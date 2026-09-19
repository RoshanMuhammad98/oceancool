import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { date, dateTime, money, toNumber } from '../lib/format.js';
import { IconEdit, IconTrash, IconWallet } from '../ui/Icons.jsx';
import { StatusPill } from '../ui/Pill.jsx';
import { Sheet } from '../ui/Sheet.jsx';
import { useToast } from '../ui/Toast.jsx';
import { Confirm } from '../ui/Confirm.jsx';
import { PaymentSheet } from './PaymentSheet.jsx';

/**
 * Everything about one job, and the two things staff do next: take the money, or fix a
 * typo. Collecting is the primary action while anything is owed; once it is settled,
 * editing leads.
 */
export function ServiceDetailSheet({ service, onClose, onChanged, onEdit }) {
  const toast = useToast();
  const [collecting, setCollecting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const pending = toNumber(service.pendingAmount) ?? 0;
  const paid = toNumber(service.paidAmount) ?? 0;

  async function remove() {
    try {
      await api.services.remove(service.id);
      toast.success('Service record deleted');
      setConfirmingDelete(false);
      onChanged?.();
      onClose();
    } catch (error) {
      toast.error(error.message);
      setConfirmingDelete(false);
    }
  }

  return (
    <>
      <Sheet
        title={service.serviceName}
        subtitle={`${service.customerName} · ${date(service.serviceDate)}`}
        onClose={onClose}
        footer={
          pending > 0 ? (
            <>
              <button type="button" className="btn" onClick={() => onEdit?.(service)}>
                <IconEdit />
                Edit
              </button>
              <button
                type="button"
                className="btn btn--cash"
                onClick={() => setCollecting(true)}
              >
                <IconWallet />
                Record payment
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--primary" onClick={() => onEdit?.(service)}>
              <IconEdit />
              Edit service
            </button>
          )
        }
      >
        <div className={`callout${pending <= 0 ? ' callout--settled' : ''}`}>
          <div>
            <span className="k">{pending > 0 ? 'Still to collect' : 'Fully paid'}</span>
            <span className="v">{money(pending > 0 ? pending : service.amount)}</span>
          </div>
          <span className="note">
            {money(service.amount)} billed
            <br />
            {money(paid)} received
          </span>
        </div>

        <dl className="kv">
          <dt>Customer</dt>
          <dd>
            <Link to={`/customers/${service.customerId}`} onClick={onClose}>
              {service.customerName}
            </Link>
            {service.customerPhone ? ` · ${service.customerPhone}` : ''}
          </dd>

          <dt>Service</dt>
          <dd>{service.serviceName}</dd>

          <dt>Service date</dt>
          <dd className="mono">{date(service.serviceDate)}</dd>

          <dt>Status</dt>
          <dd>
            <StatusPill status={service.paymentStatus} />
          </dd>

          <dt>Payment date</dt>
          <dd className="mono">
            {service.paymentDate ? date(service.paymentDate) : 'Not collected yet'}
          </dd>

          {service.remarks ? (
            <>
              <dt>Remarks</dt>
              <dd className="note">{service.remarks}</dd>
            </>
          ) : null}

          <dt>Recorded</dt>
          <dd className="muted">{dateTime(service.createdAt)}</dd>
        </dl>

        <div className="divider" />

        <button
          type="button"
          className="btn btn--sm btn--danger"
          onClick={() => setConfirmingDelete(true)}
          style={{ alignSelf: 'flex-start' }}
        >
          <IconTrash />
          Delete this record
        </button>
      </Sheet>

      {collecting ? (
        <PaymentSheet
          service={service}
          onClose={() => setCollecting(false)}
          onSaved={() => {
            onChanged?.();
            onClose();
          }}
        />
      ) : null}

      {confirmingDelete ? (
        <Confirm
          title="Delete this service record?"
          body={`${service.serviceName} for ${service.customerName} — ${money(
            service.amount,
          )} — will be removed. This cannot be undone.`}
          confirmLabel="Delete record"
          onConfirm={remove}
          onClose={() => setConfirmingDelete(false)}
        />
      ) : null}
    </>
  );
}
