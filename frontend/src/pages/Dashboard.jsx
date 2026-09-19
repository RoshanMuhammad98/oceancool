import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TopBar } from '../components/AppShell.jsx';
import { ServiceDetailSheet } from '../components/ServiceDetailSheet.jsx';
import { ServiceFormSheet } from '../components/ServiceFormSheet.jsx';
import { ServiceRow } from '../components/ServiceRow.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useInstallPrompt } from '../hooks/useInstallPrompt.js';
import { api } from '../lib/api.js';
import { amount, money } from '../lib/format.js';
import { IconInstall, IconPlus, IconRefresh, IconServices } from '../ui/Icons.jsx';
import { EmptyState, ErrorBox, LoadingScreen, Skeleton } from '../ui/States.jsx';

/**
 * The opening screen. Total pending leads, because that is the number the company
 * actually chases; the day's figures sit under it, and the last ten jobs give a
 * one-tap route into anything that needs collecting.
 */
export default function Dashboard() {
  const { data, loading, error, reload } = useAsync((signal) => api.dashboard(signal), []);
  const install = useInstallPrompt();

  const [adding, setAdding] = useState(false);
  const [openService, setOpenService] = useState(null);
  const [editingService, setEditingService] = useState(null);

  const pending = Number(data?.totalPending ?? 0);

  return (
    <>
      <TopBar
        eyebrow="OceanCool"
        title="Today"
        actions={
          <>
            <button
              type="button"
              className="iconbtn"
              onClick={reload}
              aria-label="Refresh figures"
            >
              <IconRefresh />
            </button>
            {/* the phone reaches this through the floating button instead */}
            <button
              type="button"
              className="btn btn--primary btn--sm only-wide"
              onClick={() => setAdding(true)}
            >
              <IconPlus />
              New service
            </button>
          </>
        }
      />

      <div className="page">
        {install.showBanner ? (
          <div className="installbar">
            <span className="txt">
              <b>Install OceanCool</b>
              Add it to the home screen and it opens like an app.
            </span>
            <button type="button" className="btn btn--sm" onClick={install.promptInstall}>
              <IconInstall />
              Install
            </button>
            <button
              type="button"
              className="dismiss"
              onClick={install.dismiss}
              aria-label="Dismiss install suggestion"
            >
              &times;
            </button>
          </div>
        ) : null}

        <ErrorBox error={error} onRetry={reload} />

        {loading && !data ? (
          <LoadingScreen label="Loading today's figures" />
        ) : data ? (
          <>
            <div className="band">
              <Link
                to="/services?status=PENDING"
                className={`hero${pending <= 0 ? ' hero--settled' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                <span className="lead">
                  <span className="k">
                    {pending > 0 ? 'Total pending' : 'Everything collected'}
                  </span>
                  <span className="v">{money(pending)}</span>
                </span>
                <span className="side">
                  {pending > 0 ? (
                    <>
                      across all customers
                      <br />
                      tap to see who owes
                    </>
                  ) : (
                    <>
                      no money
                      <br />
                      outstanding
                    </>
                  )}
                </span>
              </Link>

              <div className="tiles">
                <div className="tile tile--cool">
                  <span className="k">Today&rsquo;s services</span>
                  <span className="v">{amount(data.todayServices)}</span>
                  <span className="sub">{data.todayServices === 1 ? 'job' : 'jobs'} logged</span>
                </div>
                <div className="tile">
                  <span className="k">Billed today</span>
                  <span className="v">{money(data.todayRevenue)}</span>
                  <span className="sub">{money(data.todayCollected)} collected</span>
                </div>
                <div className="tile tile--good">
                  <span className="k">Billed this month</span>
                  <span className="v">{money(data.monthRevenue)}</span>
                  <span className="sub">{money(data.monthCollected)} collected</span>
                </div>
                <div className="tile">
                  <span className="k">Customers</span>
                  <span className="v">{amount(data.totalCustomers)}</span>
                  <span className="sub">on the books</span>
                </div>
              </div>
            </div>

            <section className="section">
              <div className="section__head">
                <h2>Recent services</h2>
                <span className="rule" />
                <Link to="/services">See all</Link>
              </div>

              {data.recentServices.length === 0 ? (
                <EmptyState
                  icon={<IconServices />}
                  title="No services yet"
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
                  Every job you record shows up here with what was billed and what is still
                  owed.
                </EmptyState>
              ) : (
                <ul className="list">
                  {data.recentServices.map((service) => (
                    <li key={service.id}>
                      <ServiceRow service={service} onOpen={setOpenService} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : (
          <Skeleton variant="row" count={3} />
        )}
      </div>

      <button type="button" className="fab" onClick={() => setAdding(true)}>
        <IconPlus />
        New service
      </button>

      {adding ? (
        <ServiceFormSheet onClose={() => setAdding(false)} onSaved={reload} />
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
