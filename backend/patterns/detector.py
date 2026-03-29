import talib
import pandas as pd
import numpy as np
from typing import List, Dict, Any

def get_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Add basic indicators to the dataframe."""
    df = df.copy()
    # Flatten MultiIndex columns if present
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
        
    close = df['Close'].values.flatten()
    df['SMA50'] = talib.SMA(close, timeperiod=50)
    df['SMA200'] = talib.SMA(close, timeperiod=200)
    df['RSI'] = talib.RSI(close, timeperiod=14)
    return df

def detect_golden_cross(df: pd.DataFrame) -> pd.Series:
    """SMA 50 crosses above SMA 200."""
    return (df['SMA50'] > df['SMA200']) & (df['SMA50'].shift(1) <= df['SMA200'].shift(1))

def detect_rsi_divergence(df: pd.DataFrame) -> pd.Series:
    """Price making lower lows, RSI making higher lows (Bullish Divergence)."""
    close = df['Close'].values.flatten()
    rsi = df['RSI'].values.flatten()
    
    # 14-day lookback for divergence
    price_lower = close < pd.Series(close).shift(14).values
    rsi_higher = rsi > pd.Series(rsi).shift(14).values
    rsi_oversold = rsi < 35 
    
    return pd.Series(price_lower & rsi_higher & rsi_oversold, index=df.index)

def detect_resistance_breakout(df: pd.DataFrame) -> pd.Series:
    """Price breaks above the maximum of the last 50 days resistance."""
    high = df['High'].values.flatten()
    close = df['Close'].values.flatten()
    resistance = pd.Series(high).shift(1).rolling(window=50).max().values
    return pd.Series((close > resistance) & (pd.Series(close).shift(1).values <= resistance), index=df.index)

def detect_head_and_shoulders(df: pd.DataFrame) -> pd.Series:
    """
    Simplified H&S detection based on peaks.
    Looks for: Left Shoulder (Peak 1), Head (Higher Peak 2), Right Shoulder (Lower Peak 3).
    """
    close = df['Close'].values.flatten()
    signals = pd.Series(False, index=df.index)
    
    # Needs at least 60 days
    if len(close) < 60:
        return signals
        
    for i in range(40, len(close)):
        window = close[i-40:i]
        # Find local maxima in the window
        # This is a basic approximation
        peaks = []
        for j in range(1, len(window)-1):
            if window[j] > window[j-1] and window[j] > window[j+1]:
                peaks.append((j, window[j]))
        
        if len(peaks) >= 3:
            # Sort peaks by time
            peaks.sort(key=lambda x: x[0])
            # Look for H&S pattern in the last 3 peaks
            p1, p2, p3 = peaks[-3:]
            # Head (p2) should be higher than shoulders (p1, p3)
            if p2[1] > p1[1] and p2[1] > p3[1]:
                # Shoulders should be roughly similar height (within 5%)
                if abs(p1[1] - p3[1]) / p1[1] < 0.05:
                    # Breakout (neckline) check: current price crosses below the trough between peaks
                    troughs = []
                    for k in range(p1[0], p3[0]):
                        if window[k] < window[k-1] and window[k] < window[k+1]:
                            troughs.append(window[k])
                    if troughs:
                        neckline = min(troughs)
                        if window[-1] < neckline and window[-2] >= neckline:
                            signals.iloc[i] = True
                            
    return signals

def detect_cup_and_handle(df: pd.DataFrame) -> pd.Series:
    """
    Simplified Cup and Handle detection.
    Looks for a 'U' shape followed by a small consolidation.
    """
    close = df['Close'].values
    signals = pd.Series(False, index=df.index)
    
    if len(close) < 100:
        return signals
        
    for i in range(80, len(close)):
        # Entire pattern window
        window = close[i-80:i]
        
        # Split into cup (first 70%) and handle (last 30%)
        cup_idx = int(len(window) * 0.7)
        cup = window[:cup_idx]
        handle = window[cup_idx:]
        
        # Cup characteristics: U-shape
        left_rim = cup[0]
        right_rim = cup[-1]
        bottom = min(cup)
        
        # Rim should be similar height
        rim_diff = abs(left_rim - right_rim) / left_rim
        
        # Handle should be a small drawdown from the right rim
        handle_max = max(handle)
        handle_min = min(handle)
        
        if rim_diff < 0.1 and bottom < left_rim * 0.8:
            if handle_max <= right_rim and handle_min > bottom:
                # Breakout: close above right rim
                if window[-1] > right_rim and window[-2] <= right_rim:
                    signals.iloc[i] = True
                    
    return signals

def get_pattern_signals(df: pd.DataFrame) -> Dict[str, pd.Series]:
    """Run all detectors and return a dict of boolean series."""
    df = get_indicators(df)
    return {
        "Golden Cross": detect_golden_cross(df),
        "RSI Divergence": detect_rsi_divergence(df),
        "Resistance Breakout": detect_resistance_breakout(df),
        "Head and Shoulders": detect_head_and_shoulders(df),
        "Cup and Handle": detect_cup_and_handle(df)
    }
