from fastapi import APIRouter, HTTPException, Depends
from models import OTPRequest, OTPVerify, AuthResponse, Seller, SellerCreate
from database import get_database
from auth import generate_otp, verify_otp, create_access_token
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/send-otp")
async def send_otp(request: OTPRequest):
    """Send OTP to phone number"""
    otp = generate_otp(request.phone)
    
    # In production, integrate with SMS gateway
    print(f"OTP for {request.phone}: {otp}")  # For development
    
    return {"message": "OTP sent successfully", "phone": request.phone}

@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp_endpoint(request: OTPVerify):
    """Verify OTP and login/register seller"""
    if not verify_otp(request.phone, request.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    db = get_database()
    
    # Check if seller exists
    seller = await db.sellers.find_one({"phone": request.phone}, {"_id": 0})
    
    if not seller:
        # Register new seller
        seller_id = str(uuid.uuid4())
        seller = {
            "id": seller_id,
            "business_name": f"Seller {request.phone}",
            "phone": request.phone,
            "whatsapp_number": request.phone,
            "email": f"{request.phone}@temp.com",
            "active_plan": "free",
            "status": "active",
            "created_at": datetime.utcnow().isoformat()
        }
        await db.sellers.insert_one(seller.copy())
    
    # Create access token
    access_token = create_access_token(data={"sub": seller["id"]})
    
    return AuthResponse(
        access_token=access_token,
        seller=Seller(**seller)
    )

@router.put("/profile")
async def update_profile(profile: SellerCreate, seller: dict = Depends(lambda: None)):
    """Update seller profile"""
    # Will be implemented with proper auth
    pass
