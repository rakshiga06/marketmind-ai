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
        const res = await fetch(`http://127.0.0.1:8000/api/v1/search?q=${searchQuery}`);
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
        const response = await fetch(`http://127.0.0.1:8000/api/v1/stockdata?symbol=${selectedStock}&timeframe=${selectedTimeframe}`);
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
          <PatternIntelligence symbol={selectedStock} />
        </div>
      </div>
      
      <DiscoveryModal />
    </div>
  );
}

const PatternIntelligence = ({ symbol }: { symbol: string }) => {
  const [discovery, setDiscovery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscovery = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/patterns/discovery/${symbol}`);
        if (res.ok) {
          const data = await res.json();
          setDiscovery(data);
        } else {
          setDiscovery(null);
        }
      } catch (e) {
        setDiscovery(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscovery();
  }, [symbol]);

  if (loading) return (
    <div className="glass-card p-5 animate-pulse">
      <div className="h-4 w-32 bg-secondary rounded mb-4" />
      <div className="h-20 bg-secondary rounded mb-4" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-12 bg-secondary rounded" />
        <div className="h-12 bg-secondary rounded" />
        <div className="h-12 bg-secondary rounded" />
      </div>
    </div>
  );

  if (!discovery) return (
    <div className="glass-card p-5 text-center py-10">
      <p className="text-sm text-muted-foreground mb-2">No historical patterns discovered for {symbol} yet.</p>
      <p className="text-[10px] text-muted-foreground/60">Our engine is currently backtesting 2000+ stocks. Check back shortly.</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 border-l-4 border-primary">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Most Successful Pattern (5Y)</h3>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">Live Engine Match</span>
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold ring-1 ring-primary/30">
          <JargonTerm term={discovery.pattern_name}>{discovery.pattern_name}</JargonTerm>
        </span>
        <span className="text-xs text-muted-foreground">Historical Confidence: <span className="text-gain font-mono">{discovery.confidence}%</span></span>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3">
        <p className="text-sm text-muted-foreground leading-relaxed italic">
          "{discovery.explanation}"
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 bg-secondary/50 rounded-lg border border-border/30 shadow-sm">
          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Found</p>
          <p className="text-base font-bold font-mono text-foreground">{discovery.found_count}</p>
          <p className="text-[9px] text-muted-foreground">occurrences</p>
        </div>
        <div className="text-center p-2 bg-secondary/50 rounded-lg border border-border/30 shadow-sm">
          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Avg Return</p>
          <p className={`text-base font-bold font-mono ${discovery.avg_return >= 0 ? "text-gain" : "text-loss"}`}>
            {discovery.avg_return >= 0 ? "+" : ""}{discovery.avg_return}%
          </p>
          <p className="text-[9px] text-muted-foreground">in 60 days</p>
        </div>
        <div className="text-center p-2 bg-secondary/50 rounded-lg border border-border/30 shadow-sm">
          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">Win Rate</p>
          <p className="text-base font-bold font-mono text-gain">{discovery.win_rate}%</p>
          <p className="text-[9px] text-muted-foreground">success rate</p>
        </div>
      </div>

      <button onClick={() => window.dispatchEvent(new CustomEvent('open-discovery-modal', { detail: discovery }))} className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-all shadow-lg shadow-primary/20">
        Analyze Strategic Move
      </button>
    </motion.div>
  );
};

const DiscoveryModal = () => {
  const [data, setData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = (e: any) => {
      setData(e.detail);
      setIsOpen(true);
    };
    window.addEventListener('open-discovery-modal', handleOpen);
    return () => window.removeEventListener('open-discovery-modal', handleOpen);
  }, []);

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-6 max-w-md w-full border border-primary/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/20 rounded-lg text-primary">
            <Info className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-xl">Historical Strategy Analysis</h3>
        </div>
        
        <div className="space-y-4">
          <div className="p-3 bg-secondary/50 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground font-bold uppercase mb-1">Stock Scenario</p>
            <p className="text-sm font-medium">A <span className="text-primary font-bold">{data.pattern_name}</span> has been detected on <span className="font-bold underline">{data.symbol}</span> charts.</p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
              <p className="text-sm text-muted-foreground"><strong>Performance Data:</strong> In the last 5 years, this specific setup appeared {data.found_count} times on {data.symbol}.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
              <p className="text-sm text-muted-foreground"><strong>The "Edge":</strong> Out of those occurrences, {data.win_rate}% reached a profit target of +10% within 60 days.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
              <p className="text-sm text-muted-foreground"><strong>AI Reasoning:</strong> {data.explanation}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex flex-col gap-2">
          <button onClick={() => setIsOpen(false)} className="w-full py-2.5 rounded-lg bg-secondary text-sm font-bold hover:bg-secondary/80 transition-colors">
            Close Analysis
          </button>
          <p className="text-[10px] text-center text-muted-foreground/60 italic">MarketMind Engine v1.0 • Not Financial Advice</p>
        </div>
      </motion.div>
    </div>
  );
}