// Share-It PWA Installation Utility
let deferredPrompt = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-prompt-available', { detail: e }));
  });
}

export const getDeferredPrompt = () => deferredPrompt;

export const isAppInstalled = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

export const installPwa = async (toast) => {
  if (isAppInstalled()) {
    if (toast) {
      toast.info('✨ Share-It is already installed and running as an app!');
    }
    return;
  }

  if (deferredPrompt) {
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted' && toast) {
        toast.success('🎉 Share-It installed successfully! Enjoy your app.');
      }
      deferredPrompt = null;
      return;
    } catch {
      // Fall through to manual instructions
    }
  }

  const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  if (isIos) {
    if (toast) {
      toast.info(
        "📲 To install on iPhone: Tap Safari's Share button (📤) and select 'Add to Home Screen'!"
      );
    }
    return;
  }

  // Desktop or Android fallback guidance
  if (toast) {
    toast.info(
      "📲 To install: Open your browser menu (⋮) and select 'Install App' or 'Add to Home Screen'!"
    );
  }
};
