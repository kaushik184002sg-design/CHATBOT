import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons/SendIcon';

interface ChatInputProps {
  onSendMessage: (input: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      // Cap height at roughly 5 rows
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about PROJ-BLE or any education topic..."
        rows={1}
        className="flex-1 p-3 bg-[var(--color-bg-secondary)] backdrop-blur-lg border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg resize-none focus:ring-2 focus:ring-[var(--color-accent-amber)] focus:outline-none placeholder-[var(--color-text-secondary)] disabled:opacity-50 transition-all"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="w-12 h-12 flex-shrink-0 bg-[var(--color-accent-amber)] text-black rounded-full flex items-center justify-center transition-all duration-200 hover:opacity-90 hover:shadow-[0_0_15px_var(--color-accent-amber)] disabled:bg-[var(--color-text-secondary)] disabled:opacity-50 disabled:text-black/50 disabled:cursor-not-allowed disabled:shadow-none"
        aria-label="Send message"
      >
        <SendIcon className="w-6 h-6" />
      </button>
    </form>
  );
};