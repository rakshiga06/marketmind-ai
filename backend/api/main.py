from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import health
import yfinance as yf
import pandas as pd
import numpy as np

app = FastAPI(
    title="MarketMind API",
    description="AI-powered Indian stock market intelligence platform",
    version="1.0.0"
)

# Allow CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)

# Include routes
app.include_router(health.router, prefix="/health", tags=["health"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to MarketMind API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@app.get("/api/v1/stockdata")
def get_stock_data(symbol: str, timeframe: str = "1M"):
    try:
        # Map frontend timeframe to yfinance period/interval
        tf_map = {
            "1D": ("1d", "5m"),
            "1W": ("5d", "15m"),
            "1M": ("1mo", "1d"),
            "3M": ("3mo", "1d"),
            "6M": ("6mo", "1d"),
            "1Y": ("1y", "1d"),
            "5Y": ("5y", "1wk"),
        }
        
        # Auto-append .NS for Indian stocks if not specified
        yf_symbol = symbol + ".NS" if not symbol.endswith(".NS") and not symbol.endswith(".BO") else symbol
        
        period, interval = tf_map.get(timeframe, ("1mo", "1d"))
        ticker = yf.Ticker(yf_symbol)
        df = ticker.history(period=period, interval=interval)
        
        # Fallback for global symbols (e.g. AAPL)
        if df.empty:
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period, interval=interval)
            
        if df.empty:
            return {"error": f"No data found for this symbol ({yf_symbol} or {symbol})."}
            
        # Calculate Technical Indicators
        # 1. RSI (14 period)
        delta = df['Close'].diff()
        gain = delta.where(delta > 0, 0)
        loss = -delta.where(delta < 0, 0)
        avg_gain = gain.rolling(window=14).mean()
        avg_loss = loss.rolling(window=14).mean()
        rs = avg_gain / avg_loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # 2. MACD (12, 26, 9)
        exp1 = df['Close'].ewm(span=12, adjust=False).mean()
        exp2 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = exp1 - exp2
        df['Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
        df['MACD_Hist'] = df['MACD'] - df['Signal']
        
        # 3. Bollinger Bands (20, 2)
        df['SMA20'] = df['Close'].rolling(window=20).mean()
        df['STD20'] = df['Close'].rolling(window=20).std()
        df['BB_Upper'] = df['SMA20'] + (df['STD20'] * 2)
        df['BB_Lower'] = df['SMA20'] - (df['STD20'] * 2)
        
        # Format for lightweight-charts
        df = df.reset_index()
        time_col = 'Date' if 'Date' in df.columns else 'Datetime'
        
        data = []
        for _, row in df.iterrows():
            if interval in ['1d', '1wk']:
                t = row[time_col].strftime('%Y-%m-%d')
            else:
                t = int(row[time_col].timestamp())
                
            data.append({
                "time": t,
                "open": row["Open"],
                "high": row["High"],
                "low": row["Low"],
                "close": row["Close"],
                "volume": int(row["Volume"]),
                "rsi": None if pd.isna(row["RSI"]) else float(row["RSI"]),
                "macd": None if pd.isna(row["MACD"]) else float(row["MACD"]),
                "macd_hist": None if pd.isna(row["MACD_Hist"]) else float(row["MACD_Hist"]),
                "macd_signal": None if pd.isna(row["Signal"]) else float(row["Signal"]),
                "bb_upper": None if pd.isna(row["BB_Upper"]) else float(row["BB_Upper"]),
                "bb_lower": None if pd.isna(row["BB_Lower"]) else float(row["BB_Lower"])
            })
            
        return {
            "symbol": yf_symbol,
            "period": period,
            "current_price": data[-1]["close"],
            "data": data
        }
    except Exception as e:
        return {"error": str(e)}