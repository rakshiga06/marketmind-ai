import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Send, ChevronRight, Bot } from "lucide-react";

export const ChatWidget = () => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetSymbol, setTargetSymbol] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        // Find best portfolio stock to analyze
        const pRes = await fetch("http://127.0.0.1:8000/api/v1/portfolio");
        const pData = await pRes.json();
        const holdings = pData.holdings || [];
        
        let sym = "HDFCBANK";
        if (holdings.length > 0) {
          sym = holdings[holdings.length - 1].symbol; // Analyze most recently added
        }
        setTargetSymbol(sym);

        const res = await fetch(`http://127.0.0.1:8000/api/v1/chat/insights?symbol=${sym}`);
        const data = await res.json();
        if (data.insights) setInsight(data.insights);
        else setInsight("Unable to generate insights at the moment. Please check backend.");
      } catch (e) {
        setInsight("Unable to connect to AI engine.");
      } finally {
        setLoading(false);
      }
    };
    fetchInsight();
  }, []);

  return (
    <motion.div
      id="chat-widget"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-5 flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5"><Bot className="w-4 h-4 text-primary" /> MarketMind AI</h3>
        <Link to="/chat" className="text-xs text-primary hover:underline flex items-center gap-0.5">
          Open full chat <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="bg-secondary/30 rounded-lg p-3 mb-3">
        <p className="text-xs text-muted-foreground mb-1">Actively Analyzing Context:</p>
        <p className="text-sm font-medium text-emerald-400">"{targetSymbol || "Market"}" in your Watchlist</p>
      </div>

      <div className="bg-secondary/20 rounded-lg p-3 mb-3 flex-1 overflow-y-auto max-h-[300px]">
        {loading ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 mb-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">M</span>
              </div>
              <span className="text-xs font-medium">MarketMind AI</span>
              <div className="flex gap-0.5 ml-1">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse-dot" />
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Synthesizing latest SEC/NSE filings, technicals, and global news...</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center gap-1 mb-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">M</span>
              </div>
              <span className="text-xs font-medium">MarketMind AI</span>
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
              {insight?.split('\n').map((line, i) => {
                if(line.trim() === '') return null;
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                  <p key={i}>
                    {parts.map((p, j) => p.startsWith('**') && p.endsWith('**') ? <strong key={j} className="text-foreground">{p.slice(2, -2)}</strong> : p)}
                  </p>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-3 py-2 mt-auto">
        <input
          type="text"
          placeholder={`Ask about ${targetSymbol}...`}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-0"
          readOnly
        />
        <button className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
