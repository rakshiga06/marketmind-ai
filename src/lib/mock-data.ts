export const stocks = [
  { ticker: "RELIANCE", name: "Reliance Industries Ltd", price: 2891, change: 34.68, changePct: 1.2, sector: "Energy" },
  { ticker: "HDFCBANK", name: "HDFC Bank Ltd", price: 1642.30, change: 23.40, changePct: 1.45, sector: "Banking" },
  { ticker: "INFY", name: "Infosys Ltd", price: 1834, change: 38.51, changePct: 2.1, sector: "IT" },
  { ticker: "TCS", name: "Tata Consultancy Services Ltd", price: 4120, change: 32.96, changePct: 0.8, sector: "IT" },
  { ticker: "ZOMATO", name: "Zomato Ltd", price: 218, change: -3.05, changePct: -1.4, sector: "Consumer" },
  { ticker: "BAJFINANCE", name: "Bajaj Finance Ltd", price: 7340, change: 220.2, changePct: 3.2, sector: "Finance" },
  { ticker: "WIPRO", name: "Wipro Ltd", price: 480, change: -2.4, changePct: -0.5, sector: "IT" },
  { ticker: "ICICIBANK", name: "ICICI Bank Ltd", price: 1210, change: 14.52, changePct: 1.2, sector: "Banking" },
  { ticker: "MARUTI", name: "Maruti Suzuki India Ltd", price: 12400, change: -62, changePct: -0.5, sector: "Auto" },
  { ticker: "ADANIENT", name: "Adani Enterprises Ltd", price: 2640, change: 52.8, changePct: 2.0, sector: "Infra" },
];

export const indices = [
  { name: "NIFTY 50", value: 24132.45, change: 192.30, changePct: 0.80, sparkline: [23800, 23900, 24000, 23950, 24050, 24132] },
  { name: "SENSEX", value: 79441.10, change: 680.20, changePct: 0.86, sparkline: [78500, 78800, 79000, 78900, 79200, 79441] },
  { name: "BANK NIFTY", value: 51204.60, change: -112.40, changePct: -0.22, sparkline: [51400, 51350, 51300, 51250, 51200, 51204] },
  { name: "India VIX", value: 13.40, change: -0.32, changePct: -2.33, sparkline: [14.0, 13.8, 13.6, 13.5, 13.4, 13.4] },
];

export const portfolio = {
  totalValue: 482340,
  totalInvested: 448500,
  dayChange: 12430,
  dayChangePct: 2.6,
  holdings: [
    { ticker: "HDFCBANK", name: "HDFC Bank", qty: 50, avgPrice: 1580, currentPrice: 1642.30, sector: "Banking" },
    { ticker: "INFY", name: "Infosys", qty: 30, avgPrice: 1790, currentPrice: 1834, sector: "IT" },
    { ticker: "ZOMATO", name: "Zomato", qty: 200, avgPrice: 195, currentPrice: 218, sector: "Consumer" },
    { ticker: "TCS", name: "TCS", qty: 10, avgPrice: 3900, currentPrice: 4120, sector: "IT" },
  ],
  sectorAllocation: [
    { name: "IT", value: 35, color: "hsl(164, 100%, 42%)" },
    { name: "Banking", value: 28, color: "hsl(38, 92%, 50%)" },
    { name: "Consumer", value: 18, color: "hsl(280, 70%, 55%)" },
    { name: "Other", value: 19, color: "hsl(215, 20%, 40%)" },
  ],
};

