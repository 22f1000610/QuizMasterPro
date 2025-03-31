from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db, redis_client
from backend.models import User, Quiz, Chapter, Question, Score
import json
import logging
import base64
import re
from datetime import datetime

logger = logging.getLogger(__name__)

@jwt_required()
def get_quizzes(chapter_id):
    """Get all quizzes for a chapter"""
    # Check if chapter exists
    chapter = Chapter.query.get(chapter_id)
    if not chapter:
        return jsonify({"error": "Chapter not found"}), 404
    
    # Get all quizzes for the chapter
    quizzes = Quiz.query.filter_by(chapter_id=chapter_id).all()
    
    quizzes_data = [{
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "date_of_quiz": quiz.date_of_quiz.isoformat(),
        "time_duration": quiz.time_duration,
        "questions_count": quiz.questions.count(),
        "created_at": quiz.created_at.isoformat()
    } for quiz in quizzes]
    
    # Only use Redis if it's available
    if redis_client:
        try:
            cache_key = f"chapter_{chapter_id}_quizzes"
            redis_client.setex(cache_key, 300, json.dumps(quizzes_data))
        except Exception as e:
            logger.error(f"Redis error when caching quizzes: {e}")
    
    return jsonify(quizzes_data), 200

@jwt_required()
def create_quiz(chapter_id):
    """Create a new quiz for a chapter"""
    user_id = get_jwt_identity()
    
    # Check if the user is an admin
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Admin privileges required"}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    # Validate required fields
    required_fields = ['title', 'date_of_quiz', 'time_duration']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing {field}"}), 400
    
    # Check if chapter exists
    chapter = Chapter.query.get(chapter_id)
    if not chapter:
        return jsonify({"error": "Chapter not found"}), 404
    
    # Parse date
    try:
        date_of_quiz = datetime.strptime(data['date_of_quiz'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
    
    # Create new quiz
    quiz = Quiz(
        title=data['title'],
        description=data.get('description', ''),
        chapter_id=chapter_id,
        date_of_quiz=date_of_quiz,
        time_duration=int(data['time_duration'])
    )
    
    try:
        db.session.add(quiz)
        db.session.commit()
        
        # Invalidate cache if Redis is available
        if redis_client:
            try:
                redis_client.delete(f"chapter_{chapter_id}_quizzes")
            except Exception as e:
                logger.error(f"Redis error when invalidating cache: {e}")
        
        return jsonify({
            "message": "Quiz created successfully",
            "quiz": {
                "id": quiz.id,
                "title": quiz.title,
                "description": quiz.description,
                "date_of_quiz": quiz.date_of_quiz.isoformat(),
                "time_duration": quiz.time_duration,
                "created_at": quiz.created_at.isoformat()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating quiz: {str(e)}")
        return jsonify({"error": "Error creating quiz"}), 500

@jwt_required()
def update_quiz(quiz_id):
    """Update an existing quiz"""
    user_id = get_jwt_identity()
    
    # Check if the user is an admin
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Admin privileges required"}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    # Check if quiz exists
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    
    # Update fields
    if 'title' in data:
        quiz.title = data['title']
    
    if 'description' in data:
        quiz.description = data['description']
    
    if 'date_of_quiz' in data:
        try:
            quiz.date_of_quiz = datetime.strptime(data['date_of_quiz'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
    
    if 'time_duration' in data:
        quiz.time_duration = int(data['time_duration'])
    
    try:
        db.session.commit()
        
        # Invalidate cache if Redis is available
        if redis_client:
            try:
                redis_client.delete(f"chapter_{quiz.chapter_id}_quizzes")
            except Exception as e:
                logger.error(f"Redis error when invalidating cache: {e}")
        
        return jsonify({
            "message": "Quiz updated successfully",
            "quiz": {
                "id": quiz.id,
                "title": quiz.title,
                "description": quiz.description,
                "date_of_quiz": quiz.date_of_quiz.isoformat(),
                "time_duration": quiz.time_duration,
                "created_at": quiz.created_at.isoformat()
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating quiz: {str(e)}")
        return jsonify({"error": "Error updating quiz"}), 500

@jwt_required()
def delete_quiz(quiz_id):
    """Delete a quiz"""
    user_id = get_jwt_identity()
    
    # Check if the user is an admin
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Admin privileges required"}), 403
    
    # Check if quiz exists
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    
    chapter_id = quiz.chapter_id
    
    try:
        db.session.delete(quiz)
        db.session.commit()
        
        # Invalidate cache if Redis is available
        if redis_client:
            try:
                redis_client.delete(f"chapter_{chapter_id}_quizzes")
            except Exception as e:
                logger.error(f"Redis error when invalidating cache: {e}")
        
        return jsonify({"message": "Quiz deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting quiz: {str(e)}")
        return jsonify({"error": "Error deleting quiz"}), 500

@jwt_required()
def get_questions(quiz_id):
    """Get all questions for a quiz"""
    # Check if the user is an admin
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Admin privileges required"}), 403
    
    # Check if quiz exists
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    
    # Get all questions for the quiz
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    
    questions_data = [{
        "id": question.id,
        "question_statement": question.question_statement,
        "question_image": question.question_image,
        "option1": question.option1,
        "option1_image": question.option1_image,
        "option2": question.option2,
        "option2_image": question.option2_image,
        "option3": question.option3,
        "option3_image": question.option3_image,
        "option4": question.option4,
        "option4_image": question.option4_image,
        "correct_option": question.correct_option,
        "created_at": question.created_at.isoformat()
    } for question in questions]
    
    return jsonify(questions_data), 200

@jwt_required()
def create_question(quiz_id):
    """Create a new question for a quiz"""
    user_id = get_jwt_identity()
    
    # Check if the user is an admin
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Admin privileges required"}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    # Validate required fields
    required_fields = ['question_statement', 'option1', 'option2', 'option3', 'option4', 'correct_option']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing {field}"}), 400
    
    # Check if quiz exists
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    
    # Validate correct_option
    try:
        correct_option = int(data['correct_option'])
        if correct_option < 1 or correct_option > 4:
            return jsonify({"error": "Correct option must be between 1 and 4"}), 400
    except ValueError:
        return jsonify({"error": "Correct option must be a number"}), 400
    
    # Handle image data (base64 or URL)
    question_image = data.get('question_image', None)
    option1_image = data.get('option1_image', None)
    option2_image = data.get('option2_image', None)
    option3_image = data.get('option3_image', None)
    option4_image = data.get('option4_image', None)
    
    # Create new question
    question = Question(
        quiz_id=quiz_id,
        question_statement=data['question_statement'],
        question_image=question_image,
        option1=data['option1'],
        option1_image=option1_image,
        option2=data['option2'],
        option2_image=option2_image,
        option3=data['option3'],
        option3_image=option3_image,
        option4=data['option4'],
        option4_image=option4_image,
        correct_option=correct_option
    )
    
    try:
        db.session.add(question)
        db.session.commit()
        
        return jsonify({
            "message": "Question created successfully",
            "question": {
                "id": question.id,
                "question_statement": question.question_statement,
                "question_image": question.question_image,
                "option1": question.option1,
                "option1_image": question.option1_image,
                "option2": question.option2,
                "option2_image": question.option2_image,
                "option3": question.option3,
                "option3_image": question.option3_image,
                "option4": question.option4,
                "option4_image": question.option4_image,
                "correct_option": question.correct_option,
                "created_at": question.created_at.isoformat()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating question: {str(e)}")
        return jsonify({"error": "Error creating question"}), 500

@jwt_required()
def update_question(question_id):
    """Update an existing question"""
    user_id = get_jwt_identity()
    
    # Check if the user is an admin
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Admin privileges required"}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    # Check if question exists
    question = Question.query.get(question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404
    
    # Update fields
    if 'question_statement' in data:
        question.question_statement = data['question_statement']
    
    if 'question_image' in data:
        question.question_image = data['question_image']
    
    if 'option1' in data:
        question.option1 = data['option1']
    
    if 'option1_image' in data:
        question.option1_image = data['option1_image']
    
    if 'option2' in data:
        question.option2 = data['option2']
        
    if 'option2_image' in data:
        question.option2_image = data['option2_image']
    
    if 'option3' in data:
        question.option3 = data['option3']
        
    if 'option3_image' in data:
        question.option3_image = data['option3_image']
    
    if 'option4' in data:
        question.option4 = data['option4']
        
    if 'option4_image' in data:
        question.option4_image = data['option4_image']
    
    if 'correct_option' in data:
        try:
            correct_option = int(data['correct_option'])
            if correct_option < 1 or correct_option > 4:
                return jsonify({"error": "Correct option must be between 1 and 4"}), 400
            question.correct_option = correct_option
        except ValueError:
            return jsonify({"error": "Correct option must be a number"}), 400
    
    try:
        db.session.commit()
        
        return jsonify({
            "message": "Question updated successfully",
            "question": {
                "id": question.id,
                "question_statement": question.question_statement,
                "question_image": question.question_image,
                "option1": question.option1,
                "option1_image": question.option1_image,
                "option2": question.option2,
                "option2_image": question.option2_image,
                "option3": question.option3,
                "option3_image": question.option3_image,
                "option4": question.option4,
                "option4_image": question.option4_image,
                "correct_option": question.correct_option,
                "created_at": question.created_at.isoformat()
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating question: {str(e)}")
        return jsonify({"error": "Error updating question"}), 500

@jwt_required()
def delete_question(question_id):
    """Delete a question"""
    user_id = get_jwt_identity()
    
    # Check if the user is an admin
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Admin privileges required"}), 403
    
    # Check if question exists
    question = Question.query.get(question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404
    
    try:
        db.session.delete(question)
        db.session.commit()
        
        return jsonify({"message": "Question deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting question: {str(e)}")
        return jsonify({"error": "Error deleting question"}), 500

@jwt_required()
def get_quiz_questions(quiz_id):
    """Get all questions for a quiz for users to take"""
    user_id = get_jwt_identity()
    
    # Check if quiz exists
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    
    # Check if the user has already taken this quiz
    existing_score = Score.query.filter_by(user_id=user_id, quiz_id=quiz_id).first()
    if existing_score:
        return jsonify({
            "error": "You have already taken this quiz",
            "score": {
                "total_questions": existing_score.total_questions,
                "total_correct": existing_score.total_correct,
                "percentage_score": existing_score.percentage_score,
                "time_taken": existing_score.time_taken,
                "attempt_date": existing_score.attempt_date.isoformat()
            }
        }), 400
    
    # Get all questions for the quiz
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    
    # Check if there are questions
    if not questions:
        return jsonify({"error": "No questions found for this quiz"}), 404
    
    # For security, don't include correct answers
    questions_data = [{
        "id": question.id,
        "question_statement": question.question_statement,
        "question_image": question.question_image,
        "option1": question.option1,
        "option1_image": question.option1_image,
        "option2": question.option2,
        "option2_image": question.option2_image,
        "option3": question.option3,
        "option3_image": question.option3_image,
        "option4": question.option4,
        "option4_image": question.option4_image
    } for question in questions]
    
    return jsonify({
        "quiz": {
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description,
            "time_duration": quiz.time_duration  # in minutes
        },
        "questions": questions_data
    }), 200

@jwt_required()
def submit_quiz(quiz_id):
    """Submit a quiz attempt"""
    user_id = get_jwt_identity()
    
    data = request.get_json()
    if not data or 'answers' not in data or 'time_taken' not in data:
        return jsonify({"error": "Missing answers or time taken"}), 400
    
    answers = data['answers']  # Should be a dict of question_id: selected_option
    time_taken = data['time_taken']  # Time taken in seconds
    
    # Check if quiz exists
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    
    # Check if the user has already taken this quiz
    existing_score = Score.query.filter_by(user_id=user_id, quiz_id=quiz_id).first()
    if existing_score:
        return jsonify({"error": "You have already taken this quiz"}), 400
    
    # Get all questions for the quiz
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    
    # Check if there are questions
    if not questions:
        return jsonify({"error": "No questions found for this quiz"}), 404
    
    # Calculate score
    total_questions = len(questions)
    total_correct = 0
    
    for question in questions:
        # Check if the question was answered
        if str(question.id) in answers:
            selected_option = int(answers[str(question.id)])
            if selected_option == question.correct_option:
                total_correct += 1
    
    # Calculate percentage
    percentage_score = (total_correct / total_questions) * 100 if total_questions > 0 else 0
    
    # Create score record
    score = Score(
        user_id=user_id,
        quiz_id=quiz_id,
        total_questions=total_questions,
        total_correct=total_correct,
        percentage_score=percentage_score,
        time_taken=time_taken
    )
    
    try:
        db.session.add(score)
        db.session.commit()
        
        return jsonify({
            "message": "Quiz submitted successfully",
            "score": {
                "id": score.id,
                "total_questions": score.total_questions,
                "total_correct": score.total_correct,
                "percentage_score": score.percentage_score,
                "time_taken": score.time_taken,
                "attempt_date": score.attempt_date.isoformat()
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error submitting quiz: {str(e)}")
        return jsonify({"error": "Error submitting quiz"}), 500
