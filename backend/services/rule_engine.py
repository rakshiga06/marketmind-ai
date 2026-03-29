from datetime import datetime, timedelta
import pandas as pd
from typing import List, Dict

# Rule Engine for Multi-Signal Correlator
# We define specific signals and assign them a high/low priority score (1-5).
# If the aggregate score crosses a threshold in a given 5-day window, an alert is triggered.

SIGNAL_SCORES = {
    "RSI_DIVERGENCE_BULLISH": 3,
    "INSIDER_BUY": 5,
    "BULK_DEAL_PROMOTER": 4,
    "MACD_BULLISH_CROSS": 2,
    "VOLUME_BREAKOUT": 3
}

ALERT_THRESHOLD = 7 # Minimum score to trigger a high-priority alert

class MarketSignal:
    def __init__(self, symbol: str, signal_type: str, date: datetime, context: str = ""):
        self.symbol = symbol
        self.signal_type = signal_type
        self.date = date
        self.score = SIGNAL_SCORES.get(signal_type, 1)
        self.context = context

    def to_dict(self):
        return {
            "symbol": self.symbol,
            "signal_type": self.signal_type,
            "date": self.date.isoformat(),
            "score": self.score,
            "context": self.context
        }

def evaluate_multi_signals(signals: List[MarketSignal], window_days: int = 5) -> List[Dict]:
    """
    Evaluates a raw list of chronological market signals.
    Groups them by symbol and 5-day rolling windows.
    Triggers an aggregated alert dict if the total score exceeds ALERT_THRESHOLD.
    """
    alerts = []
    
    # Group by symbol
    symbol_groups = {}
    for s in signals:
        if s.symbol not in symbol_groups:
            symbol_groups[s.symbol] = []
        symbol_groups[s.symbol].append(s)
        
    for symbol, ss in symbol_groups.items():
        # Sort chronologically
        ss.sort(key=lambda x: x.date)
        
        # Sliding window check
        for i, start_sig in enumerate(ss):
            window_end = start_sig.date + timedelta(days=window_days)
            
            # Find all signals within window_days of the start signal
            correlated = [s for s in ss[i:] if s.date <= window_end]
            
            total_score = sum(s.score for s in correlated)
            
            if total_score >= ALERT_THRESHOLD:
                # Prevent duplicate cascading alerts by marking them processed or 
                # jumping the index in a real prod system. For now, yield the match.
                alert = {
                    "symbol": symbol,
                    "trigger_date": correlated[-1].date.isoformat(),
                    "total_score": total_score,
                    "signals": [c.to_dict() for c in correlated],
                    "summary": f"High probability setup for {symbol}: {len(correlated)} correlated signals detected."
                }
                alerts.append(alert)
                break # Move to next symbol after finding one strong setup
                
    return alerts
