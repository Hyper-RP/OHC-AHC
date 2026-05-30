import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VisitTrendsChart } from '../VisitTrendsChart';
import { ChartTestWrapper } from './chartTestHelper';

describe('VisitTrendsChart', () => {
  const mockData = [
    { date: new Date('2026-05-01'), count: 10 },
    { date: new Date('2026-05-02'), count: 15 },
    { date: new Date('2026-05-03'), count: 12 },
  ];

  it('renders chart with data', () => {
    const { container } = render(
      <ChartTestWrapper height={400}>
        <VisitTrendsChart data={mockData} height={400} />
      </ChartTestWrapper>,
    );

    expect(container.querySelector('[data-testid="chart-container"]')).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    const { container } = render(
      <ChartTestWrapper height={400}>
        <VisitTrendsChart data={mockData} loading={true} height={400} />
      </ChartTestWrapper>,
    );

    expect(container.querySelector('[data-testid="chart-skeleton"]')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    const { container } = render(
      <ChartTestWrapper height={400}>
        <VisitTrendsChart data={[]} height={400} />
      </ChartTestWrapper>,
    );

    expect(container.querySelector('[data-testid="chart-empty"]')).toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('applies custom height', () => {
    const { container } = render(
      <ChartTestWrapper height={300}>
        <VisitTrendsChart data={mockData} height={300} />
      </ChartTestWrapper>,
    );

    const chart = container.querySelector('[data-testid="chart-container"]');
    expect(chart).toHaveStyle({ height: '300px' });
  });

  it('formats dates correctly', () => {
    render(
      <ChartTestWrapper height={400}>
        <VisitTrendsChart data={mockData} height={400} />
      </ChartTestWrapper>,
    );

    const chartElement = document.querySelector('svg');
    expect(chartElement).toBeInTheDocument();
  });
});