import os
import requests
from typing import Optional
import logging
from datetime import datetime, timezone
import uuid

logger = logging.getLogger(__name__)

class GupshupWhatsAppService:
    def __init__(self):
        self.api_key = os.environ.get('GUPSHUP_API_KEY', '')
        self.app_name = os.environ.get('GUPSHUP_APP_NAME', '')
        self.phone_number = os.environ.get('GUPSHUP_PHONE_NUMBER', '')
        self.base_url = 'https://api.gupshup.io/sm/api/v1'
        self.mock_mode = not self.api_key  # Enable mock mode if no API key
        
        if self.mock_mode:
            logger.info("WhatsApp service running in MOCK mode")
    
    async def _log_message(self, order_id: str, phone_number: str, message_type: str, 
                          content: str, template_name: str = None):
        """Log WhatsApp message to database"""
        try:
            from database import get_database
            db = get_database()
            
            message_log = {
                'id': str(uuid.uuid4()),
                'order_id': order_id,
                'phone_number': phone_number,
                'message_type': message_type,
                'direction': 'outbound',
                'content': content,
                'delivery_status': 'sent' if not self.mock_mode else 'mocked',
                'template_name': template_name,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            await db.whatsapp_messages.insert_one(message_log)
            logger.info(f"WhatsApp message logged for order {order_id}")
            return message_log
        except Exception as e:
            logger.error(f"Failed to log WhatsApp message: {str(e)}")
            return None
    
    def send_template_message(self, to_phone: str, template_id: str, template_params: dict):
        """Send WhatsApp template message"""
        if self.mock_mode:
            logger.info(f"[MOCK] Would send template {template_id} to {to_phone}")
            return {'status': 'mocked', 'template_id': template_id}
            
        try:
            url = f"{self.base_url}/template/msg"
            
            headers = {
                'apikey': self.api_key,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            formatted_phone = to_phone.replace('+', '').replace(' ', '').replace('-', '')
            
            data = {
                'channel': 'whatsapp',
                'source': self.phone_number,
                'destination': formatted_phone,
                'template': template_id,
                'params': template_params
            }
            
            response = requests.post(url, headers=headers, data=data)
            response.raise_for_status()
            
            logger.info(f"WhatsApp message sent to {formatted_phone}")
            return response.json()
            
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message: {str(e)}")
            return None
    
    async def send_order_interest(self, order_id: str, customer_phone: str, customer_name: str, 
                           saree_code: str, price: float, payment_link: str):
        """Send order interest message with payment link"""
        message = f"""👋 Hi {customer_name}!

Thank you for your interest in our live! 💖

🎀 Saree Code: {saree_code}
💰 Price: ₹{price:,.0f}
📦 Status: Available

TO BOOK THIS SAREE:
Pay within 15 minutes to confirm your order.

💳 Payment Link: {payment_link}

⏰ Hurry! This saree is reserved for you for 15 minutes only.

Need help? Reply here anytime!"""
        
        # Log to database
        await self._log_message(
            order_id=order_id,
            phone_number=customer_phone,
            message_type='template',
            content=message,
            template_name='order_interest'
        )
        
        return self.send_text_message(customer_phone, message)
    
    async def send_payment_confirmation(self, order_id: str, customer_phone: str, 
                                 saree_code: str, amount: float):
        """Send payment confirmation message"""
        message = f"""✅ Payment Confirmed!

Thank you for your order! 🎉

📦 Order ID: {order_id}
🎀 Saree: {saree_code}
💰 Amount Paid: ₹{amount:,.0f}

Please share your delivery address:

1. Full Name
2. Complete Address
3. Pin Code
4. Mobile Number

We'll dispatch your saree within 24 hours! 🚚"""
        
        await self._log_message(
            order_id=order_id,
            phone_number=customer_phone,
            message_type='template',
            content=message,
            template_name='payment_confirmation'
        )
        
        return self.send_text_message(customer_phone, message)
    
    async def send_payment_reminder(self, order_id: str, customer_phone: str, saree_code: str, 
                            minutes_left: int, payment_link: str):
        """Send payment reminder before expiry"""
        message = f"""⏰ REMINDER!

Your booking for {saree_code} expires in {minutes_left} minutes!

Complete payment now to confirm your order:
{payment_link}

Need more time? Reply 'EXTEND' for 10 extra minutes."""
        
        await self._log_message(
            order_id=order_id,
            phone_number=customer_phone,
            message_type='reminder',
            content=message,
            template_name='payment_reminder'
        )
        
        return self.send_text_message(customer_phone, message)
    
    async def send_booking_expired(self, order_id: str, customer_phone: str, saree_code: str):
        """Send booking expired message"""
        message = f"""❌ Booking Expired

Your booking for {saree_code} has expired.
The saree is now available for others.

Want to book again? 
Reply 'BOOK {saree_code}' or watch our next live! 🎥"""
        
        await self._log_message(
            order_id=order_id,
            phone_number=customer_phone,
            message_type='notification',
            content=message,
            template_name='booking_expired'
        )
        
        return self.send_text_message(customer_phone, message)
    
    async def send_cod_confirmation(self, customer_phone: str, order_id: str, 
                             saree_code: str, amount: float):
        """Send COD order confirmation"""
        message = f"""✅ COD Order Confirmed!

📦 Order ID: {order_id}
🎀 Saree: {saree_code}
💰 Amount: ₹{amount:,.0f} + ₹50 COD charges

Please share your delivery address:

1. Full Name
2. Complete Address
3. Pin Code  
4. Mobile Number

Total Amount to Pay on Delivery: ₹{amount + 50:,.0f}"""
        
        await self._log_message(
            order_id=order_id,
            phone_number=customer_phone,
            message_type='template',
            content=message,
            template_name='cod_confirmation'
        )
        
        return self.send_text_message(customer_phone, message)
    
    async def send_dispatch_update(self, order_id: str, customer_phone: str, 
                           tracking_id: str):
        """Send dispatch update"""
        message = f"""📦 Order Dispatched!

🎉 Great news! Your order has been shipped.

📦 Order ID: {order_id}
🚚 Tracking ID: {tracking_id}

Expected Delivery: 3-5 business days

Track your order: [Tracking Link]

Thank you for shopping with us! 💖"""
        
        await self._log_message(
            order_id=order_id,
            phone_number=customer_phone,
            message_type='notification',
            content=message,
            template_name='dispatch_update'
        )
        
        return self.send_text_message(customer_phone, message)
    
    def send_text_message(self, to_phone: str, message: str):
        """Send plain text WhatsApp message"""
        if self.mock_mode:
            logger.info(f"[MOCK] WhatsApp to {to_phone}: {message[:100]}...")
            return {'status': 'mocked', 'message': 'Message logged (mock mode)'}
            
        try:
            url = f"{self.base_url}/msg"
            
            headers = {
                'apikey': self.api_key,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            formatted_phone = to_phone.replace('+', '').replace(' ', '').replace('-', '')
            if not formatted_phone.startswith('91'):
                formatted_phone = '91' + formatted_phone
            
            data = {
                'channel': 'whatsapp',
                'source': self.phone_number,
                'destination': formatted_phone,
                'message': message,
                'src.name': self.app_name
            }
            
            response = requests.post(url, headers=headers, data=data)
            
            if response.status_code == 200:
                logger.info(f"WhatsApp text message sent to {formatted_phone}")
                return response.json()
            else:
                logger.error(f"WhatsApp API error: {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to send WhatsApp text message: {str(e)}")
            return None

# Initialize service
whatsapp_service = GupshupWhatsAppService()
