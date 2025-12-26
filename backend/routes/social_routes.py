from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import os
import requests

router = APIRouter(prefix="/api/social", tags=["Social Media"])

# Temporary storage - In production, use database
connected_accounts = {
    "facebook": {"connected": False, "pageId": "", "pageName": ""},
    "youtube": {"connected": False, "channelId": "", "channelName": ""},
    "instagram": {"connected": False, "username": ""}
}

@router.get("/connections")
async def get_connections():
    """Get all connected social accounts"""
    return connected_accounts

@router.post("/disconnect/{platform}")
async def disconnect_platform(platform: str):
    """Disconnect a social platform"""
    if platform not in connected_accounts:
        raise HTTPException(status_code=404, detail="Platform not found")
    
    connected_accounts[platform] = {
        "connected": False,
        **{k: "" for k in connected_accounts[platform].keys() if k != "connected"}
    }
    return {"message": f"{platform} disconnected successfully"}

@router.get("/oauth/facebook/callback")
async def facebook_callback(code: Optional[str] = Query(None)):
    """Handle Facebook OAuth callback"""
    if not code:
        raise HTTPException(status_code=400, detail="No authorization code provided")
    
    try:
        # Exchange code for access token
        app_id = os.environ.get("FACEBOOK_APP_ID", "")
        app_secret = os.environ.get("FACEBOOK_APP_SECRET", "")
        redirect_uri = os.environ.get("FACEBOOK_REDIRECT_URI", "")
        
        token_url = f"https://graph.facebook.com/v18.0/oauth/access_token"
        token_response = requests.get(token_url, params={
            "client_id": app_id,
            "client_secret": app_secret,
            "redirect_uri": redirect_uri,
            "code": code
        })
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if access_token:
            # Get user's pages
            pages_url = f"https://graph.facebook.com/v18.0/me/accounts"
            pages_response = requests.get(pages_url, params={
                "access_token": access_token
            })
            
            pages_data = pages_response.json()
            if pages_data.get("data") and len(pages_data["data"]) > 0:
                page = pages_data["data"][0]
                connected_accounts["facebook"] = {
                    "connected": True,
                    "pageId": page["id"],
                    "pageName": page["name"],
                    "accessToken": page["access_token"]
                }
                return {"message": "Facebook connected successfully", "page": page["name"]}
        
        raise HTTPException(status_code=400, detail="Failed to connect Facebook")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/oauth/youtube/callback")
async def youtube_callback(code: Optional[str] = Query(None)):
    """Handle YouTube OAuth callback"""
    if not code:
        raise HTTPException(status_code=400, detail="No authorization code provided")
    
    try:
        # Exchange code for access token
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
        redirect_uri = os.environ.get("YOUTUBE_REDIRECT_URI", "")
        
        token_url = "https://oauth2.googleapis.com/token"
        token_response = requests.post(token_url, data={
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "code": code,
            "grant_type": "authorization_code"
        })
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if access_token:
            # Get channel information
            channel_url = "https://www.googleapis.com/youtube/v3/channels"
            channel_response = requests.get(channel_url, params={
                "part": "snippet",
                "mine": "true",
                "access_token": access_token
            })
            
            channel_data = channel_response.json()
            if channel_data.get("items") and len(channel_data["items"]) > 0:
                channel = channel_data["items"][0]
                connected_accounts["youtube"] = {
                    "connected": True,
                    "channelId": channel["id"],
                    "channelName": channel["snippet"]["title"],
                    "accessToken": access_token
                }
                return {"message": "YouTube connected successfully", "channel": channel["snippet"]["title"]}
        
        raise HTTPException(status_code=400, detail="Failed to connect YouTube")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/oauth/instagram/callback")
async def instagram_callback(code: Optional[str] = Query(None)):
    """Handle Instagram OAuth callback"""
    if not code:
        raise HTTPException(status_code=400, detail="No authorization code provided")
    
    try:
        # Exchange code for access token
        client_id = os.environ.get("INSTAGRAM_CLIENT_ID", "")
        client_secret = os.environ.get("INSTAGRAM_CLIENT_SECRET", "")
        redirect_uri = os.environ.get("INSTAGRAM_REDIRECT_URI", "")
        
        token_url = "https://api.instagram.com/oauth/access_token"
        token_response = requests.post(token_url, data={
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "code": code,
            "grant_type": "authorization_code"
        })
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        user_data = token_data.get("user")
        
        if access_token and user_data:
            connected_accounts["instagram"] = {
                "connected": True,
                "username": user_data.get("username", ""),
                "accessToken": access_token
            }
            return {"message": "Instagram connected successfully", "username": user_data.get("username")}
        
        raise HTTPException(status_code=400, detail="Failed to connect Instagram")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
