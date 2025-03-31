import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import os
import logging
import requests
from backend.config import Config

logger = logging.getLogger(__name__)

def send_email(recipient, subject, html_content, attachments=None):
    """
    Send an email with optional attachments
    
    Args:
        recipient (str): Email address of the recipient
        subject (str): Subject of the email
        html_content (str): HTML content of the email
        attachments (list): List of dict with 'filename' and 'data' keys
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = Config.MAIL_DEFAULT_SENDER
        msg['To'] = recipient
        msg['Subject'] = subject
        
        # Attach HTML content
        msg.attach(MIMEText(html_content, 'html'))
        
        # Attach files if any
        if attachments:
            for attachment in attachments:
                part = MIMEApplication(attachment['data'], Name=attachment['filename'])
                part['Content-Disposition'] = f'attachment; filename="{attachment["filename"]}"'
                msg.attach(part)
        
        # Connect to SMTP server and send email
        with smtplib.SMTP(Config.MAIL_SERVER, Config.MAIL_PORT) as server:
            if Config.MAIL_USE_TLS:
                server.starttls()
            
            if Config.MAIL_USERNAME and Config.MAIL_PASSWORD:
                server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
            
            server.sendmail(Config.MAIL_DEFAULT_SENDER, recipient, msg.as_string())
        
        logger.info(f"Email sent successfully to {recipient}")
        return True
    
    except Exception as e:
        logger.error(f"Error sending email to {recipient}: {str(e)}")
        return False

def send_google_chat_message(webhook_url, message):
    """
    Send a message to Google Chat using a webhook
    
    Args:
        webhook_url (str): Webhook URL for Google Chat
        message (str): Message to send
        
    Returns:
        bool: True if message sent successfully, False otherwise
    """
    try:
        payload = {"text": message}
        response = requests.post(webhook_url, json=payload)
        
        if response.status_code == 200:
            logger.info("Google Chat message sent successfully")
            return True
        else:
            logger.error(f"Error sending Google Chat message: {response.status_code} {response.text}")
            return False
    
    except Exception as e:
        logger.error(f"Error sending Google Chat message: {str(e)}")
        return False
