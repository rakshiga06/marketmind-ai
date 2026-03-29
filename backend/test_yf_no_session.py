import yfinance as yf

def test_info(symbol):
    print(f"Testing info for {symbol} with session=None...")
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        print(f"Current Price: {info.get('currentPrice')}")
    except Exception as e:
        print(f"Error during info: {e}")

test_info("RELIANCE.NS")
