import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../services/api';

interface UseDashboardDataOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function getCacheKey(endpoint: string, params: Record<string, unknown>): string {
  return `${endpoint}?${JSON.stringify(params)}`;
}

function setCachedData(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function useDashboardData<T = unknown>(
  endpoint: string,
  params: Record<string, unknown> = {},
  options: UseDashboardDataOptions = {}
) {
  const {
    enabled = true,
    refetchInterval,
    onSuccess,
    onError,
  } = options;

  // Memoize params to prevent infinite loop from recreating object literals
  const serializedParams = JSON.stringify(params);
  const memoizedParams = useMemo(() => JSON.parse(serializedParams), [serializedParams]);

  const cacheKey = useMemo(() => getCacheKey(endpoint, memoizedParams), [endpoint, memoizedParams]);

  const [data, setData] = useState<T | null>(() => {
    const cached = cache.get(cacheKey);
    // Cache is valid for 5 minutes
    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached.data as T;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) {
      return new Date(cached.timestamp);
    }
    return null;
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache unless force refetch
    const cached = cache.get(cacheKey);
    if (!force && cached && Date.now() - cached.timestamp < 300000) {
      setData(cached.data as T);
      setLastUpdated(new Date(cached.timestamp));
      onSuccess?.(cached.data);
      return;
    }

    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<T>(endpoint, {
        params: memoizedParams,
        signal: abortControllerRef.current.signal,
      });

      setData(response.data);
      setLastUpdated(new Date());
      setCachedData(cacheKey, response.data);
      onSuccess?.(response.data);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
        onError?.(err);
      }
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [endpoint, enabled, cacheKey, onSuccess, onError, memoizedParams]);

  useEffect(() => {
    fetchData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchData]);

  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(() => fetchData(true), refetchInterval);
      return () => clearInterval(interval);
    }
  }, [refetchInterval, fetchData, enabled]);

  const refetch = useCallback(() => {
    cache.delete(cacheKey);
    isFetchingRef.current = false;
    fetchData(true);
  }, [cacheKey, fetchData]);

  const invalidateCache = useCallback((key?: string) => {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refetch,
    invalidateCache,
  };
}

export function clearDashboardCache(): void {
  cache.clear();
}