from sqlalchemy.orm import Session
from db.models import PortfolioHolding, User

def build_user_context(user_id: int, db: Session) -> str:
    # Fetch user data
    user = db.query(User).filter(User.id == user_id).first()
    
    # Mock experience level and watchlist for the prototype
    experience_level = "Intermediate investor"
    watchlist_str = "ZOMATO, RELIANCE, TCS, HDFCBANK"
    
    if not user:
        return f"User profile: Unknown\nHoldings: {watchlist_str}\nWatchlist: {watchlist_str}"

    # Fetch holdings
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user_id).all()
    
    total_value = sum((h.qty * h.avg_price) for h in holdings) if holdings else 0.0
    
    if total_value == 0 or len(holdings) == 0:
        # Fallback to watchlist
        holdings_str = watchlist_str
        portfolio_size_str = "Tracking Only (Paper / Watchlist Phase)"
    else:
        # Calculate percentages
        holding_percentages = []
        for h in holdings:
            val = h.qty * h.avg_price
            pct = round((val / total_value) * 100)
            holding_percentages.append(f"{h.symbol} ({pct}%)")
        holdings_str = ", ".join(holding_percentages)
        
        # Determine portfolio size bracket
        if total_value < 100000:
            portfolio_size_str = "< ₹1L"
        elif total_value < 1000000:
            portfolio_size_str = "₹1L-10L"
        elif total_value < 5000000:
            portfolio_size_str = "₹10L-50L"
        else:
            portfolio_size_str = "> ₹50L"

    context = f"User profile: {experience_level}, {portfolio_size_str} portfolio.\n"
    context += f"Tracked Stocks / Holdings: {holdings_str}\n"

    return context
