import { useMemo, useState } from 'react';
import { api, ApiError, SERVICE_NAMES } from '../lib/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { money, parseAmount, todayIso } from '../lib/format.js';
import { AmountField, Field, Segmented } from '../ui/Field.jsx';
import { IconUserPlus } from '../ui/Icons.jsx';
import { Sheet } from '../ui/Sheet.jsx';
import { ButtonSpinner } from '../ui/States.jsx';
import { useToast } from '../ui/Toast.jsx';
import { CustomerFormSheet } from './CustomerFormSheet.jsx';

/*
 * Record a job. This is the screen staff use several times a day, so it defaults to
 * today, remembers nothing they would have to clear, and asks for the payment state up
 * front — "paid now" and "they'll pay next month" are both one tap.
 */

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Not paid' },
  { value: 'PARTIAL', label: 'Part paid' },
  { value: 'PAID', label: 'Paid' },
];

export function ServiceFormSheet({ service, presetCustomerId, onClose, onSaved }) {
  const editing = Boolean(service?.id);
  const toast = useToast();

  const customers = useAsync((signal) => api.customers.list(undefined, signal), []);

  const knownName = service?.serviceName && SERVICE_NAMES.includes(service.serviceName);

  const [customerId, setCustomerId] = useState(
    String(service?.customerId || presetCustomerId || ''),
  );
  const [servicePick, setServicePick] = useState(
    editing ? (knownName ? service.serviceName : 'Other') : 'AC Service',
  );
  const [customName, setCustomName] = useState(editing && !knownName ? service.serviceName : '');
  const [amountText, setAmountText] = useState(
    service?.amount !== undefined ? trimZeros(service.amount) : '',
  );
  const [serviceDate, setServiceDate] = useState(service?.serviceDate || todayIso());
  const [status, setStatus] = useState(service?.paymentStatus || 'PENDING');
  const [paidText, setPaidText] = useState(
    service?.paidAmount !== undefined && service.paymentStatus === 'PARTIAL'
      ? trimZeros(service.paidAmount)
      : '',
  );
  const [paymentDate, setPaymentDate] = useState(service?.paymentDate || todayIso());
  const [remarks, setRemarks] = useState(service?.remarks || '');

  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);

  const amountValue = parseAmount(amountText);
  const paidValue = parseAmount(paidText);

  const pendingPreview = useMemo(() => {
    if (amountValue === null) return null;
    if (status === 'PAID') return 0;
    if (status === 'PENDING') return amountValue;
    return paidValue === null ? null : amountValue - paidValue;
  }, [amountValue, paidValue, status]);

  function validate() {
    const next = {};
    if (!customerId) next.customerId = 'Choose a customer';

    const finalName = servicePick === 'Other' ? customName.trim() : servicePick;
    if (!finalName) next.serviceName = 'Service name is required';

    if (amountText.trim() === '') next.amount = 'Amount is required';
    else if (amountValue === null) next.amount = 'Enter the amount in numbers';
    else if (amountValue < 0) next.amount = 'Amount cannot be negative';

    if (!serviceDate) next.serviceDate = 'Service date is required';

    if (status === 'PARTIAL') {
      if (paidText.trim() === '') next.paidAmount = 'Enter how much was received';
      else if (paidValue === null) next.paidAmount = 'Enter the amount in numbers';
      else if (paidValue <= 0) next.paidAmount = 'A part payment must be more than zero';
      else if (amountValue !== null && paidValue >= amountValue) {
        next.paidAmount = 'Less than the total — use "Paid" if it is settled';
      }
    }
    return { next, finalName };
  }

  async function submit(event) {
    event.preventDefault();
    if (busy) return;

    const { next, finalName } = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    const body = {
      customerId: Number(customerId),
      serviceName: finalName,
      amount: amountValue,
      serviceDate,
      paymentStatus: status,
      paidAmount: status === 'PARTIAL' ? paidValue : null,
      paymentDate: status === 'PENDING' ? null : paymentDate || serviceDate,
      remarks: remarks.trim() || null,
    };

    try {
      const saved = editing
        ? await api.services.update(service.id, body)
        : await api.services.create(body);
      toast.success(editing ? 'Service updated' : `${finalName} saved`);
      onSaved?.(saved);
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) setErrors(error.fieldErrors);
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  const list = customers.data || [];

  return (
    <>
      <Sheet
        title={editing ? 'Edit service' : 'New service'}
        subtitle={editing ? service.customerName : 'One job, one record'}
        onClose={onClose}
        footer={
          <>
            <button type="button" className="btn" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" form="service-form" className="btn btn--primary" disabled={busy}>
              {busy ? <ButtonSpinner /> : null}
              {editing ? 'Save changes' : 'Save service'}
            </button>
          </>
        }
      >
        <form className="form" id="service-form" onSubmit={submit} noValidate>
          <Field
            label="Customer"
            required
            error={errors.customerId}
            hint={customers.loading ? 'Loading customers…' : undefined}
          >
            {(props) => (
              <select
                {...props}
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
              >
                <option value="">Select a customer</option>
                {list.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                    {customer.phoneNumber ? ` · ${customer.phoneNumber}` : ''}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => setAddingCustomer(true)}
            style={{ alignSelf: 'flex-start' }}
          >
            <IconUserPlus />
            New customer
          </button>

          <div className="divider" />

          <Field label="Service" required error={errors.serviceName}>
            {(props) => (
              <select
                {...props}
                value={servicePick}
                onChange={(event) => setServicePick(event.target.value)}
              >
                {SERVICE_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </Field>

          {servicePick === 'Other' ? (
            <Field label="Which service" required error={errors.serviceName}>
              {(props) => (
                <input
                  {...props}
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder="e.g. Ducting work"
                  autoComplete="off"
                />
              )}
            </Field>
          ) : null}

          <div className="fieldrow">
            <AmountField
              label="Amount"
              required
              value={amountText}
              onChange={setAmountText}
              error={errors.amount}
            />
            <Field label="Service date" required error={errors.serviceDate}>
              {(props) => (
                <input
                  {...props}
                  type="date"
                  value={serviceDate}
                  onChange={(event) => setServiceDate(event.target.value)}
                />
              )}
            </Field>
          </div>

          <div className="divider" />

          <Segmented
            label="Payment"
            ariaLabel="Payment status"
            tone
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
          />

          {status === 'PARTIAL' ? (
            <AmountField
              label="Received so far"
              required
              value={paidText}
              onChange={setPaidText}
              error={errors.paidAmount}
            />
          ) : null}

          {status !== 'PENDING' ? (
            <Field label="Payment date" error={errors.paymentDate}>
              {(props) => (
                <input
                  {...props}
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                />
              )}
            </Field>
          ) : null}

          {pendingPreview !== null ? (
            <div className={`callout${pendingPreview <= 0 ? ' callout--settled' : ''}`}>
              <div>
                <span className="k">{pendingPreview <= 0 ? 'Fully settled' : 'Will stay pending'}</span>
                <span className="v">{money(Math.max(pendingPreview, 0))}</span>
              </div>
              {pendingPreview > 0 ? (
                <span className="note">
                  Collect later from
                  <br />
                  {nameOf(list, customerId) || 'this customer'}
                </span>
              ) : null}
            </div>
          ) : null}

          <Field label="Remarks" error={errors.remarks}>
            {(props) => (
              <textarea
                {...props}
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder="Spares used, complaint, anything to remember"
                rows={2}
              />
            )}
          </Field>
        </form>
      </Sheet>

      {addingCustomer ? (
        <CustomerFormSheet
          onClose={() => setAddingCustomer(false)}
          onSaved={(created) => {
            setCustomerId(String(created.id));
            customers.reload();
          }}
        />
      ) : null}
    </>
  );
}

function nameOf(list, id) {
  return list.find((customer) => String(customer.id) === String(id))?.name || '';
}

/** 2500.00 from the API reads better as "2500" in an input box. */
function trimZeros(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return Number.isInteger(n) ? String(n) : String(n);
}
