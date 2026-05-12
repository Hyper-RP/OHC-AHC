import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EmployeeDiagnosisDonutChart } from '../EmployeeDiagnosisDonutChart';

describe('EmployeeDiagnosisDonutChart', () => {
  const mockData = [
    { name: 'Fever', count: 15, percentage: 45, color: '#3b82f6' },
    { name: 'Cold', count: 10, percentage: 30, color: '#10b981' },
    { name: 'Headache', count: 8, percentage: 25, color: '#f59e0b' },
  ];

  it('should render loading state', () => {
    const { container } = render(<EmployeeDiagnosisDonutChart data={[]} loading={true} height={300} />);

    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render empty state', () => {
    const { container } = render(<EmployeeDiagnosisDonutChart data={[]} loading={false} height={300} />);

    const empty = container.querySelector('.empty');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent('No diagnosis data available');
  });

  it('should render chart with data', () => {
    const { container } = render(<EmployeeDiagnosisDonutChart data={mockData} />);

    const chartContainer = container.querySelector('.chartContainer');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should display total count in center', () => {
    const { container } = render(<EmployeeDiagnosisDonutChart data={mockData} />);

    const centerLabel = container.querySelector('.centerLabel');
    expect(centerLabel).toBeInTheDocument();
    expect(centerLabel).toHaveTextContent('33');
  });
});
