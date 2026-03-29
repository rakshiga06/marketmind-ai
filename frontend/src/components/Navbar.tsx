import { Link, useLocation } from "react-router-dom";
import { Bell, Moon, Sun, Menu, X, LogOut, Check, ExternalLink } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";
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
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifs = async () => {
      if (isLanding) return;
      try {
        const res = await fetch("http://localhost:8000/api/v1/radar/signals");
        const data = await res.json();
        const top5 = (data.signals || []).slice(0, 5);
        setNotifications(top5);
        setUnreadCount(top5.length);
      } catch (e) {
        console.error("Failed to fetch notifications:", e);
      }
    };
    fetchNotifs();
  }, [isLanding]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-destructive flex items-center justify-center text-[8px] font-bold text-white border-2 border-background">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 mt-2 w-80 glass-card border border-border/50 rounded-xl shadow-xl overflow-hidden z-50 origin-top-right"
                    >
                      <div className="p-3 border-b border-border/50 bg-secondary/30 flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={() => setUnreadCount(0)} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                            <Check className="w-3 h-3" /> Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto custom-scrollbar flex flex-col">
                        {notifications.length === 0 ? (
                           <div className="p-4 text-center text-xs text-muted-foreground">No new alerts</div>
                        ) : (
                          notifications.map((n, i) => (
                            <div key={n.id || i} className="p-3 border-b border-border/10 hover:bg-secondary/20 transition-colors flex gap-3 relative group">
                              {(unreadCount > 0 && i < unreadCount) && (
                                <div className="absolute left-2 top-4 w-1.5 h-1.5 rounded-full bg-primary" />
                              )}
                              <div className={`flex-1 ${unreadCount > 0 && i < unreadCount ? 'pl-2' : ''}`}>
                                <p className="text-sm font-semibold text-foreground/90">{n.ticker} <span className="text-xs font-normal text-muted-foreground ml-1">— {n.headline}</span></p>
                                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                  {n.timestamp}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <Link to="/radar" onClick={() => setShowNotifications(false)} className="block p-3 text-center text-xs font-semibold text-primary hover:bg-secondary/30 transition-colors border-t border-border/50 bg-background/50">
                        View all alerts <ExternalLink className="w-3 h-3 inline ml-1 align-text-bottom" />
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
