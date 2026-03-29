import os
from celery import Celery
from config import config

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

# We will load and define periodic signal scraping tasks here shortly.
