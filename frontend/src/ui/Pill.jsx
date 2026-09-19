import { statusLabel } from '../lib/format.js';

/**
 * Payment state, encoded in colour as well as words so a list of jobs can be read at a
 * glance: copper still owed, amber part paid, green settled.
 */
export function StatusPill({ status }) {
  return <span className={`pill pill--${status}`}>{statusLabel(status)}</span>;
}
