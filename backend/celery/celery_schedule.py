from celery.schedules import crontab
from .celery_factory import celery

# Configure periodic tasks
@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Daily task to check for inactive users and send reminders
    # Run every day at 6:00 PM
    sender.add_periodic_task(
        crontab(hour=18, minute=0),
        send_daily_reminders.s(),
        name='send_daily_reminders'
    )
    
    # Monthly task to generate activity reports for all users
    # Run on the 1st of every month at 2:00 AM
    sender.add_periodic_task(
        crontab(day_of_month=1, hour=2, minute=0),
        generate_monthly_reports.s(),
        name='generate_monthly_reports'
    )

# Import tasks after defining the celery instance
from .tasks import send_daily_reminders, generate_monthly_reports
