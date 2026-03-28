import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Send, ChevronRight } from "lucide-react";

export const ChatWidget = () => (
  <motion.div
    id="chat-widget"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="glass-card p-5 flex flex-col"
  >
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-sm text-muted-foreground">Ask MarketMind</h3>
      <Link to="/chat" className="text-xs text-primary hover:underline flex items-center gap-0.5">
        Open full chat <ChevronRight className="h-3 w-3" />
      </Link>
    </div>

    <div className="bg-secondary/30 rounded-lg p-3 mb-3">
      <p className="text-xs text-muted-foreground mb-1">Sample question:</p>
      <p className="text-sm font-medium">"Should I hold Zomato through Q1 results?"</p>
    </div>

    <div className="bg-secondary/20 rounded-lg p-3 mb-3 flex-1">
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
      <p className="text-xs text-muted-foreground leading-relaxed">
        Based on Q3 results, Zomato's adjusted EBITDA turned positive. However, food delivery growth is slowing...
      </p>
      <div className="flex gap-1.5 mt-2 flex-wrap">
        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[10px] text-primary">BSE Filing · Jan 2025</span>
        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[10px] text-primary">Q3 Earnings Call</span>
      </div>
    </div>

    <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-3 py-2">
      <input
        type="text"
        placeholder="Ask anything about your portfolio..."
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
        readOnly
      />
      <button className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
        <Send className="h-3.5 w-3.5" />
      </button>
    </div>
  </motion.div>
);
