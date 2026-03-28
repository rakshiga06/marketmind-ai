# from fastapi import FastAPI
# from api.routes import health
# # from api.routes import filings, price, portfolio  # To be included later

# app = FastAPI(
#     title="MarketMind API",
#     description="AI-powered Indian stock market intelligence platform",
#     version="1.0.0"
# )

# # Include routes
# app.include_router(health.router, prefix="/health", tags=["health"])

# @app.get("/")
# async def root():
#     return {
#         "message": "Welcome to MarketMind API",
#         "docs_url": "/docs",
#         "redoc_url": "/redoc"
#     }


# from fastapi import FastAPI
# from api.routes import health

# app = FastAPI(
#     title="MarketMind API",
#     description="AI-powered Indian stock market intelligence platform",
#     version="1.0.0"
# )

# # Include routes
# app.include_router(health.router, prefix="/health", tags=["health"])

# @app.get("/")
# async def root():
#     return {
#         "message": "Welcome to MarketMind API",
#         "docs_url": "/docs",
#         "redoc_url": "/redoc"
#     }

# # New stock data endpoint
# @app.get("/api/v1/stockdata")
# async def get_stock_data(symbol: str):
#     # Example static data, replace with actual data fetching logic
#     stock_data = {
#         "symbol": symbol,
#         "price": 1642.3,
#         "time": "2023-03-28T10:10:00"  # You can replace this with dynamic data
#     }
#     return stock_data


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import health

app = FastAPI(
    title="MarketMind API",
    description="AI-powered Indian stock market intelligence platform",
    version="1.0.0"
)

# Allow CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Replace with the URL of your frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
)

# Include routes
app.include_router(health.router, prefix="/health", tags=["health"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to MarketMind API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

# Add your stock data endpoint here
@app.get("/api/v1/stockdata")
async def get_stock_data(symbol: str):
    # Replace with your actual data fetching logic
    stock_data = {
        "symbol": symbol,
        "price": 1642.3,
        "time": "2023-03-28T10:10:00"
    }
    return stock_data