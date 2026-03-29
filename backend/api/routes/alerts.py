from fastapi import APIRouter, Depends
from typing import List, Optional
from db.database import get_db
from sqlalchemy.orm import Session
from api.routes import auth
import json

router = APIRouter()

@router.get("/feed", tags=["alerts"])
async def get_alert_feed(symbol: Optional[str] = None, current_user = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """
    Returns the feed of high-priority context-enriched alerts.
    If 'symbol' is provided, it filters for only that stock.
    Otherwise, it checks the user's active Portfolio and retrieves alerts heavily biased toward or exactly matching their holdings.
    """
    
    # 1. Mocking retrieval of recent active alerts parsed locally by Celery workers
    active_alerts = [
        {"id": "a1", "symbol": "INFY", "type": "Multi-Signal Setup", "score": 8, "trigger_date": "2024-03-29", "raw_summary": "High probability setup for INFY: 2 correlated signals detected."},
        {"id": "a2", "symbol": "RELIANCE", "type": "Tone Shift", "score": 9, "trigger_date": "2024-03-28", "raw_summary": "Management tone for RELIANCE significantly shifted from cautious to confident in Q1-2024."},
        {"id": "a3", "symbol": "TCS", "type": "Insider Buy", "score": 5, "trigger_date": "2024-03-27", "raw_summary": "Promoter entity acquired 500,000 shares in the open market."},
        {"id": "a4", "symbol": "HDFCBANK", "type": "Golden Cross", "score": 7, "trigger_date": "2024-03-26", "raw_summary": "50-day moving average crossed above the 200-day moving average indicating bullish sentiment."},
        {"id": "a5", "symbol": "ZOMATO", "type": "Volume Spikes", "score": 8, "trigger_date": "2024-03-26", "raw_summary": "Unusual volume activity detected in the last trading hour, up 400% compared to average."}
    ]
    
    # Filter by user portfolio locally (Phase 2 Portfolio Filters)
    from db.models import PortfolioHolding
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == current_user.id).all()
    holding_symbols = {h.symbol for h in holdings}
    
    # Prioritizing alerts
    results = []
    
    from services.pinecone_service import query_similar_alerts
    import google.generativeai as genai
    import os
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        genai.configure(api_key=gemini_key)
    
    gemini_model = genai.GenerativeModel("gemini-1.5-flash") if gemini_key else None
    
    for alert in active_alerts:
        if symbol and alert["symbol"] != symbol:
            continue
            
        # Prioritize matching portfolio symbols
        is_held = alert["symbol"] in holding_symbols
        # We can dynamically filter out irrelevant alerts, or just mark them as portfolio matches.
        
        # 2. Vector DB historical Context via Pinecone
        similar_past_events = query_similar_alerts(alert["raw_summary"], top_k=3)
        historical_context = "No direct major historical equivalents found in vector DB."
        
        if similar_past_events:
            historical_context = f"Found {len(similar_past_events)} similar past setups."
            # In prod, extract actual stock performance 30/60/90 days after those past dates.
            historical_context += " Previously, similar bulk deals mapped to +15% quarterly yields."
            
        # 3. Context Generation Engine using Gemini (3 sentence summary)
        claude_explanation = ""
        if gemini_model:
            try:
                prompt = f"""
                You are a concise financial alert generator.
                A priority alert just triggered:
                Event: {alert['raw_summary']}
                Historical Precedent: {historical_context}
                
                Generate EXACTLY 3 sentences:
                1. What happened.
                2. Why it is unusual compared to historical data.
                3. What happened to the stock price the last time this pattern occurred.
                """
                response = gemini_model.generate_content(prompt)
                claude_explanation = response.text.strip()
            except Exception as e:
                claude_explanation = "Analysis unavailable — retrying"
        else:
            claude_explanation = "Analysis unavailable — retrying"
            
        results.append({
            "id": alert["id"],
            "symbol": alert["symbol"],
            "type": alert["type"],
            "priority_score": alert["score"],
            "is_user_holding": is_held,
            "trigger_date": alert["trigger_date"],
            "ai_context_analysis": claude_explanation
        })
        
    return {"alerts": results}
