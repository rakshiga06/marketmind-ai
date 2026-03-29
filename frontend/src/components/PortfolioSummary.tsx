import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/hooks/useCountUp";
import { X, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

export const PortfolioSummary = ({ limit }: { limit?: number }) => {
  const { token } = useAuth();
  const [holdings, setHoldings] = useState<any[]>([]);
  const [liveData, setLiveData] = useState<Record<string, any>>({});

  const fetchPortfolio = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/portfolio", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setHoldings(data.holdings || []);
      
      const live: Record<string, any> = {};
      await Promise.all((data.holdings || []).map(async (h: any) => {
        try {
          const fres = await fetch(`http://127.0.0.1:8000/api/v1/fundamentals?symbol=${h.symbol}`);
          const fdata = await fres.json();
          if (!fdata.error) live[h.symbol] = fdata;
        } catch(e) {}
      }));
      setLiveData(live);
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [token]);

  const displayedHoldings = limit ? holdings.slice(0, limit) : holdings;

  const handleRemoveHolding = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await fetch(`http://127.0.0.1:8000/api/v1/portfolio/${symbol}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchPortfolio();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div
      id="portfolio-summary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-5 relative flex flex-col h-full overflow-hidden border-t-4 border-emerald-500/30"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm text-foreground">
            {limit ? "Top Holdings" : "Full Portfolio"}
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Watchlist Tracking</p>
        </div>
        <Link to="/portfolio" className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-full">
          Analyze All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-1 overflow-y-auto pr-1 flex-1 custom-scrollbar">
        {displayedHoldings.map(h => {
          const live = liveData[h.symbol];
          const cp = live?.price || 0;
          const prevClose = live?.previous_close || cp;
          const dayChangeValue = cp - prevClose;
          const dayChangePct = prevClose > 0 ? (dayChangeValue / prevClose) * 100 : 0;
          const positive = dayChangePct >= 0;
          return (
             <div key={h.symbol} className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0 px-2 rounded-lg group hover:bg-secondary/10 transition-colors relative">
              <div className="overflow-hidden mr-2">
                <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{h.symbol}</p>
                <p className="text-[11px] text-muted-foreground truncate font-medium">{live?.name || h.name}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right shrink-0">
                  <p className="text-sm font-mono font-medium">{cp > 0 ? formatCurrency(cp) : "..."}</p>
                  <p className={`text-xs font-mono font-semibold ${positive ? "text-gain" : "text-loss"}`}>
                     {positive ? "+" : ""}{dayChangePct.toFixed(2)}%
                  </p>
                </div>
                {!limit && (
                   <button onClick={(e) => handleRemoveHolding(h.symbol, e)} className="text-muted-foreground p-1 hover:text-red-500 rounded-md hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 absolute right-2">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {holdings.length === 0 && (
          <div className="flex flex-col items-center justify-center p-6 text-center h-full">
            <p className="text-xs text-muted-foreground text-balance">Watchlist empty. Research stocks to track them here.</p>
          </div>
        )}
      </div>
      {limit && holdings.length > limit && (
        <div className="mt-3 text-center">
          <Link to="/portfolio" className="text-[10px] text-muted-foreground hover:text-primary underline underline-offset-4">
            Viewing 3 of {holdings.length} stocks
          </Link>
        </div>
      )}
    </motion.div>
  );
};