export const signals = [
  {
    id: "1", priority: "HIGH" as const, ticker: "BAJFINANCE", name: "Bajaj Finance Ltd", sector: "Finance",
    headline: "3 consecutive insider purchases totalling ₹12.4Cr",
    body: "The promoter group has purchased shares worth ₹4.2Cr in the latest transaction — this is the 3rd consecutive insider purchase this month. When insiders buy aggressively, it often signals confidence in upcoming performance.",
    whyItMatters: "Insider buying at elevated prices suggests management believes the stock is undervalued relative to future prospects.",
    historical: ["+18%", "+12%", "-4%"],
    sources: ["SEBI Insider Trade", "BSE Filing"],
    timestamp: "2 hours ago",
  },
  {
    id: "2", priority: "HIGH" as const, ticker: "HDFCBANK", name: "HDFC Bank Ltd", sector: "Banking",
    headline: "Golden Cross pattern detected on daily chart",
    body: "The 50-day moving average just crossed above the 200-day moving average — known as a Golden Cross. On HDFC Bank, this pattern has historically led to 10%+ gains in 5 out of 6 similar occurrences over the past decade.",
    whyItMatters: "Golden Cross is one of the most reliable bullish technical signals. Combined with strong FII buying, this suggests upward momentum.",
    historical: ["+14%", "+11%", "+18%", "-3%", "+9%", "+22%"],
    sources: ["NSE Technical Data", "Chart Analysis"],
    timestamp: "4 hours ago",
  },
  {
    id: "3", priority: "MEDIUM" as const, ticker: "ZOMATO", name: "Zomato Ltd", sector: "Consumer",
    headline: "FII stake increased by 2.1% in latest quarter",
    body: "Foreign Institutional Investors have increased their stake from 18.4% to 20.5% in Q3 — the largest quarterly FII increase in Zomato's history as a public company. FII buying often precedes re-rating.",
    whyItMatters: "Large institutional buying indicates professional money managers see value. FII flows often drive sustained price moves in mid-caps.",
    historical: ["+8%", "+15%", "+6%"],
    sources: ["SEBI Shareholding", "BSE Quarterly Filing"],
    timestamp: "6 hours ago",
  },
  {
    id: "4", priority: "LOW" as const, ticker: "INFY", name: "Infosys Ltd", sector: "IT",
    headline: "Board approves ₹9,300Cr buyback at ₹1,850/share",
    body: "Infosys board has approved a buyback programme at ₹1,850 per share. Current market price is ₹1,834, offering a small premium. Buybacks reduce outstanding shares and often support price floors.",
    whyItMatters: "Buyback at a premium to CMP provides a price floor. It also signals the company believes its stock is fairly valued or undervalued.",
    historical: ["+5%", "+3%", "+7%"],
    sources: ["BSE Corporate Action", "NSE Filing"],
    timestamp: "1 day ago",
  },
  {
    id: "5", priority: "MEDIUM" as const, ticker: "RELIANCE", name: "Reliance Industries Ltd", sector: "Energy",
    headline: "Jio Financial Services cross-listing approved by SEBI",
    body: "SEBI has granted approval for the cross-listing of Jio Financial Services on international exchanges. This could unlock significant value for Reliance shareholders through potential re-rating of the financial services arm.",
    whyItMatters: "Cross-listing provides access to global capital and often results in valuation premium due to increased visibility.",
    historical: ["+6%", "+10%"],
    sources: ["SEBI Order", "BSE Filing"],
    timestamp: "1 day ago",
  },
  {
    id: "6", priority: "HIGH" as const, ticker: "ADANIENT", name: "Adani Enterprises Ltd", sector: "Infra",
    headline: "Bulk deal: Marquee fund buys 1.2Cr shares at ₹2,680",
    body: "A prominent global fund has acquired 1.2 crore shares through a bulk deal on NSE at ₹2,680 — a 1.5% premium to the previous close. This is one of the largest single-day bulk purchases in the stock.",
    whyItMatters: "Large block purchases at premiums indicate strong institutional conviction. It often triggers momentum buying from other funds.",
    historical: ["+12%", "+8%", "-2%", "+15%"],
    sources: ["NSE Bulk Deal Data", "Market Surveillance"],
    timestamp: "3 hours ago",
  },
];

