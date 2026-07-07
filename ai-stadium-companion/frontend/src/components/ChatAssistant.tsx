import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import { api, ChatMessage } from '../lib/api';
import { VoiceInput } from './VoiceInput';

interface ChatAssistantProps {
  onRouteRequested: (intent: string) => void;
}

const TYPING_DOTS = [
  { animationDelay: '0ms' },
  { animationDelay: '200ms' },
  { animationDelay: '400ms' },
];

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ onRouteRequested }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Stadium Companion. Ask me for directions (e.g. "nearest accessible restroom near section 114"), transit tips, or crowd alerts. How can I help you today?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue('');

    const lowerText = text.toLowerCase();
    if (
      lowerText.includes('route') ||
      lowerText.includes('navigation') ||
      lowerText.includes('direction') ||
      lowerText.includes('where is') ||
      lowerText.includes('nearest') ||
      lowerText.includes('how to get to') ||
      lowerText.includes('puerta') ||
      lowerText.includes('baño') ||
      lowerText.includes('restroom')
    ) {
      onRouteRequested(text);
    }

    setIsStreaming(true);

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    await api.streamChat(
      updatedMessages,
      selectedLanguage || null,
      (chunk) => {
        setMessages((prev) => {
          const next = [...prev];
          const lastMsg = next[next.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content += chunk;
          }
          return next;
        });
      },
      () => {
        setIsStreaming(false);
      },
      (err) => {
        console.error(err);
        setErrorMsg('Failed to fetch stream. The stadium network may be congested.');
        setIsStreaming(false);
        setMessages((prev) => {
          const next = [...prev];
          const lastMsg = next[next.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content === '') {
            next.pop();
          }
          return next;
        });
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  const handleVoiceTranscript = (text: string) => {
    setInputValue(text);
    handleSend(text);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat history cleared. How can I assist you at the stadium?'
      }
    ]);
    setErrorMsg(null);
  };

  const getLatestAssistantReply = (): string | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return messages[i].content;
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-canvas-soft border-1 border-hairline rounded-xl overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-hairline bg-canvas/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center shadow-lg shadow-primary/10">
            <Sparkles size={15} className="text-canvas" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider text-ink-strong font-display">AI Assistant</h2>
            <span className="text-[10px] text-primary font-mono">{isStreaming ? 'Responding...' : 'Online'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="chat-lang" className="sr-only">Select Language</label>
          <select
            id="chat-lang"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-canvas text-xs text-ink border-1 border-hairline rounded-lg py-1.5 px-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 font-sans transition-all duration-300"
          >
            <option value="">Auto-Detect</option>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="pt">Português</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>

          <button
            onClick={clearChat}
            type="button"
            className="p-2 rounded-lg border-1 border-hairline text-mute hover:text-primary hover:border-primary/30 transition-all duration-300 bg-canvas hover:bg-canvas-elevated active:scale-95"
            title="Clear Chat"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4 font-sans"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}
          >
            <div
              className={`max-w-[88%] rounded-xl p-3.5 leading-relaxed transition-all duration-300 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-primary to-primary-deep text-canvas shadow-lg shadow-primary/10'
                  : 'bg-canvas border-1 border-hairline text-ink'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-primary-deep flex items-center justify-center">
                    <Sparkles size={10} className="text-canvas" />
                  </div>
                  <span className="text-[10px] font-semibold text-primary font-display uppercase tracking-wider">Companion</span>
                </div>
              )}
              <div className={`whitespace-pre-wrap text-sm ${msg.role === 'user' ? 'font-medium' : ''}`}>
                {msg.content || (isStreaming && idx === messages.length - 1 ? (
                  <span className="flex items-center gap-1">
                    {TYPING_DOTS.map((dot, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-dot-pulse"
                        style={{ animationDelay: dot.animationDelay }}
                      />
                    ))}
                  </span>
                ) : '')}
              </div>
            </div>
          </div>
        ))}
        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 bg-red-950/20 border-1 border-red-500/20 text-red-400 rounded-xl animate-fade-in-up">
            <AlertCircle size={15} className="shrink-0" />
            <span className="text-xs font-sans">{errorMsg}</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-hairline bg-canvas/50 flex items-center gap-2.5">
        <VoiceInput
          onTranscript={handleVoiceTranscript}
          latestResponse={getLatestAssistantReply()}
        />

        <div className="flex-1 relative">
          <label htmlFor="assistant-input" className="sr-only">Type message</label>
          <input
            id="assistant-input"
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask directions, transit info or support..."
            disabled={isStreaming}
            className={`w-full bg-canvas text-ink border-1 rounded-xl py-3 pl-4 pr-4 focus:outline-none placeholder:text-mute text-sm font-sans transition-all duration-300 ${
              isFocused ? 'border-primary ring-1 ring-primary/20' : 'border-hairline'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={!inputValue.trim() || isStreaming}
          aria-label="Send message"
          className="p-3 rounded-xl bg-gradient-to-r from-primary to-primary-deep text-canvas font-semibold hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg shadow-primary/10 active:scale-95"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
