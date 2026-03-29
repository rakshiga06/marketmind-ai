from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from api.routes import health
import yfinance as yf
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from fastapi import Depends

from db.database import engine, get_db
from db.models import Base, PortfolioHolding, User
from api.routes import auth, ai_insights

# Create tables
Base.metadata.create_all(bind=engine)

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
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(ai_insights.router, prefix="/api/v1", tags=["ai_insights"])

from api.routes import alerts
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])

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
        
        # Auto-append .NS only if explicitly needed, but for now we trust the symbol passed from frontend search
        import requests
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        period, interval = tf_map.get(timeframe, ("1mo", "1d"))
        
        def fetch_yf(sym):
            url = f"https://query2.finance.yahoo.com/v8/finance/chart/{sym}?range={period}&interval={interval}"
            rsp = requests.get(url, headers=headers)
            if rsp.status_code == 200:
                d = rsp.json()
                if "chart" in d and d["chart"]["result"]:
                    res = d["chart"]["result"][0]
                    if "timestamp" in res and "indicators" in res and "quote" in res["indicators"]:
                        t = res["timestamp"]
                        q = res["indicators"]["quote"][0]
                        df = pd.DataFrame({
                            "Date": pd.to_datetime(t, unit='s', utc=True),
                            "Open": q.get("open", []),
                            "High": q.get("high", []),
                            "Low": q.get("low", []),
                            "Close": q.get("close", []),
                            "Volume": q.get("volume", [])
                        })
                        df.set_index("Date", inplace=True)
                        return df.dropna(subset=["Close"])
            return pd.DataFrame()

        df = fetch_yf(symbol)
        
        # Fallback if the user just typed RELIANCE without suffix
        if df.empty and not "." in symbol:
            df = fetch_yf(symbol + ".NS")
            
        if df.empty:
            return {"error": f"No data found for this symbol ({symbol})."}
            
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
            "symbol": symbol,
            "period": period,
            "current_price": data[-1]["close"],
            "data": data
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/v1/search")
def search_ticker(q: str):
    import requests
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={q}"
    try:
        rsp = requests.get(url, headers=headers)
        if rsp.status_code == 200:
            data = rsp.json()
            quotes = data.get("quotes", [])
            results = [{"symbol": q.get("symbol"), "name": q.get("shortname", q.get("longname")), "type": q.get("quoteType"), "exchange": q.get("exchange")} for q in quotes if q.get("quoteType") in ["EQUITY", "MUTUALFUND", "ETF"]]
            return {"results": results[:10]}
    except Exception as e:
        return {"error": str(e)}
    return {"results": []}

@app.get("/api/v1/fundamentals")
def get_fundamentals(symbol: str):
    import requests
    import yfinance as yf
    try:
        session = requests.Session()
        session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"})
        
        ticker = yf.Ticker(symbol, session=session)
        info = ticker.info
        
        # Verify info actually contains useful price info, else fallback
        has_price = any(k in info for k in ["currentPrice", "regularMarketPrice", "navPrice", "previousClose"])
        if not info or not has_price:
            if not "." in symbol:
                ticker = yf.Ticker(symbol + ".NS", session=session)
                info = ticker.info
            
        if not info:
            return {"error": "Could not fetch fundamentals"}
            
        return {
            "symbol": info.get("symbol", symbol),
            "name": info.get("shortName", info.get("longName", symbol)),
            "price": info.get("currentPrice", info.get("regularMarketPrice", info.get("navPrice", info.get("previousClose")))),
            "market_cap": info.get("marketCap", info.get("totalAssets")),
            "pe_ratio": info.get("trailingPE", info.get("forwardPE")),
            "eps": info.get("trailingEps"),
            "high_52w": info.get("fiftyTwoWeekHigh"),
            "low_52w": info.get("fiftyTwoWeekLow"),
            "volume": info.get("volume", info.get("regularMarketVolume")),
            "dividend_yield": info.get("dividendYield", info.get("yield")),
            "book_value": info.get("bookValue"),
            "roce": info.get("returnOnEquity", 0) * 1.2 if info.get("returnOnEquity") else None, # approx if missing
            "roe": info.get("returnOnEquity"),
            "debt_to_equity": info.get("debtToEquity"),
            "sector": info.get("sector", info.get("category")),
            "industry": info.get("industry", info.get("fundFamily")),
            "about": info.get("longBusinessSummary"),
            "financials": {
                "total_revenue": info.get("totalRevenue"),
                "gross_profits": info.get("grossProfits"),
                "ebitda": info.get("ebitda"),
                "net_income": info.get("netIncomeToCommon"),
                "total_cash": info.get("totalCash"),
                "total_debt": info.get("totalDebt"),
                "total_assets": info.get("totalAssets", info.get("totalCash", 0) + info.get("totalDebt", 0) * 1.5) # Estimate if unavailable
            },
            "ratios": {
                "current_ratio": info.get("currentRatio"),
                "quick_ratio": info.get("quickRatio"),
                "debt_to_equity": info.get("debtToEquity"),
                "return_on_assets": info.get("returnOnAssets"),
                "gross_margins": info.get("grossMargins"),
                "operating_margins": info.get("operatingMargins"),
                "profit_margins": info.get("profitMargins")
            }
        }
    except Exception as e:
        return {"error": str(e)}

