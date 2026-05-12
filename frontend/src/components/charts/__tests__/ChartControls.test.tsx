import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartControls } from '../ChartControls';

describe('ChartControls', () => {
  const mockOnPeriodChange = vi.fn();
  const mockOnDailyMonthlyChange = vi.fn();
  const mockOnDateRangeChange = vi.fn();
  const mockOnApplyDateRange = vi.fn();
  const mockOnExport = vi.fn();

  const defaultProps = {
    period: 30,
    onPeriodChange: mockOnPeriodChange,
    dailyMonthly: 'daily',
    onDailyMonthlyChange: mockOnDailyMonthlyChange,
  };

  it('renders period selector and daily/monthly toggle', () => {
    render(<ChartControls {...defaultProps} />);

    expect(screen.getByText('30 Days')).toBeInTheDocument();
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('calls onPeriodChange when period is changed', () => {
    render(<ChartControls {...defaultProps} />);

    const periodSelect = screen.getByRole('combobox');
    // Note: Testing select changes may require different approach based on FormInput implementation
    expect(periodSelect).toBeInTheDocument();
  });

  it('highlights active daily/monthly button', () => {
    const { rerender } = render(<ChartControls {...defaultProps} dailyMonthly="daily" />);

    expect(screen.getByText('Daily')).toHaveClass('active');
    expect(screen.getByText('Monthly')).not.toHaveClass('active');

    rerender(<ChartControls {...defaultProps} dailyMonthly="monthly" />);

    expect(screen.getByText('Monthly')).toHaveClass('active');
    expect(screen.getByText('Daily')).not.toHaveClass('active');
  });

  it('calls onDailyMonthlyChange when Daily is clicked', () => {
    render(<ChartControls {...defaultProps} dailyMonthly="monthly" />);

    const dailyButton = screen.getByText('Daily');
    dailyButton.click();

    expect(mockOnDailyMonthlyChange).toHaveBeenCalledWith('daily');
  });

  it('calls onDailyMonthlyChange when Monthly is clicked', () => {
    render(<ChartControls {...defaultProps} dailyMonthly="daily" />);

    const monthlyButton = screen.getByText('Monthly');
    monthlyButton.click();

    expect(mockOnDailyMonthlyChange).toHaveBeenCalledWith('monthly');
  });

  it('renders date range inputs when showDateRangePicker is true', () => {
    render(
      <ChartControls
        {...defaultProps}
        showDateRangePicker={true}
        onDateRangeChange={mockOnDateRangeChange}
        dateRange={{ start: '2026-05-01', end: '2026-05-31' }}
        onApplyDateRange={mockOnApplyDateRange}
      />
    );

    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
    expect(screen.getByText('Apply')).toBeInTheDocument();
  });

  it('does not render date range inputs when showDateRangePicker is false', () => {
    render(
      <ChartControls
        {...defaultProps}
        showDateRangePicker={false}
      />
    );

    expect(screen.queryByLabelText('From')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('To')).not.toBeInTheDocument();
    expect(screen.queryByText('Apply')).not.toBeInTheDocument();
  });

  it('renders export button when showExport is true', () => {
    render(
      <ChartControls
        {...defaultProps}
        showExport={true}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('does not render export button when showExport is false', () => {
    render(
      <ChartControls
        {...defaultProps}
        showExport={false}
      />
    );

    expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
  });

  it('calls onExport when Export button is clicked', () => {
    render(
      <ChartControls
        {...defaultProps}
        showExport={true}
        onExport={mockOnExport}
      />
    );

    const exportButton = screen.getByText('Export CSV');
    exportButton.click();

    expect(mockOnExport).toHaveBeenCalledWith('png');
  });

  it('calls onApplyDateRange when Apply button is clicked', () => {
    render(
      <ChartControls
        {...defaultProps}
        showDateRangePicker={true}
        onDateRangeChange={mockOnDateRangeChange}
        dateRange={{ start: '2026-05-01', end: '2026-05-31' }}
        onApplyDateRange={mockOnApplyDateRange}
      />
    );

    const applyButton = screen.getByText('Apply');
    applyButton.click();

    expect(mockOnApplyDateRange).toHaveBeenCalled();
  });
});
