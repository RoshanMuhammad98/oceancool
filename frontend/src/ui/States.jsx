import { IconAlert, IconInbox, IconRefresh } from './Icons.jsx';

/*
 * Loading, empty and error states. Skeletons mirror the shape of the real content so
 * the screen does not jump when the data lands.
 */

export function Skeleton({ variant = 'row', count = 1, style }) {
  return (
    <div className="skeleton-stack" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`skeleton skeleton--${variant}`} style={style} />
      ))}
    </div>
  );
}

export function TilesSkeleton({ count = 4 }) {
  return (
    <div className="tiles" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="tile" key={i}>
          <div className="skeleton skeleton--line" style={{ width: '58%' }} />
          <div
            className="skeleton skeleton--line"
            style={{ width: '76%', height: 20, marginTop: 8 }}
          />
        </div>
      ))}
    </div>
  );
}

export function LoadingScreen({ label = 'Loading' }) {
  return (
    <div className="stack" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <TilesSkeleton />
      <Skeleton variant="row" count={4} />
    </div>
  );
}

export function EmptyState({ icon, title, children, action }) {
  return (
    <div className="empty">
      <span className="glyph">{icon || <IconInbox />}</span>
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="errorbox" role="alert">
      <b>
        <IconAlert
          style={{ width: 15, height: 15, verticalAlign: '-2px', marginRight: 6 }}
        />
        {error.offline ? 'No connection' : 'Could not load'}
      </b>
      <span>{error.message}</span>
      {onRetry ? (
        <button type="button" className="btn btn--sm" onClick={onRetry}>
          <IconRefresh />
          Try again
        </button>
      ) : null}
    </div>
  );
}

/** Inline spinner for a button that is submitting. */
export function ButtonSpinner() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeOpacity="0.28"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="0.8s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
