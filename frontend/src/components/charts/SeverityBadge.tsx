import React from 'react';
import type { TriageLevel, Severity } from '../../types';
import styles from './SeverityBadge.module.css';

interface SeverityBadgeProps {
  level: TriageLevel | Severity;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Badge component for displaying severity or triage level
 * Color-coded for quick visual identification
 */
export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ level, size = 'medium' }) => {
  const getSeverityColor = (): string => {
    switch (level) {
      case 'LOW':
      case 'MILD':
        return styles.low;
      case 'MEDIUM':
      case 'MODERATE':
        return styles.medium;
      case 'HIGH':
      case 'SERIOUS':
        return styles.high;
      case 'CRITICAL':
        return styles.critical;
      default:
        return styles.default;
    }
  };

  const getSeverityLabel = (): string => {
    switch (level) {
      case 'LOW':
        return 'Low';
      case 'MILD':
        return 'Mild';
      case 'MEDIUM':
        return 'Medium';
      case 'MODERATE':
        return 'Moderate';
      case 'HIGH':
        return 'High';
      case 'SERIOUS':
        return 'Serious';
      case 'CRITICAL':
        return 'Critical';
      default:
        return 'Unknown';
    }
  };

  return (
    <span className={`${styles.severityBadge} ${styles[size]} ${getSeverityColor()}`}>
      {getSeverityLabel()}
    </span>
  );
};
