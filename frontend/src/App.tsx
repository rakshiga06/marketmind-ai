import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const RadarPage = lazy(() => import("./pages/RadarPage"));
const ChartsPage = lazy(() => import("./pages/ChartsPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const VideosPage = lazy(() => import("./pages/VideosPage"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 rounded-lg bg-primary animate-pulse flex items-center justify-center">
      <span className="font-bold text-primary-foreground text-sm">M</span>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/radar" element={<RadarPage />} />
              <Route path="/charts" element={<ChartsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/videos" element={<VideosPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
