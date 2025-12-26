from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import List
from models import LiveSessionCreate, LiveSession, ProductPin, LiveComment
from database import get_database
import uuid
from datetime import datetime
import json

router = APIRouter(prefix="/api/live", tags=["Live Sessions"])

# Temporary seller ID for testing without auth
TEMP_SELLER_ID = "temp-seller-123"

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

@router.post("/sessions/", response_model=LiveSession)
async def create_live_session(session: LiveSessionCreate):
    """Start a new live session"""
    db = get_database()
    
    session_id = str(uuid.uuid4())
    session_doc = {
        "id": session_id,
        "seller_id": TEMP_SELLER_ID,
        "platforms": [p.value for p in session.platforms],
        "title": session.title,
        "start_time": datetime.utcnow().isoformat(),
        "end_time": None,
        "total_orders": 0,
        "total_revenue": 0.0,
        "status": "active"
    }
    
    await db.live_sessions.insert_one(session_doc.copy())
    return LiveSession(**session_doc)

@router.get("/sessions/", response_model=List[LiveSession])
async def get_live_sessions():
    """Get all live sessions"""
    db = get_database()
    sessions = await db.live_sessions.find(
        {"seller_id": TEMP_SELLER_ID},
        {"_id": 0}
    ).sort("start_time", -1).to_list(100)
    return [LiveSession(**s) for s in sessions]

@router.post("/sessions/{session_id}/end")
async def end_live_session(session_id: str):
    """End a live session"""
    db = get_database()
    result = await db.live_sessions.update_one(
        {"id": session_id, "seller_id": TEMP_SELLER_ID},
        {"$set": {"end_time": datetime.utcnow().isoformat(), "status": "ended"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session ended successfully"}

@router.post("/sessions/{session_id}/pin")
async def pin_saree(session_id: str, saree_code: str):
    """Pin a saree during live session"""
    db = get_database()
    
    # Find saree
    saree = await db.sarees.find_one({"seller_id": TEMP_SELLER_ID, "saree_code": saree_code})
    if not saree:
        raise HTTPException(status_code=404, detail="Saree not found")
    
    pin_id = str(uuid.uuid4())
    pin_doc = {
        "id": pin_id,
        "live_session_id": session_id,
        "saree_id": saree["id"],
        "saree_code": saree_code,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    await db.product_pins.insert_one(pin_doc.copy())
    
    # Broadcast to WebSocket clients
    await manager.broadcast({
        "type": "saree_pinned",
        "data": ProductPin(**pin_doc).model_dump(mode='json')
    })
    
    return ProductPin(**pin_doc)

@router.get("/sessions/{session_id}/comments")
async def get_session_comments(session_id: str):
    """Get comments for a live session"""
    db = get_database()
    comments = await db.live_comments.find(
        {"live_session_id": session_id},
        {"_id": 0}
    ).sort("timestamp", -1).to_list(500)
    return comments

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket connection for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)
