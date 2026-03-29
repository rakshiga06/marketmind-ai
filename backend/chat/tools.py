import yfinance as yf
import json
import re
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.models import PortfolioHolding, Company
from patterns.detector import get_pattern_signals as detect_patterns

def get_stock_price(symbol: str) -> dict:
    try:
        if not symbol.endswith(".NS") and not symbol.endswith(".BO"):
            query_symbol = symbol + ".NS"
        else:
            query_symbol = symbol
        
        ticker = yf.Ticker(query_symbol)
        data = ticker.history(period="2d")
        
        if len(data) >= 1:
            current_price = float(data['Close'].iloc[-1])
            volume = int(data['Volume'].iloc[-1])
            
            if len(data) >= 2:
                prev_close = float(data['Close'].iloc[-2])
                change_percent = ((current_price - prev_close) / prev_close) * 100
            else:
                change_percent = 0.0
                
            return {
                "symbol": symbol,
                "price": current_price,
                "change_percent": round(change_percent, 2),
                "volume": volume
            }
        return {"symbol": symbol, "error": "No price data found"}
    except Exception as e:
        return {"symbol": symbol, "error": str(e)}

def get_radar_alerts(symbol: str) -> list:
    # Prototype mock - simulating Opportunity Radar alerts table
    return [
        {"signal_type": "Breakout", "explanation": f"{symbol} breaking above 50-day moving average.", "date": "Recent"},
        {"signal_type": "Volume Spike", "explanation": f"Unusual volume detected in {symbol} indicating accumulation.", "date": "Recent"}
    ]

def get_pattern_signals(symbol: str) -> dict:
    """Connects to our TA-Lib historical yfinance analysis."""
    try:
        # Fetch 2y of data to ensure enough context for long-term indicators (SMA200)
        sym = symbol if (".NS" in symbol or ".BO" in symbol) else f"{symbol}.NS"
        df = yf.download(sym, period="2y", interval="1d", progress=False)
        
        if df.empty or len(df) < 200:
            return {"symbol": symbol, "error": "Insufficient historical data for technical analysis"}
            
        results = detect_patterns(df)
        
        # Convert the dictionary of series to a summary of currently active patterns
        active_patterns = []
        for p_name, triggers in results.items():
            if triggers.iloc[-1]:
                active_patterns.append(p_name)
                
        return {
            "symbol": symbol,
            "active_patterns": active_patterns,
            "count": len(active_patterns),
            "status": "Success"
        }
    except Exception as e:
        return {"symbol": symbol, "error": str(e)}

def get_portfolio_concentration(user_id: int, db: Session) -> dict:
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user_id).all()
    if not holdings:
        return {}
    
    sector_breakdown = {}
    total_value = 0.0
    
    for holding in holdings:
        value = holding.qty * holding.avg_price
        total_value += value
        
        company = db.query(Company).filter(Company.symbol == holding.symbol).first()
        sector = company.industry if company and company.industry else "Unknown Sector"
        
        if sector in sector_breakdown:
            sector_breakdown[sector] += value
        else:
            sector_breakdown[sector] = value
            
    if total_value > 0:
        for sector in sector_breakdown:
            sector_breakdown[sector] = f"{round((sector_breakdown[sector] / total_value) * 100, 2)}%"
        
    return sector_breakdown

def detect_tool_needed(message: str, user_id: int, db: Session) -> tuple[str, list]:
    message_lower = message.lower()
    results = []
    tools_used = []
    
    # Detect uppercase symbols 
    potential_symbols = re.findall(r'\b[A-Z]{3,10}\b', message)
    stopwords = {"THE", "AND", "WHAT", "HOW", "WHY", "IS", "ARE", "AM", "I", "YOU", "HE", "SHE", "IT", "WE", "THEY", "THIS", "THAT"}
    found_symbols = [s for s in set(potential_symbols) if s not in stopwords]
    
    for symbol in found_symbols:
        results.append(f"--- LIVE DATA FOR {symbol} ---")
        
        price_data = get_stock_price(symbol)
        results.append(f"Price Data: {json.dumps(price_data)}")
        tools_used.append("Live Price")
        
        radar = get_radar_alerts(symbol)
        results.append(f"Radar Alerts: {json.dumps(radar)}")
        tools_used.append("Radar Check")
        
        patterns = get_pattern_signals(symbol)
        results.append(f"Pattern Signals: {json.dumps(patterns)}")
        tools_used.append("Pattern Detection")

    if any(keyword in message_lower for keyword in ["portfolio", "concentration", "sector", "holdings"]):
        results.append("--- PORTFOLIO CONCENTRATION ---")
        concentration = get_portfolio_concentration(user_id, db)
        results.append(json.dumps(concentration))
        tools_used.append("Portfolio Analysis")
        
    if any(keyword in message_lower for keyword in ["alert", "radar", "signal"]) and not found_symbols:
        results.append("--- RADAR ALERTS ---")
        results.append("Note: User asked about alerts/radar but didn't specify a symbol. Prompt them for a symbol.")
        tools_used.append("Radar Check")
            
    tools_used = list(set(tools_used))
    return "\n".join(results), tools_used
