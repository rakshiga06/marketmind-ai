from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from db.database import get_db
from db.models import DetectedPattern, PatternBacktestResult
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/latest", tags=["patterns"])
def get_latest_patterns(
    symbol: Optional[str] = Query(None),
    pattern: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Fetch the latest detected patterns for stocks."""
    query = db.query(DetectedPattern)
    
    if symbol:
        query = query.filter(DetectedPattern.symbol == symbol.upper())
    if pattern:
        query = query.filter(DetectedPattern.pattern_name == pattern)
        
    # Return last 7 days of detections by default
    since_date = datetime.now() - timedelta(days=7)
    query = query.filter(DetectedPattern.detected_at >= since_date)
    
    return query.order_by(DetectedPattern.detected_at.desc()).all()

@router.get("/backtest/{symbol}", tags=["patterns"])
def get_pattern_backtest(
    symbol: str,
    db: Session = Depends(get_db)
):
    """Fetch historical backtest performance for all patterns related to a specific stock."""
    results = db.query(PatternBacktestResult).filter(
        PatternBacktestResult.symbol == symbol.upper()
    ).all()
    
    return results

@router.get("/summary", tags=["patterns"])
def get_pattern_summary(db: Session = Depends(get_db)):
    """Summary of all patterns and their performance."""
    results = db.query(PatternBacktestResult).order_by(PatternBacktestResult.win_rate.desc()).limit(20).all()
    return results
