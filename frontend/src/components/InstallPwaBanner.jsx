import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, Sparkles } from 'lucide-react';

const InstallPwaBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Check if already installed & running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      return;
    }

    // 2. Check if user dismissed prompt recently
    const isDismissed = localStorage.getItem('shareit_pwa_prompt_dismissed');
    if (isDismissed) {
      const dismissedTime = parseInt(isDismissed, 10);
      // Suppress for 5 days after dismissal
      if (Date.now() - dismissedTime < 5 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // 3. Android / Chromium: capture beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 4. iOS Safari detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari =
      /safari/.test(userAgent) && !/chrome|crios|fxios|android/.test(userAgent);

    if (isIosDevice && isSafari && !isStandalone) {
      setIsIos(true);
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('shareit_pwa_prompt_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <aside
      aria-label="Install Share-It App"
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-slide-up"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md flex-shrink-0 mt-0.5">
          <Smartphone className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
              Install Share-It App
            </h4>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[9px] uppercase tracking-wider flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" /> 1-Tap
            </span>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-snug">
            {isIos ? (
              <span>
                Install on your iPhone: tap the Share button{' '}
                <Share className="w-3.5 h-3.5 inline text-emerald-600" /> and
                choose <strong>"Add to Home Screen"</strong>.
              </span>
            ) : (
              'Fast full-screen mobile access & instant neighborhood pickup alerts directly on your phone.'
            )}
          </p>

          {!isIos && (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                Add to Home Screen
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="px-2.5 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
              >
                Not Now
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition flex-shrink-0"
          title="Dismiss install banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default InstallPwaBanner;
