from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    OWNER = "owner"
    STAFF = "staff"

class PlanType(str, Enum):
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class PaymentMethod(str, Enum):
    UPI = "upi"
    COD = "cod"
    CARD = "card"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

class Platform(str, Enum):
    FACEBOOK = "facebook"
    YOUTUBE = "youtube"
    INSTAGRAM = "instagram"

# Seller Models
class SellerCreate(BaseModel):
    business_name: str
    phone: str
    whatsapp_number: str
    email: EmailStr

class Seller(BaseModel):
    id: str
    business_name: str
    phone: str
    whatsapp_number: str
    email: str
    active_plan: PlanType = PlanType.FREE
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Saree Models
class SareeCreate(BaseModel):
    saree_code: str
    images: List[str] = []
    price: float
    fabric: str
    color: str
    stock_quantity: int
    description: Optional[str] = None

class Saree(SareeCreate):
    id: str
    seller_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Live Session Models
class LiveSessionCreate(BaseModel):
    platforms: List[Platform]
    title: str

class LiveSession(BaseModel):
    id: str
    seller_id: str
    platforms: List[Platform]
    title: str
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    total_orders: int = 0
    total_revenue: float = 0.0
    status: str = "active"

# Live Product Pin
class ProductPin(BaseModel):
    id: str
    live_session_id: str
    saree_id: str
    saree_code: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Live Comment Models
class LiveComment(BaseModel):
    id: str
    live_session_id: str
    platform: Platform
    username: str
    user_id: str
    comment_text: str
    matched_keyword: Optional[str] = None
    saree_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Order Models
class OrderCreate(BaseModel):
    saree_code: str
    customer_name: str
    phone_number: str
    address: Optional[str] = None
    payment_method: PaymentMethod = PaymentMethod.COD

class LiveOrder(BaseModel):
    id: str
    order_id: str
    seller_id: str
    live_session_id: str
    saree_id: str
    saree_code: str
    customer_name: str
    phone_number: str
    address: Optional[str] = None
    payment_method: PaymentMethod
    payment_status: PaymentStatus = PaymentStatus.PENDING
    order_status: OrderStatus = OrderStatus.PENDING
    amount: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Inventory Lock
class InventoryLock(BaseModel):
    id: str
    saree_id: str
    saree_code: str
    order_id: str
    locked_at: datetime = Field(default_factory=datetime.utcnow)
    expiry_time: datetime
    status: str = "active"

# Payment Transaction
class PaymentTransaction(BaseModel):
    id: str
    order_id: str
    gateway: str
    amount: float
    status: PaymentStatus
    payment_link: Optional[str] = None
    reference_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

# WhatsApp Message Log
class WhatsAppMessage(BaseModel):
    id: str
    order_id: str
    phone_number: str
    message_type: str  # template / free_text
    direction: str  # inbound / outbound
    content: str
    delivery_status: str = "sent"
    template_name: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Auth Models
class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    seller: Seller
