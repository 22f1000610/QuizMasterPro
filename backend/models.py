from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from backend.extensions import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    scores = db.relationship('Score', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Subject(db.Model):
    __tablename__ = 'subjects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    chapters = db.relationship('Chapter', backref='subject', lazy='dynamic', cascade='all, delete-orphan')

class Chapter(db.Model):
    __tablename__ = 'chapters'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    quizzes = db.relationship('Quiz', backref='chapter', lazy='dynamic', cascade='all, delete-orphan')
    
    # Make sure chapters have unique names within a subject
    __table_args__ = (db.UniqueConstraint('subject_id', 'name', name='_subject_chapter_uc'),)

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapters.id'), nullable=False)
    date_of_quiz = db.Column(db.Date, nullable=False)
    time_duration = db.Column(db.Integer, nullable=False)  # Duration in minutes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    questions = db.relationship('Question', backref='quiz', lazy='dynamic', cascade='all, delete-orphan')
    scores = db.relationship('Score', backref='quiz', lazy='dynamic', cascade='all, delete-orphan')
    
    # Make sure quiz titles are unique within a chapter
    __table_args__ = (db.UniqueConstraint('chapter_id', 'title', name='_chapter_quiz_uc'),)

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    question_statement = db.Column(db.Text, nullable=False)
    question_image = db.Column(db.Text, nullable=True)  # URL to image or base64 encoded image
    option1 = db.Column(db.String(200), nullable=False)
    option1_image = db.Column(db.Text, nullable=True)  # URL to image or base64 encoded image
    option2 = db.Column(db.String(200), nullable=False)
    option2_image = db.Column(db.Text, nullable=True)  # URL to image or base64 encoded image
    option3 = db.Column(db.String(200), nullable=False)
    option3_image = db.Column(db.Text, nullable=True)  # URL to image or base64 encoded image
    option4 = db.Column(db.String(200), nullable=False)
    option4_image = db.Column(db.Text, nullable=True)  # URL to image or base64 encoded image
    correct_option = db.Column(db.Integer, nullable=False)  # 1, 2, 3, or 4
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Score(db.Model):
    __tablename__ = 'scores'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    total_correct = db.Column(db.Integer, nullable=False)
    percentage_score = db.Column(db.Float, nullable=False)
    time_taken = db.Column(db.Integer, nullable=False)  # Time taken in seconds
    attempt_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Make sure a user can only have one score per quiz
    __table_args__ = (db.UniqueConstraint('user_id', 'quiz_id', name='_user_quiz_uc'),)
