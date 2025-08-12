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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Cycle through dark -> lite -> high-contrast -> dark
  const toggleTheme = useCallback(() => {
  setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('lite-mode', 'dark-mode');
    if (theme === 'light') {
      root.classList.add('lite-mode');
    } else {
      root.classList.add('dark-mode');
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
            <div className="bg-[var(--color-accent-magenta)] p-2 rounded-full transition-colors">
              <BotIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)] transition-colors">PROJ-BLE Education Assistant</h1>
              <p className="text-sm text-[var(--color-text-secondary)] transition-colors">Empowering the Future of Education</p>
            </div>
          </div>
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer select-none">
              <span className="mr-2 text-[var(--color-text-secondary)]">{theme === 'light' ? 'Light' : 'Dark'} Mode</span>
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
                className="hidden"
                aria-label="Toggle theme"
              />
              <span
                className={`w-10 h-6 flex items-center bg-[var(--color-bg-secondary)] rounded-full p-1 transition-colors ${theme === 'dark' ? 'justify-end' : 'justify-start'}`}
                style={{ display: 'flex' }}
              >
                <span className={`w-4 h-4 bg-[var(--color-accent-amber)] rounded-full transition-transform duration-300`}></span>
              </span>
            </label>
          </div>
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