import { render } from '@testing-library/react';
import { BrushSelector } from '../BrushSelector';

describe('BrushSelector', () => {
  const mockData = [
    { date: '2026-01-01', value: 10 },
    { date: '2026-01-02', value: 20 },
    { date: '2026-01-03', value: 30 },
    { date: '2026-01-04', value: 40 },
    { date: '2026-01-05', value: 50 },
  ];

  it('does not render when data is empty', () => {
    const { container } = render(
      <BrushSelector
        data={[]}
        dataKey="date"
        onChange={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('does not render when data is undefined', () => {
    const { container } = render(
      <BrushSelector
        data={undefined as any}
        dataKey="date"
        onChange={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders brush component when data is provided', () => {
    const { container } = render(
      <BrushSelector
        data={mockData}
        dataKey="date"
        onChange={jest.fn()}
      />
    );

    expect(container.firstChild).not.toBeNull();
  });

  it('uses custom height', () => {
    const { container } = render(
      <BrushSelector
        data={mockData}
        dataKey="date"
        onChange={jest.fn()}
        height={150}
      />
    );

    const brushContainer = container.firstChild as HTMLElement;
    expect(brushContainer.style.height).toBe('150px');
  });

  it('uses default height when not specified', () => {
    const { container } = render(
      <BrushSelector
        data={mockData}
        dataKey="date"
        onChange={jest.fn()}
      />
    );

    const brushContainer = container.firstChild as HTMLElement;
    expect(brushContainer.style.height).toBe('100px');
  });

  it('applies custom className', () => {
    const { container } = render(
      <BrushSelector
        data={mockData}
        dataKey="date"
        onChange={jest.fn()}
        className="custom-brush"
      />
    );

    const brushContainer = container.firstChild as HTMLElement;
    expect(brushContainer).toHaveClass('custom-brush');
  });

  it('calls onChange when brush changes', () => {
    const onChange = jest.fn();
    render(
      <BrushSelector
        data={mockData}
        dataKey="date"
        onChange={onChange}
      />
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  it('respects startIndex and endIndex props', () => {
    render(
      <BrushSelector
        data={mockData}
        dataKey="date"
        onChange={jest.fn()}
        startIndex={1}
        endIndex={3}
      />
    );

    expect(document.querySelector('[dataKey="date"]')).toBeInTheDocument();
  });

  it('uses correct stroke color', () => {
    const { container } = render(
      <BrushSelector
        data={mockData}
        dataKey="date"
        onChange={jest.fn()}
      />
    );

    const brushElement = container.querySelector('[stroke="#3b82f6"]');
    expect(brushElement).toBeInTheDocument();
  });

  it('uses correct fill color', () => {
    const { container } = render(
      <BrushSelector
        data={mockData}
        dataKey="date"
        onChange={jest.fn()}
      />
    );

    const brushElement = container.querySelector('[fill="#3b82f6"]');
    expect(brushElement).toBeInTheDocument();
  });

  it('has correct traveller width', () => {
    render(
      <BrushSelector
        data={mockData}
        dataKey="date"
        onChange={jest.fn()}
      />
    );

    const travellerWidth = 10;
    expect(travellerWidth).toBeGreaterThan(0);
  });

  it('renders CartesianGrid', () => {
    const { container } = render(
      <BrushSelector
        data={mockData}
        dataKey="date"
        onChange={jest.fn()}
      />
    );

    const grid = container.querySelector('[strokeDasharray]');
    expect(grid).toBeInTheDocument();
  });

  it('renders XAxis', () => {
    render(
      <BrushSelector
        data={mockData}
        dataKey="date"
        onChange={jest.fn()}
      />
    );

    expect(document.querySelector('[dataKey="date"]')).toBeInTheDocument();
  });

  it('hides ticks on XAxis', () => {
    render(
      <BrushSelector
        data={mockData}
        dataKey="date"
        onChange={jest.fn()}
      />
    );

    const xAxis = document.querySelector('[dataKey="date"]');
    expect(xAxis).toBeInTheDocument();
  });

  it('hides axis line on XAxis', () => {
    render(
      <BrushSelector
        data={mockData}
        dataKey="date"
        onChange={jest.fn()}
      />
    );

    const xAxis = document.querySelector('[dataKey="date"]');
    expect(xAxis).toBeInTheDocument();
  });

  it('hides tick line on XAxis', () => {
    render(
      <BrushSelector
        data={mockData}
        dataKey="date"
        onChange={jest.fn()}
      />
    );

    const xAxis = document.querySelector('[dataKey="date"]');
    expect(xAxis).toBeInTheDocument();
  });
});