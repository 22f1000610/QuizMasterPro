from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.models import User
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def create_user(request):
    data = request.get_json()

    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing required fields"}), 400

    # Check if username already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username already exists"}), 400

    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already exists"}), 400

    # Create new user
    user = User(
        username=data['username'],
        email=data['email']
    )
    user.set_password(data['password'])

    try:
        from backend.extensions import db
        db.session.add(user)
        db.session.commit()
        return jsonify({
            "message": "User created successfully",
            "user_id": user.id
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def login_user(request):
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing username or password"}), 400

    user = User.query.filter_by(username=data['username']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({"error": "Invalid credentials"}), 401

    # Update last active timestamp
    user.last_active = datetime.utcnow()
    from backend.extensions import db
    db.session.commit()

    # Create access token
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "access_token": access_token,
        "user_id": user.id,
        "username": user.username,
        "is_admin": user.is_admin
    }), 200

def update_last_active():
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if user:
            user.last_active = datetime.utcnow()
            from backend.extensions import db
            db.session.commit()
            return jsonify({"message": "Last active time updated"}), 200
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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