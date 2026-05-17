import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EmployeeSeverityBarChart } from '../EmployeeSeverityBarChart';
import { ChartTestWrapper } from './chartTestHelper';

describe('EmployeeSeverityBarChart', () => {
  const mockData = [
    { severity: 'MILD' as const, count: 25, color: '#10b981' },
    { severity: 'MODERATE' as const, count: 10, color: '#f59e0b' },
    { severity: 'SERIOUS' as const, count: 5, color: '#f97316' },
    { severity: 'CRITICAL' as const, count: 2, color: '#ef4444' },
  ];

  it('should render loading state', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeSeverityBarChart data={[]} loading={true} height={300} />
      </ChartTestWrapper>,
    );

    const skeleton = container.querySelector('[data-testid="chart-skeleton"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render empty state', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeSeverityBarChart data={[]} loading={false} height={300} />
      </ChartTestWrapper>,
    );

    const empty = container.querySelector('[data-testid="chart-empty"]');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent('No severity data available');
  });

  it('should render chart with data', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeSeverityBarChart data={mockData} />
      </ChartTestWrapper>,
    );

    const chartContainer = container.querySelector('[data-testid="chart-container"]');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should render SVG chart', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeSeverityBarChart data={mockData} />
      </ChartTestWrapper>,
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});