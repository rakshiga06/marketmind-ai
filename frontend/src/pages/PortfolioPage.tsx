import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Info, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

export default function PortfolioPage() {
  const { token } = useAuth();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  
  // Holding form state
  const [qty, setQty] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Detailed Metrics State
  const [selectedStockForDetails, setSelectedStockForDetails] = useState<any | null>(null);
  const [stockInsights, setStockInsights] = useState<any | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Search effect for autocomplete
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/search?q=${searchQuery}`);
        const data = await res.json();
        if (data.results) setSearchResults(data.results);
      } catch (e) {
        console.error(e);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleAddHolding = async () => {
    if (!selectedResult || !qty || !avgPrice || !token) return;
    setIsAdding(true);
    try {
      await fetch("http://127.0.0.1:8000/api/v1/portfolio/add", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol: selectedResult.symbol,
          name: selectedResult.name,
          qty: parseFloat(qty),
          avg_price: parseFloat(avgPrice)
        })
      });
      setIsAdding(false);
      setSuccessMessage(`Successfully added ${selectedResult.symbol} to your portfolio!`);
      setTimeout(() => setSuccessMessage(""), 3000);
      setSelectedResult(null);
      setSearchQuery("");
      setQty("");
      setAvgPrice("");
      setSelectedStockForDetails(null);
    } catch (e) {
      console.error(e);
      setIsAdding(false);
    }
  };

  const openStockDetails = async (symbol: string) => {
    setInsightsLoading(true);
    setStockInsights(null);
    try {
      // Fetch Fundamentals
      const fres = await fetch(`http://127.0.0.1:8000/api/v1/fundamentals?symbol=${symbol}`);
      const fdata = await fres.json();
      setSelectedStockForDetails({ symbol, ...fdata });

      // Fetch AI Insights
      const res = await fetch(`http://127.0.0.1:8000/api/v1/portfolio/insights/${symbol}`);
      const data = await res.json();
      setStockInsights(data);
    } catch (e) {
      console.error(e);
    } finally {
      setInsightsLoading(false);
    }
  };

  const safeNum = (val: any, suffix: string = "", isCurrency: boolean = false, divisor: number = 1) => {
    if (val === null || val === undefined || isNaN(val)) return "N/A";
    const num = val / divisor;
    return (isCurrency ? `₹ ${num.toFixed(2)}` : `${num.toFixed(2)}${suffix}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Research & Add Stocks</h1>
            <p className="text-muted-foreground mt-1">Search for a company, review fundamental metrics and AI insights, and add it to your portfolio.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="glass-card p-6 rounded-2xl border border-border/50">
              <h3 className="font-semibold mb-4">Stock Search</h3>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search ticker (e.g. RELIANCE.NS)..." 
                  value={searchQuery} 
                  onChange={e => {setSearchQuery(e.target.value); setSelectedResult(null);}} 
                  className="w-full bg-secondary rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all" 
                />
                
                <AnimatePresence>
                  {searchQuery && !selectedResult && searchResults.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-xl shadow-2xl max-h-60 overflow-y-auto z-20 overflow-hidden">
                      {searchResults.map(s => (
                        <button 
                          key={s.symbol}    
                          onClick={() => { 
                            setSelectedResult(s); 
                            setSearchQuery(s.symbol); 
                            openStockDetails(s.symbol);
                          }} 
                          className="w-full text-left px-4 py-3 hover:bg-secondary text-sm border-b border-border/50 last:border-0 flex justify-between items-center transition-colors"
                        >
                          <span className="font-bold text-primary">{s.symbol}</span>
                          <span className="text-xs text-muted-foreground truncate ml-3 max-w-[60%]">{s.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {selectedResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-4 border-t border-border/50">
                  <h4 className="font-semibold text-sm">Add Transaction</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                      <input type="number" step="any" value={qty} onChange={e => setQty(e.target.value)} className="w-full bg-secondary border border-transparent focus:border-primary/30 rounded-lg px-3 py-2 text-sm outline-none transition-colors" placeholder="e.g. 50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Average Price (₹)</label>
                      <input type="number" step="any" value={avgPrice} onChange={e => setAvgPrice(e.target.value)} className="w-full bg-secondary border border-transparent focus:border-primary/30 rounded-lg px-3 py-2 text-sm outline-none transition-colors" placeholder="e.g. 1450.00" />
                    </div>
                  </div>

                  <button 
                    onClick={handleAddHolding} 
                    disabled={!selectedResult || !qty || !avgPrice || isAdding} 
                    className="w-full flex justify-center items-center gap-2 bg-primary text-primary-foreground font-semibold rounded-xl py-3 text-sm disabled:opacity-50 hover:bg-primary/90 transition-all mt-6 shadow-lg shadow-primary/20"
                  >
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Portfolio"}
                  </button>
                </motion.div>
              )}

              <AnimatePresence>
                {successMessage && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 p-3 bg-gain/10 border border-gain/20 text-gain text-sm rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> {successMessage}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

          <div className="md:col-span-7">
            {insightsLoading ? (
              <div className="glass-card p-12 rounded-2xl border border-border/50 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <h3 className="font-semibold">MarketMind is Analyzing...</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">Fetching live fundamentals and generating AI pros & cons for {selectedResult?.symbol}.</p>
              </div>
            ) : selectedStockForDetails ? (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl border border-border/50 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-border/50 bg-secondary/10">
                  <h2 className="text-2xl font-bold tracking-tight">{selectedStockForDetails.symbol}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selectedResult?.name}</p>
                </div>
                
                <div className="p-6 space-y-8">
                  {/* Metrics Grid */}
                  <div>
                    <h4 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Key Fundamentals</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-secondary/40 p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Market Cap</p>
                        <p className="text-sm font-bold">{safeNum(selectedStockForDetails.market_cap, " Cr", true, 10000000)}</p>
                      </div>
                      <div className="bg-secondary/40 p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Current Price</p>
                        <p className="text-sm font-bold">{safeNum(selectedStockForDetails.price, "", true)}</p>
                      </div>
                      <div className="bg-secondary/40 p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Stock P/E</p>
                        <p className="text-sm font-bold">{safeNum(selectedStockForDetails.pe_ratio)}</p>
                      </div>
                      <div className="bg-secondary/40 p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Book Value</p>
                        <p className="text-sm font-bold">{safeNum(selectedStockForDetails.book_value, "", true)}</p>
                      </div>
                      <div className="bg-secondary/40 p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Dividend Yield</p>
                        <p className="text-sm font-bold">{safeNum(selectedStockForDetails.dividend_yield ? selectedStockForDetails.dividend_yield * 100 : null, " %")}</p>
                      </div>
                      <div className="bg-secondary/40 p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground font-medium mb-1">ROCE</p>
                        <p className="text-sm font-bold">{safeNum(selectedStockForDetails.roce ? selectedStockForDetails.roce * 100 : null, " %")}</p>
                      </div>
                      <div className="bg-secondary/40 p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground font-medium mb-1">ROE</p>
                        <p className="text-sm font-bold">{safeNum(selectedStockForDetails.roe ? selectedStockForDetails.roe * 100 : null, " %")}</p>
                      </div>
                      <div className="bg-secondary/40 p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground font-medium mb-1">52W High / Low</p>
                        <p className="text-sm font-bold">{safeNum(selectedStockForDetails.high_52w)} / {safeNum(selectedStockForDetails.low_52w)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financials & Balance Sheet */}
                  {selectedStockForDetails.financials && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Profit/Loss & Balance Sheet</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="bg-secondary/40 p-4 rounded-xl border-l-[3px] border-l-blue-500">
                           <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                           <p className="font-bold text-sm text-foreground">{safeNum(selectedStockForDetails.financials?.total_revenue, " Cr", true, 10000000)}</p>
                        </div>
                        <div className="bg-secondary/40 p-4 rounded-xl border-l-[3px] border-l-purple-500">
                           <p className="text-xs text-muted-foreground mb-1">Total Assets</p>
                           <p className="font-bold text-sm text-foreground">{safeNum(selectedStockForDetails.financials?.total_assets, " Cr", true, 10000000)}</p>
                        </div>
                        <div className="bg-secondary/40 p-4 rounded-xl border-l-[3px] border-l-amber-500">
                           <p className="text-xs text-muted-foreground mb-1">EBITDA</p>
                           <p className="font-bold text-sm text-foreground">{safeNum(selectedStockForDetails.financials?.ebitda, " Cr", true, 10000000)}</p>
                        </div>
                        <div className="bg-secondary/40 p-4 rounded-xl border-l-[3px] border-l-green-500">
                           <p className="text-xs text-muted-foreground mb-1">Net Income</p>
                           <p className="font-bold text-sm text-foreground">{safeNum(selectedStockForDetails.financials?.net_income, " Cr", true, 10000000)}</p>
                        </div>
                        <div className="bg-secondary/40 p-4 rounded-xl border-l-[3px] border-l-teal-500">
                           <p className="text-xs text-muted-foreground mb-1">Total Cash</p>
                           <p className="font-bold text-sm text-foreground">{safeNum(selectedStockForDetails.financials?.total_cash, " Cr", true, 10000000)}</p>
                        </div>
                        <div className="bg-secondary/40 p-4 rounded-xl border-l-[3px] border-l-red-500">
                           <p className="text-xs text-muted-foreground mb-1">Total Debt</p>
                           <p className="font-bold text-sm text-foreground">{safeNum(selectedStockForDetails.financials?.total_debt, " Cr", true, 10000000)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Advanced Ratios */}
                  {selectedStockForDetails.ratios && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Advanced Ratios</h4>
                      <div className="flex flex-wrap gap-2">
                        <div className="px-3 py-2 bg-secondary/30 rounded-lg border border-border/50 min-w-[120px]">
                           <span className="text-[11px] text-muted-foreground block mb-0.5">Current Ratio</span>
                           <span className="text-sm font-semibold">{safeNum(selectedStockForDetails.ratios?.current_ratio, "x")}</span>
                        </div>
                        <div className="px-3 py-2 bg-secondary/30 rounded-lg border border-border/50 min-w-[120px]">
                           <span className="text-[11px] text-muted-foreground block mb-0.5">Quick Ratio</span>
                           <span className="text-sm font-semibold">{safeNum(selectedStockForDetails.ratios?.quick_ratio, "x")}</span>
                        </div>
                        <div className="px-3 py-2 bg-secondary/30 rounded-lg border border-border/50 min-w-[120px]">
                           <span className="text-[11px] text-muted-foreground block mb-0.5">Debt to Equity</span>
                           <span className="text-sm font-semibold">{safeNum(selectedStockForDetails.ratios?.debt_to_equity, "%", false, 0.01)}</span>
                        </div>
                        <div className="px-3 py-2 bg-secondary/30 rounded-lg border border-border/50 min-w-[120px]">
                           <span className="text-[11px] text-muted-foreground block mb-0.5">Gross Margin</span>
                           <span className="text-sm font-semibold">{safeNum(selectedStockForDetails.ratios?.gross_margins, "%", false, 0.01)}</span>
                        </div>
                        <div className="px-3 py-2 bg-secondary/30 rounded-lg border border-border/50 min-w-[120px]">
                           <span className="text-[11px] text-muted-foreground block mb-0.5">Profit Margin</span>
                           <span className="text-sm font-semibold">{safeNum(selectedStockForDetails.ratios?.profit_margins, "%", false, 0.01)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Pros and Cons */}
                  {stockInsights && (
                    <div>
                      <h4 className="text-sm font-semibold mb-4 text-primary uppercase tracking-wider flex items-center gap-2">
                        <Info className="w-4 h-4" /> MarketMind Intelligence
                      </h4>
                      <div className="space-y-4">
                        <p className="text-sm leading-relaxed p-5 bg-primary/5 rounded-xl border border-primary/20 italic text-foreground/90 shadow-inner">
                          {stockInsights.summary}
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="p-5 rounded-xl border border-gain/30 bg-gain/5 shadow-sm hover:shadow-md transition-shadow">
                            <h5 className="font-bold text-gain tracking-wider text-xs mb-4">PROS</h5>
                            <ul className="space-y-3 text-sm text-foreground/80">
                              {stockInsights.pros?.map((pro: string, idx: number) => (
                                <li key={idx} className="flex gap-2 items-start"><span className="text-gain text-lg leading-none shrink-0">•</span> <span>{pro}</span></li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-5 rounded-xl border border-loss/30 bg-loss/5 shadow-sm hover:shadow-md transition-shadow">
                            <h5 className="font-bold text-loss tracking-wider text-xs mb-4">CONS</h5>
                            <ul className="space-y-3 text-sm text-foreground/80">
                              {stockInsights.cons?.map((con: string, idx: number) => (
                                <li key={idx} className="flex gap-2 items-start"><span className="text-loss text-lg leading-none shrink-0">•</span> <span>{con}</span></li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Peer Comparison Segment Added by user request */}
                        {stockInsights.peers && stockInsights.peers.length > 0 && (
                          <div className="mt-4 p-5 rounded-xl border border-primary/20 bg-primary/5 shadow-sm w-full">
                            <h5 className="font-bold text-primary tracking-wider text-xs mb-3">SECTOR PEERS</h5>
                            <div className="flex flex-wrap gap-2">
                              {stockInsights.peers.map((peer: string, idx: number) => (
                                <span key={idx} className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-medium text-foreground/80 shadow-sm">{peer}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="glass-card rounded-2xl border border-border/50 flex flex-col items-center justify-center text-center h-full min-h-[400px] border-dashed bg-secondary/10">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground">No Stock Selected</h3>
                <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">Search and select a stock ticker to view full fundamental metrics and AI insights.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
