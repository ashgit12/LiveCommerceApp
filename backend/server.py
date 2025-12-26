from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import database and routes
from database import connect_to_mongo, close_mongo_connection
from routes import auth_routes, saree_routes, live_routes, order_routes, payment_routes, social_routes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SareeLive OS API",
    description="India's first Saree Live Commerce Platform",
    version="1.0.0",
    redirect_slashes=False
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Events
@app.on_event("startup")
async def startup():
    await connect_to_mongo()
    logger.info("SareeLive OS API started successfully")

@app.on_event("shutdown")
async def shutdown():
    await close_mongo_connection()
    logger.info("SareeLive OS API shut down")

# Include routers
app.include_router(auth_routes.router)
app.include_router(saree_routes.router)
app.include_router(live_routes.router)
app.include_router(order_routes.router)
app.include_router(payment_routes.router)
app.include_router(social_routes.router)

# Health check
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SareeLive OS API",
        "version": "1.0.0"
    }
