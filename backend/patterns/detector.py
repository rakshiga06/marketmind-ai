import yfinance as yf
import pandas as pd
import numpy as np
import talib

def get_real_pattern_signals(symbol: str) -> dict:
    """
    1. Fetches real 5-year OHLCV data.
    2. Detects Golden Cross, RSI Divergence, Support Break, Volume Spike using TA-Lib.
    3. Backtests on last 5 years: counts occurrences, avg 60-day return, and win rate (10%+).
    4. Calculates confidence from win rate.
    """
    try:
        if not symbol.endswith(".NS") and not symbol.endswith(".BO"):
            query_symbol = symbol + ".NS"
        else:
            query_symbol = symbol
            
        # Fetch 5 years of data for deep backtesting
        data = yf.Ticker(query_symbol).history(period="5y")
        
        if len(data) < 200:
            return {"patterns": [], "message": "Not enough historical data (need 200 days) for significant pattern detection."}
            
        c = data['Close']
        h = data['High']
        l = data['Low']
        v = data['Volume']
        
        patterns_found = []
        forward_days = 60
        
        # --- 1. Golden Cross ---
        sma50 = talib.SMA(c, timeperiod=50)
        sma200 = talib.SMA(c, timeperiod=200)
        golden_cross = (sma50 > sma200) & (sma50.shift(1) <= sma200.shift(1))
        
        # --- 2. RSI Divergence ---
        rsi = talib.RSI(c, timeperiod=14)
        # Price making lower lows but RSI making higher lows (14-day lookback for divergence)
        price_lower = c < c.shift(14)
        rsi_higher = rsi > rsi.shift(14)
        rsi_oversold = rsi < 40  # Typically divergence matters near oversold
        rsi_divergence = price_lower & rsi_higher & rsi_oversold
        
        # --- 3. Support Break ---
        support_20d = l.shift(1).rolling(20).min()
        support_break = c < support_20d
        
        # --- 4. Volume Spike ---
        avg_vol_20d = v.shift(1).rolling(20).mean()
        volume_spike = v > (3 * avg_vol_20d)
        
        # Group patterns to iterate and backtest
        signal_funcs = {
            "Golden Cross": golden_cross,
            "RSI Divergence": rsi_divergence,
            "Support Break": support_break,
            "Volume Spike": volume_spike
        }
        
        for p_name, signals in signal_funcs.items():
            # Get integer indices where pattern is True
            triggers = np.where(signals)[0]
            
            # Check if this pattern triggered very recently (in last 3 trading days)
            recent_trigger = any(i >= len(c) - 3 for i in triggers)
            
            if modern_triggered := recent_trigger:
                # We need to backtest it using all valid past triggers
                valid_past_triggers = [i for i in triggers if i + forward_days < len(c)]
                total_occurrences = len(valid_past_triggers)
                
                if total_occurrences == 0:
                    continue  # Can't reliably backtest if it has never happened before safely
                    
                returns = []
                success_count = 0 
                
                for idx in valid_past_triggers:
                    entry_price = c.iloc[idx]
                    exit_price = c.iloc[idx + forward_days]
                    pct_return = ((exit_price - entry_price) / entry_price) * 100
                    returns.append(pct_return)
                    
                    if pct_return >= 10.0:
                        success_count += 1
                        
                avg_return = np.mean(returns)
                win_rate = (success_count / total_occurrences) * 100
                
                # Confidence score natively calculated from backtested win_rate
                confidence_score = win_rate
                
                patterns_found.append({
                    "pattern": p_name,
                    "occurrences_last_5y": total_occurrences,
                    "average_60d_return": f"{avg_return:.1f}%",
                    "win_rate_over_10pct": f"{win_rate:.1f}%",
                    "confidence": f"{confidence_score:.1f}%",
                    "signal_type": "Bullish" if p_name != "Support Break" else "Bearish"
                })
                
        if not patterns_found:
            return {
                "patterns": [],
                "message": "No significant patterns detected currently"
            }
            
        # Return sorted by highest win rate 
        patterns_found.sort(key=lambda x: float(x["win_rate_over_10pct"].strip('%')), reverse=True)
        return {"patterns": patterns_found, "message": f"{len(patterns_found)} active pattern(s) detected."}
        
    except Exception as e:
        print(f"Pattern detection error for {symbol}: {e}")
        return {"patterns": [], "message": f"Error running pattern detections: {e}"}
