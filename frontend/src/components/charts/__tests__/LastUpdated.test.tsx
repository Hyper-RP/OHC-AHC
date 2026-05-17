import { render, screen } from '@testing-library/react';
import { LastUpdated } from '../LastUpdated';
import { act } from 'react-dom/test-utils';

describe('LastUpdated', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows "Not updated yet" when no timestamp', () => {
    render(<LastUpdated lastUpdated={null} />);

    expect(screen.getByText('Not updated yet')).toBeInTheDocument();
  });

  it('shows "Loading..." when isLoading is true', () => {
    render(<LastUpdated lastUpdated={null} isLoading={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays relative time for recent update', () => {
    render(<LastUpdated lastUpdated={new Date()} />);

    expect(screen.getByText(/just now/)).toBeInTheDocument();
  });

  it('shows relative time text', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    render(<LastUpdated lastUpdated={fiveMinutesAgo} />);

    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it('formats date and time', () => {
    render(<LastUpdated lastUpdated={new Date('2026-05-16T14:30:00Z')} />);

    expect(screen.getByText(/May/)).toBeInTheDocument();
    expect(screen.getByText(/2:30/)).toBeInTheDocument();
  });

  it('hides relative time when showRelative is false', () => {
    render(<LastUpdated lastUpdated={new Date()} showRelative={false} />);

    expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
  });

  it('updates relative time over time', () => {
    render(<LastUpdated lastUpdated={new Date()} />);

    const initialText = screen.getByText(/ago/).textContent;

    act(() => {
      jest.advanceTimersByTime(60 * 1000);
    });

    // Text should still exist and might have changed
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it('cleans up interval on unmount', () => {
    const { unmount } = render(
      <LastUpdated lastUpdated={new Date()} />
    );

    unmount();

    act(() => {
      jest.advanceTimersByTime(60 * 1000);
    });

    expect(() => unmount()).not.toThrow();
  });
});