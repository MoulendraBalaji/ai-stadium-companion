import { vi } from 'vitest';

// Mock global fetch
globalThis.fetch = vi.fn();

// Mock SpeechSynthesis if in jsdom environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
    },
    writable: true,
  });

  (window as any).SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
    text,
    lang: 'en-US',
  }));
}
