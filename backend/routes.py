from flask import Blueprint, jsonify, request
from backend.extensions import db, jwt
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import User, Subject, Chapter, Quiz, Question, Score
from backend.resources.user_resources import create_user, login_user, update_last_active
from backend.resources.admin_resources import get_users, update_user_role
from backend.resources.subject_resources import (
    get_subjects, get_subject, create_subject, 
    update_subject, delete_subject
)
from backend.resources.quiz_resources import (
    get_quizzes, get_quiz, create_quiz, 
    update_quiz, delete_quiz, get_quiz_questions,
    submit_quiz
)
from backend.resources.score_resources import get_user_scores

# Create a Blueprint for API routes
api_bp = Blueprint('api', __name__)

# User routes
@api_bp.route('/register', methods=['POST'])
def register():
    return create_user(request)

@api_bp.route('/login', methods=['POST'])
def login():
    return login_user(request)

@api_bp.route('/users/active', methods=['POST'])
@jwt_required()
def active():
    return update_last_active()

# Admin routes
@api_bp.route('/users', methods=['GET'])
@jwt_required()
def users():
    return get_users()

@api_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@jwt_required()
def update_role(user_id):
    return update_user_role(user_id, request)

# Quiz routes
@api_bp.route('/quizzes', methods=['GET'])
@jwt_required()
def list_quizzes():
    return get_quizzes()

@api_bp.route('/quizzes/search', methods=['GET'])
@jwt_required()
def search_quizzes():
    query = request.args.get('q', '')
    subject_id = request.args.get('subject_id')
    chapter_id = request.args.get('chapter_id')
    
    # Convert to integers if they exist
    if subject_id and subject_id.isdigit():
        subject_id = int(subject_id)
    else:
        subject_id = None
        
    if chapter_id and chapter_id.isdigit():
        chapter_id = int(chapter_id)
    else:
        chapter_id = None
    
    # Query quizzes with filters
    quizzes_query = Quiz.query
    
    if query:
        quizzes_query = quizzes_query.filter(Quiz.title.ilike(f'%{query}%'))
    
    if subject_id:
        quizzes_query = quizzes_query.filter(Quiz.subject_id == subject_id)
        
    if chapter_id:
        quizzes_query = quizzes_query.filter(Quiz.chapter_id == chapter_id)
    
    quizzes = quizzes_query.all()
    
    # Format the response
    result = []
    for quiz in quizzes:
        # Count questions for each quiz
        question_count = Question.query.filter_by(quiz_id=quiz.id).count()
        
        quiz_data = quiz.to_dict()
        quiz_data['questions_count'] = question_count
        result.append(quiz_data)
    
    return jsonify(result)

@api_bp.route('/quizzes/<int:quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz_by_id(quiz_id):
    return get_quiz(quiz_id)

@api_bp.route('/quizzes', methods=['POST'])
@jwt_required()
def new_quiz():
    return create_quiz(request)

@api_bp.route('/quizzes/<int:quiz_id>', methods=['PUT'])
@jwt_required()
def edit_quiz(quiz_id):
    return update_quiz(quiz_id, request)

@api_bp.route('/quizzes/<int:quiz_id>', methods=['DELETE'])
@jwt_required()
def remove_quiz(quiz_id):
    return delete_quiz(quiz_id)

@api_bp.route('/quizzes/<int:quiz_id>/questions', methods=['GET'])
@jwt_required()
def list_quiz_questions(quiz_id):
    return get_quiz_questions(quiz_id)

@api_bp.route('/quizzes/<int:quiz_id>/submit', methods=['POST'])
@jwt_required()
def quiz_submission(quiz_id):
    return submit_quiz(quiz_id, request)

# Subject routes
@api_bp.route('/subjects', methods=['GET'])
@jwt_required()
def list_subjects():
    return get_subjects()

@api_bp.route('/subjects/<int:subject_id>', methods=['GET'])
@jwt_required()
def get_subject_by_id(subject_id):
    return get_subject(subject_id)

@api_bp.route('/subjects', methods=['POST'])
@jwt_required()
def new_subject():
    return create_subject(request)

@api_bp.route('/subjects/<int:subject_id>', methods=['PUT'])
@jwt_required()
def edit_subject(subject_id):
    return update_subject(subject_id, request)

@api_bp.route('/subjects/<int:subject_id>', methods=['DELETE'])
@jwt_required()
def remove_subject(subject_id):
    return delete_subject(subject_id)

# Chapter routes
@api_bp.route('/subjects/<int:subject_id>/chapters', methods=['GET'])
@jwt_required()
def get_subject_chapters(subject_id):
    try:
        chapters = Chapter.query.filter_by(subject_id=subject_id).all()
        return jsonify([chapter.to_dict() for chapter in chapters])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/chapters', methods=['GET'])
@jwt_required()
def list_chapters():
    try:
        chapters = Chapter.query.all()
        return jsonify([chapter.to_dict() for chapter in chapters])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Score routes
@api_bp.route('/scores', methods=['GET'])
@jwt_required()
def list_user_scores():
    return get_user_scores()
