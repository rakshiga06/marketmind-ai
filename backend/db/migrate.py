from db.database import engine
from db.models import Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_database():
    """Migrate all models to the active PostgreSQL database instance."""
    try:
        logger.info("Connecting to database and creating tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database migration successful!")
    except Exception as e:
        logger.error(f"Migration failed: {e}")

if __name__ == "__main__":
    setup_database()
