import { useState } from 'react';
import { api, ApiError } from '../lib/api.js';
import { dateShort, money, parseAmount, todayIso, toNumber } from '../lib/format.js';
import { AmountField, Field } from '../ui/Field.jsx';
import { Sheet } from '../ui/Sheet.jsx';
import { ButtonSpinner } from '../ui/States.jsx';
import { useToast } from '../ui/Toast.jsx';

/**
 * Collecting money for a job that was done earlier.
 *
 * Staff are asked what they received *now* — that is what they have in hand. The total
 * received for the record is worked out here before it goes to the API, so nobody has
 * to do arithmetic at someone's door.
 */
export function PaymentSheet({ service, onClose, onSaved }) {
  const toast = useToast();

  const billed = toNumber(service.amount) ?? 0;
  const already = toNumber(service.paidAmount) ?? 0;
  const pending = Math.max(billed - already, 0);

  const [receivedText, setReceivedText] = useState(pending > 0 ? String(pending) : '');
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const received = parseAmount(receivedText);
  const remaining = received === null ? null : pending - received;

  async function submit(event) {
    event.preventDefault();
    if (busy) return;

    const next = {};
    if (receivedText.trim() === '') next.received = 'Enter the amount received';
    else if (received === null) next.received = 'Enter the amount in numbers';
    else if (received <= 0) next.received = 'Amount must be more than zero';
    else if (received > pending) next.received = `Only ${money(pending)} is pending on this job`;

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const saved = await api.services.recordPayment(service.id, {
        // the API stores the running total for the record, not this instalment
        paidAmount: already + received,
        paymentDate: paymentDate || todayIso(),
      });
      toast.success(
        saved.paymentStatus === 'PAID'
          ? `${money(received)} received — fully settled`
          : `${money(received)} received`,
      );
      onSaved?.(saved);
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        setErrors({ received: error.fieldErrors.paidAmount });
      }
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      title="Record payment"
      subtitle={`${service.customerName} · ${service.serviceName}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="payment-form" className="btn btn--cash" disabled={busy}>
            {busy ? <ButtonSpinner /> : null}
            Record payment
          </button>
        </>
      }
    >
      <div className="callout">
        <div>
          <span className="k">Pending on this job</span>
          <span className="v">{money(pending)}</span>
        </div>
        <span className="note">
          {money(billed)} billed
          <br />
          {dateShort(service.serviceDate)}
        </span>
      </div>

      <form className="form" id="payment-form" onSubmit={submit} noValidate>
        <AmountField
          label="Received now"
          required
          value={receivedText}
          onChange={setReceivedText}
          error={errors.received}
          autoFocus
        />

        {pending > 0 ? (
          <div className="quick">
            <button type="button" onClick={() => setReceivedText(String(pending))}>
              Full {money(pending)}
            </button>
            {pending >= 2 ? (
              <button
                type="button"
                onClick={() => setReceivedText(String(Math.round(pending / 2)))}
              >
                Half {money(Math.round(pending / 2))}
              </button>
            ) : null}
          </div>
        ) : null}

        <Field label="Payment date">
          {(props) => (
            <input
              {...props}
              type="date"
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
            />
          )}
        </Field>

        {remaining !== null && received !== null && received > 0 && received <= pending ? (
          <p className="hint">
            {remaining <= 0
              ? 'This settles the job in full.'
              : `${money(remaining)} will still be pending after this.`}
          </p>
        ) : null}
      </form>
    </Sheet>
  );
}
