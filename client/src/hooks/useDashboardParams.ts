import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SubscriptionStatus } from '../types';
import useDebounce from './useDebounce';

const VALID_STATUSES: SubscriptionStatus[] = ['active', 'cancelled', 'expired'];

function parsePositiveInt(value: string | null, fallback: number, max?: number): number {
  const parsed = parseInt(value ?? '', 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  if (max !== undefined) return Math.min(parsed, max);
  return parsed;
}

function parseStatus(value: string | null): SubscriptionStatus | 'all' {
  if (value && VALID_STATUSES.includes(value as SubscriptionStatus)) {
    return value as SubscriptionStatus;
  }
  return 'all';
}

interface DashboardParams {
  page: number;
  limit: number;
  status: SubscriptionStatus | 'all';
  search: string;
}

function readParams(searchParams: URLSearchParams): DashboardParams {
  return {
    page: parsePositiveInt(searchParams.get('page'), 1),
    limit: parsePositiveInt(searchParams.get('limit'), 10, 100),
    status: parseStatus(searchParams.get('status')),
    search: searchParams.get('search') ?? '',
  };
}

function applyParams(
  current: URLSearchParams,
  updates: Partial<DashboardParams>,
): URLSearchParams {
  const next = new URLSearchParams(current);

  if (updates.page !== undefined) {
    if (updates.page <= 1) next.delete('page');
    else next.set('page', String(updates.page));
  }

  if (updates.limit !== undefined) {
    if (updates.limit === 10) next.delete('limit');
    else next.set('limit', String(updates.limit));
  }

  if (updates.status !== undefined) {
    if (updates.status === 'all') next.delete('status');
    else next.set('status', updates.status);
  }

  if (updates.search !== undefined) {
    const trimmed = updates.search.trim();
    if (trimmed === '') next.delete('search');
    else next.set('search', trimmed);
  }

  return next;
}

interface UseDashboardParamsReturn {
  page: number;
  limit: number;
  status: SubscriptionStatus | 'all';
  searchInput: string;
  debouncedSearch: string;
  setPage: (page: number) => void;
  setStatus: (status: SubscriptionStatus | 'all') => void;
  setSearchInput: (search: string) => void;
  dashboardPath: string;
}

function useDashboardParams(): UseDashboardParamsReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, limit, status, search: urlSearch } = readParams(searchParams);

  const [searchInput, setSearchInputState] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 300);

  // Keep input in sync when URL changes (reload, back/forward)
  useEffect(() => {
    setSearchInputState(urlSearch);
  }, [urlSearch]);

  // Write debounced search to URL and reset page when search changes
  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === urlSearch) return;

    setSearchParams(
      (prev) => applyParams(prev, { search: trimmed, page: 1 }),
      { replace: true },
    );
  }, [debouncedSearch, urlSearch, setSearchParams]);

  const setPage = useCallback(
    (newPage: number) => {
      setSearchParams((prev) => applyParams(prev, { page: newPage }), { replace: true });
    },
    [setSearchParams],
  );

  const setStatus = useCallback(
    (newStatus: SubscriptionStatus | 'all') => {
      setSearchParams(
        (prev) => applyParams(prev, { status: newStatus, page: 1 }),
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setSearchInput = useCallback((value: string) => {
    setSearchInputState(value);
  }, []);

  const dashboardPath =
    searchParams.toString() !== '' ? `/?${searchParams.toString()}` : '/';

  return {
    page,
    limit,
    status,
    searchInput,
    debouncedSearch: debouncedSearch.trim(),
    setPage,
    setStatus,
    setSearchInput,
    dashboardPath,
  };
}

export default useDashboardParams;
