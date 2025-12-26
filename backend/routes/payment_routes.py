from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse
from database import get_database
import os
import hmac
import hashlib
from datetime import datetime, timezone
import uuid
import logging

router = APIRouter(prefix="/api/payments", tags=["Payments"])
logger = logging.getLogger(__name__)

# Import services
import sys
sys.path.append('/app/backend')
from services.payment_service import payment_service
from services.whatsapp_service import whatsapp_service

# Temporary seller ID
TEMP_SELLER_ID = "temp-seller-123"

@router.post("/create-payment-link/{order_id}")
async def create_payment_link(order_id: str, gateway: str = "razorpay"):
    """Create payment link for an order"""
    db = get_database()
    
    # Get order
    order = await db.live_orders.find_one({"order_id": order_id, "seller_id": TEMP_SELLER_ID}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Create payment link using service
    payment_data = await payment_service.create_razorpay_payment_link(
        order_id=order_id,
        amount=order["amount"],
        customer_name=order["customer_name"],
        customer_phone=order["phone_number"],
        description=f"Payment for Saree {order.get('saree_code', order_id)}"
    )
    
    if not payment_data:
        raise HTTPException(status_code=500, detail="Failed to create payment link")
    
    # Store payment transaction
    payment_doc = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "gateway": payment_data['gateway'],
        "amount": order["amount"],
        "status": "pending",
        "payment_link": payment_data['payment_link'],
        "reference_id": payment_data['payment_id'],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "mock": payment_data.get('mock', False)
    }
    await db.payment_transactions.insert_one(payment_doc)
    
    return {
        "payment_link": payment_data['payment_link'],
        "payment_id": payment_data['payment_id'],
        "mock": payment_data.get('mock', False)
    }

