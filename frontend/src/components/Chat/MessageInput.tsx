import { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "输入消息...",
  maxLength = 1000
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle message sending
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (but not Shift+Enter for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Enforce character limit
    if (value.length <= maxLength) {
      setMessage(value);
      
      // Auto-resize textarea
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const isMessageValid = message.trim().length > 0;
  const remainingChars = maxLength - message.length;

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-end space-x-3">
        {/* Message input */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          {/* Character counter */}
          <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
            <span>
              {disabled ? '发送中...' : 'Enter发送，Shift+Enter换行'}
            </span>
            <span className={remainingChars < 50 ? 'text-orange-500' : ''}>
              {remainingChars}/{maxLength}
            </span>
          </div>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !isMessageValid}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            disabled || !isMessageValid
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {disabled ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>发送中</span>
            </div>
          ) : (
            '发送'
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;