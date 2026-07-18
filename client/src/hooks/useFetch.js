import { useState, useEffect, useCallback, useRef } from 'react';

const useFetch = (apiFn, params = {}, autoFetch = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const apiFnRef = useRef(apiFn);
  apiFnRef.current = apiFn;

  const fetch = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFnRef.current(overrideParams || paramsRef.current);
      setData(res.data.data);
      setPagination(res.data.pagination || null);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever params or apiFn change
  const paramsKey = JSON.stringify(params);
  useEffect(() => {
    if (autoFetch) fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, fetch, paramsKey]);

  return { data, setData, loading, error, pagination, refetch: fetch };
};

export default useFetch;
