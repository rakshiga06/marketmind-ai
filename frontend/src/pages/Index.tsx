import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { TickerStrip } from "@/components/TickerStrip";
import { Radar, BarChart3, MessageSquare, Play, ArrowRight, Users } from "lucide-react";

const features = [
  { icon: Radar, title: "Opportunity Radar", desc: "AI detects insider trades, bulk deals, and filings — explains them in plain English." },
  { icon: BarChart3, title: "Chart Intelligence", desc: "Automatic pattern recognition with backtested success rates on Indian stocks." },
  { icon: MessageSquare, title: "AI Chat", desc: "Ask anything about your portfolio. Gets answers from real filings and data." },

];

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <TickerStrip />

    {/* Hero */}
    <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-5 tracking-tight">
          Your personal stock market analyst.{" "}
          <span className="text-primary">Powered by AI.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          India's first AI that reads filings, spots patterns, and answers your portfolio questions — in plain English.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link to="/dashboard" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Link>
          <button className="px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-secondary transition-colors flex items-center gap-2">
            <Play className="h-4 w-4" /> Watch Demo
          </button>
        </div>
      </motion.div>
    </section>

    {/* Features */}
    <section className="max-w-5xl mx-auto px-4 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="glass-card-hover p-6"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Social proof */}
    <section className="border-t border-border/50 py-10">
      <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-4">
        <div className="flex -space-x-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center">
              <Users className="h-3 w-3 text-muted-foreground" />
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Trusted by <span className="font-semibold text-foreground">10,000+</span> Indian investors</p>
      </div>
    </section>

    {/* Footer */}
    <footer className="border-t border-border/50 py-8">
      <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">M</span>
          </div>
          <span className="font-bold text-sm">MarketMind</span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <Link to="/radar" className="hover:text-foreground transition-colors">Radar</Link>
          <Link to="/charts" className="hover:text-foreground transition-colors">Charts</Link>
          <Link to="/chat" className="hover:text-foreground transition-colors">Chat</Link>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 MarketMind. Not financial advice.</p>
      </div>
    </footer>
  </div>
);

export default Index;
