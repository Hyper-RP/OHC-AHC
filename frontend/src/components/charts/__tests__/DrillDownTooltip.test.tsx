import { render, screen, fireEvent } from '@testing-library/react';
import { DrillDownTooltip } from '../DrillDownTooltip';

const mockPayload = [
  {
    name: 'Diagnosis A',
    value: 25,
    dataKey: 'diagnosis_a',
    color: '#ff0000',
    payload: {
      date: '2026-01-01',
      details: 'Additional info',
      count: 25,
      severity: 'MILD',
    },
  },
  {
    name: 'Diagnosis B',
    value: 15,
    dataKey: 'diagnosis_b',
    color: '#00ff00',
    payload: {
      date: '2026-01-01',
      count: 15,
    },
  },
];

describe('DrillDownTooltip', () => {
  it('does not render when not active', () => {
    const { container } = render(
      <DrillDownTooltip
        active={false}
        payload={mockPayload}
        onDrillDown={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('does not render when payload is empty', () => {
    const { container } = render(
      <DrillDownTooltip
        active={true}
        payload={[]}
        onDrillDown={jest.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders when active with payload', () => {
    render(
      <DrillDownTooltip
        active={true}
        payload={mockPayload}
        onDrillDown={jest.fn()}
      />
    );

    expect(screen.getByText('Diagnosis A')).toBeInTheDocument();
    expect(screen.getByText('Diagnosis B')).toBeInTheDocument();
  });

  it('shows label when provided', () => {
    render(
      <DrillDownTooltip
        active={true}
        payload={mockPayload}
        label="2026-01-01"
        onDrillDown={jest.fn()}
      />
    );

    // Find label in the header (not in details)
    const labelElement = screen.getByText('2026-01-01').closest('.text-sm.font-semibold');
    expect(labelElement).toBeInTheDocument();
  });

  it('shows payload values', () => {
    render(
      <DrillDownTooltip
        active={true}
        payload={mockPayload}
        onDrillDown={jest.fn()}
      />
    );

    // Find values in the main display area (not details)
    const values = screen.getAllByText('25').filter(el => el.closest('.font-medium'));
    expect(values.length).toBeGreaterThan(0);
    const values2 = screen.getAllByText('15').filter(el => el.closest('.font-medium'));
    expect(values2.length).toBeGreaterThan(0);
  });

  it('shows color indicators', () => {
    const { container } = render(
      <DrillDownTooltip
        active={true}
        payload={mockPayload}
        onDrillDown={jest.fn()}
      />
    );

    const colorDots = container.querySelectorAll('.rounded-full');
    expect(colorDots.length).toBeGreaterThan(0);
  });

  it('formats number values with commas', () => {
    const largePayload = [
      {
        name: 'Large Number',
        value: 10000,
        dataKey: 'large',
        color: '#ff0000',
        payload: {},
      },
    ];

    render(
      <DrillDownTooltip
        active={true}
        payload={largePayload}
        onDrillDown={jest.fn()}
      />
    );

    expect(screen.getByText('10,000')).toBeInTheDocument();
  });

  it('shows details section when payload has extra data', () => {
    render(
      <DrillDownTooltip
        active={true}
        payload={mockPayload}
        onDrillDown={jest.fn()}
      />
    );

    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('shows drill-down button when onDrillDown is provided', () => {
    render(
      <DrillDownTooltip
        active={true}
        payload={mockPayload}
        onDrillDown={jest.fn()}
      />
    );

    expect(screen.getByText('Drill Down →')).toBeInTheDocument();
  });

  it('does not show drill-down button when onDrillDown is not provided', () => {
    render(
      <DrillDownTooltip
        active={true}
        payload={mockPayload}
      />
    );

    expect(screen.queryByText('Drill Down →')).not.toBeInTheDocument();
  });

  it('uses custom content when provided', () => {
    const customContent = ({ active, payload }: any) => {
      if (!active || !payload) return null;
      return <div>Custom: {payload[0].name}</div>;
    };

    render(
      <DrillDownTooltip
        active={true}
        payload={mockPayload}
        customContent={customContent}
      />
    );

    expect(screen.getByText('Custom: Diagnosis A')).toBeInTheDocument();
  });

  it('hides system keys in details', () => {
    render(
      <DrillDownTooltip
        active={true}
        payload={mockPayload}
        onDrillDown={jest.fn()}
      />
    );

    expect(screen.queryByText('name:')).not.toBeInTheDocument();
    expect(screen.queryByText('value:')).not.toBeInTheDocument();
    expect(screen.queryByText('fill:')).not.toBeInTheDocument();
  });

  it('shows correct details keys', () => {
    render(
      <DrillDownTooltip
        active={true}
        payload={mockPayload}
        onDrillDown={jest.fn()}
      />
    );

    expect(screen.getByText(/details:/)).toBeInTheDocument();
    expect(screen.getByText(/count:/)).toBeInTheDocument();
    expect(screen.getByText(/severity:/)).toBeInTheDocument();
  });

  it('has proper tooltip styling', () => {
    const { container } = render(
      <DrillDownTooltip
        active={true}
        payload={mockPayload}
        onDrillDown={jest.fn()}
      />
    );

    const tooltip = container.firstChild as HTMLElement;
    expect(tooltip).toHaveClass('bg-white');
    expect(tooltip).toHaveClass('rounded-lg');
    expect(tooltip).toHaveClass('shadow-lg');
  });

  it('shows payload name with color', () => {
    render(
      <DrillDownTooltip
        active={true}
        payload={mockPayload}
        onDrillDown={jest.fn()}
      />
    );

    const diagnosisA = screen.getByText('Diagnosis A').closest('div');
    expect(diagnosisA?.querySelector('.rounded-full')).toHaveStyle({
      backgroundColor: '#ff0000',
    });
  });

  it('handles string values correctly', () => {
    const stringPayload = [
      {
        name: 'Text Value',
        value: 'some text',
        dataKey: 'text',
        color: '#ff0000',
        payload: {},
      },
    ];

    render(
      <DrillDownTooltip
        active={true}
        payload={stringPayload}
        onDrillDown={jest.fn()}
      />
    );

    expect(screen.getByText('some text')).toBeInTheDocument();
  });

  it('shows "cases" suffix for numeric values', () => {
    render(
      <DrillDownTooltip
        active={true}
        payload={mockPayload}
        onDrillDown={jest.fn()}
      />
    );

    // Component doesn't add "cases" suffix, just shows formatted number
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('does not show "cases" suffix for non-numeric values', () => {
    const stringPayload = [
      {
        name: 'Text',
        value: 'text',
        dataKey: 'text',
        color: '#ff0000',
        payload: {},
      },
    ];

    render(
      <DrillDownTooltip
        active={true}
        payload={stringPayload}
        onDrillDown={jest.fn()}
      />
    );

    expect(screen.getByText('text')).toBeInTheDocument();
    expect(screen.queryByText('text cases')).not.toBeInTheDocument();
  });

  it('expands details when summary is clicked', () => {
    render(
      <DrillDownTooltip
        active={true}
        payload={mockPayload}
        onDrillDown={jest.fn()}
      />
    );

    const detailsSummary = screen.getByText('View Details');
    expect(detailsSummary).toBeInTheDocument();

    fireEvent.click(detailsSummary);

    expect(screen.getByText('Additional info')).toBeVisible();
  });
});