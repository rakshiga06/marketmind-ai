import yfinance as yf
import requests

def test_yf(symbol):
    print(f"Testing {symbol} with new headers...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Referer": "https://finance.yahoo.com/",
        "Accept-Language": "en-US,en;q=0.9"
    }
    session = requests.Session()
    session.headers.update(headers)
    
    ticker = yf.Ticker(symbol, session=session)
    info = ticker.info
    print(f"Info keys: {list(info.keys())[:10]}")
    print(f"Current Price: {info.get('currentPrice', info.get('regularMarketPrice'))}")
    print(f"Market Cap: {info.get('marketCap')}")

test_yf("RELIANCE.NS")
