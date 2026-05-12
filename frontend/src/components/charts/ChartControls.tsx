import React from 'react';
import { FormInput, Button } from '../ui';
import styles from './ChartControls.module.css';

interface ChartControlsProps {
  period: number;
  onPeriodChange: (period: number) => void;
  dailyMonthly: 'daily' | 'monthly';
  onDailyMonthlyChange: (level: 'daily' | 'monthly') => void;
  dateRange?: { start: string; end: string } | null;
  onDateRangeChange?: (range: { start: string; end: string }) => void;
  onApplyDateRange?: () => void;
  onExport?: (format: 'png' | 'svg') => void;
  showDateRangePicker?: boolean;
  showExport?: boolean;
}

const PERIOD_OPTIONS = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' },
  { value: 180, label: '180 Days' },
  { value: 365, label: '365 Days' },
];

/**
 * ChartControls component
 * Common controls for charts: period selector, daily/monthly toggle, date range, export
 */
export const ChartControls: React.FC<ChartControlsProps> = ({
  period,
  onPeriodChange,
  dailyMonthly,
  onDailyMonthlyChange,
  dateRange,
  onDateRangeChange,
  onApplyDateRange,
  onExport,
  showDateRangePicker = true,
  showExport = true,
}) => {
  return (
    <div className={styles.controls}>
      <div className={styles.controlGroup}>
        {/* Period Selector */}
        <FormInput
          type="select"
          value={period.toString()}
          onChange={(value) => onPeriodChange(parseInt(value, 10))}
          options={PERIOD_OPTIONS.map((opt) => ({
            value: opt.value.toString(),
            label: opt.label,
          }))}
          className={styles.control}
        />

        {/* Daily/Monthly Toggle */}
        <div className={styles.toggle}>
          <button
            className={`${styles.toggleButton} ${dailyMonthly === 'daily' ? styles.active : ''}`}
            onClick={() => onDailyMonthlyChange('daily')}
            type="button"
          >
            Daily
          </button>
          <button
            className={`${styles.toggleButton} ${dailyMonthly === 'monthly' ? styles.active : ''}`}
            onClick={() => onDailyMonthlyChange('monthly')}
            type="button"
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      {showDateRangePicker && onDateRangeChange && (
        <div className={styles.dateRangeGroup}>
          <FormInput
            type="date"
            label="From"
            value={dateRange?.start || ''}
            onChange={(value) => onDateRangeChange({ start: value, end: dateRange?.end || '' })}
            className={styles.dateInput}
          />
          <FormInput
            type="date"
            label="To"
            value={dateRange?.end || ''}
            onChange={(value) => onDateRangeChange({ start: dateRange?.start || '', end: value })}
            className={styles.dateInput}
          />
          {onApplyDateRange && (
            <Button variant="brand" size="sm" onClick={onApplyDateRange} className={styles.applyButton}>
              Apply
            </Button>
          )}
        </div>
      )}

      {/* Export Button */}
      {showExport && onExport && (
        <Button variant="outline-secondary" size="sm" onClick={() => onExport('png')} className={styles.exportButton}>
          Export CSV
        </Button>
      )}
    </div>
  );
};
