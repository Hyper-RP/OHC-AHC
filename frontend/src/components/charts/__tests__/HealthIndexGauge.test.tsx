import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthIndexGauge } from '../HealthIndexGauge';
import { ChartTestWrapper } from './chartTestHelper';

describe('HealthIndexGauge', () => {
  const mockData = {
    department: 'Engineering',
    healthIndex: 85,
    visits: 50,
    referrals: 10,
    unfit: 5,
    employees: 100,
  };

  it('renders gauge with health index', () => {
    const { container } = render(
      <ChartTestWrapper>
        <HealthIndexGauge data={mockData} size={180} animate={false} />
      </ChartTestWrapper>,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders Health label when showLabel is true', () => {
    render(
      <ChartTestWrapper>
        <HealthIndexGauge data={mockData} size={180} showLabel={true} animate={false} />
      </ChartTestWrapper>,
    );

    expect(screen.getByText('Health')).toBeInTheDocument();
  });

  it('does not render Health label when showLabel is false', () => {
    render(
      <ChartTestWrapper>
        <HealthIndexGauge data={mockData} size={180} showLabel={false} animate={false} />
      </ChartTestWrapper>,
    );

    expect(screen.queryByText('Health')).not.toBeInTheDocument();
  });

  it('applies custom size', () => {
    const { container } = render(
      <ChartTestWrapper>
        <HealthIndexGauge data={mockData} size={200} animate={false} />
      </ChartTestWrapper>,
    );

    const gaugeContainer = container.querySelector('[class*="gaugeContainer"]') as HTMLElement;
    expect(gaugeContainer?.style.width).toBe('200px');
  });

  it('shows tooltip with department name', () => {
    render(
      <ChartTestWrapper>
        <HealthIndexGauge data={mockData} size={180} animate={false} />
      </ChartTestWrapper>,
    );

    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('displays correct color for high health index', () => {
    const highIndexData = { ...mockData, healthIndex: 85 };
    const { container } = render(
      <ChartTestWrapper>
        <HealthIndexGauge data={highIndexData} size={180} animate={false} />
      </ChartTestWrapper>,
    );

    const progressCircle = container.querySelector('svg circle[stroke-dasharray]');
    expect(progressCircle?.getAttribute('stroke')).toBe('#10b981');
  });

  it('displays correct color for medium health index', () => {
    const mediumIndexData = { ...mockData, healthIndex: 70 };
    const { container } = render(
      <ChartTestWrapper>
        <HealthIndexGauge data={mediumIndexData} size={180} animate={false} />
      </ChartTestWrapper>,
    );

    const progressCircle = container.querySelector('svg circle[stroke-dasharray]');
    expect(progressCircle?.getAttribute('stroke')).toBe('#f59e0b');
  });

  it('displays correct color for low health index', () => {
    const lowIndexData = { ...mockData, healthIndex: 50 };
    const { container } = render(
      <ChartTestWrapper>
        <HealthIndexGauge data={lowIndexData} size={180} animate={false} />
      </ChartTestWrapper>,
    );

    const progressCircle = container.querySelector('svg circle[stroke-dasharray]');
    expect(progressCircle?.getAttribute('stroke')).toBe('#ef4444');
  });

  it('renders without animation when animate is false', () => {
    render(
      <ChartTestWrapper>
        <HealthIndexGauge data={mockData} size={180} animate={false} />
      </ChartTestWrapper>,
    );

    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('displays tooltip details', () => {
    render(
      <ChartTestWrapper>
        <HealthIndexGauge data={mockData} size={180} animate={false} />
      </ChartTestWrapper>,
    );

    expect(screen.getByText('Employees:')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Visits:')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Referrals:')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Unfit:')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});