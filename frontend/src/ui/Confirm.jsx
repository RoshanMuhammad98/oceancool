import { useState } from 'react';
import { Sheet } from './Sheet.jsx';
import { ButtonSpinner } from './States.jsx';

/**
 * Confirmation before anything destructive. The confirm button carries the verb —
 * "Delete customer", not "OK" — so a mis-tap is obvious before it happens.
 */
export function Confirm({
  title,
  body,
  confirmLabel = 'Delete',
  cancelLabel = 'Keep it',
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      title={title}
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn--danger" onClick={run} disabled={busy}>
            {busy ? <ButtonSpinner /> : null}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="hint" style={{ fontSize: 'var(--step-0)', color: 'var(--ink-2)' }}>
        {body}
      </p>
    </Sheet>
  );
}
