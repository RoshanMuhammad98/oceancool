import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, setTokenReader, setUnauthorizedHandler } from '../lib/api.js';

/*
 * Who is signed in. The session (token + username) is kept in localStorage so a staff
 * member who installs the app to their home screen is not asked to sign in every
 * morning. The password is never stored.
 */

const STORAGE_KEY = 'oceancool.session';

const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token ? parsed : null;
  } catch {
    // private mode, or storage cleared mid-session — treat as signed out
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // the API client reads the token straight from here, so nothing has to pass it down
  useEffect(() => {
    setTokenReader(() => sessionRef.current?.token || null);
  }, []);

  const signOut = useCallback((options = {}) => {
    const token = sessionRef.current?.token;
    if (token && !options.skipServer) {
      // best effort — the local session is cleared either way
      api.logout().catch(() => {});
    }
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing we can do, the in-memory session still clears */
    }
    setSession(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => signOut({ skipServer: true }));
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const signIn = useCallback(async (username, password) => {
    const result = await api.login({ username, password });
    const next = {
      token: result.token,
      userId: result.userId,
      username: result.username,
      displayName: result.displayName,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* session still works for this tab */
    }
    setSession(next);
    return next;
  }, []);

  const value = useMemo(
    () => ({
      session,
      signedIn: Boolean(session?.token),
      user: session ? { username: session.username, displayName: session.displayName } : null,
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
