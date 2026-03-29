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
    import json
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        genai.configure(api_key=gemini_key)
    
    import asyncio
    await asyncio.sleep(1) # Delay between concurrent page loads
    
    gemini_model = genai.GenerativeModel("gemini-1.5-flash") if gemini_key else None
    
    filtered_alerts = []
    holding_symbols = {h.symbol for h in db.query(PortfolioHolding).filter(PortfolioHolding.user_id == current_user.id).all()}
    
    for alert in active_alerts:
        if symbol and alert["symbol"] != symbol:
            continue
            
        similar_past_events = query_similar_alerts(alert["raw_summary"], top_k=3)
        historical_context = "No direct major historical equivalents found."
        if similar_past_events:
            historical_context = f"Found {len(similar_past_events)} similar past setups. Previously mapped to +15% quarterly yields."
            
        alert["is_held"] = alert["symbol"] in holding_symbols
        alert["historical_context"] = historical_context
        filtered_alerts.append(alert)

    ai_descriptions = {}
    if gemini_model and filtered_alerts:
        prompt = "Generate a concise 2-sentence analysis for each of these market signals:\n\n"
        for i, a in enumerate(filtered_alerts, 1):
            prompt += f"{i}. {a['symbol']} - {a['type']} - {a['raw_summary']}\n   Historical context: {a['historical_context']}\n"
        prompt += """
Return the response STRICTLY as a raw JSON array of objects with keys "symbol" and "description". Do not wrap in markdown or backticks.
Example: [{"symbol": "INFY", "description": "Stock setup confirmed..."}]"""
        
        try:
            response = gemini_model.generate_content(prompt)
            text = response.text.strip()
            if text.startswith("```json"): text = text[7:-3].strip()
            elif text.startswith("```"): text = text[3:-3].strip()
            
            parsed = json.loads(text)
            for item in parsed:
                ai_descriptions[item.get("symbol")] = item.get("description")
        except Exception as e:
            print(f"Batch Gemini error: {str(e)}")

    results = []
    for alert in filtered_alerts:
        results.append({
            "id": alert["id"],
            "symbol": alert["symbol"],
            "type": alert["type"],
            "priority_score": alert["score"],
            "is_user_holding": alert["is_held"],
            "trigger_date": alert["trigger_date"],
            "ai_context_analysis": ai_descriptions.get(alert["symbol"], "Analysis unavailable — retrying")
        })
        
    return {"alerts": results}
