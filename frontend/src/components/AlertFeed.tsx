import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { BellRing, ShieldAlert, Sparkles, TrendingUp, TrendingDown, Clock } from "lucide-react";

interface Alert {
  id: string;
  symbol: string;
  type: string;
  priority_score: number;
  is_user_holding: boolean;
  trigger_date: string;
  ai_context_analysis: string;
}

export function AlertFeed() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/alerts/feed", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();
        setAlerts(data.alerts || []);
      } catch (e) {
        console.error("Failed to fetch alerts:", e);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchAlerts();
  }, [token]);

  if (!token) return null;

  return (
    <div className="glass-card rounded-2xl border border-border/50 overflow-hidden flex flex-col h-[600px] shadow-lg">
      <div className="p-4 border-b border-border/50 bg-secondary/30 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BellRing className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold leading-none">Intelligence Feed</h3>
            <p className="text-xs text-muted-foreground mt-1">AI Context & Priority Alerts</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-1 rounded">
            <Sparkles className="w-3 h-3" /> Live
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-sm">Scanning market signals...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-dashed rounded-xl border-border/50 bg-secondary/10">
            <ShieldAlert className="w-8 h-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-foreground/80 font-medium">No Priority Alerts</p>
            <p className="text-xs text-muted-foreground mt-1">Your portfolio is stable. No severe anomalies detected.</p>
          </div>
        ) : (
          <AnimatePresence>
            {alerts.map((alert, idx) => (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-5 rounded-xl border ${alert.is_user_holding ? 'border-primary/40 bg-primary/5' : 'border-border/50 bg-secondary/10'} hover:shadow-md transition-shadow`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base tracking-tight">{alert.symbol}</span>
                    {alert.is_user_holding && (
                      <span className="text-[10px] uppercase font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded border border-primary/20">Portfolio Match</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 bg-background px-2 py-1 rounded-md border shadow-sm">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">{alert.type}</span>
                    <div className="w-1 h-1 rounded-full bg-border" />
                    <span className={`text-xs font-bold ${alert.priority_score >= 8 ? 'text-loss' : 'text-primary'}`}>
                      {alert.priority_score}/10
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-background/50 rounded-lg border text-sm leading-relaxed whitespace-pre-line text-foreground/90">
                    {alert.ai_context_analysis}
                  </div>
                  
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {alert.trigger_date}
                    </span>
                    <button className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1">
                      View Details <TrendingUp className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
