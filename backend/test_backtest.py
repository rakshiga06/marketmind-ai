from db.database import SessionLocal
from services.backtest_service import run_historical_backtest
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_backtest():
    db = SessionLocal()
    test_symbols = ["RELIANCE.NS", "TCS.NS"]
    try:
        logger.info(f"Running historical backtest for {test_symbols}...")
        run_historical_backtest(db, symbols=test_symbols)
        logger.info("Historical backtest completed successfully!")
    except Exception as e:
        logger.error(f"Backtest failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_backtest()
