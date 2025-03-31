from flask import request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash
from backend.extensions import db, redis_client
from backend.models import User, Subject, Chapter, Quiz, Question, Score
import json
import logging

logger = logging.getLogger(__name__)

def admin_login():
    """Admin login endpoint"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing username or password"}), 400
    
    username = data.get('username')
    password = data.get('password')
    
    # Get the admin user
    admin = User.query.filter_by(username=username, is_admin=True).first()
    
    if not admin or not admin.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401
    
    # Create access token with string identity
    access_token = create_access_token(identity=str(admin.id))
    
    return jsonify({
        "access_token": access_token,
        "user_id": admin.id,
        "username": admin.username,
        "is_admin": admin.is_admin
    }), 200

@jwt_required()
def admin_get_users():
    """Get all users"""
    user_id = get_jwt_identity()
    
    # Check if the user is an admin
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Admin privileges required"}), 403
    
    # Get all users
    users = User.query.all()
    
    users_data = [{
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_admin,
        "last_active": user.last_active.isoformat() if user.last_active else None,
        "created_at": user.created_at.isoformat()
    } for user in users]
    
    return jsonify(users_data), 200

@jwt_required()
def admin_search_users():
    """Search users by username or email"""
    user_id = get_jwt_identity()
    
    # Check if the user is an admin
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Admin privileges required"}), 403
    
    search_term = request.args.get('q', '')
    
    # Search users
    users = User.query.filter(
        (User.username.ilike(f'%{search_term}%') | User.email.ilike(f'%{search_term}%'))
    ).all()
    
    users_data = [{
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_admin,
        "last_active": user.last_active.isoformat() if user.last_active else None,
        "created_at": user.created_at.isoformat()
    } for user in users]
    
    return jsonify(users_data), 200

@jwt_required()
def admin_search_subjects():
    """Search subjects by name"""
    user_id = get_jwt_identity()
    
    # Check if the user is an admin
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Admin privileges required"}), 403
    
    search_term = request.args.get('q', '')
    
    # Try to get from cache first
    try:
        cache_key = f"subject_search_{search_term}"
        cached_data = redis_client.get(cache_key)
        
        if cached_data:
            return jsonify(json.loads(cached_data)), 200
    except Exception as e:
        logger.warning(f"Redis cache error: {str(e)}")
        # Continue without cache
    
    # Search subjects
    subjects = Subject.query.filter(Subject.name.ilike(f'%{search_term}%')).all()
    
    subjects_data = [{
        "id": subject.id,
        "name": subject.name,
        "description": subject.description,
        "created_at": subject.created_at.isoformat(),
        "chapters_count": subject.chapters.count()
    } for subject in subjects]
    
    # Cache the result for 5 minutes
    # Only cache if Redis is available
    if redis_client:
        try:
            cache_key = f"subject_search_{search_term}"
            redis_client.setex(cache_key, 300, json.dumps(subjects_data))
        except Exception as e:
            logger.warning(f"Redis cache write error: {str(e)}")
    
    return jsonify(subjects_data), 200

@jwt_required()
def admin_search_quizzes():
    """Search quizzes by title"""
    user_id = get_jwt_identity()
    
    # Check if the user is an admin
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Admin privileges required"}), 403
    
    search_term = request.args.get('q', '')
    
    # Search quizzes
    quizzes = Quiz.query.filter(Quiz.title.ilike(f'%{search_term}%')).all()
    
    quizzes_data = [{
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "chapter_id": quiz.chapter_id,
        "chapter_name": quiz.chapter.name,
        "subject_name": quiz.chapter.subject.name,
        "date_of_quiz": quiz.date_of_quiz.isoformat(),
        "time_duration": quiz.time_duration,
        "questions_count": quiz.questions.count(),
        "created_at": quiz.created_at.isoformat()
    } for quiz in quizzes]
    
    return jsonify(quizzes_data), 200

@jwt_required()
def get_admin_dashboard_stats():
    """Get statistics for the admin dashboard"""
    user_id = get_jwt_identity()
    
    # Check if the user is an admin
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Admin privileges required"}), 403
    
    # Try to get from cache first if Redis is available
    if redis_client:
        try:
            cache_key = "admin_dashboard_stats"
            cached_data = redis_client.get(cache_key)
            
            if cached_data:
                return jsonify(json.loads(cached_data)), 200
        except Exception as e:
            logger.warning(f"Redis cache error: {str(e)}")
            # Continue without cache
    
    # Get statistics
    total_users = User.query.filter_by(is_admin=False).count()
    total_subjects = Subject.query.count()
    total_chapters = Chapter.query.count()
    total_quizzes = Quiz.query.count()
    total_questions = Question.query.count()
    total_attempts = Score.query.count()
    
    # Get recent user registrations
    recent_users = User.query.filter_by(is_admin=False).order_by(User.created_at.desc()).limit(5).all()
    recent_users_data = [{
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at.isoformat()
    } for user in recent_users]
    
    # Get recent quiz attempts
    recent_scores = Score.query.order_by(Score.attempt_date.desc()).limit(5).all()
    recent_scores_data = [{
        "id": score.id,
        "user_id": score.user_id,
        "username": score.user.username,
        "quiz_id": score.quiz_id,
        "quiz_title": score.quiz.title,
        "percentage_score": score.percentage_score,
        "attempt_date": score.attempt_date.isoformat()
    } for score in recent_scores]
    
    stats = {
        "total_users": total_users,
        "total_subjects": total_subjects,
        "total_chapters": total_chapters,
        "total_quizzes": total_quizzes,
        "total_questions": total_questions,
        "total_attempts": total_attempts,
        "recent_users": recent_users_data,
        "recent_scores": recent_scores_data
    }
    
    # Cache the results for 5 minutes if Redis is available
    if redis_client:
        try:
            cache_key = "admin_dashboard_stats"
            redis_client.setex(cache_key, 300, json.dumps(stats))
        except Exception as e:
            logger.warning(f"Redis cache write error: {str(e)}")
    
    return jsonify(stats), 200
