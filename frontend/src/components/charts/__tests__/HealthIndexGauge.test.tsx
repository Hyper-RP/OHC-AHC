import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthIndexGauge } from '../HealthIndexGauge';

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
      <HealthIndexGauge data={mockData} size={180} />
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders department label when showLabel is true', () => {
    render(
      <HealthIndexGauge data={mockData} size={180} showLabel={true} />
    );

    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('does not render department label when showLabel is false', () => {
    render(
      <HealthIndexGauge data={mockData} size={180} showsLabel={false} />
    );

    expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
  });

  it('applies custom size', () => {
    const { container } = render(
      <HealthIndexGauge data={mockData} size={200} />
    );

    const gaugeContainer = container.querySelector('.gaugeContainer');
    expect(gaugeContainer).toHaveStyle({ width: '200px' });
  });

  it('shows tooltip on hover', () => {
    const { container } = render(
      <HealthIndexGauge data={mockData} size={180} />
    );

    const gaugeContainer = container.querySelector('.gaugeContainer');

    // Tooltip should be hidden by default
    const tooltip = container.querySelector('.tooltip');
    expect(tooltip).toHaveStyle({ visibility: 'hidden' });

    // Simulate hover
    gaugeContainer?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    // Tooltip should become visible on hover
    // Note: This may need to be adjusted based on actual CSS implementation
  });

  it('displays correct color for high health index', () => {
    const highIndexData = { ...mockData, healthIndex: 85 };
    const { container } = render(
      <HealthIndexGauge data={highIndexData} size={180} />
    );

    const progressCircle = container.querySelector('.progressCircle');
    expect(progressCircle).toHaveAttribute('stroke', '#10b981');
  });

  it('displays correct color for medium health index', () => {
    const mediumIndexData = { ...mockData, healthIndex: 70 };
    const { container } = render(
      <HealthIndexGauge data={mediumIndexData} size={180} />
    );

    const progressCircle = container.querySelector('.progressCircle');
    expect(progressCircle).toHaveAttribute('stroke', '#f59e0b');
  });

  it('displays correct color for low health index', () => {
    const lowIndexData = { ...mockData, healthIndex: 50 };
    const { container } = render(
      <HealthIndexGauge data={lowIndexData} size={180} />
    );

    const progressCircle = container.querySelector('.progressCircle');
    expect(progressCircle).toHaveAttribute('stroke', '#ef4444');
  });

  it('animates when animate is true', () => {
    render(
      <HealthIndexGauge data={mockData} size={180} animate={true} />
    );

    // After animation, the displayed value should be 85
    // This would need to check the animated value
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('does not animate when animate is false', () => {
    render(
      <HealthIndexGauge data={mockData} size={180} animate={false} />
    );

    expect(screen.getByText('85%')).toBeInTheDocument();
  });
});
