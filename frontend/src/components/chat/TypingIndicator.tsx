import React from 'react';

/**
 * TypingIndicator Component
 * Индикатор "печатает..."
 */
export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 animate-fade-in">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-text-10 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-text-10 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-text-10 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-xs text-text-10">печатает...</span>
    </div>
  );
};



