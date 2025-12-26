import razorpay
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class PaymentService:
    def __init__(self):
        self.razorpay_key = os.environ.get('RAZORPAY_KEY_ID', '')
        self.razorpay_secret = os.environ.get('RAZORPAY_KEY_SECRET', '')
        self.cashfree_client_id = os.environ.get('CASHFREE_CLIENT_ID', '')
        self.cashfree_client_secret = os.environ.get('CASHFREE_CLIENT_SECRET', '')
        
        # Initialize Razorpay client
        if self.razorpay_key and self.razorpay_secret:
            self.razorpay_client = razorpay.Client(auth=(self.razorpay_key, self.razorpay_secret))
        else:
            self.razorpay_client = None
            logger.warning("Razorpay credentials not configured")
    
    def create_razorpay_payment_link(self, order_id: str, amount: float, 
                                     customer_name: str, customer_phone: str,
                                     description: str) -> Optional[dict]:
        """Create Razorpay payment link"""
        if not self.razorpay_client:
            logger.error("Razorpay client not initialized")
            return None
        
        try:
            payment_link = self.razorpay_client.payment_link.create({
                "amount": int(amount * 100),  # Convert to paise
                "currency": "INR",
                "description": description,
                "customer": {
                    "name": customer_name,
                    "contact": customer_phone
                },
                "notify": {
                    "sms": True,
                    "whatsapp": False  # We'll send via our WhatsApp service
                },
                "reminder_enable": True,
                "callback_url": os.environ.get('RAZORPAY_CALLBACK_URL', ''),
                "callback_method": "get",
                "reference_id": order_id,
                "expire_by": int((datetime.utcnow() + timedelta(minutes=15)).timestamp())
            })
            
            logger.info(f"Razorpay payment link created for order {order_id}")
            return {
                'payment_link': payment_link['short_url'],
                'payment_id': payment_link['id'],
                'gateway': 'razorpay'
            }
            
        except Exception as e:
            logger.error(f"Failed to create Razorpay payment link: {str(e)}")
            return None
    
    def create_cashfree_payment_link(self, order_id: str, amount: float,
                                     customer_name: str, customer_phone: str,
                                     description: str) -> Optional[dict]:
        """Create Cashfree payment link"""
        # Cashfree implementation
        try:
            import requests
            
            url = "https://api.cashfree.com/pg/links"
            headers = {
                "x-client-id": self.cashfree_client_id,
                "x-client-secret": self.cashfree_client_secret,
                "x-api-version": "2023-08-01",
                "Content-Type": "application/json"
            }
            
            payload = {
                "link_id": f"link_{order_id}",
                "link_amount": amount,
                "link_currency": "INR",
                "link_purpose": description,
                "customer_details": {
                    "customer_phone": customer_phone,
                    "customer_name": customer_name
                },
                "link_notify": {
                    "send_sms": False,
                    "send_email": False
                },
                "link_expiry_time": (datetime.utcnow() + timedelta(minutes=15)).isoformat()
            }
            
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Cashfree payment link created for order {order_id}")
            
            return {
                'payment_link': data['link_url'],
                'payment_id': data['cf_link_id'],
                'gateway': 'cashfree'
            }
            
        except Exception as e:
            logger.error(f"Failed to create Cashfree payment link: {str(e)}")
            return None

from datetime import datetime, timedelta

# Initialize service
payment_service = PaymentService()
