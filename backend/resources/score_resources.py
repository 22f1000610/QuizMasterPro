from flask import request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db, redis_client
from backend.models import Score, User, Quiz
from backend.celery.tasks import generate_scores_csv
import json
import logging
import os

logger = logging.getLogger(__name__)

@jwt_required()
def get_user_scores():
    """Get all scores for the current user"""
    current_user = get_jwt_identity()
    user_id = current_user.get('id')
    
    # Try to get from cache first
    cache_key = f"user_{user_id}_scores"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        return jsonify(json.loads(cached_data)), 200
    
    # Get all scores for the user
    scores = Score.query.filter_by(user_id=user_id).order_by(Score.attempt_date.desc()).all()
    
    scores_data = []
    for score in scores:
        quiz = Quiz.query.get(score.quiz_id)
        chapter = quiz.chapter
        subject = chapter.subject
        
        scores_data.append({
            "id": score.id,
            "quiz_id": score.quiz_id,
            "quiz_title": quiz.title,
            "chapter_name": chapter.name,
            "subject_name": subject.name,
            "total_questions": score.total_questions,
            "total_correct": score.total_correct,
            "percentage_score": score.percentage_score,
            "time_taken": score.time_taken,
            "attempt_date": score.attempt_date.isoformat()
        })
    
    # Cache the results for 5 minutes
    redis_client.setex(cache_key, 300, json.dumps(scores_data))
    
    return jsonify(scores_data), 200

@jwt_required()
def get_all_scores():
    """Get all scores for all users (admin only)"""
    current_user = get_jwt_identity()
    
    # Check if the user is an admin
    if not current_user.get('is_admin', False):
        return jsonify({"error": "Admin privileges required"}), 403
    
    # Try to get from cache first
    cache_key = "all_scores"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        return jsonify(json.loads(cached_data)), 200
    
    # Get all scores
    scores = Score.query.order_by(Score.attempt_date.desc()).all()
    
    scores_data = []
    for score in scores:
        user = User.query.get(score.user_id)
        quiz = Quiz.query.get(score.quiz_id)
        chapter = quiz.chapter
        subject = chapter.subject
        
        scores_data.append({
            "id": score.id,
            "user_id": score.user_id,
            "username": user.username,
            "quiz_id": score.quiz_id,
            "quiz_title": quiz.title,
            "chapter_name": chapter.name,
            "subject_name": subject.name,
            "total_questions": score.total_questions,
            "total_correct": score.total_correct,
            "percentage_score": score.percentage_score,
            "time_taken": score.time_taken,
            "attempt_date": score.attempt_date.isoformat()
        })
    
    # Cache the results for 5 minutes
    redis_client.setex(cache_key, 300, json.dumps(scores_data))
    
    return jsonify(scores_data), 200

@jwt_required()
def export_scores_csv():
    """Trigger a Celery task to export scores to CSV"""
    current_user = get_jwt_identity()
    
    # Check if the user is an admin
    if not current_user.get('is_admin', False):
        return jsonify({"error": "Admin privileges required"}), 403
    
    # Start the Celery task
    task = generate_scores_csv.delay()
    
    return jsonify({
        "message": "CSV export started",
        "task_id": task.id
    }), 202

@jwt_required()
def get_csv_file(task_id):
    """Get the generated CSV file"""
    current_user = get_jwt_identity()
    
    # Check if the user is an admin
    if not current_user.get('is_admin', False):
        return jsonify({"error": "Admin privileges required"}), 403
    
    # Check if the file exists
    file_path = os.path.join("backend", "celery", "user-downloads", f"scores_{task_id}.csv")
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found. Task may still be processing."}), 404
    
    return send_file(file_path, as_attachment=True, download_name="quiz_scores.csv")
