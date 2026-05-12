import React from 'react';
import styles from './DailyMonthlyToggle.module.css';

interface DailyMonthlyToggleProps {
  value: 'daily' | 'monthly';
  onChange: (value: 'daily' | 'monthly') => void;
  disabled?: boolean;
}

export const DailyMonthlyToggle: React.FC<DailyMonthlyToggleProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className={styles.toggleContainer}>
      <button
        type="button"
        className={`${styles.toggleButton} ${value === 'daily' ? styles.active : ''}`}
        onClick={() => onChange('daily')}
        disabled={disabled}
        aria-pressed={value === 'daily'}
        aria-label="View by day"
      >
        Daily
      </button>
      <button
        type="button"
        className={`${styles.toggleButton} ${value === 'monthly' ? styles.active : ''}`}
        onClick={() => onChange('monthly')}
        disabled={disabled}
        aria-pressed={value === 'monthly'}
        aria-label="View by month"
      >
        Monthly
      </button>
    </div>
  );
};
