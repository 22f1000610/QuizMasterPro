import os
import csv
from datetime import datetime, timedelta
import io
from backend.extensions import db
from backend.models import User, Quiz, Score, Subject, Chapter, Question
from .celery_factory import celery
from .mail_service import send_email
import tempfile
import pandas as pd
import logging
from sqlalchemy import func

logger = logging.getLogger(__name__)

# Make sure user-downloads directory exists
os.makedirs(os.path.join("backend", "celery", "user-downloads"), exist_ok=True)

@celery.task
def send_daily_reminders():
    """
    Send daily reminders to inactive users
    """
    logger.info("Starting daily reminder task")
    
    try:
        # Get inactive users (haven't logged in for 7 days)
        cutoff_date = datetime.utcnow() - timedelta(days=7)
        inactive_users = User.query.filter(
            User.is_admin == False,
            User.last_active < cutoff_date
        ).all()
        
        # Get recent quizzes (created in the last 7 days)
        recent_cutoff = datetime.utcnow() - timedelta(days=7)
        recent_quizzes = Quiz.query.filter(Quiz.created_at > recent_cutoff).all()
        
        # Send reminders
        for user in inactive_users:
            # Skip users who have attempted all recent quizzes
            user_scores = [score.quiz_id for score in Score.query.filter_by(user_id=user.id).all()]
            pending_quizzes = [quiz for quiz in recent_quizzes if quiz.id not in user_scores]
            
            if pending_quizzes:
                # Create email content
                subject = "Quiz Master Pro - New Quizzes Available"
                html_content = f"""
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                        .container {{ padding: 20px; }}
                        h1 {{ color: #2c3e50; }}
                        ul {{ margin-bottom: 20px; }}
                        li {{ margin-bottom: 10px; }}
                        .footer {{ margin-top: 30px; color: #7f8c8d; font-size: 0.9em; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Hello {user.username}!</h1>
                        <p>We've noticed you haven't visited Quiz Master Pro lately. We have some new quizzes that might interest you:</p>
                        <ul>
                """
                
                # Add up to 5 quizzes
                for quiz in pending_quizzes[:5]:
                    chapter = Chapter.query.get(quiz.chapter_id)
                    subject = Subject.query.get(chapter.subject_id)
                    html_content += f"<li><strong>{subject.name}</strong>: {chapter.name} - {quiz.title}</li>"
                
                html_content += f"""
                        </ul>
                        <p>Log in now to take these quizzes and improve your knowledge!</p>
                        <p><a href="http://localhost:5000/login">Click here to log in</a></p>
                        <div class="footer">
                            <p>This is an automated message. Please do not reply to this email.</p>
                            <p>If you no longer wish to receive these notifications, please update your preferences in your account settings.</p>
                        </div>
                    </div>
                </body>
                </html>
                """
                
                # Send email
                send_email(user.email, subject, html_content)
                logger.info(f"Reminder email sent to {user.email}")
        
        return f"Sent reminders to {len(inactive_users)} inactive users"
    
    except Exception as e:
        logger.error(f"Error sending daily reminders: {str(e)}")
        return f"Error: {str(e)}"

