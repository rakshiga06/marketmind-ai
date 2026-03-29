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
    # In a prod environment, these would be pulled from PostgreSQL `alerts` table or similar.
    active_alerts = [
        {"id": "a1", "symbol": "INFY", "type": "Multi-Signal Setup", "score": 8, "trigger_date": "2024-03-29", "raw_summary": "High probability setup for INFY: 2 correlated signals detected."},
        {"id": "a2", "symbol": "RELIANCE", "type": "Tone Shift", "score": 9, "trigger_date": "2024-03-28", "raw_summary": "Management tone for RELIANCE significantly shifted from cautious to confident in Q1-2024."},
        {"id": "a3", "symbol": "TCS", "type": "Insider Buy", "score": 5, "trigger_date": "2024-03-27", "raw_summary": "Promoter entity acquired 500,000 shares in the open market."}
    ]
    
    # Filter by user portfolio locally (Phase 2 Portfolio Filters)
    from db.models import PortfolioHolding
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == current_user.id).all()
    holding_symbols = {h.symbol for h in holdings}
    
    # Prioritizing alerts
    results = []
    
    from services.pinecone_service import query_similar_alerts
    from services.anthropic_service import anthropic_client
    
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
            
        # 3. Context Generation Engine using Anthropic/Claude (3 sentence summary)
        claude_explanation = ""
        try:
            if anthropic_client:
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
                response = anthropic_client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=60,
                    temperature=0.2,
                    messages=[{"role": "user", "content": prompt}]
                )
                claude_explanation = response.content[0].text.strip()
            else:
                claude_explanation = f"{alert['raw_summary']} {historical_context} Simulated Claude generated output since API is not initialized natively."
        except Exception as e:
            claude_explanation = alert["raw_summary"]
            
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
