/**
 * Centralized API Configuration for Eagle Power Schools Management System
 * Automatically resolves the backend API URL for development, local network, and production deployments.
 */

export function getApiBase() {
  if (typeof window !== 'undefined') {
    // 1. Runtime override via window global or localStorage for flexible production hosting
    if (window.EAGLEPOWER_API_BASE && typeof window.EAGLEPOWER_API_BASE === 'string') {
      return window.EAGLEPOWER_API_BASE.trim().replace(/\/$/, '');
    }
    try {
      const stored = window.localStorage?.getItem('eaglepower_api_base');
      if (stored && typeof stored === 'string' && stored.trim()) {
        return stored.trim().replace(/\/$/, '');
      }
    } catch (_) {}
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
      return 'http://localhost:5050/api';
    }
    // In production or when served by Express backend on the same origin:
    return `${origin}/api`;
  }
  return 'http://localhost:5050/api';
}

export const API_BASE = getApiBase();

export function getAuthHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token && !token.startsWith('offline-session-')) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
