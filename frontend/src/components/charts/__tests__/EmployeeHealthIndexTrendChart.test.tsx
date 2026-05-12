import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EmployeeHealthIndexTrendChart } from '../EmployeeHealthIndexTrendChart';

describe('EmployeeHealthIndexTrendChart', () => {
  const mockData = [
    { date: 'May 01', fullDate: '2026-05-01', healthIndex: 85, status: 'good' as const },
    { date: 'May 02', fullDate: '2026-05-02', healthIndex: 72, status: 'warning' as const },
    { date: 'May 03', fullDate: '2026-05-03', healthIndex: 55, status: 'concern' as const },
  ];

  it('should render loading state', () => {
    const { container } = render(<EmployeeHealthIndexTrendChart data={[]} loading={true} height={350} />);

    const skeleton = container.querySelector('.skeleton');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render empty state', () => {
    const { container } = render(<EmployeeHealthIndexTrendChart data={[]} loading={false} height={350} />);

    const empty = container.querySelector('.empty');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent('No health index data available');
  });

  it('should render chart with data', () => {
    const { container } = render(<EmployeeHealthIndexTrendChart data={mockData} />);

    const chartContainer = container.querySelector('.chartContainer');
    expect(chartContainer).toBeInTheDocument();
  });

  it('should render reference line at y=60', () => {
    const { container } = render(<EmployeeHealthIndexTrendChart data={mockData} />);

    const referenceLine = container.querySelector('.recharts-reference-line');
    expect(referenceLine).toBeInTheDocument();
  });
});
