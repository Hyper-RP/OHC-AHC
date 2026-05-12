import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EmployeeVisitTypeChart } from '../EmployeeVisitTypeChart';

describe('EmployeeVisitTypeChart', () => {
  const mockData = [
    { type: 'Routine' as const, count: 25, percentage: 50 },
    { type: 'Walk-in' as const, count: 20, percentage: 40 },
    { type: 'Follow-up' as const, count: 5, percentage: 10 },
  ];

  it('should render loading state', () => {
    const { container } = render(<EmployeeVisitTypeChart data={[]} loading={true} height={300} />);

    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render empty state', () => {
    const { container } = render(<EmployeeVisitTypeChart data={[]} loading={false} height={300} />);

    const empty = container.querySelector('.empty');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent('No visit type data available');
  });

  it('should render chart with data', () => {
    const { container } = render(<EmployeeVisitTypeChart data={mockData} />);

    const chartContainer = container.querySelector('.chartContainer');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should render legend', () => {
    const { container } = render(<EmployeeVisitTypeChart data={mockData} />);

    const legend = container.querySelector('.recharts-legend-wrapper');
    expect(legend).toBeInTheDocument();
  });
});
