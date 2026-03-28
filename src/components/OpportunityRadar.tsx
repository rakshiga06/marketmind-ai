import { motion } from "framer-motion";
import { signals } from "@/lib/mock-data";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SignalCard } from "./SignalCard";

export const OpportunityRadar = () => (
  <motion.div
    id="opportunity-radar"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="glass-card p-5"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-sm text-muted-foreground">Today's Signals</h3>
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
      </div>
      <Link to="/radar" className="text-xs text-primary hover:underline flex items-center gap-0.5">
        View all <ChevronRight className="h-3 w-3" />
      </Link>
    </div>

    <div className="space-y-3">
      {signals.slice(0, 3).map(s => (
        <SignalCard key={s.id} signal={s} compact />
      ))}
    </div>
  </motion.div>
);
