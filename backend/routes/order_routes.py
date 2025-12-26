from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from models import OrderCreate, LiveOrder, OrderStatus, PaymentStatus
from database import get_database
from auth import get_current_seller
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.post("/", response_model=LiveOrder)
async def create_order(order: OrderCreate, live_session_id: str, seller: dict = Depends(get_current_seller)):
    """Create a new order"""
    db = get_database()
    
    # Find saree
    saree = await db.sarees.find_one({
        "seller_id": seller["id"],
        "saree_code": order.saree_code
    })
    if not saree:
        raise HTTPException(status_code=404, detail="Saree not found")
    
    # Check stock
    if saree["stock_quantity"] <= 0:
        raise HTTPException(status_code=400, detail="Saree out of stock")
    
    order_id = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    order_doc = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "seller_id": seller["id"],
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
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    await db.live_orders.insert_one(order_doc.copy())
    
    # Update session stats
    await db.live_sessions.update_one(
        {"id": live_session_id},
        {
            "$inc": {"total_orders": 1, "total_revenue": saree["price"]}
        }
    )
    
    return LiveOrder(**order_doc)

@router.get("/", response_model=List[LiveOrder])
async def get_orders(
    status: Optional[OrderStatus] = None,
    seller: dict = Depends(get_current_seller)
):
    """Get all orders for seller"""
    db = get_database()
    
    query = {"seller_id": seller["id"]}
    if status:
        query["order_status"] = status.value
    
    orders = await db.live_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [LiveOrder(**o) for o in orders]

@router.get("/{order_id}", response_model=LiveOrder)
async def get_order(order_id: str, seller: dict = Depends(get_current_seller)):
    """Get specific order"""
    db = get_database()
    order = await db.live_orders.find_one(
        {"order_id": order_id, "seller_id": seller["id"]},
        {"_id": 0}
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return LiveOrder(**order)

@router.put("/{order_id}/status")
async def update_order_status(
    order_id: str,
    order_status: OrderStatus,
    seller: dict = Depends(get_current_seller)
):
    """Update order status"""
    db = get_database()
    result = await db.live_orders.update_one(
        {"order_id": order_id, "seller_id": seller["id"]},
        {"$set": {
            "order_status": order_status.value,
            "updated_at": datetime.utcnow().isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated successfully"}
