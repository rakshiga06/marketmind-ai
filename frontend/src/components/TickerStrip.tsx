import { motion } from "framer-motion";
import { stocks } from "@/lib/mock-data";

const tickerData = stocks.map(s => ({
  ticker: s.ticker,
  change: s.changePct,
}));

const doubled = [...tickerData, ...tickerData];

export const TickerStrip = () => (
  <div className="w-full overflow-hidden border-y border-border/50 bg-secondary/30 py-2">
    <div className="ticker-scroll flex gap-8 whitespace-nowrap w-max">
      {doubled.map((item, i) => (
        <span key={i} className="flex items-center gap-2 text-sm">
          <span className="font-mono font-semibold">{item.ticker}</span>
          <span className={item.change >= 0 ? "text-gain font-mono" : "text-loss font-mono"}>
            {item.change >= 0 ? "+" : ""}{item.change}%
          </span>
        </span>
      ))}
    </div>
  </div>
);
