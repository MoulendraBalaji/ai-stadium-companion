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
      content: 'Welcome to StadiumOS AI. Ask me for directions, transit info, crowd alerts, or any stadium question. How can I assist you?'
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
        setErrorMsg('Connection lost. The stadium network may be congested.');
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
        content: 'Chat cleared. How can I assist you at the stadium?'
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
    <div className="card flex flex-col h-full overflow-hidden" style={{ minHeight: 'calc(100vh - 7rem)' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-glow-sm">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-display" style={{ color: 'var(--color-text-strong)' }}>
              AI Companion
            </h2>
            <span className="text-[10px] font-mono flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-accent animate-pulse' : 'bg-success'}`} />
              <span style={{ color: isStreaming ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                {isStreaming ? 'Responding...' : 'Online'}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="chat-lang" className="sr-only">Select Language</label>
          <select
            id="chat-lang"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="input-field text-xs py-1.5 px-3 w-auto"
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
            className="p-2 rounded-xl transition-all duration-300 hover:bg-white/5"
            style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border-subtle)' }}
            title="Clear Chat"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed transition-all duration-300 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-accent to-accent-dark text-white shadow-glow-sm'
                  : 'card-elevated'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center">
                    <Sparkles size={10} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold font-display uppercase tracking-wider" style={{ color: 'var(--color-accent-light)' }}>
                    StadiumOS
                  </span>
                </div>
              )}
              <div
                dir={msg.content && /[\u0600-\u06FF]/.test(msg.content) ? 'rtl' : 'ltr'}
                aria-live={msg.role === 'assistant' ? 'polite' : 'off'}
                className={`whitespace-pre-wrap text-sm ${msg.role === 'user' ? 'font-medium' : ''}`}
              >
                {msg.content || (isStreaming && idx === messages.length - 1 ? (
                  <span className="flex items-center gap-1.5 py-1">
                    {TYPING_DOTS.map((dot, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-accent animate-dot-pulse"
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
          <div className="flex items-center gap-3 p-4 rounded-xl animate-fade-in-up" style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.15)'
          }}>
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span className="text-xs" style={{ color: '#f87171' }}>{errorMsg}</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-3 flex items-center gap-3" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
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
            placeholder="Ask about directions, transit, or stadium info..."
            disabled={isStreaming}
            className="input-field text-sm pr-4"
            style={isFocused ? { borderColor: 'var(--color-accent)', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)' } : {}}
          />
        </div>

        <button
          type="submit"
          disabled={!inputValue.trim() || isStreaming}
          aria-label="Send message"
          className="p-3 rounded-xl bg-gradient-to-br from-accent to-accent-dark text-white font-semibold hover:shadow-glow disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center active:scale-95"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
