import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useCountUp, formatCurrency } from "@/hooks/useCountUp";
import { JargonTerm } from "@/components/JargonTerm";
import { X, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

export const PortfolioSummary = () => {
  const { token } = useAuth();
  const [holdings, setHoldings] = useState<any[]>([]);
  const [liveData, setLiveData] = useState<Record<string, any>>({});

  const fetchPortfolio = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8000/api/v1/portfolio", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setHoldings(data.holdings || []);
      
      const live: Record<string, any> = {};
      await Promise.all((data.holdings || []).map(async (h: any) => {
        try {
          const fres = await fetch(`http://localhost:8000/api/v1/fundamentals?symbol=${h.symbol}`);
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

  const handleRemoveHolding = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await fetch(`http://localhost:8000/api/v1/portfolio/${symbol}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchPortfolio();
    } catch (e) {
      console.error(e);
    }
  };

  let totalValue = 0;
  let totalCost = 0;
  const pieData: any[] = [];

  holdings.forEach(h => {
    const live = liveData[h.symbol];
    const cp = live?.price || h.avg_price;
    const val = cp * h.qty;
    totalValue += val;
    totalCost += (h.avg_price * h.qty);
    pieData.push({ name: h.symbol, value: val });
  });

  const dayChange = totalValue - totalCost;
  const dayChangePct = totalCost > 0 ? (dayChange / totalCost) * 100 : 0;
  const animatedTotal = useCountUp(totalValue, 1000);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];
  const finalPieData = pieData.sort((a,b)=>b.value-a.value).map((d, i) => ({ ...d, color: colors[i % colors.length] }));

  return (
    <motion.div
      id="portfolio-summary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-5 relative flex flex-col h-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-muted-foreground">Your Portfolio</h3>
        <Link to="/portfolio" className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-full">
          Research & Add Stocks <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mb-4">
        <p className="text-2xl font-bold font-mono">{formatCurrency(totalValue > 0 ? animatedTotal: totalValue)}</p>
        <p className={`text-sm font-mono ${dayChange >= 0 ? "text-gain" : "text-loss"}`}>
          {dayChange >= 0 ? "+" : ""}{formatCurrency(dayChange)} ({dayChange >= 0 ? "+" : ""}{dayChangePct.toFixed(2)}%) P&L
        </p>
      </div>

      {totalValue > 0 && (
        <div className="flex items-center gap-4 mb-4">
          <div className="w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={finalPieData} dataKey="value" innerRadius={28} outerRadius={42} paddingAngle={3} stroke="none">
                  {finalPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-1 w-full max-h-24 overflow-y-auto pr-2">
            {finalPieData.map(s => (
              <div key={s.name} className="flex items-center justify-between text-xs w-full">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-muted-foreground truncate">{s.name}</span>
                </div>
                <span className="font-mono font-medium shrink-0 ml-2">{((s.value / totalValue) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 overflow-y-auto pr-1">
        {holdings.slice(0, 3).map(h => {
          const live = liveData[h.symbol];
          const cp = live?.price || h.avg_price;
          const pl = ((cp - h.avg_price) / h.avg_price) * 100;
          const positive = pl >= 0;
          return (
            <div key={h.symbol} className="flex items-center justify-between py-3 border-t border-border/50 px-2 rounded-lg group">
              <div className="overflow-hidden mr-2">
                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{h.symbol}</p>
                <p className="text-xs text-muted-foreground truncate">{h.qty} shares · avg {formatCurrency(h.avg_price)}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right shrink-0">
                  <p className="text-sm font-mono">{formatCurrency(cp * h.qty)}</p>
                  <p className={`text-xs font-mono ${positive ? "text-gain" : "text-loss"}`}>
                    <JargonTerm term="P&L">{positive ? "+" : ""}{pl.toFixed(1)}%</JargonTerm>
                  </p>
                </div>
                <button onClick={(e) => handleRemoveHolding(h.symbol, e)} className="text-muted-foreground p-1 hover:text-red-500 rounded-md hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
        {holdings.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No holdings yet. Search for a stock to track it!</p>}
      </div>
    </motion.div>
  );
};
