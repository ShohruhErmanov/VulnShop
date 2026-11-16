import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { tokenStore, onUnauthorized, initCsrf } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clear = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) { setUser(null); return null; }
    try {
      const { data } = await api.get('/auth/me', { skipAuthRedirect: true });
      setUser(data.user);
      return data.user;
    } catch (_) {
      clear();
      return null;
    }
  }, [clear]);

  useEffect(() => {
    onUnauthorized(clear);
    Promise.all([initCsrf(), refresh()]).finally(() => setLoading(false));
  }, [clear, refresh]);

  const applySession = useCallback((data) => {
    tokenStore.set(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password }, { skipAuthRedirect: true });
    return applySession(data);
  }, [applySession]);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return applySession(data);
  }, [applySession]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch (_) { /* ignore */ }
    clear();
  }, [clear]);

  /** Used when the backend issues a new token (e.g. after switching the Broken Auth lab). */
  const replaceToken = useCallback((token) => {
    if (token) tokenStore.set(token);
  }, []);

  const value = useMemo(() => ({
    user, loading, isAdmin: user && user.role === 'admin', login, register, logout, refresh, setUser, replaceToken,
  }), [user, loading, login, register, logout, refresh, replaceToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
