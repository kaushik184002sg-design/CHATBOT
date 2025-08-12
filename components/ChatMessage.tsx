import React from 'react';
import type { Message } from '../types';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

const ContentRenderer: React.FC<{ content: string }> = ({ content }) => {
  const blocks: React.ReactNode[] = [];
  let currentListItems: React.ReactNode[] = [];

  const lines = content.split('\n');

  const renderInline = (text: string) => text.split('*').map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part));

  const flushList = (key: string | number) => {
    if (currentListItems.length > 0) {
      blocks.push(<ul key={`ul-${key}`} className="list-disc list-inside space-y-1 my-2 pl-2">{currentListItems}</ul>);
      currentListItems = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      currentListItems.push(
        <li key={i}>{renderInline(trimmedLine.substring(2))}</li>
      );
    } else {
      flushList(i);
      if (trimmedLine) {
        blocks.push(<p key={i} className="my-1">{renderInline(line)}</p>);
      }
    }
  });

  flushList('last');

  return <>{blocks}</>;
};


const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1">
    <span className="w-2 h-2 bg-[var(--color-accent-cyan)] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
    <span className="w-2 h-2 bg-[var(--color-accent-cyan)] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
    <span className="w-2 h-2 bg-[var(--color-accent-cyan)] rounded-full animate-bounce"></span>
  </div>
);


export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading = false }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`flex items-start gap-4 ${isModel ? '' : 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isModel ? 'bg-[var(--color-accent-magenta)] shadow-[0_0_10px_var(--color-accent-magenta)]' : 'bg-[var(--color-accent-amber)] shadow-[0_0_10px_var(--color-accent-amber)]'}`}>
        {isModel ? <BotIcon className="w-5 h-5 text-white" /> : <UserIcon className="w-5 h-5 text-black" />}
      </div>
      <div 
        className={`p-4 rounded-xl max-w-2xl transition-all duration-300 border border-[var(--color-border)] backdrop-blur-lg
        ${isModel 
          ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-tl-none shadow-[0_0_20px_rgba(245,93,255,0.2)]' 
          : 'bg-[var(--color-bg-user-message)] text-[var(--color-text-primary)] rounded-tr-none shadow-[0_0_20px_rgba(255,183,77,0.3)]'}`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-[var(--color-text-secondary)]">{message.timestamp}</span>
        </div>
        {isLoading && !message.content ? (
          <TypingIndicator />
        ) : (
          <div className="prose prose-sm max-w-none text-inherit leading-relaxed space-y-2">
            <ContentRenderer content={message.content} />
          </div>
        )}
      </div>
    </div>
  );
};