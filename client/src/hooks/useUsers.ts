import { useState, useEffect, useCallback } from 'react';
import { getUsers } from '../api/userApi';
import type { User } from '../types';

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getUsers(controller.signal)
      .then((data) => {
        setUsers(data);
        setError(null);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { users, loading, error, refetch };
}

export default useUsers;
