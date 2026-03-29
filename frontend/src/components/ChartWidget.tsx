import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, TrendingUp } from "lucide-react";
import { JargonTerm } from "./JargonTerm";
import { createChart, CandlestickSeries, ColorType, IChartApi } from "lightweight-charts";
import { useAuth } from "@/context/AuthContext";

export const ChartWidget = () => {
  const { token } = useAuth();
  const [discovery, setDiscovery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Get Top Holding
        let symbol = "RELIANCE"; // Default fallback
        if (token) {
          const pRes = await fetch("http://127.0.0.1:8000/api/v1/portfolio", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const pData = await pRes.json();
          if (pData.holdings && pData.holdings.length > 0) {
            symbol = pData.holdings[0].symbol;
          }
        }

        // 2. Fetch Discovery & Chart Data
        const [dRes, sRes] = await Promise.all([
          fetch(`http://127.0.0.1:8000/api/v1/patterns/discovery/${symbol}`),
          fetch(`http://127.0.0.1:8000/api/v1/stockdata?symbol=${symbol}&timeframe=1M`)
        ]);

        if (dRes.ok) setDiscovery(await dRes.json());
        
        if (sRes.ok && chartContainerRef.current) {
          const sData = await sRes.json();
          renderChart(sData.data);
        }
      } catch (e) {
        console.error("Dashboard chart error:", e);
      } finally {
        setLoading(false);
      }
    };

    const renderChart = (data: any[]) => {
      if (!chartContainerRef.current) return;
      if (chartRef.current) chartRef.current.remove();

      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 120, // Compact height for widget
        layout: { 
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#A3A3A3',
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
        },
        timeScale: { visible: false }, // Hide time for compactness
        rightPriceScale: { visible: false }, // Hide price for compactness
        handleScroll: false,
        handleScale: false,
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10B981', downColor: '#EF4444', 
        borderVisible: false,
        wickUpColor: '#10B981', wickDownColor: '#EF4444',
      });

      candleSeries.setData(data.map((d: any) => ({
        time: d.time, open: d.open, high: d.high, low: d.low, close: d.close
      })));

      chartRef.current = chart;
    };

    fetchData();

    return () => {
      if (chartRef.current) chartRef.current.remove();
    };
  }, [token]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-5 border-l-4 border-primary shadow-lg shadow-primary/5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Pattern Intel</h3>
        </div>
        <Link to="/charts" className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-bold uppercase tracking-widest">
          Analysis Hub <ChevronRight className="h-2.5 w-2.5" />
        </Link>
      </div>

      <div className="relative mb-3 h-[120px] rounded-lg overflow-hidden bg-secondary/10 group">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10 font-mono text-[10px] text-muted-foreground">
            SCANNING HARMONICS...
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-background/60 backdrop-blur-md text-[9px] font-mono text-muted-foreground border border-border/50 uppercase">
          {discovery?.symbol || "RELIANCE"} 1M
        </div>
      </div>

      {discovery ? (
        <div className="space-y-2">
           <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold ring-1 ring-primary/20">
               <JargonTerm term={discovery.pattern_name}>{discovery.pattern_name}</JargonTerm>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">Confidence: <span className="text-gain font-mono">{discovery.confidence}%</span></span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 italic">
            "{discovery.explanation}"
          </p>
          <div className="flex items-center gap-3 pt-1 border-t border-border/10">
            <span className="text-[11px] font-mono text-gain font-bold">{discovery.win_rate}% success</span>
            <span className="text-[11px] font-mono text-muted-foreground">{discovery.found_count} FOUND</span>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-xs text-muted-foreground">Scanning {discovery?.symbol || "RELIANCE"} history...</p>
        </div>
      )}
    </motion.div>
  );
};
