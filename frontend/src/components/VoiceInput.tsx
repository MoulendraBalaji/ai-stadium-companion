import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  latestResponse: string | null;
  className?: string;
}

interface SpeechWindow extends Window {
  SpeechRecognition?: unknown;
  webkitSpeechRecognition?: unknown;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  latestResponse,
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);

  const recognitionRef = useRef<unknown>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    const win = window as SpeechWindow;
    const SpeechRecognitionConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setSupportMessage('Speech Recognition not supported in this browser.');
      return;
    }

    const SpeechRecognition = SpeechRecognitionConstructor as new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onstart: () => void;
      onresult: (event: unknown) => void;
      onerror: (event: unknown) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: unknown) => {
      const e = event as { results: Array<Array<{ transcript: string }>> };
      const transcript = e.results[0][0].transcript;
      if (transcript) {
        onTranscript(transcript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [onTranscript]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthesisRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    if (speechEnabled && latestResponse && synthesisRef.current) {
      synthesisRef.current.cancel();
      const cleanText = latestResponse
        .replace(/[*#_`]/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .trim();
      if (cleanText) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.rate = 1.05;
        utterance.pitch = 1;
        synthesisRef.current.speak(utterance);
      }
    }
  }, [latestResponse, speechEnabled]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    const rec = recognitionRef.current as { stop: () => void; start: () => void };
    if (isListening) {
      rec.stop();
    } else {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
      try {
        rec.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const toggleSpeechPlayback = () => {
    const nextState = !speechEnabled;
    setSpeechEnabled(nextState);
    if (!nextState && synthesisRef.current) {
      synthesisRef.current.cancel();
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        onClick={toggleListening}
        type="button"
        aria-label={isListening ? 'Stop recording' : 'Start recording'}
        title="Voice input"
        disabled={!!supportMessage}
        className="p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center active:scale-90"
        style={{
          background: isListening ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-surface)',
          border: `1px solid ${isListening ? 'rgba(239, 68, 68, 0.3)' : 'var(--color-border-subtle)'}`,
          color: isListening ? '#f87171' : 'var(--color-text-muted)',
          opacity: supportMessage ? 0.4 : 1,
          cursor: supportMessage ? 'not-allowed' : 'pointer',
        }}
      >
        {isListening ? (
          <span className="relative flex items-center justify-center">
            <span className="absolute w-full h-full rounded-full bg-red-400/20 animate-ping" />
            <MicOff size={16} />
          </span>
        ) : (
          <Mic size={16} />
        )}
      </button>

      <button
        onClick={toggleSpeechPlayback}
        type="button"
        aria-label={speechEnabled ? 'Disable audio readback' : 'Enable audio readback'}
        title="Text-to-speech"
        disabled={!synthesisRef.current}
        className="p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center active:scale-90"
        style={{
          background: speechEnabled ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-surface)',
          border: `1px solid ${speechEnabled ? 'rgba(59, 130, 246, 0.3)' : 'var(--color-border-subtle)'}`,
          color: speechEnabled ? 'var(--color-accent)' : 'var(--color-text-muted)',
          opacity: !synthesisRef.current ? 0.4 : 1,
          cursor: !synthesisRef.current ? 'not-allowed' : 'pointer',
        }}
      >
        {speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>

      <div className="sr-only" aria-live="polite">
        {isListening && 'Listening for voice input...'}
        {speechEnabled && 'Text-to-speech enabled.'}
        {supportMessage && `Speech unavailable: ${supportMessage}`}
      </div>
    </div>
  );
};
