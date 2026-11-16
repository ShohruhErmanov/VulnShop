import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../api/client';

/** Small data-fetching hook: { data, loading, error, reload, setData } */
export default function useApi(url, { skip = false } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const reload = useCallback(async () => {
    if (skip || !url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url);
      setData(res.data);
      setStatus(res.status);
    } catch (err) {
      setError(errorMessage(err));
      setStatus(err.response ? err.response.status : null);
    } finally {
      setLoading(false);
    }
  }, [url, skip]);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, status, reload, setData };
}
