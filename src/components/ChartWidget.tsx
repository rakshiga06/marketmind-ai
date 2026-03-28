import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { JargonTerm } from "./JargonTerm";

export const ChartWidget = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="glass-card p-5"
  >
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-sm text-muted-foreground">Pattern Detected</h3>
      <Link to="/charts" className="text-xs text-primary hover:underline flex items-center gap-0.5">
        Open full chart <ChevronRight className="h-3 w-3" />
      </Link>
    </div>

    {/* Mock candlestick chart */}
    <div className="h-32 bg-secondary/30 rounded-lg mb-3 flex items-end justify-center gap-1 px-4 py-2">
      {[40, 55, 45, 60, 50, 65, 70, 62, 75, 80, 72, 85, 90, 82, 95, 88, 92, 98, 95, 100].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className={`w-full rounded-sm ${i > 14 ? "bg-gain" : i > 10 ? "bg-primary/60" : "bg-muted-foreground/30"}`}
            style={{ height: `${h}%` }}
          />
        </div>
      ))}
    </div>

    <div className="flex items-center gap-2 mb-2">
      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-semibold">
        <JargonTerm term="Golden Cross">Golden Cross</JargonTerm>
      </span>
      <span className="text-xs text-muted-foreground">HDFCBANK</span>
    </div>

    <p className="text-sm text-muted-foreground mb-2">
      The 50-day average just crossed above the 200-day average on HDFC Bank. Historically this led to 10%+ gains in 5 out of 6 similar occurrences.
    </p>

    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-gain">Success rate: 83%</span>
    </div>
  </motion.div>
);
