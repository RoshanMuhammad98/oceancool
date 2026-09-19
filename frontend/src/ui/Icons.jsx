/*
 * One icon family, hand-drawn on a 24x24 grid with a 1.8 stroke and round joins, so
 * everything in the app looks like it came from the same set. No icon dependency.
 */

function Stroke({ children, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** The OceanCool mark: an indoor unit with three airflow bars, the last one short. */
export function BrandMark(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      <rect x="3.5" y="4.5" width="17" height="4.4" rx="1.4" fill="#fff" />
      <path d="M6.2 7.6h11.6" stroke="#075663" strokeWidth="1.1" strokeLinecap="round" />
      <rect x="5.2" y="12.1" width="12.2" height="1.9" rx="0.95" fill="#fff" opacity="0.95" />
      <rect x="7.4" y="15.6" width="8.6" height="1.9" rx="0.95" fill="#fff" opacity="0.7" />
      <rect x="9.6" y="19.1" width="5.2" height="1.9" rx="0.95" fill="#E08A56" />
    </svg>
  );
}

export function IconDashboard(props) {
  return (
    <Stroke {...props}>
      <path d="M3 13.2 12 5l9 8.2" />
      <path d="M5.4 11.6V19a1 1 0 0 0 1 1h3.2v-4.3h4.8V20h3.2a1 1 0 0 0 1-1v-7.4" />
    </Stroke>
  );
}

export function IconCustomers(props) {
  return (
    <Stroke {...props}>
      <circle cx="9.2" cy="8.4" r="3.4" />
      <path d="M2.8 20c0-3.3 2.9-5.6 6.4-5.6s6.4 2.3 6.4 5.6" />
      <path d="M16.4 5.6a3.2 3.2 0 0 1 0 6.1" />
      <path d="M18.1 14.9c1.9.7 3.1 2.3 3.1 4.4" />
    </Stroke>
  );
}

/** A spanner — the job itself. */
export function IconServices(props) {
  return (
    <Stroke {...props}>
      <path d="M14.8 3.4a4.8 4.8 0 0 0 5.8 6.4l-9 9a3.1 3.1 0 0 1-4.4-4.4l9-9Z" />
      <path d="M5.9 18.1h.01" />
      <path d="M17.6 6.4 20.4 3.6" />
    </Stroke>
  );
}

export function IconReports(props) {
  return (
    <Stroke {...props}>
      <path d="M3.6 20.4h16.8" />
      <rect x="5" y="11.4" width="3.4" height="6.4" rx="1" />
      <rect x="10.3" y="6.6" width="3.4" height="11.2" rx="1" />
      <rect x="15.6" y="9" width="3.4" height="8.8" rx="1" />
    </Stroke>
  );
}

/** Sliders, not a cog: a cog's teeth turn to mush at 21px on a phone tab bar. */
export function IconSettings(props) {
  return (
    <Stroke {...props}>
      <path d="M3.4 8h9.2M18.4 8h2.2" />
      <circle cx="15.5" cy="8" r="2.4" />
      <path d="M3.4 16h2.2M11.4 16h9.2" />
      <circle cx="8.5" cy="16" r="2.4" />
    </Stroke>
  );
}

export function IconPlus(props) {
  return (
    <Stroke {...props}>
      <path d="M12 5.2v13.6M5.2 12h13.6" />
    </Stroke>
  );
}

export function IconSearch(props) {
  return (
    <Stroke {...props}>
      <circle cx="10.8" cy="10.8" r="6.2" />
      <path d="m15.4 15.4 4.2 4.2" />
    </Stroke>
  );
}

export function IconChevronRight(props) {
  return (
    <Stroke {...props}>
      <path d="m9.4 5.6 6.4 6.4-6.4 6.4" />
    </Stroke>
  );
}

export function IconChevronLeft(props) {
  return (
    <Stroke {...props}>
      <path d="M14.6 5.6 8.2 12l6.4 6.4" />
    </Stroke>
  );
}

export function IconCheck(props) {
  return (
    <Stroke {...props}>
      <path d="m4.8 12.6 4.6 4.6L19.2 7.4" />
    </Stroke>
  );
}

export function IconAlert(props) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.8v5M12 16.1h.01" />
    </Stroke>
  );
}

export function IconPhone(props) {
  return (
    <Stroke {...props}>
      <path d="M7.4 3.6h2.2l1.4 3.6-1.9 1.3a10.6 10.6 0 0 0 5 5l1.3-1.9 3.6 1.4v2.2a2 2 0 0 1-2.2 2A15.6 15.6 0 0 1 3.5 5.8a2 2 0 0 1 2-2.2Z" />
    </Stroke>
  );
}

export function IconWallet(props) {
  return (
    <Stroke {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2.4" />
      <path d="M3 10.4h18" />
      <path d="M16.6 14.8h1.8" />
    </Stroke>
  );
}

export function IconEdit(props) {
  return (
    <Stroke {...props}>
      <path d="M4.2 19.8h3.2L19.1 8.1a2 2 0 0 0 0-2.8l-.4-.4a2 2 0 0 0-2.8 0L4.2 16.6v3.2Z" />
      <path d="m14.6 6.8 2.6 2.6" />
    </Stroke>
  );
}

export function IconTrash(props) {
  return (
    <Stroke {...props}>
      <path d="M4.6 7h14.8" />
      <path d="M9.4 7V4.9A1 1 0 0 1 10.4 4h3.2a1 1 0 0 1 1 .9V7" />
      <path d="M6.6 7l.8 11.3a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5L17.4 7" />
      <path d="M10.4 11v5M13.6 11v5" />
    </Stroke>
  );
}

export function IconRefresh(props) {
  return (
    <Stroke {...props}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20.4 4.6v4.2h-4.2" />
    </Stroke>
  );
}

export function IconInstall(props) {
  return (
    <Stroke {...props}>
      <rect x="6" y="2.8" width="12" height="18.4" rx="2.6" />
      <path d="M12 8v6.6" />
      <path d="m9.4 12.2 2.6 2.6 2.6-2.6" />
    </Stroke>
  );
}

export function IconLogout(props) {
  return (
    <Stroke {...props}>
      <path d="M14.4 4.6H6.8a2 2 0 0 0-2 2v10.8a2 2 0 0 0 2 2h7.6" />
      <path d="M17.4 8.6 20.8 12l-3.4 3.4" />
      <path d="M20.2 12H10.4" />
    </Stroke>
  );
}

export function IconCalendar(props) {
  return (
    <Stroke {...props}>
      <rect x="3.6" y="5.4" width="16.8" height="15" rx="2.2" />
      <path d="M3.6 10h16.8M8.4 3.4v3.6M15.6 3.4v3.6" />
    </Stroke>
  );
}

export function IconUserPlus(props) {
  return (
    <Stroke {...props}>
      <circle cx="10" cy="8.4" r="3.6" />
      <path d="M3.4 20c0-3.4 3-5.8 6.6-5.8 1.3 0 2.5.3 3.5.8" />
      <path d="M17.6 14.2v5.6M14.8 17h5.6" />
    </Stroke>
  );
}

export function IconInbox(props) {
  return (
    <Stroke {...props}>
      <path d="M3.4 13.4 6 5.6a1.6 1.6 0 0 1 1.5-1.1h9a1.6 1.6 0 0 1 1.5 1.1l2.6 7.8" />
      <path d="M3.4 13.4h4.4l1.1 2.4h6.2l1.1-2.4h4.4v4.6a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6v-4.6Z" />
    </Stroke>
  );
}
