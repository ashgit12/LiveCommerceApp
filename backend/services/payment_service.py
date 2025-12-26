import os
import logging
from typing import Optional
from datetime import datetime, timedelta, timezone
import uuid
import hashlib

logger = logging.getLogger(__name__)

class PaymentService:
    def __init__(self):
        self.razorpay_key = os.environ.get('RAZORPAY_KEY_ID', '')
        self.razorpay_secret = os.environ.get('RAZORPAY_KEY_SECRET', '')
        self.mock_mode = not self.razorpay_key  # Enable mock mode if no API key
        
        if not self.mock_mode:
            import razorpay
            self.razorpay_client = razorpay.Client(auth=(self.razorpay_key, self.razorpay_secret))
        else:
            self.razorpay_client = None
            logger.info("Payment service running in MOCK mode")
    
    def _generate_mock_payment_link(self, order_id: str, amount: float):
        """Generate a mock payment link for demo purposes"""
        # Create a unique mock payment ID
        mock_id = hashlib.md5(f"{order_id}{amount}{datetime.now().isoformat()}".encode()).hexdigest()[:12]
        
        # Generate demo payment link - use frontend URL's base for external access
        frontend_url = os.environ.get('FRONTEND_URL', '')
        if frontend_url:
            # Extract base domain from frontend URL and use it for API
            base_url = frontend_url.replace('http://', 'https://').rstrip('/')
        else:
            base_url = os.environ.get('BACKEND_URL', 'http://localhost:8001')
        mock_link = f"{base_url}/api/payments/demo/{mock_id}"
        
        return {
            'payment_link': mock_link,
            'payment_id': f"pay_mock_{mock_id}",
            'gateway': 'razorpay_mock',
            'mock': True
        }
    
    async def create_razorpay_payment_link(self, order_id: str, amount: float, 
                                     customer_name: str, customer_phone: str,
                                     description: str) -> Optional[dict]:
        """Create Razorpay payment link"""
        
        # If in mock mode, return mock payment link
        if self.mock_mode:
            logger.info(f"[MOCK] Creating payment link for order {order_id}, amount ₹{amount}")
            return self._generate_mock_payment_link(order_id, amount)
        
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
                "expire_by": int((datetime.now(timezone.utc) + timedelta(minutes=15)).timestamp())
            })
            
            logger.info(f"Razorpay payment link created for order {order_id}")
            return {
                'payment_link': payment_link['short_url'],
                'payment_id': payment_link['id'],
                'gateway': 'razorpay'
            }
            
        except Exception as e:
            logger.error(f"Failed to create Razorpay payment link: {str(e)}")
            # Fall back to mock mode on error
            return self._generate_mock_payment_link(order_id, amount)
    
    async def verify_payment(self, payment_id: str, order_id: str) -> dict:
        """Verify payment status"""
        if self.mock_mode or payment_id.startswith('pay_mock_'):
            # In mock mode, auto-complete payment
            return {
                'status': 'completed',
                'payment_id': payment_id,
                'order_id': order_id,
                'mock': True
            }
        
        try:
            payment = self.razorpay_client.payment.fetch(payment_id)
            return {
                'status': 'completed' if payment['status'] == 'captured' else payment['status'],
                'payment_id': payment_id,
                'order_id': order_id
            }
        except Exception as e:
            logger.error(f"Failed to verify payment: {str(e)}")
            return {'status': 'error', 'error': str(e)}

# Initialize service
payment_service = PaymentService()
