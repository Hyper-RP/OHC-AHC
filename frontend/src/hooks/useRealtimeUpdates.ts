import { useState, useEffect, useCallback, useRef } from 'react';

interface UseRealtimeUpdatesOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (data: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  reconnectAttempts: number;
}

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions) {
  const {
    url,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    reconnecting: false,
    reconnectAttempts: 0,
  });
  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const [messageHistory, setMessageHistory] = useState<Array<{ time: Date; data: unknown }>>([]);
  const maxHistorySize = 100;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(url);
    } catch (error) {
      onError?.(error as Event);
      return;
    }

    wsRef.current.onopen = () => {
      setState((prev) => ({
        ...prev,
        connected: true,
        reconnecting: false,
        reconnectAttempts: 0,
      }));
      onConnect?.();
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        setMessageHistory((prev) => [
          { time: new Date(), data },
          ...prev.slice(0, maxHistorySize - 1),
        ]);
        onMessage?.(data);
      } catch {
        setLastMessage(event.data);
        setMessageHistory((prev) => [
          { time: new Date(), data: event.data },
          ...prev.slice(0, maxHistorySize - 1),
        ]);
        onMessage?.(event.data);
      }
    };

    wsRef.current.onerror = (error) => {
      onError?.(error);
    };

    wsRef.current.onclose = () => {
      setState((prev) => ({
        ...prev,
        connected: false,
      }));
      onDisconnect?.();

      if (state.reconnectAttempts < maxReconnectAttempts) {
        setState((prev) => ({
          ...prev,
          reconnecting: true,
          reconnectAttempts: prev.reconnectAttempts + 1,
        }));

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      }
    };
  }, [url, reconnectInterval, maxReconnectAttempts, onConnect, onDisconnect, onError, onMessage, state.reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState({
      connected: false,
      reconnecting: false,
      reconnectAttempts: 0,
    });
  }, []);

  const sendMessage = useCallback((data: string | Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      wsRef.current.send(message);
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setState((prev) => ({
      ...prev,
      reconnectAttempts: 0,
    }));
    connect();
  }, [disconnect, connect]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connected: state.connected,
    reconnecting: state.reconnecting,
    reconnectAttempts: state.reconnectAttempts,
    lastMessage,
    messageHistory,
    sendMessage,
    disconnect,
    reconnect,
  };
}