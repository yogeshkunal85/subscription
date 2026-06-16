import type { User, ApiResponse } from '../types';
import client from './client';

export async function getUsers(signal?: AbortSignal): Promise<User[]> {
  const res = (await client.get('/api/users', { signal })) as unknown as ApiResponse<User[]>;
  return res.data ?? [];
}

export async function createUser(name: string, email: string): Promise<User> {
  const res = (await client.post('/api/users', { name, email })) as unknown as ApiResponse<User>;
  if (!res.data) throw new Error('Failed to create user');
  return res.data;
}
