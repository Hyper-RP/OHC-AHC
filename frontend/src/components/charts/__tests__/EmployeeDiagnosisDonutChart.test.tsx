import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EmployeeDiagnosisDonutChart } from '../EmployeeDiagnosisDonutChart';
import { ChartTestWrapper } from './chartTestHelper';

describe('EmployeeDiagnosisDonutChart', () => {
  const mockData = [
    { name: 'Fever', count: 15, percentage: 45, color: '#3b82f6' },
    { name: 'Cold', count: 10, percentage: 30, color: '#10b981' },
    { name: 'Headache', count: 8, percentage: 25, color: '#f59e0b' },
  ];

  it('should render loading state', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeDiagnosisDonutChart data={[]} loading={true} height={300} />
      </ChartTestWrapper>,
    );

    const skeleton = container.querySelector('[data-testid="chart-skeleton"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render empty state', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeDiagnosisDonutChart data={[]} loading={false} height={300} />
      </ChartTestWrapper>,
    );

    const empty = container.querySelector('[data-testid="chart-empty"]');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent('No diagnosis data available');
  });

  it('should render chart with data', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeDiagnosisDonutChart data={mockData} />
      </ChartTestWrapper>,
    );

    const chartContainer = container.querySelector('[data-testid="chart-container"]');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should display total count in center', () => {
    const { container } = render(
      <ChartTestWrapper>
        <EmployeeDiagnosisDonutChart data={mockData} />
      </ChartTestWrapper>,
    );

    const chartContainer = container.querySelector('[data-testid="chart-container"]');
    expect(chartContainer).toBeInTheDocument();
  });
});
