import { useState } from 'react';
import { api, ApiError } from '../lib/api.js';
import { Field } from '../ui/Field.jsx';
import { Sheet } from '../ui/Sheet.jsx';
import { ButtonSpinner } from '../ui/States.jsx';
import { useToast } from '../ui/Toast.jsx';

/**
 * Add or edit a customer. Name is the only required field — a mechanic standing in
 * someone's kitchen should be able to save a customer in one line and fill in the rest
 * later.
 */
export function CustomerFormSheet({ customer, onClose, onSaved }) {
  const editing = Boolean(customer?.id);
  const toast = useToast();

  const [name, setName] = useState(customer?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(customer?.phoneNumber || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;

    const next = {};
    if (!name.trim()) next.name = 'Customer name is required';
    if (phoneNumber.trim() && !/^[0-9+\-\s]{6,20}$/.test(phoneNumber.trim())) {
      next.phoneNumber = 'Enter a valid phone number';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    const body = {
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
    };

    try {
      const saved = editing
        ? await api.customers.update(customer.id, body)
        : await api.customers.create(body);
      toast.success(editing ? 'Customer updated' : `${saved.name} added`);
      onSaved?.(saved);
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) setErrors(error.fieldErrors);
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      title={editing ? 'Edit customer' : 'New customer'}
      subtitle={editing ? customer.name : 'Name is enough to start'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="customer-form" className="btn btn--primary" disabled={busy}>
            {busy ? <ButtonSpinner /> : null}
            {editing ? 'Save changes' : 'Add customer'}
          </button>
        </>
      }
    >
      <form className="form" id="customer-form" onSubmit={submit} noValidate>
        <Field label="Customer name" required error={errors.name}>
          {(props) => (
            <input
              {...props}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. ABC Company"
              autoComplete="off"
              autoFocus
            />
          )}
        </Field>

        <Field label="Phone number" error={errors.phoneNumber}>
          {(props) => (
            <input
              {...props}
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              type="tel"
              inputMode="tel"
              placeholder="98470 00000"
              autoComplete="off"
            />
          )}
        </Field>

        <Field label="Address" error={errors.address}>
          {(props) => (
            <textarea
              {...props}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Building, area, city"
              rows={2}
            />
          )}
        </Field>
      </form>
    </Sheet>
  );
}
