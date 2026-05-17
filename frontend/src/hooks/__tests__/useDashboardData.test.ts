import { renderHook, waitFor, act } from '@testing-library/react';
import api from '../../services/api';
import { useDashboardData, clearDashboardCache } from '../useDashboardData';

jest.mock('../../services/api');

describe('useDashboardData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearDashboardCache();
  });

  it('fetches data on mount', async () => {
    const mockData = { results: [{ id: 1, name: 'Test' }] };
    (api.get as jest.Mock).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() =>
      useDashboardData('/test-endpoint')
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith('/test-endpoint', {
      params: {},
      signal: expect.any(AbortSignal),
    });
  });

  it('uses cached data when available', async () => {
    const mockData = { results: [{ id: 1, name: 'Test' }] };
    (api.get as jest.Mock).mockResolvedValue({ data: mockData });

    const { result: result1 } = renderHook(() =>
      useDashboardData('/test-endpoint')
    );

    await waitFor(() => {
      expect(result1.current.data).toEqual(mockData);
    });

    (api.get as jest.Mock).mockClear();

    const { result: result2 } = renderHook(() =>
      useDashboardData('/test-endpoint')
    );

    await waitFor(() => {
      expect(result2.current.data).toEqual(mockData);
    });

    expect(api.get).not.toHaveBeenCalled();
  });

  it('refetches data when calling refetch', async () => {
    const mockData1 = { results: [{ id: 1, name: 'Test1' }] };
    const mockData2 = { results: [{ id: 2, name: 'Test2' }] };
    (api.get as jest.Mock)
      .mockResolvedValueOnce({ data: mockData1 })
      .mockResolvedValueOnce({ data: mockData2 });

    const { result } = renderHook(() =>
      useDashboardData('/test-endpoint')
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });

    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it('handles errors', async () => {
    const mockError = new Error('API Error');
    (api.get as jest.Mock).mockRejectedValue(mockError);

    const onError = jest.fn();
    const { result } = renderHook(() =>
      useDashboardData('/test-endpoint', {}, { onError })
    );

    await waitFor(() => {
      expect(result.current.error).toBe(mockError);
    });

    expect(onError).toHaveBeenCalledWith(mockError);
  });

  it('respects enabled option', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useDashboardData('/test-endpoint', {}, { enabled }),
      { initialProps: { enabled: false } }
    );

    expect(result.current.isLoading).toBe(false);

    rerender({ enabled: true });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });

  it('auto-refreshes with interval', async () => {
    jest.useFakeTimers();
    const mockData = { results: [{ id: 1 }] };
    (api.get as jest.Mock).mockResolvedValue({ data: mockData });

    const { result } = renderHook(() =>
      useDashboardData('/test-endpoint', {}, { refetchInterval: 1000 })
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    expect(api.get).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });
});