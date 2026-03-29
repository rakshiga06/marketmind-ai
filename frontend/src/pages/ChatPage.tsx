import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { Send, Plus, Briefcase, TrendingUp, BarChart3, CircleDot } from "lucide-react";
import ReactMarkdown from "react-markdown";

const categories = [
  { label: "My Portfolio", icon: Briefcase },
  { label: "Market", icon: TrendingUp },
  { label: "IPOs", icon: BarChart3 },
  { label: "Mutual Funds", icon: CircleDot },
];

const API_BASE = "http://127.0.0.1:8000/api/chat";
const USER_ID = 1;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: string[];
  sources?: string[];
  confidence?: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

const suggestedQuestions = [
  "What's driving NIFTY today?",
  "Explain my sector risk",
  "Any insider activity this week?",
];

const ChatPage = () => {
  const [input, setInput] = useState("");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [pastChats, setPastChats] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Fetch History Sidebar
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history/${USER_ID}`);
      const data = await res.json();
      setPastChats(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Fetch specific conversation
  useEffect(() => {
    const fetchConversation = async () => {
      if (!selectedChat) {
        setMessages([]);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/conversation/${selectedChat}`);
        const data = await res.json();
        const formattedMessages = data.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.sources,
          steps: m.tools_used
        }));
        setMessages(formattedMessages);
      } catch (e) {
        console.error(e);
      }
    };
    fetchConversation();
  }, [selectedChat]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          message: text,
          conversation_id: selectedChat,
        }),
      });

      const data = await res.json();
      
      if (!selectedChat && data.conversation_id) {
        setSelectedChat(data.conversation_id);
        fetchHistory(); // refresh sidebar
      }

      const assistantMsg: Message = {
        id: Date.now().toString() + "a",
        role: "assistant",
        content: data.reply,
        sources: data.sources,
        steps: data.tools_used
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString() + "e", role: "assistant", content: "Error connecting to AI service." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Left panel */}
        <div className="hidden lg:block w-80 border-r border-border/50 p-4 space-y-4">
          <button 
            onClick={() => { setSelectedChat(null); setMessages([]); }}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
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
            <p className="text-xs text-muted-foreground font-medium mb-2 mt-4">Recent</p>
            <div className="space-y-1 overflow-y-auto max-h-[40vh]">
              {pastChats.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChat(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedChat === c.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  <p className="truncate block pr-2 text-foreground font-medium mb-1">{c.title || "New Chat"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - Active chat */}
        <div className="flex-1 flex flex-col relative h-[calc(100vh-64px)] overflow-hidden">
          <div className="border-b border-border/50 px-4 py-3 flex items-center gap-2 bg-background/80 backdrop-blur z-10 w-full absolute top-0">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">M</span>
            </div>
            <span className="font-semibold text-sm">MarketMind AI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 mt-14 mb-24">
            {messages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center opacity-70">
                  <div className="w-12 h-12 rounded-full bg-primary/20 mb-4 flex items-center justify-center text-primary">
                    <TrendingUp />
                  </div>
                  <h3 className="text-lg font-medium mb-2">How can I help you today?</h3>
                  <p className="text-sm text-muted-foreground max-w-sm text-center mb-6">Ask about your portfolio sectors, technical patterns for a stock, or live market data.</p>
                  
                  <div className="flex gap-2 flex-wrap justify-center max-w-lg">
                    {suggestedQuestions.map(q => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        className="px-4 py-2 rounded-full border border-border bg-secondary/30 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
               </div>
            ) : (
              messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-xl lg:max-w-2xl text-sm ${msg.role === "user"
                  ? "bg-primary/20 rounded-2xl rounded-br-sm px-4 py-3 border border-primary/20"
                  : "space-y-2 bg-secondary/30 rounded-2xl rounded-tl-sm px-5 py-4 border border-border/50"
                }`}>
                  {msg.role === "assistant" && msg.steps && msg.steps.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3 border-b border-border/50 pb-2">
                      {msg.steps.map((step, j) => (
                        <span key={j} className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-background/50 border border-border text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {step} RUN
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={`${msg.role === "assistant" ? "" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary">M</span>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-widest text-primary">MarketMind</span>
                      </div>
                    )}
                    <div className="prose prose-sm prose-invert max-w-none leading-relaxed text-foreground/90">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>

                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-border/50">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider w-full mb-1">Citations</span>
                      {msg.sources.map(src => (
                        <span key={src} className="px-2.5 py-1 rounded bg-background border border-border text-[10px] text-muted-foreground font-medium shadow-sm flex items-center gap-1">
                          <CircleDot className="w-2.5 h-2.5 text-blue-400" />
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )))}
            
            {isLoading && (
               <div className="flex justify-start">
                 <div className="bg-secondary/30 rounded-2xl rounded-tl-sm px-5 py-3 border border-border/50">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-background via-background to-transparent z-10 pt-10">
            <div className="flex items-center gap-2 bg-background border border-border/60 shadow-lg px-4 py-3 rounded-2xl max-w-3xl mx-auto focus-within:border-primary/50 transition-colors">
              <input
                type="text"
                value={input}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask anything about markets, your portfolio, stocks..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 w-full"
                disabled={isLoading}
              />
              <button 
                onClick={() => handleSend(input)}
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 disabled:bg-secondary disabled:text-muted-foreground hover:opacity-90 transition-all shadow-sm"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="text-center mt-2 max-w-3xl mx-auto">
               <span className="text-[10px] text-muted-foreground">MarketMind AI can make mistakes. Verify critical financial information before trading.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
