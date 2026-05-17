import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EmployeeVisitTypeChart } from '../EmployeeVisitTypeChart';
import { ChartTestWrapper } from './chartTestHelper';

describe('EmployeeVisitTypeChart', () => {
  const mockData = [
    { type: 'Routine' as const, count: 25, percentage: 50 },
    { type: 'Walk-in' as const, count: 20, percentage: 40 },
    { type: 'Follow-up' as const, count: 5, percentage: 10 },
  ];

  it('should render loading state', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeVisitTypeChart data={[]} loading={true} height={300} />
      </ChartTestWrapper>,
    );

    const skeleton = container.querySelector('[data-testid="chart-skeleton"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render empty state', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeVisitTypeChart data={[]} loading={false} height={300} />
      </ChartTestWrapper>,
    );

    const empty = container.querySelector('[data-testid="chart-empty"]');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent('No visit type data available');
  });

  it('should render chart with data', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeVisitTypeChart data={mockData} />
      </ChartTestWrapper>,
    );

    const chartContainer = container.querySelector('[data-testid="chart-container"]');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should render SVG chart', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeVisitTypeChart data={mockData} />
      </ChartTestWrapper>,
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});