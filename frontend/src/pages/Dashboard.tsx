import { Navbar } from "@/components/Navbar";
import { MarketOverview } from "@/components/MarketOverview";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { OpportunityRadar } from "@/components/OpportunityRadar";
import { AlertFeed } from "@/components/AlertFeed";
import { ChartWidget } from "@/components/ChartWidget";
import { ChatWidget } from "@/components/ChatWidget";
import { OnboardingTooltips } from "@/components/OnboardingTooltips";
import { motion } from "framer-motion";

const Dashboard = () => (
  <div className="min-h-screen">
    <Navbar />
    <OnboardingTooltips />
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <MarketOverview />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PortfolioSummary limit={3} />
          <ChartWidget />
        </div>
        <div className="lg:col-span-3 space-y-6">
          <AlertFeed />
        </div>
      </div>


      <OpportunityRadar />

      <ChatWidget />
    </div>
  </div>
);

export default Dashboard;
