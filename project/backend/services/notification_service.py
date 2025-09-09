import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client
import os
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        # SMTP config
        self.smtp_host = os.getenv('SMTP_HOST')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_user = os.getenv('SMTP_USER')
        self.smtp_pass = os.getenv('SMTP_PASS')
        
        # Twilio config
        self.twilio_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.twilio_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.twilio_phone = os.getenv('TWILIO_PHONE_NUMBER')
        
        self.twilio_client = None
        if self.twilio_sid and self.twilio_token:
            try:
                self.twilio_client = Client(self.twilio_sid, self.twilio_token)
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")

    def send_email_alert(self, to_email, subject, message, prediction_data=None):
        """Send email alert for high churn risk predictions"""
        if not all([self.smtp_host, self.smtp_user, self.smtp_pass]):
            logger.warning("Email configuration incomplete, skipping email alert")
            return False
            
        try:
            msg = MIMEMultipart()
            msg['From'] = self.smtp_user
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Create HTML email body
            html_body = self._create_email_template(message, prediction_data)
            msg.attach(MIMEText(html_body, 'html'))
            
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_pass)
            
            text = msg.as_string()
            server.sendmail(self.smtp_user, to_email, text)
            server.quit()
            
            logger.info(f"Email alert sent to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
            return False

    def send_sms_alert(self, to_phone, message):
        """Send SMS alert for high churn risk predictions"""
        if not self.twilio_client:
            logger.warning("Twilio not configured, skipping SMS alert")
            return False
            
        try:
            self.twilio_client.messages.create(
                body=message,
                from_=self.twilio_phone,
                to=to_phone
            )
            
            logger.info(f"SMS alert sent to {to_phone}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send SMS alert: {e}")
            return False

    def send_churn_alert(self, prediction_data, notification_settings):
        """Send churn alert based on prediction and user settings"""
        probability = prediction_data.get('probability', 0)
        threshold = float(notification_settings.get('threshold', 0.7))
        
        if probability < threshold:
            return
            
        customer_data = prediction_data.get('customerData', {})
        subject = f"High Churn Risk Alert - {probability:.1%} probability"
        
        message = f"""
        High churn risk detected for customer:
        
        Churn Probability: {probability:.1%}
        Tenure: {customer_data.get('tenure', 'N/A')} months
        Monthly Charges: ${customer_data.get('monthlyCharges', 'N/A')}
        Contract: {customer_data.get('contract', 'N/A')}
        
        Immediate action recommended for customer retention.
        """
        
        # Send email if enabled
        if notification_settings.get('emailEnabled') and notification_settings.get('emailAddress'):
            self.send_email_alert(
                notification_settings['emailAddress'], 
                subject, 
                message, 
                prediction_data
            )
        
        # Send SMS if enabled
        if notification_settings.get('smsEnabled') and notification_settings.get('phoneNumber'):
            sms_message = f"High churn risk alert: {probability:.1%} probability. Check dashboard for details."
            self.send_sms_alert(notification_settings['phoneNumber'], sms_message)

    def _create_email_template(self, message, prediction_data):
        """Create HTML email template for churn alerts"""
        if not prediction_data:
            return f"<html><body><p>{message}</p></body></html>"
            
        probability = prediction_data.get('probability', 0)
        customer_data = prediction_data.get('customerData', {})
        
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background-color: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px -30px; }}
                .alert-box {{ background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 15px; margin: 20px 0; }}
                .probability {{ font-size: 24px; font-weight: bold; color: #dc2626; }}
                .details {{ background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0; }}
                .detail-row {{ display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚨 High Churn Risk Alert</h1>
                </div>
                
                <div class="alert-box">
                    <p><strong>A customer with high churn probability has been detected!</strong></p>
                    <div class="probability">Churn Probability: {probability:.1%}</div>
                </div>
                
                <h3>Customer Details:</h3>
                <div class="details">
                    <div class="detail-row">
                        <span><strong>Tenure:</strong></span>
                        <span>{customer_data.get('tenure', 'N/A')} months</span>
                    </div>
                    <div class="detail-row">
                        <span><strong>Monthly Charges:</strong></span>
                        <span>${customer_data.get('monthlyCharges', 'N/A')}</span>
                    </div>
                    <div class="detail-row">
                        <span><strong>Total Charges:</strong></span>
                        <span>${customer_data.get('totalCharges', 'N/A')}</span>
                    </div>
                    <div class="detail-row">
                        <span><strong>Contract Type:</strong></span>
                        <span>{customer_data.get('contract', 'N/A')}</span>
                    </div>
                    <div class="detail-row">
                        <span><strong>Payment Method:</strong></span>
                        <span>{customer_data.get('paymentMethod', 'N/A')}</span>
                    </div>
                    <div class="detail-row">
                        <span><strong>Internet Service:</strong></span>
                        <span>{customer_data.get('internetService', 'N/A')}</span>
                    </div>
                </div>
                
                <p><strong>Recommended Actions:</strong></p>
                <ul>
                    <li>Contact customer immediately for retention discussion</li>
                    <li>Review contract terms and pricing options</li>
                    <li>Offer personalized promotions or services</li>
                    <li>Schedule follow-up within 48 hours</li>
                </ul>
                
                <div class="footer">
                    <p>This alert was generated by the ChurnPredict AI system. Login to your dashboard for more details and analytics.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html

    def apply_settings(self, user_id, settings):
        """Optional: Validate and apply user settings (placeholder)"""
        logger.info(f"Applied notification settings for {user_id}: {settings}")


# Global notification service instance
notification_service = NotificationService()
