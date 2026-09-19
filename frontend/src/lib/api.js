/*
 * The only place this app talks to the backend.
 *
 * In dev, requests go to a same-origin "/api" that Vite proxies to Spring Boot.
 * In production, set VITE_API_BASE_URL to the deployed API origin.
 */

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

/** AuthProvider installs a getter here so no component has to pass the token around. */
let readToken = () => null;

export function setTokenReader(fn) {
  readToken = typeof fn === 'function' ? fn : () => null;
}

/** AuthProvider installs this so a rejected token signs the user out everywhere at once. */
let onUnauthorized = () => {};

export function setUnauthorizedHandler(fn) {
  onUnauthorized = typeof fn === 'function' ? fn : () => {};
}

export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = null, offline = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.offline = offline;
  }

  /** True when the session is gone and the user has to sign in again. */
  get isAuthFailure() {
    return this.status === 401;
  }
}

async function request(path, { method = 'GET', body, signal, query } = {}) {
  const url = BASE + path + buildQuery(query);
  const token = readToken();

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError('Cannot reach the server. Check your internet and try again.', {
      offline: true,
    });
  }

  if (response.status === 204) return null;

  const payload = await readPayload(response);

  if (!response.ok) {
    // a rejected token anywhere means the session is over, not just this screen
    if (response.status === 401 && !path.startsWith('/api/auth/')) onUnauthorized();
    throw new ApiError(messageFrom(payload, response.status), {
      status: response.status,
      fieldErrors: payload?.fieldErrors ?? null,
    });
  }

  return payload;
}

async function readPayload(response) {
  const type = response.headers.get('content-type') || '';
  if (!type.includes('application/json')) {
    const text = await response.text();
    return text ? { message: text } : null;
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function messageFrom(payload, status) {
  if (payload?.message) return payload.message;
  if (status === 401) return 'Your session has ended. Please sign in again.';
  if (status === 404) return 'That record no longer exists.';
  if (status === 409) return 'That change conflicts with existing records.';
  return 'Something went wrong. Please try again.';
}

function buildQuery(query) {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/* ---------------------------------------------------------------- endpoints */

export const api = {
  login: (credentials) => request('/api/auth/login', { method: 'POST', body: credentials }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),

  dashboard: (signal) => request('/api/dashboard', { signal }),

  customers: {
    list: (search, signal) => request('/api/customers', { query: { search }, signal }),
    detail: (id, signal) => request(`/api/customers/${id}`, { signal }),
    create: (body) => request('/api/customers', { method: 'POST', body }),
    update: (id, body) => request(`/api/customers/${id}`, { method: 'PUT', body }),
    remove: (id, force) =>
      request(`/api/customers/${id}`, { method: 'DELETE', query: { force: force || undefined } }),
  },

  services: {
    list: (filters, signal) => request('/api/services', { query: filters, signal }),
    get: (id, signal) => request(`/api/services/${id}`, { signal }),
    create: (body) => request('/api/services', { method: 'POST', body }),
    update: (id, body) => request(`/api/services/${id}`, { method: 'PUT', body }),
    recordPayment: (id, body) =>
      request(`/api/services/${id}/payment`, { method: 'PATCH', body }),
    remove: (id) => request(`/api/services/${id}`, { method: 'DELETE' }),
  },

  reports: {
    get: (filters, signal) => request('/api/reports', { query: filters, signal }),
  },
};

/** The service names staff pick from. "Other" lets them type anything. */
export const SERVICE_NAMES = [
  'AC Service',
  'AC Repair',
  'AC Installation',
  'AC Gas Filling',
  'AC Maintenance',
  'AC Cleaning',
  'AC Inspection',
  'Compressor Repair',
  'Other',
];

export const PAYMENT_STATUSES = ['PENDING', 'PARTIAL', 'PAID'];
