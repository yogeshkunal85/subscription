import { useState, useEffect, useCallback } from 'react';
import { getSubscriptions } from '../api/subscriptionApi';
import type { Subscription, Meta, ListParams } from '../types';

interface UseSubscriptionsReturn {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  meta: Meta | null;
  refetch: () => void;
}

function useSubscriptions(params: ListParams): UseSubscriptionsReturn {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [tick, setTick] = useState(0);

  // Destructure primitives to avoid object identity triggering infinite loops
  const { page, limit, status, search } = params;

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    getSubscriptions({ page, limit, status, search }, controller.signal)
      .then(({ data, meta: m }) => {
        setSubscriptions(data);
        setMeta(m);
        setError(null);
        setLoading(false);
      })
      .catch((err: Error) => {
        // CanceledError = AbortController fired (unmount / param change). Ignore silently.
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [page, limit, status, search, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { subscriptions, loading, error, meta, refetch };
}

export default useSubscriptions;
