import axios, { type InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const OTP_ENDPOINTS = ['/auth/otp/request', '/auth/otp/verify', '/auth/refresh'];
const memoryStore = new Map<string, string>();

/** Read an auth/UI value from persistent storage without crashing in restricted mobile browsers. */
export function getStoredValue(key: string): string | null {
  if (typeof window === 'undefined') return memoryStore.get(key) ?? null;
  try {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  } catch { /* localStorage can be disabled in private/embedded contexts */ }
  try {
    const value = window.sessionStorage.getItem(key);
    if (value) return value;
  } catch { /* sessionStorage may also be restricted */ }
  return memoryStore.get(key) ?? null;
}

/** Keep the session available to the app even if one browser storage backend is blocked. */
export function setStoredValue(key: string, value: string): void {
  memoryStore.set(key, value);
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, value); } catch { /* use session/memory fallback */ }
  try { window.sessionStorage.setItem(key, value); } catch { /* memory fallback remains available for SPA navigation */ }
}

export function removeStoredValue(key: string): void {
  memoryStore.delete(key);
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(key); } catch { /* storage may be restricted */ }
  try { window.sessionStorage.removeItem(key); } catch { /* storage may be restricted */ }
}

export const api = axios.create({ baseURL: API_URL, timeout: 20_000 });

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

api.interceptors.response.use((response) => response, async (error) => {
  if (error.response?.status !== 401 || typeof window === 'undefined') return Promise.reject(error);
  const url = String(error.config?.url || '');
  if (OTP_ENDPOINTS.some((path) => url.includes(path))) return Promise.reject(error);

  const refresh = getStoredValue('refresh_token');
  if (refresh) {
    if (!refreshInFlight) {
      refreshInFlight = axios.post(`${API_URL}/auth/refresh`, { refresh_token: refresh }, { timeout: 20_000 })
        .then((res) => {
          setStoredValue('access_token', String(res.data.access_token));
          if (res.data.refresh_token) setStoredValue('refresh_token', String(res.data.refresh_token));
          return String(res.data.access_token);
        })
        .catch(() => null)
        .finally(() => { refreshInFlight = null; });
    }
    const access = await refreshInFlight;
    if (access && error.config && !error.config.__retried) {
      error.config.__retried = true;
      error.config.headers.Authorization = `Bearer ${access}`;
      return api.request(error.config);
    }
  }

  if (getToken()) {
    clearTokens();
    removeStoredValue('user');
    window.dispatchEvent(new Event('auth-changed'));
    const current = `${window.location.pathname}${window.location.search}`;
    if (window.location.pathname !== '/login') window.location.assign(`/login?next=${encodeURIComponent(current)}`);
  }
  return Promise.reject(error);
});

export function saveTokens(access: string, refresh: string) {
  if (!access) throw new Error('Authentication response did not include an access token.');
  setStoredValue('access_token', access);
  if (refresh) setStoredValue('refresh_token', refresh);
}
export function clearTokens() {
  removeStoredValue('access_token');
  removeStoredValue('refresh_token');
}
export function getToken() {
  return getStoredValue('access_token');
}
