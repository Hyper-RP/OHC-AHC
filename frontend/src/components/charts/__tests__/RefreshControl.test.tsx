import { render, screen, fireEvent } from '@testing-library/react';
import { RefreshControl } from '../RefreshControl';

describe('RefreshControl', () => {
  it('renders with default label', () => {
    render(<RefreshControl onRefresh={jest.fn()} />);

    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('calls onRefresh when clicked', () => {
    const onRefresh = jest.fn();
    render(<RefreshControl onRefresh={onRefresh} />);

    fireEvent.click(screen.getByText('Refresh'));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when isRefreshing is true', () => {
    render(<RefreshControl onRefresh={jest.fn()} isRefreshing={true} />);

    expect(screen.getByText('Refresh')).toBeInTheDocument();
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<RefreshControl onRefresh={jest.fn()} disabled={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('uses custom label', () => {
    render(<RefreshControl onRefresh={jest.fn()} label="Update Now" />);

    expect(screen.getByText('Update Now')).toBeInTheDocument();
  });

  it('does not call onRefresh when refreshing', () => {
    const onRefresh = jest.fn();
    render(
      <RefreshControl onRefresh={onRefresh} isRefreshing={true} />
    );

    fireEvent.click(screen.getByText('Refresh'));

    expect(onRefresh).not.toHaveBeenCalled();
  });
});