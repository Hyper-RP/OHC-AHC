import React from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: number;
  trendLabel?: string;
  trendColor?: 'success' | 'danger' | 'neutral';
  onClick?: () => void;
  className?: string;
}

/**
 * StatCard component for displaying metrics with optional trend indicators
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendLabel,
  trendColor = 'neutral',
  onClick,
  className = '',
}) => {
  return (
    <div
      className={`${styles.statCard} ${onClick ? styles.clickable : ''} ${className}`}
      onClick={onClick}
    >
      <div className={styles.statHeader}>
        <div className={styles.statLeft}>
          {icon && <span className={styles.statIcon}>{icon}</span>}
          <span className={styles.statLabel}>{label}</span>
        </div>
        {trend !== undefined && (
          <div className={`${styles.statTrend} ${styles[trendColor]}`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className={styles.statValue}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {trendLabel && <p className={styles.statTrendLabel}>{trendLabel}</p>}
    </div>
  );
};
