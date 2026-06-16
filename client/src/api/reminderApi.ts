import type { Reminder, ApiResponse } from '../types';
import client from './client';

export async function getUpcomingReminders(
  days: number = 7,
  signal?: AbortSignal,
): Promise<Reminder[]> {
  const res = (await client.get('/api/reminders/upcoming', {
    params: { days },
    signal,
  })) as unknown as ApiResponse<Reminder[]>;

  return res.data ?? [];
}
