from werkzeug.security import generate_password_hash
from backend.extensions import db
from backend.models import User
from backend.config import Config
import logging

logger = logging.getLogger(__name__)

def create_admin_user():
    """
    Create the initial admin user if it doesn't exist
    """
    try:
        # Check if admin already exists
        admin = User.query.filter_by(username=Config.ADMIN_USERNAME).first()
        
        if not admin:
            logger.info("Creating admin user")
            admin = User(
                username=Config.ADMIN_USERNAME, 
                email='admin@quizmasterpro.com',
                is_admin=True
            )
            admin.password_hash = generate_password_hash(Config.ADMIN_PASSWORD)
            
            db.session.add(admin)
            db.session.commit()
            logger.info("Admin user created successfully")
        else:
            logger.info("Admin user already exists")
            
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating admin user: {str(e)}")
