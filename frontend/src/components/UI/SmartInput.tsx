/**
 * Smart Input Component
 * Advanced input with auto-complete, suggestions, and smart features
 */

import { useState, useRef, useEffect } from 'react';
import type { FC, KeyboardEvent } from 'react';
import { VoiceInput } from './VoiceInput';

interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  suggestions?: string[];
  className?: string;
}

const quickPrompts = [
  { text: '解释一下', icon: '💡', category: '解释' },
  { text: '写代码', icon: '💻', category: '编程' },
  { text: '翻译成', icon: '🌐', category: '翻译' },
  { text: '总结一下', icon: '📝', category: '总结' },
  { text: '分析', icon: '🔍', category: '分析' },
  { text: '优化', icon: '⚡', category: '优化' },
];

export const SmartInput: FC<SmartInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = '输入你的消息...',
  disabled = false,
  suggestions = [],
  className = ''
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [isComposing, setIsComposing] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Update counts
  useEffect(() => {
    setCharCount(value.length);
    setWordCount(value.trim().split(/\s+/).filter(word => word.length > 0).length);
  }, [value]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  // Filter suggestions
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(value.toLowerCase()) && suggestion !== value
  ).slice(0, 5);

  // Handle key events
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (selectedSuggestion >= 0 && filteredSuggestions.length > 0) {
        onChange(filteredSuggestions[selectedSuggestion]);
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
      } else {
        onSubmit();
      }
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestion(prev => 
        prev <= 0 ? filteredSuggestions.length - 1 : prev - 1
      );
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestion(prev => 
        prev >= filteredSuggestions.length - 1 ? 0 : prev + 1
      );
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowQuickPrompts(false);
      setSelectedSuggestion(-1);
    } else if (e.key === 'Tab' && showQuickPrompts) {
      e.preventDefault();
      setShowQuickPrompts(false);
    }
  };

  // Handle input change
  const handleChange = (newValue: string) => {
    onChange(newValue);
    setShowSuggestions(newValue.length > 0 && filteredSuggestions.length > 0);
    setSelectedSuggestion(-1);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
    textareaRef.current?.focus();
  };

  // Handle quick prompt click
  const handleQuickPromptClick = (prompt: string) => {
    const newValue = value ? `${value} ${prompt}` : prompt;
    onChange(newValue);
    setShowQuickPrompts(false);
    textareaRef.current?.focus();
  };

  // Handle voice transcript
  const handleVoiceTranscript = (transcript: string) => {
    const newValue = value ? `${value} ${transcript}` : transcript;
    onChange(newValue);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Quick prompts */}
      {showQuickPrompts && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-20">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚡</span>
            <span className="font-medium text-gray-800">快速提示</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleQuickPromptClick(prompt.text)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
              >
                <span>{prompt.icon}</span>
                <div>
                  <div className="text-sm font-medium">{prompt.text}</div>
                  <div className="text-xs text-gray-500">{prompt.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-48 overflow-y-auto z-10"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors ${
                index === selectedSuggestion ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              } ${index === 0 ? 'rounded-t-xl' : ''} ${
                index === filteredSuggestions.length - 1 ? 'rounded-b-xl' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-blue-500">💡</span>
                <span className="text-sm">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Main input container */}
      <div className="relative bg-white rounded-2xl border border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200 shadow-sm hover:shadow-md">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onFocus={() => {
            if (value.length === 0) {
              setShowQuickPrompts(true);
            }
          }}
          onBlur={() => {
            // Delay hiding to allow clicks
            setTimeout(() => {
              setShowSuggestions(false);
              setShowQuickPrompts(false);
            }, 200);
          }}
          placeholder={disabled ? 'AI 正在思考中...' : placeholder}
          disabled={disabled}
          className="w-full p-4 pr-32 bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-500"
          style={{ minHeight: '56px', maxHeight: '120px' }}
          rows={1}
        />

        {/* Right side controls */}
        <div className="absolute right-2 bottom-2 flex items-center gap-2">
          {/* Voice input */}
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            className="scale-75"
          />

          {/* Submit button */}
          <button
            onClick={onSubmit}
            disabled={!value.trim() || disabled}
            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
          >
            {disabled ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-lg">🚀</span>
            )}
          </button>
        </div>

        {/* Bottom bar with stats and shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{charCount}/2000 字符</span>
            <span>{wordCount} 词</span>
            <button
              onClick={() => setShowQuickPrompts(!showQuickPrompts)}
              className="flex items-center gap-1 hover:text-blue-500 transition-colors"
            >
              <span>⚡</span>
              <span>快速提示</span>
            </button>
          </div>
          
          <div className="text-xs text-gray-500">
            <span>Enter 发送 • Shift+Enter 换行</span>
          </div>
        </div>
      </div>
    </div>
  );
};