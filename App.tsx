import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { createChatSession } from './services/geminiService';
import type { Message } from './types';
import { WELCOME_MESSAGE } from './constants';
import { BotIcon } from './components/icons/BotIcon';
import { ContrastIcon } from './components/icons/ContrastIcon';

const App: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'high-contrast'>('dark');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'high-contrast' : 'dark'));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'high-contrast') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [theme]);

  const initializeChat = useCallback(() => {
    try {
      const chatSession = createChatSession();
      setChat(chatSession);
      setMessages([WELCOME_MESSAGE]);
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      setMessages([{
        role: 'model',
        content: "I'm sorry, I couldn't connect to the server. Please check your API key and refresh the page.",
      }]);
    }
  }, []);

  useEffect(() => {
    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (userInput: string) => {
    if (isLoading || !userInput.trim() || !chat) return;

    setIsLoading(true);

    const userMessage: Message = {
      role: 'user',
      content: userInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    try {
      const stream = await chat.sendMessageStream({ message: userInput });


      setMessages(prev => [...prev, {
        role: 'model',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content += chunkText;
          // timestamp remains unchanged for streaming
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: 'model',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans">
      <header className="bg-[var(--color-bg-secondary)] backdrop-blur-lg border-b border-[var(--color-border)] p-4 shadow-lg transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-[var(--color-accent-magenta)] p-2 rounded-full transition-colors shadow-[0_0_15px_var(--color-accent-magenta)]">
              <BotIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)] transition-colors" style={{ textShadow: '0 0 8px var(--color-accent-cyan)'}}>PROJ-BLE Education Assistant</h1>
              <p className="text-sm text-[var(--color-text-secondary)] transition-colors">Empowering the Future of Education</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-[var(--color-accent-amber)] transition-all"
            aria-label="Toggle high contrast mode"
            title="Toggle high contrast mode"
          >
            <ContrastIcon className="w-6 h-6" />
          </button>
        </div>
      </header>
      
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && messages[messages.length-1].role === 'user' && (
            <ChatMessage message={{role: 'model', content: ''}} isLoading={true} />
          )}
        </div>
      </main>

      <footer className="bg-[var(--color-bg-secondary)] backdrop-blur-lg border-t border-[var(--color-border)] p-4 transition-colors shadow-lg">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </footer>
    </div>
  );
};

export default App;