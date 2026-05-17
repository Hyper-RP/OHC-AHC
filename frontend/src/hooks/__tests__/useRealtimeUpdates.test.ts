import { renderHook, act, waitFor } from '@testing-library/react';
import { useRealtimeUpdates } from '../useRealtimeUpdates';

class MockWebSocket {
  url: string;
  readyState: number = 0;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url: string) {
    this.url = url;
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
}

describe('useRealtimeUpdates', () => {
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    originalWebSocket = global.WebSocket;
    global.WebSocket = MockWebSocket as any;
  });

  afterEach(() => {
    global.WebSocket = originalWebSocket;
  });

  it('connects to WebSocket on mount', async () => {
    const { result } = renderHook(() =>
      useRealtimeUpdates({
        url: 'ws://localhost:8080',
      })
    );

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });
  });

  it('calls onConnect when WebSocket opens', async () => {
    const onConnect = jest.fn();
    renderHook(() =>
      useRealtimeUpdates({
        url: 'ws://localhost:8080',
        onConnect,
      })
    );

    await waitFor(() => {
      expect(onConnect).toHaveBeenCalled();
    });
  });

  it('receives messages', async () => {
    const onMessage = jest.fn();
    const { result } = renderHook(() =>
      useRealtimeUpdates({
        url: 'ws://localhost:8080',
        onMessage,
      })
    );

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    const ws = global.WebSocket as any;
    const mockWs = ws.mock.instances[0];

    act(() => {
      mockWs.onmessage?.(new MessageEvent('message', { data: JSON.stringify({ test: 'data' }) }));
    });

    expect(result.current.lastMessage).toEqual({ test: 'data' });
    expect(onMessage).toHaveBeenCalledWith({ test: 'data' });
  });

  it('stores message history', async () => {
    const { result } = renderHook(() =>
      useRealtimeUpdates({
        url: 'ws://localhost:8080',
      })
    );

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    const ws = global.WebSocket as any;
    const mockWs = ws.mock.instances[0];

    act(() => {
      mockWs.onmessage?.(new MessageEvent('message', { data: JSON.stringify({ id: 1 }) }));
      mockWs.onmessage?.(new MessageEvent('message', { data: JSON.stringify({ id: 2 }) }));
    });

    expect(result.current.messageHistory).toHaveLength(2);
    expect(result.current.messageHistory[0].data).toEqual({ id: 2 });
    expect(result.current.messageHistory[1].data).toEqual({ id: 1 });
  });

  it('limits message history to 100 items', async () => {
    const { result } = renderHook(() =>
      useRealtimeUpdates({
        url: 'ws://localhost:8080',
      })
    );

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    const ws = global.WebSocket as any;
    const mockWs = ws.mock.instances[0];

    act(() => {
      for (let i = 0; i < 105; i++) {
        mockWs.onmessage?.(new MessageEvent('message', { data: JSON.stringify({ id: i }) }));
      }
    });

    expect(result.current.messageHistory).toHaveLength(100);
  });

  it('handles string messages', async () => {
    const { result } = renderHook(() =>
      useRealtimeUpdates({
        url: 'ws://localhost:8080',
      })
    );

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    const ws = global.WebSocket as any;
    const mockWs = ws.mock.instances[0];

    act(() => {
      mockWs.onmessage?.(new MessageEvent('message', { data: 'plain text' }));
    });

    expect(result.current.lastMessage).toBe('plain text');
  });

  it('calls onError on WebSocket error', async () => {
    const onError = jest.fn();
    renderHook(() =>
      useRealtimeUpdates({
        url: 'ws://localhost:8080',
        onError,
      })
    );

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it('calls onDisconnect on WebSocket close', async () => {
    const onDisconnect = jest.fn();
    const { result } = renderHook(() =>
      useRealtimeUpdates({
        url: 'ws://localhost:8080',
        onDisconnect,
      })
    );

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    act(() => {
      result.current.disconnect();
    });

    expect(onDisconnect).toHaveBeenCalled();
    expect(result.current.connected).toBe(false);
  });

  it('auto-reconnects on disconnect', async () => {
    const { result } = renderHook(() =>
      useRealtimeUpdates({
        url: 'ws://localhost:8080',
        reconnectInterval: 100,
      })
    );

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.reconnecting).toBe(true);
    expect(result.current.reconnectAttempts).toBeGreaterThan(0);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });
  });

  it('stops reconnecting after max attempts', async () => {
    const { result } = renderHook(() =>
      useRealtimeUpdates({
        url: 'ws://localhost:8080',
        reconnectInterval: 10,
        maxReconnectAttempts: 2,
      })
    );

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    act(() => {
      result.current.disconnect();
    });

    act(() => {
      jest.advanceTimersByTime(30);
    });

    expect(result.current.reconnectAttempts).toBe(2);
    expect(result.current.reconnecting).toBe(false);
  });

  it('sends messages when connected', async () => {
    const { result } = renderHook(() =>
      useRealtimeUpdates({
        url: 'ws://localhost:8080',
      })
    );

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    act(() => {
      result.current.sendMessage('test message');
    });

    const ws = global.WebSocket as any;
    const mockWs = ws.mock.instances[0];

    expect(() => {
      mockWs.send('test message');
    }).not.toThrow();
  });

  it('sends JSON messages when connected', async () => {
    const { result } = renderHook(() =>
      useRealtimeUpdates({
        url: 'ws://localhost:8080',
      })
    );

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    act(() => {
      result.current.sendMessage({ type: 'ping' });
    });

    const ws = global.WebSocket as any;
    const mockWs = ws.mock.instances[0];

    expect(() => {
      mockWs.send('{"type":"ping"}');
    }).not.toThrow();
  });

  it('reconnects when called', async () => {
    const { result } = renderHook(() =>
      useRealtimeUpdates({
        url: 'ws://localhost:8080',
      })
    );

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.connected).toBe(false);

    act(() => {
      result.current.reconnect();
    });

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() =>
      useRealtimeUpdates({
        url: 'ws://localhost:8080',
      })
    );

    expect(() => unmount()).not.toThrow();
  });
});