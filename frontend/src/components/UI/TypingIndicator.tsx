/**
 * Advanced Typing Indicator Component
 * Shows realistic typing animation with multiple effects
 */

import { useEffect, useState } from 'react';
import type { FC } from 'react';

interface TypingIndicatorProps {
  isVisible: boolean;
  className?: string;
  variant?: 'dots' | 'wave' | 'pulse' | 'brain';
}

export const TypingIndicator: FC<TypingIndicatorProps> = ({
  isVisible,
  className = '',
  variant = 'brain'
}) => {
  const [currentDot, setCurrentDot] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentDot(prev => (prev + 1) % 3);
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex items-center gap-1">
            {[0, 1, 2].map(index => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentDot === index ? 'bg-blue-500 scale-125' : 'bg-gray-400'
                }`}
              />
            ))}
          </div>
        );

      case 'wave':
        return (
          <div className="flex items-center gap-1">
            {[0, 1, 2].map(index => (
              <div
                key={index}
                className="w-1 bg-blue-500 rounded-full animate-pulse"
                style={{
                  height: currentDot === index ? '16px' : '8px',
                  animationDelay: `${index * 0.2}s`
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping" />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping animation-delay-200" />
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping animation-delay-400" />
          </div>
        );

      case 'brain':
        return (
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🧠</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex gap-1 mb-1">
                {[0, 1, 2, 3].map(index => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      index <= currentDot ? 'bg-blue-500 w-4' : 'bg-gray-300 w-2'
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-500 font-medium">AI 正在思考...</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      {renderVariant()}
    </div>
  );
};