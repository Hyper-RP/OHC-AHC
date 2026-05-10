import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SnackbarProvider, useSnackbar } from '../SnackbarContext';

// Helper component that exposes snackbar API
const TestConsumer: React.FC = () => {
  const { show, close, isOpen, currentMessage } = useSnackbar();
  return (
    <div>
      <span data-testid="status">{isOpen ? 'open' : 'closed'}</span>
      <span data-testid="message">{currentMessage?.message ?? 'none'}</span>
      <span data-testid="severity">{currentMessage?.severity ?? 'none'}</span>
      <button onClick={() => show('Test message')}>Show Default</button>
      <button onClick={() => show('Success!', 'success')}>Show Success</button>
      <button onClick={() => show('Error!', 'error', 1000)}>Show Error</button>
      <button onClick={close}>Close</button>
    </div>
  );
};

describe('SnackbarContext', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const renderSnackbar = () => render(
    <SnackbarProvider><TestConsumer /></SnackbarProvider>
  );

  it('provides show and close functions', () => {
    renderSnackbar();
    expect(screen.getByText('Show Default')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('starts with closed state', () => {
    renderSnackbar();
    expect(screen.getByTestId('status')).toHaveTextContent('closed');
    expect(screen.getByTestId('message')).toHaveTextContent('none');
  });

  it('show() sets isOpen to true and sets message', async () => {
    renderSnackbar();
    await act(async () => {
      screen.getByText('Show Default').click();
    });
    expect(screen.getByTestId('status')).toHaveTextContent('open');
    expect(screen.getByTestId('message')).toHaveTextContent('Test message');
  });

  it('show() defaults severity to info', async () => {
    renderSnackbar();
    await act(async () => {
      screen.getByText('Show Default').click();
    });
    expect(screen.getByTestId('severity')).toHaveTextContent('info');
  });

  it('show() sets correct severity', async () => {
    renderSnackbar();
    await act(async () => {
      screen.getByText('Show Success').click();
    });
    expect(screen.getByTestId('severity')).toHaveTextContent('success');
  });

  it('close() sets isOpen to false', async () => {
    renderSnackbar();
    await act(async () => { screen.getByText('Show Default').click(); });
    expect(screen.getByTestId('status')).toHaveTextContent('open');
    await act(async () => { screen.getByText('Close').click(); });
    expect(screen.getByTestId('status')).toHaveTextContent('closed');
  });

  it('auto-dismisses after duration', async () => {
    renderSnackbar();
    await act(async () => { screen.getByText('Show Error').click(); });
    expect(screen.getByTestId('status')).toHaveTextContent('open');
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(screen.getByTestId('status')).toHaveTextContent('closed');
  });

  it('replaces current message on subsequent show()', async () => {
    renderSnackbar();
    await act(async () => { screen.getByText('Show Default').click(); });
    expect(screen.getByTestId('message')).toHaveTextContent('Test message');
    await act(async () => { screen.getByText('Show Success').click(); });
    expect(screen.getByTestId('message')).toHaveTextContent('Success!');
  });

  it('useSnackbar throws outside provider', () => {
    const Broken = () => { useSnackbar(); return null; };
    expect(() => render(<Broken />)).toThrow('useSnackbar must be used within a SnackbarProvider');
  });
});
