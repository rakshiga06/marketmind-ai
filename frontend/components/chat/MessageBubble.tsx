import React from 'react';
import SourceChip from './SourceChip';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  tools_used?: string[];
  timestamp?: string;
}

export function MessageBubble({ role, content, sources = [], tools_used = [], timestamp }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
      <div 
        className={`max-w-[85%] sm:max-w-[75%] px-5 py-4 shadow-sm w-fit ${
          isUser 
            ? 'bg-emerald-600/90 text-white rounded-2xl rounded-tr-sm backdrop-blur-md' 
            : 'bg-gray-800/80 text-gray-100 border border-gray-700/50 rounded-2xl rounded-tl-sm backdrop-blur-md'
        }`}
      >
        {/* Tool badges */}
        {!isUser && tools_used.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tools_used.map((tool, idx) => (
              <span key={idx} className="inline-flex items-center space-x-1 text-[10px] uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-800/50">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{tool} data fetched</span>
              </span>
            ))}
          </div>
        )}

        {/* Message body */}
        <div className="prose prose-sm prose-invert max-w-none break-words whitespace-pre-wrap leading-relaxed">
          {content}
        </div>

        {/* AI Action/Source Footer */}
        {!isUser && sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-700/50 flex flex-wrap items-center">
            <span className="w-full text-xs text-gray-400 mb-1.5 font-medium flex items-center uppercase tracking-wider select-none">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Sources
            </span>
            <div className="flex flex-wrap">
              {sources.map((source, idx) => (
                <SourceChip key={idx} label={source} />
              ))}
            </div>
          </div>
        )}
        
        {/* Timestamp */}
        {timestamp && (
          <div className={`text-[10px] mt-1.5 opacity-0 group-hover:opacity-60 transition-opacity text-right ${isUser ? 'text-emerald-100' : 'text-gray-400'}`}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
