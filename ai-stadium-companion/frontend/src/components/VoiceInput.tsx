import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  latestResponse: string | null;
  className?: string;
}

interface SpeechWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  latestResponse,
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    const win = window as SpeechWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupportMessage('Web Speech Recognition API not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        onTranscript(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
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

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
      try {
        recognitionRef.current.start();
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
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleListening}
        type="button"
        aria-label={isListening ? 'Stop voice recording' : 'Start voice recording'}
        title="Speak your query"
        disabled={!!supportMessage}
        className={`p-3 rounded-xl border-1 transition-all duration-300 flex items-center justify-center active:scale-90 ${
          isListening
            ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-lg shadow-red-500/10'
            : 'bg-canvas border-hairline hover:border-primary/30 text-mute hover:text-primary hover:bg-canvas-elevated disabled:opacity-40 disabled:cursor-not-allowed'
        }`}
      >
        {isListening ? (
          <span className="relative flex items-center justify-center">
            <span className="absolute w-full h-full rounded-full bg-red-400/20 animate-ping" />
            <MicOff size={18} />
          </span>
        ) : (
          <Mic size={18} />
        )}
      </button>

      <button
        onClick={toggleSpeechPlayback}
        type="button"
        aria-label={speechEnabled ? 'Disable text-to-speech audio reader' : 'Enable text-to-speech audio reader'}
        title="Toggle audio readback"
        disabled={!synthesisRef.current}
        className={`p-3 rounded-xl border-1 transition-all duration-300 flex items-center justify-center active:scale-90 ${
          speechEnabled
            ? 'bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/10'
            : 'bg-canvas border-hairline hover:border-primary/30 text-mute hover:text-primary hover:bg-canvas-elevated disabled:opacity-40 disabled:cursor-not-allowed'
        }`}
      >
        {speechEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      <div className="sr-only" aria-live="polite">
        {isListening && 'Listening for voice input...'}
        {speechEnabled && 'Text to speech readback enabled.'}
        {supportMessage && `Speech input unavailable: ${supportMessage}`}
      </div>
    </div>
  );
};
