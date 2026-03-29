"use client";

import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from '../../components/chat/MessageBubble';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface Message {
  id: string | number;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  tools_used?: string[];
  created_at?: string;
}

const USER_ID = 1; // Used for prototype
const API_BASE = 'http://localhost:8000/api/chat'; // Assuming FastAPI runs here

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested questions
  const suggestedQuestions = [
    "Am I too concentrated in any sector?",
    "What is the radar flagging this week?",
    "Compare TCS vs Infosys for 6 months",
    "How will an RBI rate cut affect my portfolio?"
  ];

  // Fetch conversation history
  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/history/${USER_ID}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConvId) {
        setMessages([]);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/conversation/${activeConvId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };
    fetchMessages();
  }, [activeConvId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text: string = inputValue) => {
    if (!text.trim()) return;
    
    // Add optimistic user message
    const newMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: USER_ID,
          message: text,
          conversation_id: activeConvId || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // If it was a new conversation, set active ID and refresh sidebar
        if (!activeConvId && data.conversation_id) {
          setActiveConvId(data.conversation_id);
          fetchConversations();
        }
        
        // Add assistant response
        setMessages((prev) => [
          ...prev, 
          {
            id: Date.now() + 1,
            role: 'assistant',
            content: data.reply,
            sources: data.sources,
            tools_used: data.tools_used,
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR */}
      <div className="w-[260px] flex-shrink-0 bg-gray-950 border-r border-gray-800 flex flex-col h-full">
        <div className="p-4">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium shadow-sm transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 mt-2">
          {conversations.length === 0 ? (
            <p className="text-gray-500 text-sm text-center mt-4">No past conversations</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left px-3 py-3 rounded-lg text-sm truncate transition-colors ${
                  activeConvId === conv.id 
                    ? 'bg-gray-800 text-emerald-400 border border-emerald-500/30' 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }`}
              >
                <div className="font-medium truncate">{conv.title || "New Chat"}</div>
                <div className="text-xs opacity-50 mt-1">
                  {new Date(conv.created_at).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col relative bg-[#111827]">
        
        {/* Header */}
        <header className="h-16 border-b border-gray-800 flex items-center px-6 bg-gray-950/80 backdrop-blur-md sticky top-0 z-10 w-full justify-between">
          <h1 className="font-semibold text-gray-100 flex items-center gap-2">
            MarketMind AI Assistant
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-widest border border-emerald-500/30">Beta</span>
          </h1>
        </header>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto w-full scroll-smooth">
          <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
            
            {messages.length === 0 && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center mt-20 fade-in">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-gray-700/50">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2 text-white text-center">How can I help you?</h2>
                <p className="text-gray-400 mb-10 max-w-sm text-center leading-relaxed">Ask anything about your portfolio, live market data, or NSE stocks.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                  {suggestedQuestions.map((q, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSend(q)}
                      className="p-4 bg-gray-800/40 hover:bg-gray-800 border border-gray-700/50 hover:border-emerald-500/50 rounded-xl text-left text-sm text-gray-300 transition-all duration-200 shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <MessageBubble 
                key={m.id} 
                role={m.role} 
                content={m.content} 
                sources={m.sources}
                tools_used={m.tools_used}
                timestamp={m.created_at}
              />
            ))}
            
            {isLoading && (
              <div className="flex justify-start mb-6 fade-in">
                <div className="bg-gray-800/80 rounded-2xl rounded-tl-sm px-5 py-5 shadow-sm border border-gray-700/50 w-24 backdrop-blur-md">
                  <div className="flex space-x-1.5 justify-center">
                    <div className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#111827] via-[#111827] to-transparent pt-10 pb-6 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end shadow-xl rounded-2xl bg-gray-800 border border-gray-700 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500/50 transition-all group">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading) handleSend();
                  }
                }}
                disabled={isLoading}
                placeholder="Ask anything about your portfolio or any NSE stock..."
                className="w-full max-h-48 min-h-[56px] py-4 pl-4 pr-12 bg-transparent text-gray-100 placeholder-gray-500 resize-none outline-none disabled:opacity-50"
                rows={1}
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-2 bottom-2 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-colors"
                title="Send Message"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-gray-500 select-none tracking-wide">MarketMind AI can make mistakes. Verify critical financial information before trading.</span>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
