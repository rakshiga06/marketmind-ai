import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { JargonTerm } from "@/components/JargonTerm";
import { motion } from "framer-motion";
import { Search, TrendingUp, ChevronRight } from "lucide-react";
import { stocks } from "@/lib/mock-data";

const timeframes = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"];
const indicators = ["RSI", "MACD", "Bollinger Bands", "Volume"];
const recentlyViewed = ["RELIANCE", "HDFCBANK", "INFY", "ZOMATO"];
const patternAlerts = [
  { ticker: "HDFCBANK", pattern: "Golden Cross" },
  { ticker: "BAJFINANCE", pattern: "Cup & Handle" },
  { ticker: "RELIANCE", pattern: "Ascending Triangle" },
];

const ChartsPage = () => {
  const [selectedStock, setSelectedStock] = useState("HDFCBANK");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1M");
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const stock = stocks.find(s => s.ticker === selectedStock) || stocks[1];
  const positive = stock.change >= 0;

  const toggleIndicator = (ind: string) => {
    setActiveIndicators(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <div className="hidden lg:block w-60 border-r border-border/50 p-4 space-y-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search stocks..."
              className="w-full bg-secondary rounded-lg pl-8 pr-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
            {searchFocused && (
              <div className="absolute top-full left-0 right-0 mt-1 glass-card p-2 z-10">
                {stocks.slice(0, 4).map(s => (
                  <button
                    key={s.ticker}
                    onClick={() => setSelectedStock(s.ticker)}
                    className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-secondary flex items-center justify-between"
                  >
                    <span className="font-mono font-medium">{s.ticker}</span>
                    <span className={`text-xs font-mono ${s.change >= 0 ? "text-gain" : "text-loss"}`}>
                      {s.change >= 0 ? "+" : ""}{s.changePct}%
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
        <div className="flex-1 p-4 lg:p-6 space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-wrap items-baseline gap-3 mb-1">
              <h1 className="text-xl font-bold">{stock.name}</h1>
              <span className="text-sm text-muted-foreground font-mono">NSE: {stock.ticker}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold font-mono">₹{stock.price.toLocaleString("en-IN")}</span>
              <span className={`text-sm font-mono ${positive ? "text-gain" : "text-loss"}`}>
                {positive ? "+" : ""}₹{stock.change.toFixed(2)} ({positive ? "+" : ""}{stock.changePct}%) TODAY
              </span>
            </div>
          </motion.div>

          <div className="flex gap-1 flex-wrap">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedTimeframe === tf ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Mock chart */}
          <div className="glass-card h-64 md:h-80 flex items-end justify-center gap-0.5 px-4 py-4 relative overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => {
              const h = 20 + Math.sin(i * 0.3) * 15 + Math.random() * 20 + (i > 25 ? i * 1.2 : 0);
              const isGreen = Math.random() > 0.4;
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className={`w-full rounded-sm ${isGreen ? "bg-gain/70" : "bg-loss/70"}`} style={{ height: `${Math.min(h, 95)}%` }} />
                </div>
              );
            })}
            <div className="absolute bottom-2 right-3 text-[10px] text-muted-foreground/50">Powered by lightweight-charts</div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {indicators.map(ind => (
              <button
                key={ind}
                onClick={() => toggleIndicator(ind)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeIndicators.includes(ind) ? "bg-primary/10 text-primary border border-primary/30" : "bg-secondary text-muted-foreground"
                }`}
              >
                <JargonTerm term={ind}>{ind}</JargonTerm>
              </button>
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
};

export default ChartsPage;
