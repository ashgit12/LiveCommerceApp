from motor.motor_asyncio import AsyncIOMotorClient
import os
from typing import Optional

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    """Connect to MongoDB"""
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'saree_live')
    
    db_instance.client = AsyncIOMotorClient(mongo_url)
    db_instance.db = db_instance.client[db_name]
    
    # Create indexes
    await db_instance.db.sellers.create_index("phone", unique=True)
    await db_instance.db.sellers.create_index("email", unique=True)
    await db_instance.db.sarees.create_index([("seller_id", 1), ("saree_code", 1)], unique=True)
    await db_instance.db.live_sessions.create_index("seller_id")
    await db_instance.db.live_orders.create_index("order_id", unique=True)
    await db_instance.db.live_orders.create_index("seller_id")
    await db_instance.db.live_orders.create_index("phone_number")
    await db_instance.db.inventory_locks.create_index("expiry_time")
    
    print("Connected to MongoDB")

async def close_mongo_connection():
    """Close MongoDB connection"""
    if db_instance.client:
        db_instance.client.close()
        print("Closed MongoDB connection")

def get_database():
    """Get database instance"""
    return db_instance.db