export const jargonDefinitions: Record<string, string> = {
  "RSI": "Relative Strength Index — A score from 0-100 that tells you if a stock is overbought or oversold. Above 70 = possibly overpriced, below 30 = possibly underpriced.",
  "MACD": "Moving Average Convergence Divergence — A trend indicator that shows when momentum is shifting. When the MACD line crosses above the signal line, it's considered bullish.",
  "Bollinger Bands": "Price bands drawn above and below a stock's moving average. When the price touches the upper band, the stock might be overbought. When it touches the lower band, it might be oversold.",
  "Golden Cross": "When the 50-day moving average crosses above the 200-day average. It's considered a strong bullish signal that often precedes sustained uptrends.",
  "FII": "Foreign Institutional Investors — Large overseas funds, banks, and institutions that invest in Indian stocks. Their buying/selling patterns significantly impact market direction.",
  "DII": "Domestic Institutional Investors — Indian mutual funds, insurance companies, and banks that invest in the stock market. They often buy when FIIs sell, providing stability.",
  "Bulk Deal": "When someone buys or sells more than 0.5% of a company's total shares in a single trading session. These deals are reported publicly and can signal major moves.",
  "Insider Trade": "When a company's promoters, directors, or senior management buy or sell their own company's shares. It's legal when disclosed, and often signals insider confidence.",
  "P&L": "Profit & Loss — The difference between what you paid for a stock and what it's worth now. Positive = profit, negative = loss.",
  "Cup & Handle": "A chart pattern that looks like a tea cup. The 'cup' is a U-shaped recovery and the 'handle' is a small dip before breakout. It's considered a bullish pattern.",
  "India VIX": "Volatility Index — Measures how much the market expects prices to swing in the next 30 days. High VIX = fearful market, Low VIX = calm market.",
  "Buyback": "When a company buys its own shares from the market, reducing the total number of shares. This usually increases the value of remaining shares.",
  "Sector Rotation": "When money flows out of one industry sector and into another. For example, investors moving from IT stocks to banking stocks.",
  "IPO": "Initial Public Offering — When a private company sells shares to the public for the first time, allowing anyone to become a part-owner.",
};

export const videos = [
  { id: "1", title: "Market Wrap — NIFTY hits 3-week high, FII buys ₹2,400Cr", duration: "1:24", timeAgo: "4 mins ago", views: "2.1K", featured: true },
  { id: "2", title: "Sector Rotation: IT leads, Metals lag — what it means for your portfolio", duration: "2:15", timeAgo: "1 hour ago", views: "1.8K" },
  { id: "3", title: "FII vs DII flows this week — who's winning?", duration: "3:02", timeAgo: "2 hours ago", views: "3.2K" },
  { id: "4", title: "3 IPOs opening this week — subscription status live", duration: "1:48", timeAgo: "4 hours ago", views: "5.4K" },
  { id: "5", title: "HDFC Bank breakout — technical analysis in 60 seconds", duration: "1:01", timeAgo: "6 hours ago", views: "2.7K" },
  { id: "6", title: "Why NIFTY fell 200 points today", duration: "2:30", timeAgo: "1 day ago", views: "8.1K" },
  { id: "7", title: "Top 5 bulk deals today — smart money is moving", duration: "1:55", timeAgo: "1 day ago", views: "4.3K" },
];

export const chatMessages = [
  {
    id: "1", role: "user" as const,
    content: "Should I hold Zomato through Q1 results?",
  },
  {
    id: "2", role: "assistant" as const,
    content: `Based on my analysis of Zomato's recent data, here's my assessment:

**Zomato has shown improving fundamentals** — Q3 adjusted EBITDA turned positive for the first time, and Blinkit's contribution margin improved from -15% to -4%. Revenue grew 68% YoY.

**However, Q1 results carry some uncertainty:**
- Food delivery growth is slowing (from 25% to 18% order growth)
- Blinkit's aggressive expansion could pressure margins
- Competition from Swiggy's IPO-funded expansion is intensifying

**For your portfolio context:** You hold 200 shares at an average of ₹195. Current price is ₹218, giving you a **+11.8% return**. Your position is relatively small (9% of portfolio).

**My suggestion:** The risk-reward is moderately favorable for holding. Consider setting a stop-loss at ₹200 to protect your gains while maintaining upside exposure.`,
    sources: ["BSE Filing · Jan 2025", "Q3 Earnings Call", "NSE Bulk Deal Data"],
    confidence: "Medium" as const,
    steps: ["Checked Q3 results", "Analyzed FII flows", "Reviewed chart", "Synthesized"],
  },
];
