import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { JargonTerm } from "@/components/JargonTerm";
import { motion } from "framer-motion";
import { Search, Info } from "lucide-react";
import { stocks } from "@/lib/mock-data";
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, IChartApi, ColorType } from "lightweight-charts";

const timeframes = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"];

const indicatorInfo: Record<string, string> = {
  "RSI":"Relative Strength Index: Measures the speed and magnitude of price changes to evaluate overbought (>70) or oversold (<30) conditions.",
  "MACD": "Trend-following momentum indicator showing the relationship between two moving averages. Used to spot trend changes.",
  "Bollinger Bands": "Measures volatility. Prices moving near the upper band may indicate overbought conditions, while lower band may mean oversold.",
  "Volume": "Total number of shares traded. Used to confirm the strength of a price trend (high volume = strong trend)."
};

const recentlyViewed = ["RELIANCE", "HDFCBANK", "INFY", "ZOMATO"];
const patternAlerts = [
  { ticker: "HDFCBANK", pattern: "Golden Cross" },
  { ticker: "BAJFINANCE", pattern: "Cup & Handle" },
  { ticker: "RELIANCE", pattern: "Ascending Triangle" },
];

export default function ChartsPage() {
  const [selectedStock, setSelectedStock] = useState("HDFCBANK");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1M");
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  const [stockData, setStockData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const stock = stocks.find(s => s.ticker === selectedStock) || { name: stockData?.symbol || selectedStock, ticker: selectedStock, price: 0, change: 0, changePct: 0 };

  const toggleIndicator = (ind: string) => {
    setActiveIndicators(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/search?q=${searchQuery}`);
        const data = await res.json();
        if (data.results) setSearchResults(data.results);
      } catch (e) {
        console.error(e);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  useEffect(() => {
    const fetchStockData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:8000/api/v1/stockdata?symbol=${selectedStock}&timeframe=${selectedTimeframe}`);
        const result = await response.json();
        if (result.error) {
          setError(result.error);
          setStockData(null);
        } else {
          setStockData(result);
        }
      } catch (err: any) {
        console.error("Error fetching stock data:", err);
        setError("Failed to fetch data from backend. Ensure the server is running.");
        setStockData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStockData();
  }, [selectedStock, selectedTimeframe]);

  useEffect(() => {
    if (!stockData || !stockData.data || !chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: { 
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#A3A3A3',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }
    });
    
    chartRef.current = chart;

    // Main Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981', downColor: '#EF4444', 
      borderVisible: false,
      wickUpColor: '#10B981', wickDownColor: '#EF4444',
    });

    const candleData = stockData.data.map((d: any) => ({
      time: d.time, open: d.open, high: d.high, low: d.low, close: d.close
    }));
    candleSeries.setData(candleData);

    // Dynamic Indicators
    if (activeIndicators.includes("Volume")) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '', // overlay
      });
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      
      const volData = stockData.data.map((d: any) => ({
        time: d.time, value: d.volume, color: d.close >= d.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
      }));
      volumeSeries.setData(volData);
    }

    if (activeIndicators.includes("Bollinger Bands")) {
      const upperSeries = chart.addSeries(LineSeries, { color: 'rgba(56, 189, 248, 0.5)', lineWidth: 1 });
      const lowerSeries = chart.addSeries(LineSeries, { color: 'rgba(56, 189, 248, 0.5)', lineWidth: 1 });
      
      upperSeries.setData(stockData.data.filter((d:any)=>d.bb_upper).map((d: any) => ({ time: d.time, value: d.bb_upper })));
      lowerSeries.setData(stockData.data.filter((d:any)=>d.bb_lower).map((d: any) => ({ time: d.time, value: d.bb_lower })));
    }

    if (activeIndicators.includes("RSI")) {
      const rsiSeries = chart.addSeries(LineSeries, { color: '#A855F7', lineWidth: 2, priceScaleId: 'rsi' });
      chart.priceScale('rsi').applyOptions({ scaleMargins: { top: 0.75, bottom: 0 } });
      rsiSeries.setData(stockData.data.filter((d:any)=>d.rsi).map((d: any) => ({ time: d.time, value: d.rsi })));
    }
    
    if (activeIndicators.includes("MACD")) {
      const macdSeries = chart.addSeries(LineSeries, { color: '#3B82F6', lineWidth: 2, priceScaleId: 'macd' });
      const macdSignal = chart.addSeries(LineSeries, { color: '#F59E0B', lineWidth: 1, priceScaleId: 'macd' });
      const macdHist = chart.addSeries(HistogramSeries, { priceScaleId: 'macd' });
      
      chart.priceScale('macd').applyOptions({ scaleMargins: { top: 0.75, bottom: 0 } });
      
      macdSeries.setData(stockData.data.filter((d:any)=>d.macd).map((d:any)=>({ time: d.time, value: d.macd })));
      macdSignal.setData(stockData.data.filter((d:any)=>d.macd_signal).map((d:any)=>({ time: d.time, value: d.macd_signal })));
      macdHist.setData(stockData.data.filter((d:any)=>d.macd_hist).map((d:any)=>({
        time: d.time, value: d.macd_hist, color: d.macd_hist >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
      })));
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [stockData, activeIndicators]);

  // Derived display details
  const displayPrice = stockData ? stockData.current_price : stock.price;
  const startPrice = stockData?.data?.[0]?.open;
  const changeVal = stockData && startPrice ? displayPrice - startPrice : stock.change;
  const changePct = stockData && startPrice ? ((changeVal / startPrice) * 100).toFixed(2) : stock.changePct;
  const positive = changeVal >= 0;

  return (
    <div className="min-h-screen font-sans">
      <Navbar />
      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <div className="hidden lg:block w-60 border-r border-border/50 p-4 space-y-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search global stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary rounded-lg pl-8 pr-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary transition-all"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
            />
            {searchFocused && (
              <div className="absolute top-full left-0 right-0 mt-1 glass-card p-2 z-20 max-h-60 overflow-y-auto shadow-xl">
                {searchQuery.trim() ? (searchResults.length > 0 ? searchResults.map(s => (
                  <button
                    key={s.symbol}
                    onMouseDown={() => { setSelectedStock(s.symbol); setSearchQuery(''); setSearchFocused(false); }}
                    className="w-full text-left px-3 py-2 rounded text-sm hover:bg-secondary flex flex-col gap-0.5"
                  >
                    <span className="font-bold flex items-center justify-between">
                      {s.symbol}
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{s.type || "EQUITY"}</span>
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{s.name} • {s.exchange}</span>
                  </button>
                )) : <div className="text-xs text-muted-foreground px-2 py-2">No results</div>) : stocks.slice(0, 4).map(s => (
                  <button
                    key={s.ticker}
                    onMouseDown={() => { setSelectedStock(s.ticker); setSearchFocused(false); }}
                    className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-secondary flex items-center justify-between"
                  >
                    <span className="font-mono font-medium">{s.ticker}</span>
                    <span className={`text-xs font-mono ${(s.change ?? 0) >= 0 ? "text-gain" : "text-loss"}`}>
                      {(s.change ?? 0) >= 0 ? "+" : ""}{s.changePct || 0}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Recently Viewed</p>
            <div className="space-y-1">
              {recentlyViewed.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedStock(t)}
                  className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-secondary ${selectedStock === t ? "bg-secondary text-primary" : ""}`}
                >
                  <span className="font-mono">{t}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Pattern Alerts</p>
            <div className="space-y-1.5">
              {patternAlerts.map(p => (
                <button
                  key={p.ticker}
                  onClick={() => setSelectedStock(p.ticker)}
                  className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-secondary"
                >
                  <span className="font-mono font-medium">{p.ticker}</span>
                  <span className="block text-muted-foreground">{p.pattern}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main chart area */}
        <div className="flex-1 p-4 lg:p-6 space-y-4 relative w-full overflow-hidden">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-wrap items-baseline gap-3 mb-1">
              <h1 className="text-xl font-bold">{stock.name}</h1>
              <span className="text-sm text-muted-foreground font-mono">NSE: {stockData?.symbol || stock.ticker}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold font-mono">₹{displayPrice.toLocaleString("en-IN", {maximumFractionDigits: 2})}</span>
              <span className={`text-sm font-mono ${positive ? "text-gain" : "text-loss"}`}>
                {positive ? "+" : ""}₹{changeVal.toFixed(2)} ({positive ? "+" : ""}{changePct}%) {selectedTimeframe}
              </span>
            </div>
          </motion.div>

          <div className="flex gap-1 flex-wrap">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border border-transparent ${
                  selectedTimeframe === tf ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Actual Lightweight Candlestick Chart */}
          <div className="glass-card h-80 md:h-[450px] relative overflow-hidden p-0 flex items-center justify-center border border-border/50 rounded-xl">
            {isLoading && <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 font-mono text-sm text-muted-foreground">Fetching market data...</div>}
            {error && <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 text-loss font-mono text-sm">{error}</div>}
            <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
            <div className="absolute bottom-2 right-3 text-[10px] text-muted-foreground/30 z-10 pointer-events-none">Powered by lightweight-charts & yfinance</div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {Object.keys(indicatorInfo).map(ind => (
              <div key={ind} className="relative group">
                <button
                  onClick={() => toggleIndicator(ind)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeIndicators.includes(ind) ? "bg-primary/10 text-primary border border-primary/30" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {ind}
                  <Info className="w-3 h-3 opacity-50" />
                </button>
                {/* Tooltip Hover Box */}
                <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 text-xs bg-popover text-popover-foreground border border-border rounded-lg shadow-xl z-50">
                  <p className="font-bold mb-1 text-primary">{ind}</p>
                  <p className="leading-relaxed">{indicatorInfo[ind]}</p>
                  
                  {/* Arrow for tooltip */}
                  <div className="absolute w-2 h-2 bg-popover border-b border-r border-border transform rotate-45 left-1/2 -translate-x-1/2 -bottom-[5px]"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Pattern Intelligence */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <h3 className="font-semibold mb-3">Detected Patterns</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">
                <JargonTerm term="Cup & Handle">Cup & Handle</JargonTerm>
              </span>
              <span className="text-xs text-muted-foreground">Confidence: <span className="text-gain font-mono">87%</span></span>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3">
              <p className="text-sm text-muted-foreground">
                This stock has been consolidating in a U-shape for 8 weeks and is now breaking out — this is classically bullish. 
                The 'handle' phase suggests a final shakeout before the move.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center p-2 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Found</p>
                <p className="text-sm font-bold font-mono">4 times</p>
                <p className="text-[10px] text-muted-foreground">in 5 years</p>
              </div>
              <div className="text-center p-2 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Avg return</p>
                <p className="text-sm font-bold font-mono text-gain">+14.2%</p>
                <p className="text-[10px] text-muted-foreground">60 days later</p>
              </div>
              <div className="text-center p-2 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Win rate</p>
                <p className="text-sm font-bold font-mono text-gain">75%</p>
                <p className="text-[10px] text-muted-foreground">on this stock</p>
              </div>
            </div>

            <button onClick={() => setShowModal(true)} className="w-full py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
              What should I do?
            </button>
          </motion.div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-3">What does this mean for me?</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="text-primary font-bold">1.</span>
                <p className="text-sm text-muted-foreground"><strong>What happened:</strong> A Cup & Handle pattern formed over 8 weeks, suggesting the stock has found strong support and is preparing for an upward move.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">2.</span>
                <p className="text-sm text-muted-foreground"><strong>Why it might matter:</strong> This pattern has a 75% success rate on this stock historically, with an average gain of 14.2% in the following 60 days.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">3.</span>
                <p className="text-sm text-muted-foreground"><strong>What some investors do:</strong> Some investors see this as a buying opportunity, while others wait for confirmation of the breakout with increased volume. This is not financial advice.</p>
              </div>
            </div>
            <button onClick={() => setShowModal(false)} className="w-full mt-4 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors">
              Got it
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}