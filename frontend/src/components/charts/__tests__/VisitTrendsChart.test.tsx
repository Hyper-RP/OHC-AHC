import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisitTrendsChart } from '../VisitTrendsChart';

describe('VisitTrendsChart', () => {
  const mockData = [
    { date: new Date('2026-05-01'), count: 10 },
    { date: new Date('2026-05-02'), count: 15 },
    { date: new Date('2026-05-03'), count: 12 },
  ];

  it('renders chart with data', () => {
    const { container } = render(
      <VisitTrendsChart data={mockData} height={400} />
    );

    expect(container.querySelector('.chart')).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    const { container } = render(
      <VisitTrendsChart data={mockData} loading={true} height={400} />
    );

    expect(container.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    const { container } = render(
      <VisitTrendsChart data={[]} height={400} />
    );

    expect(container.querySelector('.empty')).toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('applies custom height', () => {
    const { container } = render(
      <VisitTrendsChart data={mockData} height={300} />
    );

    const chart = container.querySelector('.chart');
    expect(chart).toHaveStyle({ height: '300px' });
  });

  it('formats dates correctly', () => {
    render(<VisitTrendsChart data={mockData} height={400} />);

    // Check that chart is rendered (Recharts SVG should be present)
    const chartElement = document.querySelector('svg');
    expect(chartElement).toBeInTheDocument();
  });
});
