import { useState, useEffect, useCallback, useRef } from 'react';
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

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

function getCacheKey(endpoint: string, params: Record<string, unknown>): string {
  return `${endpoint}?${JSON.stringify(params)}`;
}

function getCachedData(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > CACHE_DURATION;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return entry.data;
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

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cacheKey = getCacheKey(endpoint, params);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const cached = getCachedData(cacheKey);
      if (cached && !error) {
        setData(cached as T);
        setIsLoading(false);
        return;
      }

      const response = await api.get<T>(endpoint, {
        params,
        signal: abortControllerRef.current.signal,
      });

      setData(response.data);
      setLastUpdated(new Date());
      setCachedData(cacheKey, response.data);
      onSuccess?.(response.data);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const error = err as Error;
        setError(error);
        onError?.(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, enabled, cacheKey, onSuccess, onError, error]);

  useEffect(() => {
    fetchData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchData]);

  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [refetchInterval, fetchData, enabled]);

  const refetch = useCallback(() => {
    cache.delete(cacheKey);
    fetchData();
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