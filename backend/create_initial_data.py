from werkzeug.security import generate_password_hash
from datetime import datetime
from backend.extensions import db
from backend.models import User, Subject, Chapter, Quiz, Question
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

def create_sample_data():
    """
    Create sample data for testing purposes
    """
    try:
        # Create a sample subject
        subject = Subject(name="Mathematics", description="Basic mathematics course")
        db.session.add(subject)
        db.session.flush()

        # Create a sample chapter
        chapter = Chapter(
            name="Algebra",
            description="Introduction to algebra",
            subject_id=subject.id
        )
        db.session.add(chapter)
        db.session.flush()

        # Create a sample quiz
        quiz = Quiz(
            title="Basic Algebra Quiz",
            description="Test your algebra knowledge",
            chapter_id=chapter.id,
            date_of_quiz=datetime.utcnow().date(),
            time_duration=30
        )
        db.session.add(quiz)
        db.session.flush()

        # Create sample questions
        questions = [
            Question(
                quiz_id=quiz.id,
                question_text="What is 2x + 3 when x = 2?",
                correct_answer="7",
                options=["5", "6", "7", "8"]
            ),
            Question(
                quiz_id=quiz.id,
                question_text="Solve for x: 3x = 9",
                correct_answer="3",
                options=["2", "3", "4", "5"]
            )
        ]
        for question in questions:
            db.session.add(question)

        db.session.commit()
        logger.info("Sample data created successfully")

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating sample data: {str(e)}")
