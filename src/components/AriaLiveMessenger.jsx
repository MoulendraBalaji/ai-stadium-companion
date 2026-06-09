import { useEffect, useState } from 'react';

/**
 * AriaLiveMessenger component
 * Standard helper to announce messages to screen readers dynamically.
 * Receives an "announcement" prop and outputs it to an aria-live container.
 */
export default function AriaLiveMessenger({ announcement }) {
  const [liveText, setLiveText] = useState('');

  useEffect(() => {
    if (announcement) {
      // Avoid calling setState synchronously inside useEffect
      const stateTimer = setTimeout(() => {
        setLiveText(announcement);
      }, 0);

      // Clear after a brief period so subsequent identical messages trigger re-announcement
      const clearTimer = setTimeout(() => {
        setLiveText('');
      }, 3000);

      return () => {
        clearTimeout(stateTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [announcement]);


  return (
    <div 
      className="sr-only" 
      role="status" 
      aria-live="polite" 
      aria-atomic="true"
    >
      {liveText}
    </div>
  );
}
