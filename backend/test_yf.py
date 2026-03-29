import yfinance as yf
import requests

def test_yf(symbol):
    print(f"Testing {symbol}...")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    session = requests.Session()
    session.headers.update(headers)
    
    ticker = yf.Ticker(symbol, session=session)
    info = ticker.info
    print(f"Info keys: {list(info.keys())[:10]}")
    print(f"Current Price: {info.get('currentPrice')}")
    print(f"Symbol: {info.get('symbol')}")

test_yf("RELIANCE.NS")
