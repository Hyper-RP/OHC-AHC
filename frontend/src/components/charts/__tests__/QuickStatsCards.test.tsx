import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickStatsCards } from '../QuickStatsCards';

describe('QuickStatsCards', () => {
  const mockData = {
    totalVisits: 42,
    avgRecoveryTime: 5,
    fitnessTrend: { direction: 'up' as const, percentage: 12 },
  };

  it('should render all three stat cards', () => {
    render(<QuickStatsCards data={mockData} />);

    expect(screen.getByText('Total Visits')).toBeInTheDocument();
    expect(screen.getByText('Avg Recovery Time')).toBeInTheDocument();
    expect(screen.getByText('Fitness Trend')).toBeInTheDocument();
  });

  it('should display values correctly', () => {
    render(<QuickStatsCards data={mockData} />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('5 days')).toBeInTheDocument();
    expect(screen.getByText('12%')).toBeInTheDocument();
  });

  it('should display correct trend icon for up direction', () => {
    render(<QuickStatsCards data={mockData} />);

    const trendValue = screen.getByText('12%');
    expect(trendValue).toHaveClass('up');
  });

  it('should display correct trend icon for down direction', () => {
    const data = { ...mockData, fitnessTrend: { direction: 'down' as const, percentage: 8 } };
    render(<QuickStatsCards data={data} />);

    const trendValue = screen.getByText('8%');
    expect(trendValue).toHaveClass('down');
  });

  it('should display correct trend icon for stable direction', () => {
    const data = { ...mockData, fitnessTrend: { direction: 'stable' as const, percentage: 0 } };
    render(<QuickStatsCards data={data} />);

    const trendValue = screen.getByText('0%');
    expect(trendValue).toHaveClass('stable');
  });
});
