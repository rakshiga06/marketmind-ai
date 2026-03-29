import React from 'react';

interface SourceChipProps {
  label: string;
}

export function SourceChip({ label }: SourceChipProps) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-800/40 text-gray-300 border border-gray-700/50 mr-2 mt-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50">
      <svg 
        className="mr-1.5 h-3 w-3 text-emerald-400" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {label}
    </span>
  );
}

export default SourceChip;
