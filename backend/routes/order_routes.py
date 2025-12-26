from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import List, Optional
from models import OrderCreate, LiveOrder, OrderStatus, PaymentStatus
from database import get_database
import uuid
from datetime import datetime, timedelta, timezone
import redis
import logging

# Import services
import sys
sys.path.append('/app/backend')
from services.whatsapp_service import whatsapp_service
from services.payment_service import payment_service

router = APIRouter(prefix="/api/orders", tags=["Orders"])
logger = logging.getLogger(__name__)

# Temporary seller ID for testing without auth
TEMP_SELLER_ID = "temp-seller-123"

# Redis for inventory locking
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_client.ping()
except:
    redis_client = None
    logger.warning("Redis not available, inventory locking disabled")

async def send_whatsapp_and_payment_link(order: dict, saree: dict):
    """Background task to send WhatsApp message with payment link"""
    try:
        # Generate payment link
        payment_data = await payment_service.create_razorpay_payment_link(
            order_id=order['order_id'],
            amount=order['amount'],
            customer_name=order['customer_name'],
            customer_phone=order['phone_number'],
            description=f"Payment for Saree {order['saree_code']}"
        )
        
        if payment_data:
            # Store payment transaction
            db = get_database()
            await db.payment_transactions.insert_one({
                'id': str(uuid.uuid4()),
                'order_id': order['order_id'],
                'gateway': payment_data['gateway'],
                'amount': order['amount'],
                'status': 'pending',
                'payment_link': payment_data['payment_link'],
                'reference_id': payment_data['payment_id'],
                'created_at': datetime.now(timezone.utc).isoformat(),
                'mock': payment_data.get('mock', False)
            })
            
            # Send WhatsApp message
            await whatsapp_service.send_order_interest(
                order_id=order['order_id'],
                customer_phone=order['phone_number'],
                customer_name=order['customer_name'],
                saree_code=order['saree_code'],
                price=order['amount'],
                payment_link=payment_data['payment_link']
            )
            
            logger.info(f"WhatsApp and payment link sent for order {order['order_id']}")
        else:
            logger.error(f"Failed to create payment link for order {order['order_id']}")
            
    except Exception as e:
        logger.error(f"Error in send_whatsapp_and_payment_link: {str(e)}")

async def send_cod_message(order: dict):
    """Background task to send COD confirmation"""
    try:
        await whatsapp_service.send_cod_confirmation(
            customer_phone=order['phone_number'],
            order_id=order['order_id'],
            saree_code=order['saree_code'],
            amount=order['amount']
        )
        logger.info(f"COD confirmation sent for order {order['order_id']}")
    except Exception as e:
        logger.error(f"Error sending COD confirmation: {str(e)}")

@router.post("/", response_model=LiveOrder)
async def create_order(order: OrderCreate, live_session_id: str, background_tasks: BackgroundTasks):
    """Create a new order with automatic WhatsApp and payment link"""
    db = get_database()
    
    # Find saree
    saree = await db.sarees.find_one({
        "seller_id": TEMP_SELLER_ID,
        "saree_code": order.saree_code
    })
    if not saree:
        raise HTTPException(status_code=404, detail="Saree not found")
    
    # Check stock
    if saree["stock_quantity"] <= 0:
        raise HTTPException(status_code=400, detail="Saree out of stock")
    
    # Check if already locked
    if redis_client:
        lock_key = f"lock:{saree['id']}"
        existing_lock = redis_client.get(lock_key)
        if existing_lock:
            raise HTTPException(status_code=400, detail="Saree is currently reserved by another customer")
    
    order_id = f"ORD-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    order_doc = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "seller_id": TEMP_SELLER_ID,
        "live_session_id": live_session_id,
        "saree_id": saree["id"],
        "saree_code": order.saree_code,
        "customer_name": order.customer_name,
        "phone_number": order.phone_number,
        "address": order.address,
        "payment_method": order.payment_method.value,
        "payment_status": "pending",
        "order_status": "pending",
        "amount": saree["price"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    }
    
    await db.live_orders.insert_one(order_doc.copy())
    
    # Lock inventory for 15 minutes
    if redis_client:
        lock_key = f"lock:{saree['id']}"
        redis_client.setex(lock_key, 900, order_id)  # 900 seconds = 15 minutes
        logger.info(f"Inventory locked for saree {order.saree_code}, order {order_id}")
    
    # Update session stats
    await db.live_sessions.update_one(
        {"id": live_session_id},
        {
            "$inc": {"total_orders": 1, "total_revenue": saree["price"]}
        }
    )
    
    # Send WhatsApp and payment link in background
    if order.payment_method.value == 'upi' or order.payment_method.value == 'card':
        background_tasks.add_task(send_whatsapp_and_payment_link, order_doc, saree)
    elif order.payment_method.value == 'cod':
        background_tasks.add_task(send_cod_message, order_doc)
    
    logger.info(f"Order created: {order_id} for saree {order.saree_code}")
    
    return LiveOrder(**order_doc)

@router.get("/", response_model=List[LiveOrder])
async def get_orders(status: Optional[OrderStatus] = None):
    """Get all orders for seller"""
    db = get_database()
    
    query = {"seller_id": TEMP_SELLER_ID}
    if status:
        query["order_status"] = status.value
    
    orders = await db.live_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [LiveOrder(**o) for o in orders]

@router.get("/{order_id}", response_model=LiveOrder)
async def get_order(order_id: str):
    """Get specific order"""
    db = get_database()
    order = await db.live_orders.find_one(
        {"order_id": order_id, "seller_id": TEMP_SELLER_ID},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return LiveOrder(**order)

@router.put("/{order_id}/status")
async def update_order_status(order_id: str, order_status: OrderStatus):
    """Update order status"""
    db = get_database()
    result = await db.live_orders.update_one(
        {"order_id": order_id, "seller_id": TEMP_SELLER_ID},
        {"$set": {
            "order_status": order_status.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated successfully"}

@router.get("/{order_id}/messages")
async def get_order_messages(order_id: str):
    """Get all WhatsApp messages for an order"""
    db = get_database()
    messages = await db.whatsapp_messages.find(
        {"order_id": order_id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(100)
    return messages

@router.get("/{order_id}/payment")
async def get_order_payment(order_id: str):
    """Get payment details for an order"""
    db = get_database()
    payment = await db.payment_transactions.find_one(
        {"order_id": order_id},
        {"_id": 0}
    )
    if not payment:
        return {"status": "no_payment", "order_id": order_id}
    return payment