@celery.task
def generate_monthly_reports():
    """
    Generate monthly activity reports for all users
    """
    logger.info("Starting monthly report generation task")
    
    try:
        # Get all non-admin users
        users = User.query.filter_by(is_admin=False).all()
        
        # Get previous month
        today = datetime.utcnow()
        first_day_of_current_month = datetime(today.year, today.month, 1)
        last_day_of_previous_month = first_day_of_current_month - timedelta(days=1)
        first_day_of_previous_month = datetime(last_day_of_previous_month.year, 
                                              last_day_of_previous_month.month, 1)
        
        month_name = first_day_of_previous_month.strftime("%B %Y")
        
        # Generate report for each user
        for user in users:
            # Get all scores for user in previous month
            scores = Score.query.filter(
                Score.user_id == user.id,
                Score.attempt_date >= first_day_of_previous_month,
                Score.attempt_date <= last_day_of_previous_month
            ).all()
            
            # Skip users with no activity
            if not scores:
                logger.info(f"No activity for user {user.username} in {month_name}, skipping report")
                continue
            
            # Calculate statistics
            total_quizzes = len(scores)
            total_questions = sum(score.total_questions for score in scores)
            total_correct = sum(score.total_correct for score in scores)
            average_score = sum(score.percentage_score for score in scores) / total_quizzes if total_quizzes > 0 else 0
            
            # Generate HTML report
            subject = f"Quiz Master Pro - Your Activity Report for {month_name}"
            html_content = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                    .container {{ padding: 20px; }}
                    h1 {{ color: #2c3e50; text-align: center; }}
                    h2 {{ color: #3498db; }}
                    .summary {{ background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }}
                    .summary p {{ margin: 5px 0; }}
                    table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                    th {{ background-color: #f2f2f2; }}
                    tr:nth-child(even) {{ background-color: #f9f9f9; }}
                    .footer {{ margin-top: 30px; color: #7f8c8d; font-size: 0.9em; text-align: center; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Monthly Activity Report: {month_name}</h1>
                    <div class="summary">
                        <h2>Summary</h2>
                        <p><strong>Total Quizzes Taken:</strong> {total_quizzes}</p>
                        <p><strong>Total Questions Answered:</strong> {total_questions}</p>
                        <p><strong>Total Correct Answers:</strong> {total_correct}</p>
                        <p><strong>Average Score:</strong> {average_score:.2f}%</p>
                    </div>
                    
                    <h2>Quiz Details</h2>
                    <table>
                        <tr>
                            <th>Date</th>
                            <th>Subject</th>
                            <th>Chapter</th>
                            <th>Quiz</th>
                            <th>Score</th>
                            <th>Time Taken</th>
                        </tr>
            """
            
            # Add rows for each score
            for score in scores:
                quiz = Quiz.query.get(score.quiz_id)
                chapter = Chapter.query.get(quiz.chapter_id)
                subject = Subject.query.get(chapter.subject_id)
                
                # Format time taken (seconds to MM:SS)
                minutes = score.time_taken // 60
                seconds = score.time_taken % 60
                time_formatted = f"{minutes:02d}:{seconds:02d}"
                
                html_content += f"""
                        <tr>
                            <td>{score.attempt_date.strftime("%Y-%m-%d %H:%M")}</td>
                            <td>{subject.name}</td>
                            <td>{chapter.name}</td>
                            <td>{quiz.title}</td>
                            <td>{score.percentage_score:.2f}% ({score.total_correct}/{score.total_questions})</td>
                            <td>{time_formatted}</td>
                        </tr>
                """
            
            html_content += f"""
                    </table>
                    
                    <h2>Performance by Subject</h2>
                    <table>
                        <tr>
                            <th>Subject</th>
                            <th>Quizzes Taken</th>
                            <th>Average Score</th>
                        </tr>
            """
            
            # Group scores by subject
            subject_scores = {}
            for score in scores:
                quiz = Quiz.query.get(score.quiz_id)
                chapter = Chapter.query.get(quiz.chapter_id)
                subject = Subject.query.get(chapter.subject_id)
                
                if subject.name not in subject_scores:
                    subject_scores[subject.name] = {
                        'count': 0,
                        'total_score': 0
                    }
                
                subject_scores[subject.name]['count'] += 1
                subject_scores[subject.name]['total_score'] += score.percentage_score
            
            # Add rows for each subject
            for subject_name, data in subject_scores.items():
                avg_score = data['total_score'] / data['count']
                html_content += f"""
                        <tr>
                            <td>{subject_name}</td>
                            <td>{data['count']}</td>
                            <td>{avg_score:.2f}%</td>
                        </tr>
                """
            
            html_content += f"""
                    </table>
                    
                    <div class="footer">
                        <p>This is an automated report generated on {datetime.utcnow().strftime("%Y-%m-%d")}.</p>
                        <p>Log in to <a href="http://localhost:5000">Quiz Master Pro</a> to see more details and take more quizzes!</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Send email with report
            send_email(user.email, subject, html_content)
            logger.info(f"Monthly report sent to {user.email}")
        
        return f"Generated reports for {len(users)} users"
    
    except Exception as e:
        logger.error(f"Error generating monthly reports: {str(e)}")
        return f"Error: {str(e)}"

@celery.task
def generate_scores_csv():
    """
    Generate a CSV file with all quiz scores for admin export
    """
    logger.info("Starting CSV export task")
    
    try:
        # Create a unique task ID
        task_id = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        
        # Directory for storing files
        output_dir = os.path.join("backend", "celery", "user-downloads")
        os.makedirs(output_dir, exist_ok=True)
        
        # File path
        file_path = os.path.join(output_dir, f"scores_{task_id}.csv")
        
        # Get all scores with related data
        scores_data = []
        scores = Score.query.all()
        
        for score in scores:
            user = User.query.get(score.user_id)
            quiz = Quiz.query.get(score.quiz_id)
            chapter = Chapter.query.get(quiz.chapter_id)
            subject = Subject.query.get(chapter.subject_id)
            
            scores_data.append({
                'User ID': user.id,
                'Username': user.username,
                'Email': user.email,
                'Subject': subject.name,
                'Chapter': chapter.name,
                'Quiz': quiz.title,
                'Date of Quiz': quiz.date_of_quiz.isoformat(),
                'Total Questions': score.total_questions,
                'Correct Answers': score.total_correct,
                'Score (%)': score.percentage_score,
                'Time Taken (seconds)': score.time_taken,
                'Attempt Date': score.attempt_date.isoformat()
            })
        
        # Create DataFrame and export to CSV
        df = pd.DataFrame(scores_data)
        df.to_csv(file_path, index=False)
        
        logger.info(f"CSV export completed: {file_path}")
        return {"task_id": task_id, "file_path": file_path}
    
    except Exception as e:
        logger.error(f"Error generating CSV: {str(e)}")
        return {"error": str(e)}
