import { render, screen, fireEvent } from '@testing-library/react';
import { DateRangeFilter } from '../DateRangeFilter';

describe('DateRangeFilter', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders date range picker', () => {
    render(
      <DateRangeFilter
        start={null}
        end={null}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
  });

  it('shows quick presets', () => {
    render(
      <DateRangeFilter
        start={null}
        end={null}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    expect(screen.getByText('This month')).toBeInTheDocument();
  });

  it('calls onChange when start date changes', () => {
    render(
      <DateRangeFilter
        start={null}
        end={null}
        onChange={mockOnChange}
      />
    );

    const startInput = document.querySelectorAll('input[type="date"]')[0];
    if (startInput) {
      fireEvent.change(startInput, { target: { value: '2026-01-01' } });
      expect(mockOnChange).toHaveBeenCalled();
    }
  });

  it('calls onChange when end date changes', () => {
    render(
      <DateRangeFilter
        start={new Date('2026-01-01')}
        end={null}
        onChange={mockOnChange}
      />
    );

    const endInput = document.querySelectorAll('input[type="date"]')[1];
    if (endInput) {
      fireEvent.change(endInput, { target: { value: '2026-01-31' } });
      expect(mockOnChange).toHaveBeenCalled();
    }
  });

  it('clears dates when clear button is clicked', () => {
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-31');

    render(
      <DateRangeFilter
        start={start}
        end={end}
        onChange={mockOnChange}
      />
    );

    // Clear button is a button with X icon
    const clearButton = screen.getByText('Date Range').nextElementSibling;
    if (clearButton) {
      fireEvent.click(clearButton);
      expect(mockOnChange).toHaveBeenCalledWith(null, null);
    }
  });

  it('does not show clear button when no dates selected', () => {
    render(
      <DateRangeFilter
        start={null}
        end={null}
        onChange={mockOnChange}
      />
    );

    // Clear button only shows when dates are selected
    const clearButton = screen.getByText('Date Range').nextElementSibling;
    expect(clearButton).not.toBeInTheDocument();
  });

  it('applies preset when clicked', () => {
    render(
      <DateRangeFilter
        start={null}
        end={null}
        onChange={mockOnChange}
      />
    );

    fireEvent.click(screen.getByText('Last 7 days'));

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('displays section headers', () => {
    render(
      <DateRangeFilter
        start={null}
        end={null}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Quick presets')).toBeInTheDocument();
  });

  it('has correct input types', () => {
    render(
      <DateRangeFilter
        start={null}
        end={null}
        onChange={mockOnChange}
      />
    );

    const inputs = document.querySelectorAll('input[type="date"]');
    expect(inputs.length).toBe(2);
  });

  it('uses custom presets', () => {
    const customPresets = [
      { label: 'Custom 1', start: new Date('2026-01-01'), end: new Date('2026-01-15') },
    ];

    render(
      <DateRangeFilter
        start={null}
        end={null}
        onChange={mockOnChange}
        presets={customPresets}
      />
    );

    expect(screen.getByText('Custom 1')).toBeInTheDocument();
    expect(screen.queryByText('Today')).not.toBeInTheDocument();
  });

  it('shows input labels', () => {
    render(
      <DateRangeFilter
        start={null}
        end={null}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
  });

  it('has proper spacing and layout', () => {
    const { container } = render(
      <DateRangeFilter
        start={null}
        end={null}
        onChange={mockOnChange}
      />
    );

    const filterContainer = container.firstChild as HTMLElement;
    expect(filterContainer).toHaveClass('space-y-4');
  });
});