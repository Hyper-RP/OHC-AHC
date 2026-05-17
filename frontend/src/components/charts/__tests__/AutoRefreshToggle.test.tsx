import { render, screen, fireEvent } from '@testing-library/react';
import { AutoRefreshToggle } from '../AutoRefreshToggle';

describe('AutoRefreshToggle', () => {
  it('renders with label', () => {
    render(
      <AutoRefreshToggle enabled={false} onToggle={jest.fn()} />
    );

    expect(screen.getByText('Auto-refresh')).toBeInTheDocument();
  });

  it('calls onToggle when switch is clicked', () => {
    const onToggle = jest.fn();
    render(
      <AutoRefreshToggle enabled={false} onToggle={onToggle} />
    );

    const button = screen.getByRole('switch');
    fireEvent.click(button);

    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('shows correct enabled state', () => {
    const { rerender } = render(
      <AutoRefreshToggle enabled={true} onToggle={jest.fn()} />
    );

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

    rerender(<AutoRefreshToggle enabled={false} onToggle={jest.fn()} />);

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('shows interval selector when enabled', () => {
    render(
      <AutoRefreshToggle
        enabled={true}
        onToggle={jest.fn()}
        interval={60}
        onIntervalChange={jest.fn()}
      />
    );

    expect(screen.getByText('Interval:')).toBeInTheDocument();
  });

  it('does not show interval selector when onIntervalChange is not provided', () => {
    render(
      <AutoRefreshToggle enabled={true} onToggle={jest.fn()} />
    );

    expect(screen.queryByText('Interval:')).not.toBeInTheDocument();
  });

  it('calls onIntervalChange when interval changes', () => {
    const onIntervalChange = jest.fn();
    render(
      <AutoRefreshToggle
        enabled={true}
        onToggle={jest.fn()}
        interval={60}
        onIntervalChange={onIntervalChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '300' } });

    expect(onIntervalChange).toHaveBeenCalledWith(300);
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <AutoRefreshToggle
        enabled={false}
        onToggle={jest.fn()}
        disabled={true}
      />
    );

    const button = screen.getByRole('switch');
    expect(button).toBeDisabled();
  });

  it('displays correct interval options', () => {
    render(
      <AutoRefreshToggle
        enabled={true}
        onToggle={jest.fn()}
        interval={60}
        onIntervalChange={jest.fn()}
      />
    );

    expect(screen.getByText('30s')).toBeInTheDocument();
    expect(screen.getByText('1m')).toBeInTheDocument();
    expect(screen.getByText('5m')).toBeInTheDocument();
    expect(screen.getByText('10m')).toBeInTheDocument();
  });
});