import { useMemo, useState } from 'react';
import { TopBar } from '../components/AppShell.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { api } from '../lib/api.js';
import { amount, date, money, toIso, toNumber } from '../lib/format.js';
import { Field, Segmented } from '../ui/Field.jsx';
import { IconReports } from '../ui/Icons.jsx';
import { EmptyState, ErrorBox, Skeleton, TilesSkeleton } from '../ui/States.jsx';

/*
 * Revenue over a period, grouped by day, week, month or year.
 *
 * Each row's bar is scaled against the biggest row, and split green/copper — collected
 * against still owed — so a month that billed well but collected badly is obvious
 * without reading a single figure.
 */

const GROUPS = [
  { value: 'DAY', label: 'Day' },
  { value: 'WEEK', label: 'Week' },
  { value: 'MONTH', label: 'Month' },
  { value: 'YEAR', label: 'Year' },
];

export default function Reports() {
  const presets = useMemo(buildPresets, []);
  const [presetKey, setPresetKey] = useState('year');
  const [groupBy, setGroupBy] = useState('MONTH');
  const [from, setFrom] = useState(presets.year.from);
  const [to, setTo] = useState(presets.year.to);

  const { data, loading, error, reload } = useAsync(
    (signal) => api.reports.get({ from, to, groupBy }, signal),
    [from, to, groupBy],
  );

  function applyPreset(key) {
    setPresetKey(key);
    if (key === 'custom') return;
    setFrom(presets[key].from);
    setTo(presets[key].to);
    if (presets[key].groupBy) setGroupBy(presets[key].groupBy);
  }

  const buckets = data?.buckets || [];
  const maxAmount = buckets.reduce(
    (max, bucket) => Math.max(max, toNumber(bucket.amount) ?? 0),
    0,
  );

  const collectionRate =
    data && (toNumber(data.totalAmount) ?? 0) > 0
      ? Math.round(((toNumber(data.collectedAmount) ?? 0) / (toNumber(data.totalAmount) ?? 1)) * 100)
      : null;

  return (
    <>
      <TopBar eyebrow="OceanCool" title="Reports" />

      <div className="page">
        <div className="filters" role="group" aria-label="Report period">
          {[
            { key: 'month', label: 'This month' },
            { key: 'year', label: 'This year' },
            { key: 'last12', label: 'Last 12 months' },
            { key: 'custom', label: 'Custom' },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              className="chip"
              aria-pressed={presetKey === option.key}
              onClick={() => applyPreset(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {presetKey === 'custom' ? (
          <div className="fieldrow">
            <Field label="From">
              {(props) => (
                <input
                  {...props}
                  type="date"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                />
              )}
            </Field>
            <Field label="To">
              {(props) => (
                <input
                  {...props}
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                />
              )}
            </Field>
          </div>
        ) : null}

        <Segmented
          label="Group by"
          ariaLabel="Group the report by"
          options={GROUPS}
          value={groupBy}
          onChange={setGroupBy}
        />

        <ErrorBox error={error} onRetry={reload} />

        {loading && !data ? (
          <>
            <TilesSkeleton />
            <Skeleton variant="row" count={4} />
          </>
        ) : data ? (
          <>
            <p className="hint">
              {date(data.from)} to {date(data.to)}
            </p>

            <div className="tiles">
              <div className="tile">
                <span className="k">Services</span>
                <span className="v">{amount(data.totalServices)}</span>
              </div>
              <div className="tile">
                <span className="k">Total billed</span>
                <span className="v">{money(data.totalAmount)}</span>
              </div>
              <div className="tile tile--good">
                <span className="k">Collected</span>
                <span className="v">{money(data.collectedAmount)}</span>
                <span className="sub">
                  {collectionRate === null ? 'nothing billed' : `${collectionRate}% of billed`}
                </span>
              </div>
              <div className="tile tile--due">
                <span className="k">Pending</span>
                <span className="v">{money(data.pendingAmount)}</span>
              </div>
            </div>

            <section className="section">
              <div className="section__head">
                <h2>{groupLabel(groupBy)}</h2>
                <span className="rule" />
                <span className="tally">{buckets.length}</span>
              </div>

              {buckets.length === 0 ? (
                <EmptyState icon={<IconReports />} title="No services in this period">
                  Pick a wider range, or record a service to see it appear here.
                </EmptyState>
              ) : (
                <div className="panel">
                  <div className="panel__body">
                    <div className="mix">
                      {buckets.map((bucket) => {
                        const billed = toNumber(bucket.amount) ?? 0;
                        const collected = toNumber(bucket.collected) ?? 0;
                        const pending = toNumber(bucket.pending) ?? 0;
                        const scale = maxAmount > 0 ? 100 / maxAmount : 0;

                        return (
                          <div className="mixrow" key={bucket.label}>
                            <span className="ml">{bucket.label}</span>
                            <span className="mv">{money(billed)}</span>
                            <span className="bar">
                              <span
                                className="got"
                                style={{ width: `${collected * scale}%` }}
                                title={`${money(collected)} collected`}
                              />
                              <span
                                className="owed"
                                style={{ width: `${pending * scale}%` }}
                                title={`${money(pending)} pending`}
                              />
                            </span>
                            <span className="legend">
                              <span className="got">{money(collected)} in</span>
                              {pending > 0 ? (
                                <span className="owed">{money(pending)} due</span>
                              ) : null}
                              <span>
                                {bucket.services}{' '}
                                {bucket.services === 1 ? 'service' : 'services'}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}

function groupLabel(groupBy) {
  if (groupBy === 'DAY') return 'Day by day';
  if (groupBy === 'WEEK') return 'Week by week';
  if (groupBy === 'YEAR') return 'Year by year';
  return 'Month by month';
}

function buildPresets() {
  const now = new Date();
  const year = now.getFullYear();

  const monthFrom = new Date(year, now.getMonth(), 1);
  const monthTo = new Date(year, now.getMonth() + 1, 0);
  const last12From = new Date(year, now.getMonth() - 11, 1);

  return {
    month: { from: toIso(monthFrom), to: toIso(monthTo), groupBy: 'DAY' },
    year: { from: `${year}-01-01`, to: `${year}-12-31`, groupBy: 'MONTH' },
    last12: { from: toIso(last12From), to: toIso(monthTo), groupBy: 'MONTH' },
    custom: {},
  };
}
