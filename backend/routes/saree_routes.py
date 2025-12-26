from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models import SareeCreate, Saree
from database import get_database
from auth import get_current_seller
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/sarees", tags=["Saree Catalog"])

@router.post("/", response_model=Saree)
async def create_saree(saree: SareeCreate, seller: dict = Depends(get_current_seller)):
    """Create new saree product"""
    db = get_database()
    
    # Check if saree code already exists for this seller
    existing = await db.sarees.find_one({
        "seller_id": seller["id"],
        "saree_code": saree.saree_code
    })
    if existing:
        raise HTTPException(status_code=400, detail="Saree code already exists")
    
    saree_id = str(uuid.uuid4())
    saree_doc = {
        "id": saree_id,
        "seller_id": seller["id"],
        **saree.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    await db.sarees.insert_one(saree_doc.copy())
    return Saree(**saree_doc)

@router.get("/", response_model=List[Saree])
async def get_sarees(seller: dict = Depends(get_current_seller)):
    """Get all sarees for seller"""
    db = get_database()
    sarees = await db.sarees.find(
        {"seller_id": seller["id"]},
        {"_id": 0}
    ).to_list(1000)
    return [Saree(**s) for s in sarees]

@router.get("/{saree_id}", response_model=Saree)
async def get_saree(saree_id: str, seller: dict = Depends(get_current_seller)):
    """Get specific saree"""
    db = get_database()
    saree = await db.sarees.find_one(
        {"id": saree_id, "seller_id": seller["id"]},
        {"_id": 0}
    )
    if not saree:
        raise HTTPException(status_code=404, detail="Saree not found")
    return Saree(**saree)

@router.put("/{saree_id}", response_model=Saree)
async def update_saree(saree_id: str, saree_update: SareeCreate, seller: dict = Depends(get_current_seller)):
    """Update saree"""
    db = get_database()
    
    update_data = saree_update.model_dump()
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = await db.sarees.update_one(
        {"id": saree_id, "seller_id": seller["id"]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Saree not found")
    
    saree = await db.sarees.find_one({"id": saree_id}, {"_id": 0})
    return Saree(**saree)

@router.delete("/{saree_id}")
async def delete_saree(saree_id: str, seller: dict = Depends(get_current_seller)):
    """Delete saree"""
    db = get_database()
    result = await db.sarees.delete_one({"id": saree_id, "seller_id": seller["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Saree not found")
    return {"message": "Saree deleted successfully"}
