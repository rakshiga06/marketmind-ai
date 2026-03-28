import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Bookmark, MessageSquare } from "lucide-react";
import { JargonTerm } from "./JargonTerm";

interface Signal {
  id: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  ticker: string;
  name: string;
  sector: string;
  headline: string;
  body: string;
  whyItMatters: string;
  historical: string[];
  sources: string[];
  timestamp: string;
}

const priorityStyles = {
  HIGH: "bg-loss/10 text-loss border-loss/30",
  MEDIUM: "bg-warn/10 text-warn border-warn/30",
  LOW: "bg-gain/10 text-gain border-gain/30",
};

const priorityBorder = {
  HIGH: "border-l-loss",
  MEDIUM: "border-l-warn",
  LOW: "border-l-gain",
};

export const SignalCard = ({ signal, compact }: { signal: Signal; compact?: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  return (
    <motion.div
      layout
      className={`glass-card-hover p-4 border-l-2 ${priorityBorder[signal.priority]} ${compact ? "" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${priorityStyles[signal.priority]}`}>
              {signal.priority}
            </span>
            <span className="font-mono font-bold text-sm">{signal.ticker}</span>
            {!compact && <span className="text-xs text-muted-foreground">{signal.name}</span>}
            <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground">{signal.sector}</span>
          </div>

          <p className="text-sm font-semibold mb-1">{signal.headline}</p>

          {!compact && <p className="text-sm text-muted-foreground mb-2">{signal.body}</p>}

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {compact && <p className="text-sm text-muted-foreground mb-2">{signal.body}</p>}
                <div className="bg-secondary/50 rounded-lg p-3 mb-2">
                  <p className="text-xs text-muted-foreground mb-1">Historical context:</p>
                  <div className="flex gap-2">
                    {signal.historical.map((h, i) => (
                      <span key={i} className={`text-xs font-mono ${h.startsWith("+") ? "text-gain" : "text-loss"}`}>{h}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showWhy && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-2">
                  <p className="text-xs font-semibold text-primary mb-1">What does this mean for me?</p>
                  <p className="text-xs text-muted-foreground">{signal.whyItMatters}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {signal.sources.map(src => (
              <span key={src} className="px-1.5 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground">{src}</span>
            ))}
            <span className="text-[10px] text-muted-foreground">{signal.timestamp}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Less" : "More"}
        </button>
        <button onClick={() => setShowWhy(!showWhy)} className="text-xs text-primary hover:underline">
          What does this mean?
        </button>
        {!compact && (
          <>
            <button className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Bookmark className="h-3 w-3" /> Watchlist
            </button>
            <button className="flex items-center gap-1 text-xs text-primary hover:underline">
              <MessageSquare className="h-3 w-3" /> Ask AI
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};
