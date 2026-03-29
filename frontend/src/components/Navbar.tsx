import { Link, useLocation } from "react-router-dom";
import { Bell, Moon, Sun, Menu, X, LogOut } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Radar", path: "/radar" },
  { label: "Charts", path: "/charts" },
  { label: "Chat", path: "/chat" },
];

export const Navbar = () => {
  const location = useLocation();
  const { beginnerMode, setBeginnerMode, theme, setTheme } = useApp();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLanding = location.pathname === "/";

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="font-bold text-primary-foreground text-sm">M</span>
          </div>
          <span className="font-bold text-lg tracking-tight">MarketMind</span>
        </Link>

        {!isLanding && (
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <Link
                key={l.path}
                to={l.path}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === l.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {!isLanding && (
            <>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gain/10 border border-gain/20">
                <span className="w-1.5 h-1.5 rounded-full bg-gain animate-pulse-dot" />
                <span className="text-xs font-medium text-gain">MARKET OPEN</span>
              </div>

              <div id="beginner-toggle" className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary cursor-pointer" onClick={() => setBeginnerMode(!beginnerMode)}>
                <span className={`text-xs font-medium ${beginnerMode ? "text-primary" : "text-muted-foreground"}`}>
                  Beginner {beginnerMode ? "ON" : "OFF"}
                </span>
              </div>

              <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-loss" />
              </button>
            </>
          )}

          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            {theme === "dark" ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
          </button>

          {!isLanding && user && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{user.email ? user.email.charAt(0).toUpperCase() : "U"}</span>
              </div>
              <button onClick={logout} className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors" title="Log out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}

          {!isLanding && (
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-secondary">
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && !isLanding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-1">
              {navLinks.map(l => (
                <Link
                  key={l.path}
                  to={l.path}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    location.pathname === l.path ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
