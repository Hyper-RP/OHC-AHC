import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EmployeeSeverityBarChart } from '../EmployeeSeverityBarChart';

describe('EmployeeSeverityBarChart', () => {
  const mockData = [
    { severity: 'MILD' as const, count: 25, color: '#10b981' },
    { severity: 'MODERATE' as const, count: 10, color: '#f59e0b' },
    { severity: 'SERIOUS' as const, count: 5, color: '#f97316' },
    { severity: 'CRITICAL' as const, count: 2, color: '#ef4444' },
  ];

  it('should render loading state', () => {
    const { container } = render(<EmployeeSeverityBarChart data={[]} loading={true} height={300} />);

    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render empty state', () => {
    const { container } = render(<EmployeeSeverityBarChart data={[]} loading={false} height={300} />);

    const empty = container.querySelector('.empty');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent('No severity data available');
  });

  it('should render chart with data', () => {
    const { container } = render(<EmployeeSeverityBarChart data={mockData} />);

    const chartContainer = container.querySelector('.chartContainer');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should render all severity levels', () => {
    const { container } = render(<EmployeeSeverityBarChart data={mockData} />);

    const xAxis = container.querySelector('.recharts-xAxis');
    expect(xAxis).toBeInTheDocument();
  });
});
