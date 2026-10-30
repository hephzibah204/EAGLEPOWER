/**
 * Centralized API Configuration for Eagle Power Schools Management System
 * Automatically resolves the backend API URL for development, local network, and production deployments.
 */

// This is a UI marker, never a credential. The server owns the HttpOnly session cookie.
export const COOKIE_SESSION = 'cookie-session';
let sessionToken = '';

export function clearLegacyTokens() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('eagle_token');
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('eagle_user');
  } catch { /* Storage can be unavailable in privacy modes. */ }
}

clearLegacyTokens();

export function getSessionToken() {
  clearLegacyTokens();
  return sessionToken;
}

export function setSessionToken(token) {
  clearLegacyTokens();
  sessionToken = token === COOKIE_SESSION ? COOKIE_SESSION : '';
}

export function getApiBase() {
  if (typeof window !== 'undefined') {
    // Runtime overrides are development-only: persisted URLs must not redirect credentials in production.
    const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
    if (isLocal && window.EAGLEPOWER_API_BASE && typeof window.EAGLEPOWER_API_BASE === 'string') {
      return window.EAGLEPOWER_API_BASE.trim().replace(/\/$/, '');
    }
    try {
      const stored = window.localStorage?.getItem('eaglepower_api_base');
      if (isLocal && stored && typeof stored === 'string' && stored.trim()) {
        return stored.trim().replace(/\/$/, '');
      }
    } catch {}
  }
  // 2. Build-time environment variables
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/$/, '');
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.trim().replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const { port, origin } = window.location;
    // When running on local dev tooling (Vite: 5173, Next.js: 3000, Vite preview: 4173)
    if (port === '5173' || port === '3000' || port === '4173') {
      return `http://${window.location.hostname}:5050/api`;
    }
    // In production or when served by Express backend on the same origin:
    return `${origin}/api`;
  }
  return 'http://localhost:5050/api';
}

export const API_BASE = getApiBase();

export function getAuthHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token && token !== COOKIE_SESSION && !token.startsWith('offline-session-')) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// All browser API calls share cookie credentials and CSRF protection, including admin modules.
export async function apiFetch(input, options = {}) {
  const headers = new Headers(options.headers);
  if (headers.get('Authorization') === `Bearer ${COOKIE_SESSION}`) headers.delete('Authorization');
  const method = (options.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('X-Eagle-Request', '1');
  const response = await globalThis.fetch(input, { ...options, headers, credentials: 'include' });
  if (response.status === 401 && sessionToken === COOKIE_SESSION) {
    setSessionToken('');
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('eagle-session-expired'));
  }
  return response;
}

export async function restoreSession(options = {}) {
  try {
    const response = await apiFetch(`${getApiBase()}/auth/me`, { cache: 'no-store', ...options });
    if (!response || response.status === 401 || response.status === 403 || response.status === 404 || response.status === 503) return null;
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    if (!data || !data.success || !data.user?.id) return null;
    return data.user;
  } catch {
    return null;
  }
}
