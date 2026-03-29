import os
from celery import Celery
from celery.schedules import crontab
from config import config
from db.database import SessionLocal
from services.pattern_service import run_daily_pattern_job
from services.backtest_service import run_historical_backtest
import logging

logger = logging.getLogger(__name__)

celery_app = Celery(
    "marketmind_worker",
    broker=config.REDIS_URL,
    backend=config.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    broker_connection_retry_on_startup=True
)

@celery_app.task(name="run_daily_patterns")
def run_daily_patterns():
    db = SessionLocal()
    try:
        run_daily_pattern_job(db)
    finally:
        db.close()

@celery_app.task(name="run_full_backtest")
def run_full_backtest():
    db = SessionLocal()
    try:
        run_historical_backtest(db)
    finally:
        db.close()

# Schedule tasks
celery_app.conf.beat_schedule = {
    "daily-pattern-detection": {
        "task": "run_daily_patterns",
        "schedule": crontab(hour=18, minute=30), # Run after IST market close
    },
    "monthly-backtest-refresh": {
        "task": "run_full_backtest",
        "schedule": crontab(day_of_month=1, hour=1, minute=0), # Run monthly
    }
}
