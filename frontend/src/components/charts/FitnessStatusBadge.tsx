import React from 'react';
import styles from './FitnessStatusBadge.module.css';

export type FitnessStatus = 'FIT' | 'UNFIT' | 'TEMPORARY_UNFIT' | 'UNDER_OBSERVATION';

interface FitnessStatusBadgeProps {
  status: FitnessStatus;
  size?: 'sm' | 'md' | 'lg';
}

const FITNESS_CONFIG: Record<FitnessStatus, { color: string; label: string; icon: string }> = {
  FIT: { color: '#10b981', label: 'Fit', icon: '✓' },
  UNFIT: { color: '#ef4444', label: 'Unfit', icon: '✕' },
  TEMPORARY_UNFIT: { color: '#f59e0b', label: 'Temporarily Unfit', icon: '!' },
  UNDER_OBSERVATION: { color: '#f97316', label: 'Under Observation', icon: '◉' },
};

export const FitnessStatusBadge: React.FC<FitnessStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const config = FITNESS_CONFIG[status];
  const sizeClass = styles[size];

  return (
    <div
      className={`${styles.badge} ${sizeClass}`}
      style={{ ['--badge-color' as any]: config.color }}
      role="status"
      aria-label={`Fitness status: ${config.label}`}
    >
      <span className={styles.icon}>{config.icon}</span>
      <span className={styles.label}>{config.label}</span>
    </div>
  );
};
