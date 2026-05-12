import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EmployeeVisitFrequencyChart } from '../EmployeeVisitFrequencyChart';

describe('EmployeeVisitFrequencyChart', () => {
  const mockData = [
    { date: 'May 01', fullDate: '2026-05-01', count: 12 },
    { date: 'May 02', fullDate: '2026-05-02', count: 8 },
    { date: 'May 03', fullDate: '2026-05-03', count: 15 },
  ];

  it('should render loading state', () => {
    const { container } = render(<EmployeeVisitFrequencyChart data={[]} loading={true} height={300} />);

    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveStyle({ height: '300px' });
  });

  it('should render empty state', () => {
    const { container } = render(<EmployeeVisitFrequencyChart data={[]} loading={false} height={300} />);

    const empty = container.querySelector('.empty');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent('No visit data available');
  });

  it('should render chart with data', () => {
    const { container } = render(
      <EmployeeVisitFrequencyChart data={mockData} loading={false} height={300} />
    );

    const chartContainer = container.querySelector('.chartContainer');
    expect(chartContainer).toBeInTheDocument();
    expect(chartContainer).toHaveStyle({ height: '300px' });
  });

  it('should render responsive container', () => {
    const { container } = render(<EmployeeVisitFrequencyChart data={mockData} />);

    const responsiveContainer = container.querySelector('.recharts-responsive-container');
    expect(responsiveContainer).toBeInTheDocument();
  });
});
