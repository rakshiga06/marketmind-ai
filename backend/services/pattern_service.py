import yfinance as yf
import pandas as pd
from sqlalchemy.orm import Session
from db.models import DetectedPattern
from patterns.detector import get_pattern_signals
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Subset for initial testing; would be 2000+ in production
NIFTY_50 = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "HINDUNILVR.NS",
    "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "KOTAKBANK.NS", "LT.NS", "AXISBANK.NS",
    "BAJFINANCE.NS", "ASIANPAINT.NS", "MARUTI.NS", "SUNPHARMA.NS", "TITAN.NS",
    "HCLTECH.NS", "ULTRACEMCO.NS", "WIPRO.NS", "ADANIENT.NS", "ADANIPORTS.NS",
    "TATASTEEL.NS", "TATAMOTORS.NS", "M&M.NS", "POWERGRID.NS", "NTPC.NS", "ONGC.NS",
    "JSWSTEEL.NS", "COALINDIA.NS", "GRASIM.NS", "HINDALCO.NS", "BPCL.NS", "BAJAJ-AUTO.NS"
]

def fetch_and_detect_patterns(db: Session, symbols: list = None):
    """
    Fetch 1-year OHLCV for symbols and detect all patterns.
    Saves new detections to DetectedPattern table.
    """
    if symbols is None:
        symbols = NIFTY_50
        
    for symbol in symbols:
        try:
            logger.info(f"Detecting patterns for {symbol}...")
            # Fetch data (1y for context)
            df = yf.download(symbol, period="1y", interval="1d", progress=False)
            if df.empty or len(df) < 100:
                continue
            
            # Run detectors
            results = get_pattern_signals(df)
            
            # Check for triggers on the last available day
            for pattern_name, triggers in results.items():
                if triggers.iloc[-1]: # If pattern triggered on the most recent row
                    logger.info(f"Pattern {pattern_name} detected for {symbol}!")
                    
                    # Create detection record
                    detection = DetectedPattern(
                        symbol=symbol.replace(".NS", ""),
                        pattern_name=pattern_name,
                        detected_at=datetime.now(),
                        price_at_detection=float(df['Close'].values.flatten()[-1]),
                        metadata_json=None # Can be extended
                    )
                    db.add(detection)
                    
            db.commit()
        except Exception as e:
            logger.error(f"Error processing {symbol}: {e}")
            db.rollback()

def run_daily_pattern_job(db: Session):
    """Entry point for daily batch task."""
    logger.info("Starting daily pattern detection job...")
    fetch_and_detect_patterns(db)
    logger.info("Daily pattern detection job completed.")
