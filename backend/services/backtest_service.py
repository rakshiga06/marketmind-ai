import yfinance as yf
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from db.models import PatternBacktestResult
from patterns.detector import get_pattern_signals
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Subset for testing
NIFTY_50 = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "SBIN.NS"]

def run_historical_backtest(db: Session, symbols: list = None):
    """
    Run 5-year historical backtest for all patterns.
    Calculates median returns for 30, 60, and 90-day windows.
    """
    if symbols is None:
        symbols = NIFTY_50
        
    for symbol in symbols:
        try:
            logger.info(f"Backtesting {symbol} patterns for 5 years...")
            df = yf.download(symbol, period="5y", interval="1d", progress=False)
            if df.empty or len(df) < 250:
                continue
            
            # Run detectors on entire historical series
            results = get_pattern_signals(df)
            close = df['Close'].values.flatten()
            
            for p_name, triggers in results.items():
                trigger_indices = np.where(triggers.values)[0]
                total_triggers = len(trigger_indices)
                
                if total_triggers == 0:
                    continue
                
                metrics = {30: [], 60: [], 90: []}
                success_count = 0
                
                for idx in trigger_indices:
                    entry_price = close[idx]
                    
                    for days in [30, 60, 90]:
                        if idx + days < len(close):
                            exit_price = close[idx + days]
                            ret = ((exit_price - entry_price) / entry_price) * 100
                            metrics[days].append(ret)
                            
                            # Standard win condition (e.g., >10% return in 60 days)
                            if days == 60 and ret >= 10.0:
                                success_count += 1
                
                # Update or Create backtest result record
                backtest_res = db.query(PatternBacktestResult).filter(
                    PatternBacktestResult.symbol == symbol.replace(".NS", ""),
                    PatternBacktestResult.pattern_name == p_name
                ).first()
                
                if not backtest_res:
                    backtest_res = PatternBacktestResult(
                        symbol=symbol.replace(".NS", ""),
                        pattern_name=p_name
                    )
                    db.add(backtest_res)
                
                backtest_res.occurrences_count = total_triggers
                backtest_res.median_return_30d = float(np.median(metrics[30])) if metrics[30] else 0.0
                backtest_res.median_return_60d = float(np.median(metrics[60])) if metrics[60] else 0.0
                backtest_res.median_return_90d = float(np.median(metrics[90])) if metrics[90] else 0.0
                backtest_res.win_rate = float((success_count / len(metrics[60])) * 100) if metrics[60] else 0.0
                backtest_res.updated_at = datetime.now()
                
            db.commit()
            logger.info(f"Finished backtesting {symbol}.")
            
        except Exception as e:
            logger.error(f"Backtest error for {symbol}: {e}")
            db.rollback()
