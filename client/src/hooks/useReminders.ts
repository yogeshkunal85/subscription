import { useState, useEffect, useCallback } from 'react';
import { getUpcomingReminders } from '../api/reminderApi';
import type { Reminder } from '../types';

interface UseRemindersReturn {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useReminders(days: number): UseRemindersReturn {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    getUpcomingReminders(days, controller.signal)
      .then((data) => {
        setReminders(data);
        setError(null);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, [days, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { reminders, loading, error, refetch };
}

export default useReminders;
