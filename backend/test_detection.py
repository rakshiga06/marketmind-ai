from db.database import SessionLocal
from services.pattern_service import fetch_and_detect_patterns
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_detection():
    db = SessionLocal()
    test_symbols = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS"]
    try:
        logger.info(f"Running test pattern detection for {test_symbols}...")
        fetch_and_detect_patterns(db, symbols=test_symbols)
        logger.info("Test detection completed successfully!")
    except Exception as e:
        logger.error(f"Test detection failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_detection()
