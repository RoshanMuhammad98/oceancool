import { useCallback, useEffect, useState } from 'react';

const DISMISS_KEY = 'oceancool.installDismissed';

/**
 * "Add to Home Screen".
 *
 * Chrome-family browsers fire `beforeinstallprompt`, which we hold on to so the app can
 * offer the install where it makes sense instead of leaving it buried in a browser menu.
 * iOS Safari never fires it — there, `iosHint` is true and Settings explains the
 * Share -> Add to Home Screen route instead.
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [dismissed, setDismissed] = useState(() => readDismissed());

  useEffect(() => {
    function onBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredPrompt(event);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return choice?.outcome === 'accepted';
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* the banner just comes back next time */
    }
  }, []);

  return {
    canInstall: Boolean(deferredPrompt) && !installed,
    showBanner: Boolean(deferredPrompt) && !installed && !dismissed,
    iosHint: isIos() && !installed,
    installed,
    promptInstall,
    dismiss,
  };
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator.standalone === true
  );
}

function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}
