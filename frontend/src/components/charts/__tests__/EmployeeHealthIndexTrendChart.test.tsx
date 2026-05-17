import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EmployeeHealthIndexTrendChart } from '../EmployeeHealthIndexTrendChart';
import { ChartTestWrapper } from './chartTestHelper';

describe('EmployeeHealthIndexTrendChart', () => {
  const mockData = [
    { date: 'May 01', fullDate: '2026-05-01', healthIndex: 85, status: 'good' as const },
    { date: 'May 02', fullDate: '2026-05-02', healthIndex: 72, status: 'warning' as const },
    { date: 'May 03', fullDate: '2026-05-03', healthIndex: 55, status: 'concern' as const },
  ];

  it('should render loading state', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeHealthIndexTrendChart data={[]} loading={true} height={350} />
      </ChartTestWrapper>,
    );

    const skeleton = container.querySelector('[data-testid="chart-skeleton"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render empty state', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeHealthIndexTrendChart data={[]} loading={false} height={350} />
      </ChartTestWrapper>,
    );

    const empty = container.querySelector('[data-testid="chart-empty"]');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent('No health index data available');
  });

  it('should render chart with data', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeHealthIndexTrendChart data={mockData} />
      </ChartTestWrapper>,
    );

    const chartContainer = container.querySelector('[data-testid="chart-container"]');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should render SVG chart', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeHealthIndexTrendChart data={mockData} />
      </ChartTestWrapper>,
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});