import yfinance as yf

def test_download(symbol):
    print(f"Testing download for {symbol}...")
    try:
        data = yf.download(symbol, period="1d", interval="1m")
        print(f"Data rows: {len(data)}")
        if len(data) > 0:
            print("Download successful!")
            print(data.tail())
        else:
            print("Download returned NO data.")
    except Exception as e:
        print(f"Error during download: {e}")

test_download("RELIANCE.NS")
