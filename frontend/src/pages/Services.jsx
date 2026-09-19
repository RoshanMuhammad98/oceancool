import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TopBar } from '../components/AppShell.jsx';
import { ServiceDetailSheet } from '../components/ServiceDetailSheet.jsx';
import { ServiceFormSheet } from '../components/ServiceFormSheet.jsx';
import { ServiceRow } from '../components/ServiceRow.jsx';
import { useAsync, useDebounced } from '../hooks/useAsync.js';
import { api } from '../lib/api.js';
import {
  dayLabel,
  money,
  thisMonthRange,
  thisWeekRange,
  todayRange,
  toNumber,
} from '../lib/format.js';
import { Field } from '../ui/Field.jsx';
import { IconPlus, IconSearch, IconServices } from '../ui/Icons.jsx';
import { EmptyState, ErrorBox, Skeleton } from '../ui/States.jsx';

/*
 * Every job, filtered the way the shop asks about them: what happened today, what is
 * still unpaid, what a particular customer owes. Rows are grouped by day with a day
 * total, so a week's work reads as a sequence rather than a wall.
 */

const PERIODS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom' },
];

const STATUSES = [
  { value: '', label: 'Any status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIAL', label: 'Part paid' },
  { value: 'PAID', label: 'Paid' },
];

export default function Services({ openNew = false }) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const [period, setPeriod] = useState(params.get('period') || 'month');
  const [status, setStatus] = useState(params.get('status') || '');
  const [customFrom, setCustomFrom] = useState(params.get('from') || '');
  const [customTo, setCustomTo] = useState(params.get('to') || '');
  const [search, setSearch] = useState(params.get('q') || '');
  const debounced = useDebounced(search, 280);

  const [adding, setAdding] = useState(openNew);
  const [openService, setOpenService] = useState(null);
  const [editingService, setEditingService] = useState(null);

  const range = useMemo(() => {
    if (period === 'today') return todayRange();
    if (period === 'week') return thisWeekRange();
    if (period === 'month') return thisMonthRange();
    if (period === 'custom') return { from: customFrom || undefined, to: customTo || undefined };
    return { from: undefined, to: undefined };
  }, [period, customFrom, customTo]);

  // keep the filters in the URL so a filtered view can be bookmarked or shared
  useEffect(() => {
    const next = {};
    if (period !== 'month') next.period = period;
    if (status) next.status = status;
    if (period === 'custom' && customFrom) next.from = customFrom;
    if (period === 'custom' && customTo) next.to = customTo;
    if (debounced.trim()) next.q = debounced.trim();
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, status, customFrom, customTo, debounced]);

  const { data, loading, error, reload } = useAsync(
    (signal) =>
      api.services.list(
        {
          from: range.from,
          to: range.to,
          status: status || undefined,
          q: debounced.trim() || undefined,
        },
        signal,
      ),
    [range.from, range.to, status, debounced],
  );

  const services = data || [];
  const groups = useMemo(() => groupByDay(services), [services]);

  const totals = useMemo(() => {
    let billed = 0;
    let pending = 0;
    services.forEach((service) => {
      billed += toNumber(service.amount) ?? 0;
      pending += toNumber(service.pendingAmount) ?? 0;
    });
    return { billed, pending };
  }, [services]);

  const filtered = Boolean(status) || period !== 'all' || debounced.trim().length > 0;

  return (
    <>
      <TopBar
        eyebrow="OceanCool"
        title="Services"
        actions={
          <button
            type="button"
            className="iconbtn"
            onClick={() => setAdding(true)}
            aria-label="Add service"
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
            placeholder="Search customer, phone or service"
            aria-label="Search services"
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

        <div className="filters" role="group" aria-label="Filter by period">
          {PERIODS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="chip"
              aria-pressed={period === option.value}
              onClick={() => setPeriod(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {period === 'custom' ? (
          <div className="fieldrow">
            <Field label="From">
              {(props) => (
                <input
                  {...props}
                  type="date"
                  value={customFrom}
                  onChange={(event) => setCustomFrom(event.target.value)}
                />
              )}
            </Field>
            <Field label="To">
              {(props) => (
                <input
                  {...props}
                  type="date"
                  value={customTo}
                  onChange={(event) => setCustomTo(event.target.value)}
                />
              )}
            </Field>
          </div>
        ) : null}

        <div className="filters" role="group" aria-label="Filter by payment status">
          {STATUSES.map((option) => (
            <button
              key={option.value || 'any'}
              type="button"
              className="chip"
              aria-pressed={status === option.value}
              onClick={() => setStatus(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <ErrorBox error={error} onRetry={reload} />

        {loading && !data ? (
          <Skeleton variant="row" count={6} />
        ) : services.length === 0 ? (
          filtered ? (
            <EmptyState icon={<IconSearch />} title="Nothing matches these filters">
              Try a wider period, or clear the status filter.
            </EmptyState>
          ) : (
            <EmptyState
              icon={<IconServices />}
              title="No services recorded"
              action={
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => setAdding(true)}
                >
                  <IconPlus />
                  Add the first service
                </button>
              }
            >
              Record a job with the customer, the amount and whether it is paid. The pending
              figures build themselves from there.
            </EmptyState>
          )
        ) : (
          <>
            <div className="tiles tiles--three">
              <div className="tile">
                <span className="k">Services</span>
                <span className="v">{services.length}</span>
              </div>
              <div className="tile">
                <span className="k">Billed</span>
                <span className="v">{money(totals.billed)}</span>
              </div>
              <div className="tile tile--due">
                <span className="k">Pending</span>
                <span className="v">{money(totals.pending)}</span>
              </div>
            </div>

            {groups.map((group) => (
              <section className="section" key={group.date}>
                <div className="daybar">
                  <span className="d">{dayLabel(group.date)}</span>
                  <span className="rule" />
                  <span className="dt">{money(group.total)}</span>
                </div>
                <ul className="list">
                  {group.items.map((service) => (
                    <li key={service.id}>
                      {/* the day heading above already carries the date */}
                      <ServiceRow service={service} variant="grouped" onOpen={setOpenService} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>

      <button type="button" className="fab" onClick={() => setAdding(true)}>
        <IconPlus />
        New service
      </button>

      {adding ? (
        <ServiceFormSheet
          onClose={() => {
            setAdding(false);
            // arrived from the home-screen "Add service" shortcut — drop /new from the URL
            if (openNew) navigate('/services', { replace: true });
          }}
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
    </>
  );
}

/** The API already sorts newest first, so insertion order is the display order. */
function groupByDay(services) {
  const byDate = new Map();
  services.forEach((service) => {
    const key = service.serviceDate;
    if (!byDate.has(key)) byDate.set(key, { date: key, total: 0, items: [] });
    const group = byDate.get(key);
    group.items.push(service);
    group.total += toNumber(service.amount) ?? 0;
  });
  return Array.from(byDate.values());
}