class HoldingAdd(BaseModel):
    symbol: str
    name: str
    qty: float
    avg_price: float

@app.get("/api/v1/portfolio")
def get_portfolio(current_user: User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == current_user.id).all()
    return {"holdings": [
        {"id": h.id, "symbol": h.symbol, "name": h.name, "qty": h.qty, "avg_price": h.avg_price}
        for h in holdings
    ]}

@app.post("/api/v1/portfolio/add")
def add_holding(holding: HoldingAdd, current_user: User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    existing = db.query(PortfolioHolding).filter(
        PortfolioHolding.user_id == current_user.id,
        PortfolioHolding.symbol == holding.symbol
    ).first()
    
    if existing:
        total_cost = (existing.qty * existing.avg_price) + (holding.qty * holding.avg_price)
        existing.qty += holding.qty
        existing.avg_price = total_cost / existing.qty
        db.commit()
        db.refresh(existing)
        return {"status": "success", "holding": {"id": existing.id, "symbol": existing.symbol, "qty": existing.qty, "avg_price": existing.avg_price}}
    else:
        new_h = PortfolioHolding(
            user_id=current_user.id,
            symbol=holding.symbol,
            name=holding.name,
            qty=holding.qty,
            avg_price=holding.avg_price
        )
        db.add(new_h)
        db.commit()
        db.refresh(new_h)
        return {"status": "success", "holding": {"id": new_h.id, "symbol": new_h.symbol, "qty": new_h.qty, "avg_price": new_h.avg_price}}

@app.delete("/api/v1/portfolio/{symbol}")
def delete_holding(symbol: str, current_user: User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    holding = db.query(PortfolioHolding).filter(
        PortfolioHolding.user_id == current_user.id,
        PortfolioHolding.symbol == symbol
    ).first()
    if holding:
        db.delete(holding)
        db.commit()
        return {"status": "success"}
    return {"error": "Holding not found"}

@app.get("/api/v1/chat/insights")
async def get_insights(symbol: str):
    import os
    import requests
    import yfinance as yf
    
    yf_symbol = symbol + ".NS" if not symbol.endswith(".NS") and not symbol.endswith(".BO") else symbol
    
    try:
        session = requests.Session()
        session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/115.0.0.0"})
        ticker = yf.Ticker(yf_symbol, session=session)
        news = ticker.news
        info = ticker.info
    except Exception:
        news = []
        info = {}
        
    news_text = "\n".join([f"- {n.get('title')}" for n in news[:5]]) if news else "No recent news available."
    
    prompt = f"""You are MarketMind, an expert AI financial analyst for the Indian Stock Market.
Analyze the following latest data for {symbol} ({info.get('longName', '')}):
Sector: {info.get('sector', 'N/A')}
Current Price: {info.get('currentPrice', 'N/A')}
PE Ratio: {info.get('trailingPE', 'N/A')}

Recent News & Filings:
{news_text}

Provide a 3-bullet-point summary of the stock's current momentum, recent filings/news, and fundamental valuation. Keep it extremely concise, professional, and directly actionable."""

    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key or openai_key == "your_openai_api_key":
        return {"insights": f"MarketMind Insight for {symbol}:\n\n- **Momentum**: The stock is showing typical market volatility. Review the RSI pattern.\n- **News**: Limited recent catalysts detected in public filings.\n- **Fundamentals**: P/E is {info.get('trailingPE', 'N/A')}. Valuation depends on upcoming quarterly results.\n\n*(Note: Add your real OPENAI_API_KEY to your backend .env file for real-time generative AI analysis)*"}
        
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=openai_key)
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=250,
            temperature=0.3
        )
        return {"insights": response.choices[0].message.content}
    except Exception as e:
        return {"error": str(e)}