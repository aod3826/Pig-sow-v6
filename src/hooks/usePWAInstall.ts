import { useState, useEffect } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

let deferredPromptGlobal: BeforeInstallPromptEvent | null = null;
let isDismissedGlobal = false;
const listeners: Array<() => void> = [];

const notifyListeners = () => listeners.forEach(fn => fn());

// Catch the event as early as possible
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPromptGlobal = e as BeforeInstallPromptEvent;
    notifyListeners();
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(deferredPromptGlobal);
  const [isDismissed, setIsDismissed] = useState(isDismissedGlobal);

  useEffect(() => {
    const handleUpdate = () => {
      setDeferredPrompt(deferredPromptGlobal);
      setIsDismissed(isDismissedGlobal);
    };
    
    // In case it changed before the effect ran
    handleUpdate();

    listeners.push(handleUpdate);
    return () => {
      const index = listeners.indexOf(handleUpdate);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  const dismiss = () => {
    isDismissedGlobal = true;
    notifyListeners();
  };

  const clearPrompt = () => {
    deferredPromptGlobal = null;
    notifyListeners();
  };

  return { deferredPrompt, isDismissed, dismiss, clearPrompt };
}
