import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/AppShell.jsx';
import { CustomerFormSheet } from '../components/CustomerFormSheet.jsx';
import { useAsync, useDebounced } from '../hooks/useAsync.js';
import { api } from '../lib/api.js';
import { initials, money, toNumber } from '../lib/format.js';
import { IconCustomers, IconPlus, IconSearch, IconUserPlus } from '../ui/Icons.jsx';
import { EmptyState, ErrorBox, Skeleton } from '../ui/States.jsx';

/**
 * Who the company works for. Each row carries the two figures that matter — what they
 * have been billed in total, and what is still owed — so the list doubles as the
 * collection sheet.
 */
export default function Customers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 280);
  const [adding, setAdding] = useState(false);

  const { data, loading, error, reload } = useAsync(
    (signal) => api.customers.list(debounced.trim() || undefined, signal),
    [debounced],
  );

  const customers = data || [];
  const searching = debounced.trim().length > 0;

  return (
    <>
      <TopBar
        eyebrow="OceanCool"
        title="Customers"
        actions={
          <button
            type="button"
            className="iconbtn"
            onClick={() => setAdding(true)}
            aria-label="Add customer"
          >
            <IconPlus />
          </button>
        }
      />

      <div className="page">
        <div className="searchbox">
          <IconSearch />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or phone number"
            aria-label="Search customers"
            autoComplete="off"
          />
          {search ? (
            <button
              type="button"
              className="clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              &times;
            </button>
          ) : null}
        </div>

        <ErrorBox error={error} onRetry={reload} />

        {loading && !data ? (
          <Skeleton variant="row" count={6} />
        ) : customers.length === 0 ? (
          searching ? (
            <EmptyState icon={<IconSearch />} title="No customer matched">
              Nothing found for &ldquo;{debounced.trim()}&rdquo;. Try part of the name or the
              phone number.
            </EmptyState>
          ) : (
            <EmptyState
              icon={<IconCustomers />}
              title="No customers yet"
              action={
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => setAdding(true)}
                >
                  <IconUserPlus />
                  Add the first customer
                </button>
              }
            >
              Add a customer once, then every service you record for them builds up their
              history and their pending amount.
            </EmptyState>
          )
        ) : (
          <>
            <div className="section__head">
              <h2>{searching ? 'Matches' : 'All customers'}</h2>
              <span className="rule" />
              <span className="tally">{customers.length}</span>
            </div>

            <ul className="list">
              {customers.map((customer) => {
                const pending = toNumber(customer.pendingAmount) ?? 0;
                return (
                  <li key={customer.id}>
                    <button
                      type="button"
                      className="rowlink"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <span className="avatar" aria-hidden="true">
                        {initials(customer.name)}
                      </span>
                      <span className="body">
                        <span className="t1">{customer.name}</span>
                        <span className="t2">
                          {customer.phoneNumber || 'No phone number'} ·{' '}
                          {customer.totalServices}{' '}
                          {customer.totalServices === 1 ? 'service' : 'services'}
                        </span>
                        {pending > 0 ? (
                          <span className="t3">{money(pending)} pending</span>
                        ) : null}
                      </span>
                      <span className="figs">
                        <span className="amt">{money(customer.totalAmount)}</span>
                        <span
                          className="amt2"
                          style={{ color: pending > 0 ? 'var(--copper-ink)' : 'var(--good-ink)' }}
                        >
                          {pending > 0 ? 'owes' : 'settled'}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <button type="button" className="fab" onClick={() => setAdding(true)}>
        <IconUserPlus />
        New customer
      </button>

      {adding ? (
        <CustomerFormSheet
          onClose={() => setAdding(false)}
          onSaved={(created) => {
            reload();
            navigate(`/customers/${created.id}`);
          }}
        />
      ) : null}
    </>
  );
}
