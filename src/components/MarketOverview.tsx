import { motion } from "framer-motion";
import { indices } from "@/lib/mock-data";
import { useCountUp, formatNumber } from "@/hooks/useCountUp";

const MiniSparkline = ({ data, positive }: { data: number[]; positive: boolean }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 60},${30 - ((v - min) / range) * 25}`).join(" ");

  return (
    <svg width="60" height="30" className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "hsl(160, 84%, 39%)" : "hsl(0, 84%, 60%)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const IndexPill = ({ index }: { index: typeof indices[0] }) => {
  const value = useCountUp(index.value, 1200, 2);
  const positive = index.change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card px-4 py-3 flex items-center gap-3 min-w-[200px]"
    >
      <div className="flex-1">
        <p className="text-xs text-muted-foreground font-medium">{index.name}</p>
        <p className="font-mono font-bold text-sm">{formatNumber(value)}</p>
        <p className={`text-xs font-mono ${positive ? "text-gain" : "text-loss"}`}>
          {positive ? "+" : ""}{index.change.toFixed(2)} ({positive ? "+" : ""}{index.changePct}%)
        </p>
      </div>
      <MiniSparkline data={index.sparkline} positive={positive} />
    </motion.div>
  );
};

export const MarketOverview = () => (
  <div id="market-overview" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {indices.map(idx => <IndexPill key={idx.name} index={idx} />)}
  </div>
);
