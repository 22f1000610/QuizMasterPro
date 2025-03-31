from celery import Celery
import os

def make_celery(app=None):
    """
    Create a Celery instance
    
    Args:
        app: Flask application instance
        
    Returns:
        Celery instance
    """
    # Create Celery app
    celery = Celery(
        'quiz_master_pro',
        broker=os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
        backend=os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
        include=['backend.celery.tasks']
    )
    
    # Load task configuration
    celery.conf.update(
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        timezone='UTC',
        enable_utc=True,
    )
    
    if app:
        # Configure Celery for Flask application
        class FlaskTask(celery.Task):
            def __call__(self, *args, **kwargs):
                with app.app_context():
                    return self.run(*args, **kwargs)
        
        celery.Task = FlaskTask
    
    return celery

# Create Celery instance
celery = make_celery()
