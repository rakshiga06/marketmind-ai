import { useState } from "react";
import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/context/AppContext";

interface TooltipStep {
  target: string;
  title: string;
  description: string;
}

const steps: TooltipStep[] = [
  { target: "market-overview", title: "Market Overview", description: "See live indices — NIFTY, SENSEX, and more — at a glance. Green means up, red means down." },
  { target: "portfolio-summary", title: "Your Portfolio", description: "Track your holdings, see today's P&L, and understand your sector allocation." },
  { target: "opportunity-radar", title: "Opportunity Radar", description: "AI-powered signals from insider trades, bulk deals, and filings — explained in plain English." },
  { target: "chat-widget", title: "Ask MarketMind", description: "Ask any question about your portfolio or the market. Our AI reads filings and data so you don't have to." },
  { target: "beginner-toggle", title: "Beginner Mode", description: "Keep this ON to see jargon explained in simple language. You can turn it off anytime." },
];

export const OnboardingTooltips = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);
  const { beginnerMode } = useApp();

  useEffect(() => {
    const seen = localStorage.getItem("mm-onboarding-seen");
    if (!seen && beginnerMode) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [beginnerMode]);

  const dismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem("mm-onboarding-seen", "true");
  }, []);

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else dismiss();
  };

  if (!show) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm flex items-center justify-center"
        onClick={dismiss}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="glass-card p-6 max-w-sm mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-primary">{currentStep + 1} of {steps.length}</span>
            <button onClick={dismiss} className="text-xs text-muted-foreground hover:text-foreground">Skip tour</button>
          </div>
          <h3 className="text-lg font-bold mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {steps.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= currentStep ? "bg-primary" : "bg-secondary"}`} />
              ))}
            </div>
            <button onClick={next} className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              {currentStep < steps.length - 1 ? "Next →" : "Got it!"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
