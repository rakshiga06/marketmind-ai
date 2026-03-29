import os
from sqlalchemy.orm import Session
from db.database import SessionLocal, engine
from db.models import PortfolioHolding, User, Base

def inject_mock_data():
    # Ensure tables exist (they should, but just in case)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Get the first user (usually the one logged in during dev)
        user = db.query(User).first()
        if not user:
            print("No users found. Please sign up in the app first.")
            return

        mock_holdings = [
            {"symbol": "RELIANCE", "name": "Reliance Industries Ltd", "qty": 10, "avg_price": 2500.0},
            {"symbol": "HDFCBANK", "name": "HDFC Bank Ltd", "qty": 25, "avg_price": 1450.0},
            {"symbol": "TCS", "name": "Tata Consultancy Services Ltd", "qty": 5, "avg_price": 3200.0}
        ]

        for h in mock_holdings:
            # Check if already exists
            existing = db.query(PortfolioHolding).filter(
                PortfolioHolding.user_id == user.id,
                PortfolioHolding.symbol == h["symbol"]
            ).first()

            if not existing:
                new_h = PortfolioHolding(
                    user_id=user.id,
                    symbol=h["symbol"],
                    name=h["name"],
                    qty=h["qty"],
                    avg_price=h["avg_price"]
                )
                db.add(new_h)
                print(f"Added {h['symbol']} to user {user.email}")
            else:
                print(f"{h['symbol']} already in portfolio for user {user.email}")
        
        db.commit()
        print("Mock data injection complete.")
    except Exception as e:
        print(f"Error injecting data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    inject_mock_data()
