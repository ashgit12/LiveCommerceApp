import os
import requests
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class GupshupWhatsAppService:
    def __init__(self):
        self.api_key = os.environ.get('GUPSHUP_API_KEY', '')
        self.app_name = os.environ.get('GUPSHUP_APP_NAME', '')
        self.phone_number = os.environ.get('GUPSHUP_PHONE_NUMBER', '')
        self.base_url = 'https://api.gupshup.io/sm/api/v1'
    
    def send_template_message(self, to_phone: str, template_id: str, template_params: dict):
        """Send WhatsApp template message"""
        try:
            url = f"{self.base_url}/template/msg"
            
            headers = {
                'apikey': self.api_key,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            # Format phone number (remove +, spaces, etc.)
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
    
    def send_order_interest(self, customer_phone: str, customer_name: str, 
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
        
        return self.send_text_message(customer_phone, message)
    
    def send_payment_confirmation(self, customer_phone: str, order_id: str, 
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
        
        return self.send_text_message(customer_phone, message)
    
    def send_payment_reminder(self, customer_phone: str, saree_code: str, 
                            minutes_left: int, payment_link: str):
        """Send payment reminder before expiry"""
        message = f"""⏰ REMINDER!

Your booking for {saree_code} expires in {minutes_left} minutes!

Complete payment now to confirm your order:
{payment_link}

Need more time? Reply 'EXTEND' for 10 extra minutes."""
        
        return self.send_text_message(customer_phone, message)
    
    def send_booking_expired(self, customer_phone: str, saree_code: str):
        """Send booking expired message"""
        message = f"""❌ Booking Expired

Your booking for {saree_code} has expired.
The saree is now available for others.

Want to book again? 
Reply 'BOOK {saree_code}' or watch our next live! 🎥"""
        
        return self.send_text_message(customer_phone, message)
    
    def send_cod_confirmation(self, customer_phone: str, order_id: str, 
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
        
        return self.send_text_message(customer_phone, message)
    
    def send_dispatch_update(self, customer_phone: str, order_id: str, 
                           tracking_id: str):
        """Send dispatch update"""
        message = f"""📦 Order Dispatched!

🎉 Great news! Your order has been shipped.

📦 Order ID: {order_id}
🚚 Tracking ID: {tracking_id}

Expected Delivery: 3-5 business days

Track your order: [Tracking Link]

Thank you for shopping with us! 💖"""
        
        return self.send_text_message(customer_phone, message)
    
    def send_text_message(self, to_phone: str, message: str):
        """Send plain text WhatsApp message"""
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
