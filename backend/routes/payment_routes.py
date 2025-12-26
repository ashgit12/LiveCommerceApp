from fastapi import APIRouter, HTTPException, Depends, Request
from database import get_database
from auth import get_current_seller
import razorpay
import os
import hmac
import hashlib

router = APIRouter(prefix="/api/payments", tags=["Payments"])

# Initialize Razorpay (will add Cashfree later)
razorpay_client = None
try:
    razorpay_key = os.environ.get("RAZORPAY_KEY_ID")
    razorpay_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    if razorpay_key and razorpay_secret:
        razorpay_client = razorpay.Client(auth=(razorpay_key, razorpay_secret))
except:
    pass

@router.post("/create-payment-link/{order_id}")
async def create_payment_link(order_id: str, gateway: str = "razorpay", seller: dict = Depends(get_current_seller)):
    """Create payment link for an order"""
    db = get_database()
    
    # Get order
    order = await db.live_orders.find_one({"order_id": order_id, "seller_id": seller["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if gateway == "razorpay" and razorpay_client:
        try:
            payment_link = razorpay_client.payment_link.create({
                "amount": int(order["amount"] * 100),  # Amount in paise
                "currency": "INR",
                "description": f"Payment for Order {order_id}",
                "customer": {
                    "name": order["customer_name"],
                    "contact": order["phone_number"]
                },
                "notify": {
                    "sms": True,
                    "whatsapp": True
                },
                "reminder_enable": True,
                "callback_url": os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:3000") + "/payment-success",
                "callback_method": "get"
            })
            
            # Store payment transaction
            payment_doc = {
                "id": payment_link["id"],
                "order_id": order_id,
                "gateway": "razorpay",
                "amount": order["amount"],
                "status": "pending",
                "payment_link": payment_link["short_url"],
                "reference_id": payment_link["id"],
                "created_at": datetime.utcnow().isoformat()
            }
            await db.payment_transactions.insert_one(payment_doc)
            
            return {
                "payment_link": payment_link["short_url"],
                "payment_id": payment_link["id"]
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Payment link creation failed: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Payment gateway not configured")

@router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request):
    """Handle Razorpay webhook"""
    db = get_database()
    
    # Get webhook signature
    webhook_signature = request.headers.get("X-Razorpay-Signature")
    webhook_secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET")
    
    # Get request body
    body = await request.body()
    
    # Verify signature
    if webhook_secret:
        expected_signature = hmac.new(
            webhook_secret.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if webhook_signature != expected_signature:
            raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Parse event
    import json
    event = json.loads(body)
    
    if event["event"] == "payment_link.paid":
        payment_link_id = event["payload"]["payment_link"]["entity"]["id"]
        
        # Update payment transaction
        await db.payment_transactions.update_one(
            {"reference_id": payment_link_id},
            {"$set": {"status": "completed", "completed_at": datetime.utcnow().isoformat()}}
        )
        
        # Update order
        payment = await db.payment_transactions.find_one({"reference_id": payment_link_id})
        if payment:
            await db.live_orders.update_one(
                {"order_id": payment["order_id"]},
                {"$set": {"payment_status": "completed", "order_status": "confirmed"}}
            )
    
    return {"status": "success"}

from datetime import datetime
