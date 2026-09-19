import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads data and keeps the three states a screen needs: data, loading, error.
 *
 * The loader is given an AbortSignal, so a screen the user has already left stops
 * writing into state. `reload()` re-runs it — used by the retry button and after any
 * save, so the figures on screen always come from the server rather than a guess.
 *
 * @param loader (signal) => Promise<data>
 * @param deps   re-run when these change, like useEffect
 */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState((current) => ({ data: current.data, loading: true, error: null }));

    loaderRef
      .current(controller.signal)
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || error?.name === 'AbortError') return;
        setState({ data: null, loading: false, error });
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { ...state, reload };
}

/** Debounces a value — used so typing in a search box does not fire a request per key. */
export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
