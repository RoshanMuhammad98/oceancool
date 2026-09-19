import { dateShort, money, toNumber } from '../lib/format.js';
import { StatusPill } from '../ui/Pill.jsx';

/**
 * One job in a list. Used on the dashboard, the service list and a customer's history.
 *
 * `variant` only decides which line leads:
 *   customer  customer name, then service and date   (dashboard)
 *   grouped   customer name, then service only       (lists already headed by a date)
 *   service   service name, then date                (one customer's history)
 *
 * The left stripe and the pill both carry the payment state, and anything still owed
 * gets its own copper line, so an unpaid job is visible without reading the row.
 */
export function ServiceRow({ service, onOpen, variant = 'customer' }) {
  const pending = toNumber(service.pendingAmount) ?? 0;
  const leadsWithCustomer = variant !== 'service';

  return (
    <button
      type="button"
      className="rowlink"
      data-status={service.paymentStatus}
      onClick={() => onOpen?.(service)}
    >
      <span className="body">
        <span className="t1">
          {leadsWithCustomer ? service.customerName : service.serviceName}
        </span>
        <span className="t2">
          {variant === 'grouped'
            ? service.serviceName
            : leadsWithCustomer
              ? `${service.serviceName} · ${dateShort(service.serviceDate)}`
              : dateShort(service.serviceDate)}
        </span>
        {pending > 0 ? <span className="t3">{money(pending)} pending</span> : null}
      </span>
      <span className="figs">
        <span className="amt">{money(service.amount)}</span>
        <StatusPill status={service.paymentStatus} />
      </span>
    </button>
  );
}
