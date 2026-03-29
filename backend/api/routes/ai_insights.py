import os
from fastapi import APIRouter
from pydantic import BaseModel
import yfinance as yf
import requests

router = APIRouter()

@router.get("/portfolio/insights/{symbol}")
async def get_portfolio_insights(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # If no info found, try with .NS
        if not info or ("currentPrice" not in info and "regularMarketPrice" not in info):
            if not "." in symbol:
                ticker = yf.Ticker(symbol + ".NS")
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
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key or "your_" in gemini_key:
        return {
            "pros": ["Company has an active market presence.", "Data indicates potential for long-term growth."],
            "cons": ["Valuation may be high relative to book value.", "Requires careful tracking of quarterly results."],
            "peers": ["Competitor A", "Competitor B", "Competitor C"],
            "summary": "This is a machine-generated placeholder because GEMINI_API_KEY is not configured."
        }

    try:
        import google.generativeai as genai
        import json
        import asyncio
        await asyncio.sleep(1) # Delay between concurrent page loads
        
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:-3].strip()
        elif text.startswith("```"): text = text[3:-3].strip()
        
        return json.loads(text)
    except Exception as e:
        return {"error": str(e), "pros": [], "cons": [], "peers": [], "summary": "Error analyzing data."}
