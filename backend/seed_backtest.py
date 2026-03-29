from db.database import SessionLocal
from services.backtest_service import run_historical_backtest
import logging

logging.basicConfig(level=logging.INFO)

def seed():
    db = SessionLocal()
    try:
        # Run backtest for some NIFTY 50 majors
        symbols = ["HDFCBANK.NS", "TCS.NS", "RELIANCE.NS", "INFY.NS", "ITC.NS"]
        print(f"Seeding backtest data for {symbols}...")
        run_historical_backtest(db, symbols)
        print("Seeding complete.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
