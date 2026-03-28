import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { chatMessages } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Send, Plus, MessageSquare, Briefcase, TrendingUp, BarChart3, CircleDot } from "lucide-react";
import ReactMarkdown from "react-markdown";

const categories = [
  { label: "My Portfolio", icon: Briefcase },
  { label: "Market", icon: TrendingUp },
  { label: "IPOs", icon: BarChart3 },
  { label: "Mutual Funds", icon: CircleDot },
];

const pastChats = [
  { id: "1", preview: "Should I hold Zomato through Q1?", time: "Today" },
  { id: "2", preview: "What's driving NIFTY this week?", time: "Yesterday" },
  { id: "3", preview: "Explain my banking exposure risk", time: "2 days ago" },
];

const suggestedQuestions = [
  "What's driving NIFTY today?",
  "Explain my sector risk",
  "Any insider activity this week?",
];

const ChatPage = () => {
  const [input, setInput] = useState("");
  const [selectedChat, setSelectedChat] = useState("1");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Left panel */}
        <div className="hidden lg:block w-80 border-r border-border/50 p-4 space-y-4">
          <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> New Chat
          </button>

          <div className="space-y-1">
            {categories.map(c => (
              <button key={c.label} className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary flex items-center gap-2 transition-colors">
                <c.icon className="h-3.5 w-3.5" /> {c.label}
              </button>
            ))}
          </div>

          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Recent</p>
            <div className="space-y-1">
              {pastChats.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChat(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedChat === c.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  <p className="truncate">{c.preview}</p>
                  <p className="text-[10px] text-muted-foreground">{c.time}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - Active chat */}
        <div className="flex-1 flex flex-col">
          <div className="border-b border-border/50 px-4 py-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">M</span>
            </div>
            <span className="font-semibold text-sm">MarketMind AI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gain" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-2xl ${msg.role === "user"
                  ? "bg-primary/10 rounded-2xl rounded-br-md px-4 py-3"
                  : "space-y-2"
                }`}>
                  {msg.role === "assistant" && "steps" in msg && (
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      {msg.steps.map((step, j) => (
                        <span key={j} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground">
                          <span className="w-1 h-1 rounded-full bg-gain" /> {step}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={`text-sm ${msg.role === "assistant" ? "glass-card p-4" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary">M</span>
                        </div>
                        <span className="text-xs font-medium">MarketMind AI</span>
                      </div>
                    )}
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>

                  {msg.role === "assistant" && "sources" in msg && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.sources.map(src => (
                        <span key={src} className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] text-primary font-medium">{src}</span>
                      ))}
                      {"confidence" in msg && (
                        <span className="px-2 py-0.5 rounded-full bg-warn/10 text-[10px] text-warn font-medium">
                          {msg.confidence} confidence
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Suggested questions */}
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {suggestedQuestions.map(q => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="px-3 py-1.5 rounded-full bg-secondary text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-border/50 p-4">
            <div className="flex items-center gap-2 glass-card px-4 py-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask anything about markets, your portfolio, stocks..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
              <button className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
