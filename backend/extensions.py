from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from sqlalchemy.orm import DeclarativeBase
import redis
import os
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create base class for SQLAlchemy models
class Base(DeclarativeBase):
    pass

# Initialize extensions
db = SQLAlchemy(model_class=Base)
jwt = JWTManager()
cors = CORS()
mail = Mail()

# Initialize Redis client (will be connected in app.py)
redis_client = None