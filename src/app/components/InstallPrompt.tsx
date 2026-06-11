import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      const e = event as BeforeInstallPromptEvent;
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      console.log('CampusLink was successfully installed');
      setShowPrompt(false);
      setDeferredPrompt(null);
      // Clear the install prompt from UI
      localStorage.setItem('campuslink-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Don't show if already dismissed recently
    const dismissed = sessionStorage.getItem('install-prompt-dismissed');
    if (dismissed) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('install-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-purple-600 text-white rounded-2xl shadow-2xl p-4 max-w-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-5 h-5" />
              <h3 className="font-semibold">Install CampusLink</h3>
            </div>
            <p className="text-sm text-purple-100">
              Install the app for quick access and offline support
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-purple-200 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleInstall}
            className="flex-1 bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
