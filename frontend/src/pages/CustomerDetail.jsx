import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../components/AppShell.jsx';
import { CustomerFormSheet } from '../components/CustomerFormSheet.jsx';
import { ServiceDetailSheet } from '../components/ServiceDetailSheet.jsx';
import { ServiceFormSheet } from '../components/ServiceFormSheet.jsx';
import { ServiceRow } from '../components/ServiceRow.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { api, ApiError } from '../lib/api.js';
import { amount, money, toNumber } from '../lib/format.js';
import { Confirm } from '../ui/Confirm.jsx';
import {
  IconChevronLeft,
  IconEdit,
  IconPhone,
  IconPlus,
  IconServices,
  IconTrash,
} from '../ui/Icons.jsx';
import { EmptyState, ErrorBox, LoadingScreen } from '../ui/States.jsx';
import { useToast } from '../ui/Toast.jsx';

/**
 * One customer: who they are, what they owe, and everything ever done for them.
 *
 * Deleting is deliberately two steps — the first attempt is refused by the API when
 * there is history, and only then is the "history as well" option offered.
 */
export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data, loading, error, reload } = useAsync(
    (signal) => api.customers.detail(id, signal),
    [id],
  );

  const [addingService, setAddingService] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [openService, setOpenService] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [forceDelete, setForceDelete] = useState(null);

  const customer = data?.customer;
  const services = data?.services || [];
  const pending = toNumber(customer?.pendingAmount) ?? 0;

  async function removeCustomer(force) {
    try {
      await api.customers.remove(id, force);
      toast.success(`${customer.name} deleted`);
      navigate('/customers', { replace: true });
    } catch (err) {
      setConfirmDelete(false);
      if (err instanceof ApiError && err.status === 400) {
        // has service history — offer the explicit "delete the history too" path
        setForceDelete(err.message);
        return;
      }
      toast.error(err.message);
    }
  }

  return (
    <>
      <TopBar
        eyebrow="Customer"
        title={customer?.name || 'Customer'}
        actions={
          <button
            type="button"
            className="iconbtn"
            onClick={() => navigate('/customers')}
            aria-label="Back to customers"
          >
            <IconChevronLeft />
          </button>
        }
      />

      <div className="page">
        <ErrorBox error={error} onRetry={reload} />

        {loading && !data ? (
          <LoadingScreen label="Loading customer" />
        ) : customer ? (
          <>
            <div className={`hero${pending <= 0 ? ' hero--settled' : ''}`}>
              <span className="lead">
                <span className="k">{pending > 0 ? 'Pending amount' : 'Nothing pending'}</span>
                <span className="v">{money(pending)}</span>
              </span>
              <span className="side">
                {money(customer.totalAmount)} billed
                <br />
                {money(customer.paidAmount)} received
              </span>
            </div>

            <div className="panel">
              <div className="panel__body">
                {customer.phoneNumber ? (
                  <div className="telline">
                    <IconPhone style={{ width: 16, height: 16, color: 'var(--ink-3)' }} />
                    <a href={`tel:${customer.phoneNumber.replace(/\s/g, '')}`}>
                      {customer.phoneNumber}
                    </a>
                  </div>
                ) : (
                  <p className="hint">No phone number saved.</p>
                )}

                {customer.address ? <p className="hint">{customer.address}</p> : null}

                <div className="tiles tiles--three">
                  <div className="tile">
                    <span className="k">Services</span>
                    <span className="v">{amount(customer.totalServices)}</span>
                  </div>
                  <div className="tile tile--good">
                    <span className="k">Received</span>
                    <span className="v">{money(customer.paidAmount)}</span>
                  </div>
                  <div className="tile tile--due">
                    <span className="k">Pending</span>
                    <span className="v">{money(pending)}</span>
                  </div>
                </div>

                <div className="btnrow--split">
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setAddingService(true)}
                  >
                    <IconPlus />
                    Add service
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setEditingCustomer(true)}
                  >
                    <IconEdit />
                    Edit customer
                  </button>
                </div>
              </div>
            </div>

            <section className="section">
              <div className="section__head">
                <h2>Service history</h2>
                <span className="rule" />
                <span className="tally">{services.length}</span>
              </div>

              {services.length === 0 ? (
                <EmptyState
                  icon={<IconServices />}
                  title="No services yet"
                  action={
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => setAddingService(true)}
                    >
                      <IconPlus />
                      Add a service
                    </button>
                  }
                >
                  Once you record a job for {customer.name}, it shows here with the amount and
                  the payment status.
                </EmptyState>
              ) : (
                <ul className="list">
                  {services.map((service) => (
                    <li key={service.id}>
                      <ServiceRow service={service} variant="service" onOpen={setOpenService} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="divider" />

            <button
              type="button"
              className="btn btn--sm btn--danger"
              onClick={() => setConfirmDelete(true)}
              style={{ alignSelf: 'flex-start' }}
            >
              <IconTrash />
              Delete customer
            </button>
          </>
        ) : null}
      </div>

      {addingService ? (
        <ServiceFormSheet
          presetCustomerId={id}
          onClose={() => setAddingService(false)}
          onSaved={reload}
        />
      ) : null}

      {editingCustomer ? (
        <CustomerFormSheet
          customer={customer}
          onClose={() => setEditingCustomer(false)}
          onSaved={reload}
        />
      ) : null}

      {openService ? (
        <ServiceDetailSheet
          service={openService}
          onClose={() => setOpenService(null)}
          onChanged={reload}
          onEdit={(service) => {
            setOpenService(null);
            setEditingService(service);
          }}
        />
      ) : null}

      {editingService ? (
        <ServiceFormSheet
          service={editingService}
          onClose={() => setEditingService(null)}
          onSaved={reload}
        />
      ) : null}

      {confirmDelete ? (
        <Confirm
          title={`Delete ${customer?.name}?`}
          body="The customer will be removed. Their service history is kept unless you confirm again."
          confirmLabel="Delete customer"
          onConfirm={() => removeCustomer(false)}
          onClose={() => setConfirmDelete(false)}
        />
      ) : null}

      {forceDelete ? (
        <Confirm
          title="Delete the service history too?"
          body={`${forceDelete} Deleting now removes every service record for this customer as well. This cannot be undone.`}
          confirmLabel="Delete everything"
          cancelLabel="Keep the records"
          onConfirm={() => removeCustomer(true)}
          onClose={() => setForceDelete(null)}
        />
      ) : null}
    </>
  );
}
