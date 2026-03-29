import os
from fastapi import APIRouter
from pydantic import BaseModel
import yfinance as yf
import requests

router = APIRouter()

@router.get("/portfolio/insights/{symbol}")
async def get_portfolio_insights(symbol: str):
    try:
        session = requests.Session()
        session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"})
        ticker = yf.Ticker(symbol, session=session)
        info = ticker.info
    except Exception:
        info = {}

    prompt = f"""You are MarketMind, an expert AI financial analyst.
Analyze {symbol} ({info.get('longName', '')}):
Sector: {info.get('sector', 'N/A')}
Current Price: {info.get('currentPrice', 'N/A')}
PE Ratio: {info.get('trailingPE', 'N/A')}
Book Value: {info.get('bookValue', 'N/A')}
ROE: {info.get('returnOnEquity', 'N/A')}
Debt to Equity: {info.get('debtToEquity', 'N/A')}

Generate a JSON response with exactly this structure:
{{
  "pros": ["bullet 1", "bullet 2", "bullet 3"],
  "cons": ["bullet 1", "bullet 2", "bullet 3"],
  "peers": ["PeerCompany 1", "PeerCompany 2", "PeerCompany 3"],
  "summary": "A reliable 2-sentence summary of the stock's current fundamentals."
}}
Keep it strictly factual and actionable.
"""
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        return {
            "pros": ["Company has an active market presence.", "Data indicates potential for long-term growth."],
            "cons": ["Valuation may be high relative to book value.", "Requires careful tracking of quarterly results."],
            "peers": ["Competitor A", "Competitor B", "Competitor C"],
            "summary": "This is a machine-generated placeholder because OPENAI_API_KEY is not configured."
        }

    try:
        from openai import AsyncOpenAI
        import json
        client = AsyncOpenAI(api_key=openai_key)
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            response_format={ "type": "json_object" },
            max_tokens=300,
            temperature=0.2
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        return {"error": str(e), "pros": [], "cons": [], "peers": [], "summary": "Error analyzing data."}