@router.get("/demo/{payment_id}", response_class=HTMLResponse)
async def demo_payment_page(payment_id: str):
    """Demo payment page for mock payments"""
    db = get_database()
    
    # Find the payment transaction
    payment = await db.payment_transactions.find_one(
        {"reference_id": f"pay_mock_{payment_id}"},
        {"_id": 0}
    )
    
    if not payment:
        return HTMLResponse(content="""
        <html>
            <head><title>Payment Not Found</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1>Payment Not Found</h1>
                <p>This payment link is invalid or expired.</p>
            </body>
        </html>
        """, status_code=404)
    
    # Get order details
    order = await db.live_orders.find_one({"order_id": payment["order_id"]}, {"_id": 0})
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Demo Payment - SareeLive</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            * {{ box-sizing: border-box; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }}
            .card {{
                background: white;
                border-radius: 16px;
                padding: 32px;
                max-width: 400px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }}
            .logo {{
                text-align: center;
                margin-bottom: 24px;
            }}
            .logo h2 {{
                color: #9b2c2c;
                margin: 0;
            }}
            .demo-badge {{
                background: #fef3c7;
                color: #92400e;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                text-align: center;
                margin-bottom: 24px;
            }}
            .order-details {{
                background: #f8fafc;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 24px;
            }}
            .detail-row {{
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
            }}
            .detail-label {{
                color: #64748b;
                font-size: 14px;
            }}
            .detail-value {{
                font-weight: 600;
                color: #1e293b;
            }}
            .amount {{
                font-size: 32px;
                font-weight: 700;
                color: #059669;
                text-align: center;
                margin: 20px 0;
            }}
            .btn {{
                width: 100%;
                padding: 16px;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                margin-bottom: 12px;
            }}
            .btn-success {{
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                color: white;
            }}
            .btn-success:hover {{
                opacity: 0.9;
            }}
            .btn-cancel {{
                background: #f1f5f9;
                color: #64748b;
            }}
            .footer {{
                text-align: center;
                margin-top: 20px;
                color: #94a3b8;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="logo">
                <h2>🎀 SareeLive</h2>
            </div>
            <div class="demo-badge">
                ⚠️ DEMO MODE - This is a test payment
            </div>
            <div class="order-details">
                <div class="detail-row">
                    <span class="detail-label">Order ID</span>
                    <span class="detail-value">{payment['order_id']}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Saree Code</span>
                    <span class="detail-value">{order.get('saree_code', 'N/A') if order else 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Customer</span>
                    <span class="detail-value">{order.get('customer_name', 'N/A') if order else 'N/A'}</span>
                </div>
            </div>
            <div class="amount">₹{payment['amount']:,.0f}</div>
            <form action="/api/payments/demo/{payment_id}/complete" method="POST">
                <button type="submit" class="btn btn-success">
                    ✅ Complete Payment (Demo)
                </button>
            </form>
            <form action="/api/payments/demo/{payment_id}/cancel" method="POST">
                <button type="submit" class="btn btn-cancel">
                    Cancel
                </button>
            </form>
            <div class="footer">
                This is a demo payment page. No real money will be charged.
            </div>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)

@router.post("/demo/{payment_id}/complete", response_class=HTMLResponse)
async def complete_demo_payment(payment_id: str):
    """Complete a demo payment"""
    db = get_database()
    
    # Find and update payment
    payment = await db.payment_transactions.find_one(
        {"reference_id": f"pay_mock_{payment_id}"},
        {"_id": 0}
    )
    
    if not payment:
        return HTMLResponse(content="<h1>Payment not found</h1>", status_code=404)
    
    # Update payment status
    await db.payment_transactions.update_one(
        {"reference_id": f"pay_mock_{payment_id}"},
        {"$set": {
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update order status
    order = await db.live_orders.find_one({"order_id": payment["order_id"]}, {"_id": 0})
    await db.live_orders.update_one(
        {"order_id": payment["order_id"]},
        {"$set": {
            "payment_status": "completed",
            "order_status": "confirmed",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Send payment confirmation WhatsApp
    if order:
        await whatsapp_service.send_payment_confirmation(
            order_id=payment["order_id"],
            customer_phone=order.get("phone_number", ""),
            saree_code=order.get("saree_code", ""),
            amount=payment["amount"]
        )
    
    logger.info(f"Demo payment completed for order {payment['order_id']}")
    
    return HTMLResponse(content=f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Successful - SareeLive</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }}
            .card {{
                background: white;
                border-radius: 16px;
                padding: 40px;
                max-width: 400px;
                width: 100%;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            }}
            .success-icon {{
                font-size: 64px;
                margin-bottom: 20px;
            }}
            h1 {{
                color: #059669;
                margin-bottom: 16px;
            }}
            p {{
                color: #64748b;
                margin-bottom: 24px;
            }}
            .order-id {{
                background: #f0fdf4;
                padding: 12px;
                border-radius: 8px;
                font-family: monospace;
                color: #166534;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="success-icon">✅</div>
            <h1>Payment Successful!</h1>
            <p>Thank you for your purchase. A WhatsApp confirmation has been sent.</p>
            <div class="order-id">Order: {payment['order_id']}</div>
        </div>
    </body>
    </html>
    """)

@router.post("/demo/{payment_id}/cancel", response_class=HTMLResponse)
async def cancel_demo_payment(payment_id: str):
    """Cancel a demo payment"""
    db = get_database()
    
    # Update payment status
    await db.payment_transactions.update_one(
        {"reference_id": f"pay_mock_{payment_id}"},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment Cancelled - SareeLive</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f8fafc;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .card {
                background: white;
                border-radius: 16px;
                padding: 40px;
                max-width: 400px;
                width: 100%;
                text-align: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            h1 {
                color: #64748b;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div style="font-size: 64px;">❌</div>
            <h1>Payment Cancelled</h1>
            <p>You can try again from the order page.</p>
        </div>
    </body>
    </html>
    """)

@router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request):
    """Handle Razorpay webhook"""
    db = get_database()
    
    # Get webhook signature
    webhook_signature = request.headers.get("X-Razorpay-Signature")
    webhook_secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET")
    
    # Get request body
    body = await request.body()
    
    # Verify signature if secret is configured
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
    
    if event.get("event") == "payment_link.paid":
        payment_link_id = event["payload"]["payment_link"]["entity"]["id"]
        
        # Update payment transaction
        await db.payment_transactions.update_one(
            {"reference_id": payment_link_id},
            {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Update order
        payment = await db.payment_transactions.find_one({"reference_id": payment_link_id}, {"_id": 0})
        if payment:
            # Update order status
            await db.live_orders.update_one(
                {"order_id": payment["order_id"]},
                {"$set": {
                    "payment_status": "completed",
                    "order_status": "confirmed",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Get order and send WhatsApp confirmation
            order = await db.live_orders.find_one({"order_id": payment["order_id"]}, {"_id": 0})
            if order:
                await whatsapp_service.send_payment_confirmation(
                    order_id=payment["order_id"],
                    customer_phone=order.get("phone_number", ""),
                    saree_code=order.get("saree_code", ""),
                    amount=payment["amount"]
                )
    
    return {"status": "success"}

@router.get("/transactions")
async def get_all_transactions():
    """Get all payment transactions"""
    db = get_database()
    transactions = await db.payment_transactions.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return transactions
