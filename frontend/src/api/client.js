import axios from 'axios';

const TOKEN_KEY = 'vs_token';

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch (_) { return null; } },
  set: (t) => { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch (_) { /* storage blocked */ } },
};

const api = axios.create({ baseURL: '/api', withCredentials: true, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let unauthorizedHandler = null;
export const onUnauthorized = (fn) => { unauthorizedHandler = fn; };

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Hosted classroom server: access gate expired -> back to the class-code page.
    if (err.response && err.response.status === 401 && err.response.data && err.response.data.gate) {
      window.location.assign('/gate');
      return Promise.reject(err);
    }
    if (err.response && err.response.status === 401 && unauthorizedHandler && !err.config.skipAuthRedirect) {
      unauthorizedHandler();
    }
    return Promise.reject(err);
  },
);

/** Fetch an anti-CSRF token and attach it to every subsequent request. */
export async function initCsrf() {
  try {
    const { data } = await api.get('/auth/csrf');
    api.defaults.headers.common['X-CSRF-Token'] = data.csrfToken;
  } catch (_) { /* backend offline: pages show their own errors */ }
}

export function errorMessage(err, fallback = 'Xatolik yuz berdi') {
  const data = err && err.response && err.response.data;
  if (data && data.error) {
    return Array.isArray(data.details) && data.details.length ? `${data.error}: ${data.details.join(', ')}` : data.error;
  }
  if (err && err.code === 'ECONNABORTED') return 'Server javob bermadi';
  if (err && !err.response) return 'Serverga ulanib bo‘lmadi';
  return fallback;
}

export default api;
