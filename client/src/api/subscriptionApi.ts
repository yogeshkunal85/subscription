import type { Subscription, SubscriptionFormData, ListParams, ApiResponse, Meta } from '../types';
import client from './client';

interface CleanParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

function buildParams(params: ListParams): CleanParams {
  const clean: CleanParams = {};
  if (params.page !== undefined) clean.page = params.page;
  if (params.limit !== undefined) clean.limit = params.limit;
  // Omit 'all' — the backend expects no status param for "all"
  if (params.status && params.status !== 'all') clean.status = params.status;
  if (params.search && params.search.trim() !== '') clean.search = params.search.trim();
  return clean;
}

export async function getSubscriptions(
  params: ListParams,
  signal?: AbortSignal,
): Promise<{ data: Subscription[]; meta: Meta }> {
  const res = (await client.get('/api/subscriptions', {
    params: buildParams(params),
    signal,
  })) as unknown as ApiResponse<Subscription[]>;

  return {
    data: res.data ?? [],
    meta: res.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
  };
}

export async function getSubscription(id: number, signal?: AbortSignal): Promise<Subscription> {
  const res = (await client.get(`/api/subscriptions/${id}`, {
    signal,
  })) as unknown as ApiResponse<Subscription>;

  if (!res.data) throw new Error('Subscription not found');
  return res.data;
}

export async function createSubscription(data: SubscriptionFormData): Promise<Subscription> {
  const res = (await client.post('/api/subscriptions', data)) as unknown as ApiResponse<Subscription>;
  if (!res.data) throw new Error('Failed to create subscription');
  return res.data;
}

export async function updateSubscription(
  id: number,
  data: Partial<SubscriptionFormData>,
): Promise<Subscription> {
  const res = (await client.put(
    `/api/subscriptions/${id}`,
    data,
  )) as unknown as ApiResponse<Subscription>;
  if (!res.data) throw new Error('Failed to update subscription');
  return res.data;
}

export async function deleteSubscription(id: number): Promise<void> {
  await client.delete(`/api/subscriptions/${id}`);
}
