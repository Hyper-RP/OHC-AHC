import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatCard } from '../StatCard';

describe('StatCard Component', () => {
  const user = userEvent.setup();

  it('renders with label and value', () => {
    render(<StatCard label="Total Visits" value="1,234" />);
    expect(screen.getByText('Total Visits')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders with numeric value and formats it', () => {
    render(<StatCard label="Users" value={1234} />);
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders with positive trend', () => {
    render(<StatCard label="Referrals" value="56" trend={12} />);
    // Check that trend arrow and value exist
    expect(screen.getAllByText(/↑/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/12/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/%/).length).toBeGreaterThan(0);
  });

  it('renders with negative trend', () => {
    render(<StatCard label="Decrease" value="23" trend={-3} />);
    expect(screen.getAllByText(/↓/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3/).length).toBeGreaterThan(0);
  });

  it('renders with zero trend', () => {
    render(<StatCard label="Stable" value="42" trend={0} />);
    expect(screen.getAllByText(/—/).length).toBeGreaterThan(0);
  });

  it('renders with icon', () => {
    render(<StatCard label="Users" value="450" icon="👥" />);
    expect(screen.getByText('👥')).toBeInTheDocument();
  });

  it('renders without trend when trend is undefined', () => {
    render(<StatCard label="Simple" value="42" />);
    // Trend should not be present - check that arrow doesn't exist
    expect(screen.queryByText(/↑|↓|—/)).not.toBeInTheDocument();
  });

  it('renders with trend label', () => {
    render(<StatCard label="Monthly" value={78} trend={15} trendLabel="vs last month" />);
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('is clickable when onClick is provided', async () => {
    const handleClick = vi.fn();
    render(<StatCard label="Clickable" value="100" onClick={handleClick} />);

    await user.click(screen.getByText('100'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders all props together', () => {
    render(
      <StatCard
        label="Active Patients"
        value={78}
        trend={15}
        trendLabel="vs last month"
        icon="🏥"
        className="highlight"
      />
    );
    expect(screen.getByText('Active Patients')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getAllByText(/↑/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/15/).length).toBeGreaterThan(0);
    expect(screen.getByText('vs last month')).toBeInTheDocument();
    expect(screen.getByText('🏥')).toBeInTheDocument();
  });
});
