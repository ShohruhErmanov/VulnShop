import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const LabContext = createContext(null);

/** Current lab modes (public /api/health) — used by the UI to render lab-dependent behaviour. */
export function LabProvider({ children }) {
  const [modes, setModes] = useState({});
  const [appMode, setAppMode] = useState('lab');
  const [online, setOnline] = useState(true);
  const [deployment, setDeployment] = useState('local');

  const refreshModes = useCallback(async () => {
    try {
      const { data } = await api.get('/health');
      setModes(data.labs || {});
      setAppMode(data.mode);
      setDeployment(data.deployment || 'local');
      setOnline(true);
    } catch (_) {
      setOnline(false);
    }
  }, []);

  useEffect(() => { refreshModes(); }, [refreshModes]);

  const value = useMemo(() => ({
    modes,
    appMode,
    online,
    hosted: deployment === 'hosted',
    refreshModes,
    isVulnerable: (id) => Boolean(modes[id]),
    vulnerableCount: Object.values(modes).filter(Boolean).length,
  }), [modes, appMode, online, deployment, refreshModes]);

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>;
}

export const useLab = () => useContext(LabContext);
