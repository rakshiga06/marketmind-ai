import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { SignalCard } from "@/components/SignalCard";
import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";

const filters = ["All Signals", "Insider Trades", "Bulk Deals", "Filings", "Earnings", "Regulatory"];

const RadarPage = () => {
  const [activeFilter, setActiveFilter] = useState("All Signals");
  const [searchQuery, setSearchQuery] = useState("");
  const [myStocksOnly, setMyStocksOnly] = useState(false);
  const [activeSignals, setActiveSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ZOMATO, RELIANCE, TCS, HDFCBANK from the onboarding phase
  const trackedWatchlist = ["ZOMATO", "RELIANCE", "TCS", "HDFCBANK"];

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/radar/signals");
        const data = await res.json();
        setActiveSignals(data.signals || []);
      } catch (e) {
        console.error("Failed to fetch radar signals");
      } finally {
        setLoading(false);
      }
    };
    fetchSignals();
  }, []);

  const filtered = activeSignals.filter(s => {
    const matchesSearch = searchQuery === "" || s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWatchlist = myStocksOnly ? trackedWatchlist.includes(s.ticker) : true;
    return matchesSearch && matchesWatchlist;
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Opportunity Radar</h1>
          <p className="text-sm text-muted-foreground mb-6">AI-detected signals from insider trades, bulk deals, and regulatory filings.</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-2 flex-wrap flex-1">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeFilter === f ? "bg-primary/10 text-primary border border-primary/30" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 bg-secondary rounded-lg px-3 py-1.5 min-w-[200px]">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by stock or sector..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground/60 w-full"
            />
          </div>
          
          <button 
            onClick={() => setMyStocksOnly(!myStocksOnly)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              myStocksOnly ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-sm" : "bg-secondary text-muted-foreground border-border hover:bg-secondary/70"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${myStocksOnly ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`}></div>
            My Stocks Only
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
             <p className="text-sm font-medium text-muted-foreground animate-pulse">Running live calculations on TA-Lib and YFinance...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <SignalCard signal={s} />
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg font-semibold mb-2">No signals found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or check back after market hours.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RadarPage;
