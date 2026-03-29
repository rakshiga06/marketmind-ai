import sys
import os

# Add the project root to sys.path if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from db.database import engine, get_db
    from db.models import Base, PortfolioHolding, User
    from api.routes import auth, ai_insights
    print("Imports successful!")
except Exception as e:
    print(f"Import failed: {e}")
    import traceback
    traceback.print_exc()
