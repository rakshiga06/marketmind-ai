import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { portfolio } from "@/lib/mock-data";
import { useCountUp, formatCurrency } from "@/hooks/useCountUp";
import { JargonTerm } from "@/components/JargonTerm";
import { Plus } from "lucide-react";

export const PortfolioSummary = () => {
  const totalValue = useCountUp(portfolio.totalValue, 1400);
  const dayChange = useCountUp(portfolio.dayChange, 1200);

  return (
    <motion.div
      id="portfolio-summary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-muted-foreground">Your Portfolio</h3>
        <button className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="h-3 w-3" /> Add Holdings</button>
      </div>

      <div className="mb-4">
        <p className="text-2xl font-bold font-mono">{formatCurrency(totalValue)}</p>
        <p className="text-sm font-mono text-gain">
          +{formatCurrency(dayChange)} (+{portfolio.dayChangePct}%) today
        </p>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-24 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={portfolio.sectorAllocation} dataKey="value" innerRadius={28} outerRadius={42} paddingAngle={3} stroke="none">
                {portfolio.sectorAllocation.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1">
          {portfolio.sectorAllocation.map(s => (
            <div key={s.name} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              <span className="text-muted-foreground">{s.name}</span>
              <span className="font-mono font-medium">{s.value}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {portfolio.holdings.slice(0, 3).map(h => {
          const pl = ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100;
          const positive = pl >= 0;
          return (
            <div key={h.ticker} className="flex items-center justify-between py-1.5 border-t border-border/50">
              <div>
                <p className="text-sm font-semibold">{h.name}</p>
                <p className="text-xs text-muted-foreground">{h.qty} shares · avg {formatCurrency(h.avgPrice)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono">{formatCurrency(h.currentPrice * h.qty)}</p>
                <p className={`text-xs font-mono ${positive ? "text-gain" : "text-loss"}`}>
                  <JargonTerm term="P&L">{positive ? "+" : ""}{pl.toFixed(1)}%</JargonTerm>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
