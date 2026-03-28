import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SignalCard } from "@/components/SignalCard";
import { signals } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

const filters = ["All Signals", "Insider Trades", "Bulk Deals", "Filings", "Earnings", "Regulatory"];

const RadarPage = () => {
  const [activeFilter, setActiveFilter] = useState("All Signals");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = signals.filter(s =>
    searchQuery === "" || s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Opportunity Radar</h1>
          <p className="text-sm text-muted-foreground mb-6">AI-detected signals from insider trades, bulk deals, and regulatory filings.</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-2 flex-wrap flex-1">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeFilter === f ? "bg-primary/10 text-primary border border-primary/30" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-1.5 min-w-[200px]">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by stock or sector..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <SignalCard signal={s} />
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg font-semibold mb-2">No signals found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or check back after market hours.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RadarPage;
