import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

/*
 * The app's one overlay: a bottom sheet on a phone, a centred dialog from tablet width
 * up (same markup, switched in CSS). Escape and the scrim both close it, focus is
 * trapped while it is open and returned to whatever opened it, and the page behind
 * cannot scroll.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sheet({ title, subtitle, onClose, children, footer, closeLabel = 'Close' }) {
  const cardRef = useRef(null);
  const openerRef = useRef(null);
  const titleId = useId();

  // remember what had focus, then put it back on close
  useEffect(() => {
    openerRef.current = document.activeElement;
    const card = cardRef.current;
    // Focus the dialog itself rather than its first control: that would land on the
    // close button and show a focus ring on it. A form that wants a specific field
    // focused says so with autoFocus, and React has already done it by now.
    if (card && !card.contains(document.activeElement)) card.focus();

    return () => {
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const onKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const nodes = Array.from(cardRef.current?.querySelectorAll(FOCUSABLE) || []).filter(
        (node) => node.offsetParent !== null,
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  return createPortal(
    <div className="sheet" onKeyDown={onKeyDown}>
      <button type="button" className="sheet__scrim" aria-label={closeLabel} onClick={onClose} />
      <div
        className="sheet__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={cardRef}
        tabIndex={-1}
      >
        <div className="sheet__head">
          <div className="titles">
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <span className="sub">{subtitle}</span> : null}
          </div>
          <button
            type="button"
            className="iconbtn iconbtn--x"
            onClick={onClose}
            aria-label={closeLabel}
          >
            &times;
          </button>
        </div>
        <div className="sheet__body">{children}</div>
        {footer ? <div className="sheet__foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
