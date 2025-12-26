from fastapi import APIRouter, HTTPException, Depends
from models import OTPRequest, OTPVerify, AuthResponse, Seller, SellerCreate
from database import get_database
from auth import generate_otp, verify_otp, create_access_token
import uuid
from datetime import datetime, timezone
import logging

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)

# Demo OTP for testing (always works)
DEMO_OTP = "123456"
DEMO_PHONE = "9999999999"

@router.post("/send-otp")
async def send_otp(request: OTPRequest):
    """Send OTP to phone number"""
    otp = generate_otp(request.phone)
    
    # Log the OTP for development/testing
    logger.info(f"OTP for {request.phone}: {otp}")
    
    # In demo mode, return the OTP in response for easy testing
    response = {
        "message": "OTP sent successfully", 
        "phone": request.phone,
        "demo_otp": otp  # Remove this in production
    }
    
    return response

@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp_endpoint(request: OTPVerify):
    """Verify OTP and login/register seller"""
    
    # Allow demo OTP for any phone number (for easy testing)
    is_valid = verify_otp(request.phone, request.otp) or request.otp == DEMO_OTP
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    db = get_database()
    
    # Check if seller exists
    seller = await db.sellers.find_one({"phone": request.phone}, {"_id": 0})
    
    if not seller:
        # Register new seller
        seller_id = str(uuid.uuid4())
        seller = {
            "id": seller_id,
            "business_name": f"My Saree Store",
            "phone": request.phone,
            "whatsapp_number": request.phone,
            "email": f"seller_{request.phone}@sareelive.com",
            "active_plan": "free",
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.sellers.insert_one(seller.copy())
        logger.info(f"New seller registered: {seller_id}")
    
    # Create access token
    access_token = create_access_token(data={"sub": seller["id"]})
    
    logger.info(f"Seller logged in: {seller['id']}")
    
    return AuthResponse(
        access_token=access_token,
        seller=Seller(**seller)
    )

@router.get("/me")
async def get_current_user(seller: dict = Depends(lambda: None)):
    """Get current logged in user - placeholder for now"""
    # Will be implemented with proper auth middleware
    db = get_database()
    # For now, return the first seller or temp seller
    seller = await db.sellers.find_one({}, {"_id": 0})
    if seller:
        return seller
    return {"error": "Not authenticated"}

@router.put("/profile")
async def update_profile(profile: SellerCreate):
    """Update seller profile"""
    db = get_database()
    
    # For now, update the first seller found
    seller = await db.sellers.find_one({}, {"_id": 0})
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    
    update_data = {
        "business_name": profile.business_name,
        "phone": profile.phone,
        "whatsapp_number": profile.whatsapp_number,
        "email": profile.email,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.sellers.update_one(
        {"id": seller["id"]},
        {"$set": update_data}
    )
    
    return {"message": "Profile updated successfully"}

@router.post("/logout")
async def logout():
    """Logout user - client should clear token"""
    return {"message": "Logged out successfully"}
