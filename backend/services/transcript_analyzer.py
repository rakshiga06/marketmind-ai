import os
import pdfplumber
import requests
from io import BytesIO
from db.database import SessionLocal
from db.models import ToneShiftBaseline
from services.anthropic_service import detect_tone_shift
from services.pinecone_service import store_alert_context

def analyze_transcript(symbol: str, quarter: str, pdf_url: str):
    """
    Downloads a PDF earnings transcript, parses it with pdfplumber, 
    and evaluates management tone shifts relative to historical DB baselines using Claude.
    """
    try:
        # 1. Fetch PDF (Mocking the real download for Phase 2 scaffold)
        # response = requests.get(pdf_url)
        # pdf_file = BytesIO(response.content)
        
        # Here we mock the PDF extraction block since we don't have a real PDF url handy.
        # In prod:
        # with pdfplumber.open(pdf_file) as pdf:
        #     full_text = "\\n".join(page.extract_text() for page in pdf.pages)
        
        current_paragraph = f"We have seen moderate headwinds in our supply chain, but we maintain strong optionality moving into {quarter}. We expect stable margins despite global macro pressures."
        
        # 2. Get historical baselines from Postgres
        db = SessionLocal()
        try:
            history = db.query(ToneShiftBaseline).filter(ToneShiftBaseline.symbol == symbol).order_by(ToneShiftBaseline.created_at.desc()).limit(4).all()
            historical_paragraphs = [h.key_paragraph for h in history if h.key_paragraph]
        finally:
            db.close()
            
        # 3. Analyze shift using Anthropic Claude API
        detected_tone = detect_tone_shift(historical_paragraphs, current_paragraph)
        
        # 4. Save new baseline
        db = SessionLocal()
        try:
            new_baseline = ToneShiftBaseline(
                symbol=symbol,
                quarter=quarter,
                sentiment_score=detected_tone,
                key_paragraph=current_paragraph
            )
            db.add(new_baseline)
            db.commit()
        finally:
            db.close()
            
        print(f"[TONE SHIFT] {symbol} {quarter} analyzed: Tone determined as '{detected_tone}'")
        
        # 5. If it shifted from cautious to confident (or vice versa), alert it and push to Pinecone!
        if history and history[0].sentiment_score != detected_tone and detected_tone in ['confident', 'cautious']:
            rep_text = f"Management tone for {symbol} significantly shifted from {history[0].sentiment_score} to {detected_tone} in {quarter}."
            print(f"!!! ALERT !!! {rep_text}")
            
            store_alert_context(
                alert_id=f"tone_{symbol}_{quarter}",
                text_representation=rep_text,
                metadata={"symbol": symbol, "type": "tone_shift", "score": detected_tone}
            )
            return True
            
        return False
        
    except Exception as e:
        print(f"Error analyzing transcript for {symbol}: {e}")
        return False
