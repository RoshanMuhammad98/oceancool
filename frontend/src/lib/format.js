/*
 * Rupees and dates, formatted the way the shop reads them.
 *
 * Money: Indian digit grouping — 2,500 / 15,000 / 1,25,000.
 * Dates: DD-MM-YYYY on screen. The API speaks ISO (yyyy-MM-dd) so sorting and
 * <input type="date"> stay unambiguous; conversion happens here and nowhere else.
 */

const RUPEES = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const RUPEES_PAISE = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PLAIN = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

/** ₹2,500 — paise shown only when there are any. */
export function money(value) {
  const n = toNumber(value);
  if (n === null) return '—';
  return Number.isInteger(n) ? RUPEES.format(n) : RUPEES_PAISE.format(n);
}

/** For tight spots: 2,500 with no symbol. */
export function amount(value) {
  const n = toNumber(value);
  return n === null ? '—' : PLAIN.format(n);
}

/**
 * Reads what a person typed into an amount box — "2500", "2,500", "₹2500", "2500.50".
 * Returns null when it is not a usable figure, so callers can show one clear error.
 */
export function parseAmount(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  if (typeof input !== 'string') return null;
  const cleaned = input.replace(/[₹,\s]/g, '');
  if (cleaned === '') return null;
  if (!/^\d*\.?\d*$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/* ---------------------------------------------------------------- dates */

/** "2026-09-17" -> "17-09-2026" */
export function date(iso) {
  const parts = splitIso(iso);
  if (!parts) return '—';
  const [y, m, d] = parts;
  return `${pad(d)}-${pad(m)}-${y}`;
}

/** "2026-09-17" -> "17 Sep 2026" — easier to scan in a list than all digits. */
export function dateShort(iso) {
  const parts = splitIso(iso);
  if (!parts) return '—';
  const [y, m, d] = parts;
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

/** Today and yesterday get named; everything else gets its date. */
export function dayLabel(iso) {
  const parts = splitIso(iso);
  if (!parts) return '—';
  if (iso === todayIso()) return 'Today';
  if (iso === shiftDays(todayIso(), -1)) return 'Yesterday';
  if (iso === shiftDays(todayIso(), 1)) return 'Tomorrow';
  return dateShort(iso);
}

export function dateTime(isoDateTime) {
  if (!isoDateTime) return '—';
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return '—';
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return `${date(toIso(d))} · ${time}`;
}

export function todayIso() {
  return toIso(new Date());
}

/** Local calendar date, not UTC — an 11pm entry must not land on tomorrow. */
export function toIso(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftDays(iso, days) {
  const parts = splitIso(iso);
  if (!parts) return iso;
  const [y, m, d] = parts;
  const shifted = new Date(y, m - 1, d + days);
  return toIso(shifted);
}

/* ---------------------------------------------------------------- ranges */

/** @param month 0-11, matching Date */
export function monthRange(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return { from: toIso(first), to: toIso(last) };
}

export function monthLabel(year, month) {
  return `${MONTHS[month]} ${year}`;
}

export function thisWeekRange() {
  const now = new Date();
  // week starts Monday, matching the backend's WEEK grouping
  const offset = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return { from: toIso(monday), to: toIso(sunday) };
}

export function thisMonthRange() {
  const now = new Date();
  return monthRange(now.getFullYear(), now.getMonth());
}

export function todayRange() {
  const iso = todayIso();
  return { from: iso, to: iso };
}

/* ---------------------------------------------------------------- misc */

/** "ABC Company" -> "AC", "Sreela" -> "SR" — the customer-list avatar. */
export function initials(name) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function statusLabel(status) {
  if (status === 'PAID') return 'Paid';
  if (status === 'PARTIAL') return 'Part paid';
  if (status === 'PENDING') return 'Pending';
  return status || '—';
}

function splitIso(iso) {
  if (typeof iso !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function pad(n) {
  return String(n).padStart(2, '0');
}
