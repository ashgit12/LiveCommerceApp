from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from typing import Optional
import pyotp
import redis

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

# Redis for OTP storage
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_client.ping()
except:
    redis_client = None
    print("Warning: Redis not available, using in-memory OTP storage")
    otp_storage = {}

def generate_otp(phone: str) -> str:
    """Generate 6-digit OTP"""
    totp = pyotp.TOTP(pyotp.random_base32(), digits=6, interval=300)  # 5 min validity
    otp = totp.now()
    
    # Store in Redis or memory
    if redis_client:
        redis_client.setex(f"otp:{phone}", 300, otp)  # 5 min expiry
    else:
        otp_storage[phone] = {"otp": otp, "expires": datetime.utcnow() + timedelta(minutes=5)}
    
    return otp

def verify_otp(phone: str, otp: str) -> bool:
    """Verify OTP"""
    if redis_client:
        stored_otp = redis_client.get(f"otp:{phone}")
        if stored_otp and stored_otp == otp:
            redis_client.delete(f"otp:{phone}")
            return True
    else:
        stored = otp_storage.get(phone)
        if stored and stored["otp"] == otp and stored["expires"] > datetime.utcnow():
            del otp_storage[phone]
            return True
    return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_seller(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated seller"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        seller_id: str = payload.get("sub")
        if seller_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    from database import get_database
    db = get_database()
    seller = await db.sellers.find_one({"id": seller_id})
    if seller is None:
        raise credentials_exception
    return seller
