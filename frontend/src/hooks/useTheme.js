import { useCallback, useEffect, useState } from 'react';

const KEY = 'oceancool.theme';

/**
 * Light / dark / follow the phone.
 *
 * "system" stamps nothing on the document, which is what the CSS expects: the
 * prefers-color-scheme block handles that case. An explicit choice stamps
 * data-theme so it beats the OS setting in either direction.
 */
export function useTheme() {
  const [theme, setTheme] = useState(read);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);

    try {
      if (theme === 'system') window.localStorage.removeItem(KEY);
      else window.localStorage.setItem(KEY, theme);
    } catch {
      /* the choice still applies for this session */
    }
  }, [theme]);

  const choose = useCallback((next) => setTheme(next), []);

  return { theme, choose };
}

/** Called once before React renders, so there is no flash of the wrong theme. */
export function applyStoredTheme() {
  const stored = read();
  if (stored !== 'system') document.documentElement.setAttribute('data-theme', stored);
}

function read() {
  try {
    const stored = window.localStorage.getItem(KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}
