import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EmployeeVisitFrequencyChart } from '../EmployeeVisitFrequencyChart';
import { ChartTestWrapper } from './chartTestHelper';

describe('EmployeeVisitFrequencyChart', () => {
  const mockData = [
    { date: 'May 01', fullDate: '2026-05-01', count: 12 },
    { date: 'May 02', fullDate: '2026-05-02', count: 8 },
    { date: 'May 03', fullDate: '2026-05-03', count: 15 },
  ];

  it('should render loading state', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeVisitFrequencyChart data={[]} loading={true} height={300} />
      </ChartTestWrapper>,
    );

    const skeleton = container.querySelector('[data-testid="chart-skeleton"]');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveStyle({ height: '300px' });
  });

  it('should render empty state', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeVisitFrequencyChart data={[]} loading={false} height={300} />
      </ChartTestWrapper>,
    );

    const empty = container.querySelector('[data-testid="chart-empty"]');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent('No visit data available');
  });

  it('should render chart with data', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeVisitFrequencyChart data={mockData} loading={false} height={300} />
      </ChartTestWrapper>,
    );

    const chartContainer = container.querySelector('[data-testid="chart-container"]');
    expect(chartContainer).toBeInTheDocument();
    expect(chartContainer).toHaveStyle({ height: '300px' });
  });

  it('should render SVG chart', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeVisitFrequencyChart data={mockData} />
      </ChartTestWrapper>,
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});