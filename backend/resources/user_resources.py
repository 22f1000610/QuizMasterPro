from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from backend.extensions import db
from backend.models import User
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def create_user():
    """Register a new user"""
    data = request.get_json()

    try:
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"error": "Email already registered"}), 400

        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            password=generate_password_hash(data['password'])
        )

        db.session.add(user)
        db.session.commit()

        return jsonify({"message": "User created successfully"}), 201

    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        return jsonify({"error": "Could not create user"}), 500

def login_user():
    """Login a user"""
    data = request.get_json()

    try:
        user = User.query.filter_by(email=data['email']).first()

        if user and check_password_hash(user.password, data['password']):
            access_token = create_access_token(identity=user.id)
            return jsonify({
                "access_token": access_token,
                "user": user.to_dict()
            }), 200

        return jsonify({"error": "Invalid credentials"}), 401

    except Exception as e:
        logger.error(f"Error logging in: {str(e)}")
        return jsonify({"error": "Could not log in"}), 500

@jwt_required()
def update_last_active():
    """Update user's last active timestamp"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user:
            user.last_active = datetime.utcnow()
            db.session.commit()
            return jsonify({"message": "Last active time updated"}), 200

        return jsonify({"error": "User not found"}), 404

    except Exception as e:
        logger.error(f"Error updating last active: {str(e)}")
        return jsonify({"error": "Could not update last active time"}), 500

@jwt_required()
def get_user_profile():
    """Get the user's profile"""
    user_id = get_jwt_identity()
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_admin,
        "last_active": user.last_active.isoformat() if user.last_active else None,
        "created_at": user.created_at.isoformat()
    }), 200