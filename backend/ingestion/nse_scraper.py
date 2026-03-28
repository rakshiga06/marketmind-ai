import logging
import requests
import time
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class NSEScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive"
        })
        self.base_url = "https://www.nseindia.com"
        self._initialize_session()

    def _initialize_session(self):
        """Hit the base page to establish cookies"""
        try:
            time.sleep(1) # Rate limiting
            response = self.session.get(self.base_url, timeout=10)
            response.raise_for_status()
            logger.info("NSE session initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize NSE session: {e}")

    def get_corporate_announcements(self) -> List[Dict[str, Any]]:
        """Fetch latest corporate announcements for equities."""
        url = f"{self.base_url}/api/corporate-announcements?index=equities"
        return self._fetch_json(url)

    def get_board_meetings(self) -> List[Dict[str, Any]]:
        """Fetch upcoming corporate board meetings."""
        url = f"{self.base_url}/api/corporate-board-meetings?index=equities"
        return self._fetch_json(url)

    def get_insider_trading(self, symbol: str, from_date: str, to_date: str) -> List[Dict[str, Any]]:
        """Fetch insider trading data for a symbol in a date range."""
        url = f"{self.base_url}/api/corporates-pit?symbol={symbol}&from={from_date}&to={to_date}"
        return self._fetch_json(url)

    def _fetch_json(self, url: str) -> List[Dict[str, Any]]:
        try:
            time.sleep(1) # Rate limiting to avoid blocks
            headers = {"Accept": "*/*"}
            response = self.session.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Extract data array depending on the exact NSE API response shape
            if isinstance(data, dict) and "data" in data:
                return data["data"]
            elif isinstance(data, list):
                return data
            else:
                return []
        except requests.exceptions.HTTPError as e:
            if response.status_code == 401:
                logger.warning("Session might have expired. Reinitializing...")
                self._initialize_session()
                # Retry once
                response = self.session.get(url, headers={"Accept": "*/*"}, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("data", []) if isinstance(data, dict) else data
            logger.error(f"HTTPError fetching data from {url}: {e}")
            return []
        except Exception as e:
            logger.error(f"Error fetching data from {url}: {e}")
            return []

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scraper = NSEScraper()
    
    print("\\nFetching Board Meetings...")
    meetings = scraper.get_board_meetings()
    print(f"Got {len(meetings)} meetings. Top result:")
    if meetings:
        print(meetings[0])
        
    print("\\nFetching Corporate Announcements...")
    announcements = scraper.get_corporate_announcements()
    print(f"Got {len(announcements)} announcements. Top result:")
    if announcements:
        print(announcements[0])
