import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import {
  BrandMark,
  IconCustomers,
  IconDashboard,
  IconLogout,
  IconReports,
  IconServices,
  IconSettings,
} from '../ui/Icons.jsx';

/*
 * The layout every signed-in screen sits in.
 *
 * One set of navigation items rendered twice: as bottom tabs on a phone (thumb
 * reachable, five targets) and as a side rail from 900px up, where a bottom bar would
 * read as a phone app stretched wide. CSS decides which is visible; there is no second
 * component to keep in sync.
 */

const NAV = [
  { to: '/', label: 'Home', railLabel: 'Dashboard', Icon: IconDashboard, end: true },
  { to: '/customers', label: 'Customers', Icon: IconCustomers },
  { to: '/services', label: 'Services', Icon: IconServices },
  { to: '/reports', label: 'Reports', Icon: IconReports },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
];

export function AppShell() {
  const { user, signOut } = useAuth();

  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">
          <span className="brandmark">
            <BrandMark />
          </span>
          <span className="name">
            OceanCool
            <span>AC Service</span>
          </span>
        </div>

        <nav aria-label="Sections">
          {NAV.map(({ to, label, railLabel, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
            >
              <Icon />
              <span>{railLabel || label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="footer">
          <div className="eyebrow">Signed in</div>
          <div className="truncate" style={{ fontWeight: 600 }}>
            {user?.displayName || user?.username}
          </div>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => signOut()}>
            <IconLogout />
            Sign out
          </button>
        </div>
      </aside>

      <div className="frame">
        <Outlet />
      </div>

      <nav className="tabbar" aria-label="Sections">
        <div className="inner">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

/**
 * The sticky header of a screen. The brand mark shows only on a phone, where the rail
 * that normally carries it is hidden.
 */
export function TopBar({ eyebrow, title, actions }) {
  return (
    <header className="topbar">
      <span className="brandmark">
        <BrandMark />
      </span>
      <div className="titles">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
      </div>
      {actions}
    </header>
  );
}
