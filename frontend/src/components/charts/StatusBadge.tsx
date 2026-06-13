import React from 'react';
import type { VisitStatus, PrescriptionStatus } from '../../types';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status?: VisitStatus | PrescriptionStatus;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Badge component for displaying visit or prescription status
 * Color-coded for quick visual identification
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  if (!status) {
    return null;
  }

  const getStatusColor = (): string => {
    switch (status) {
      case 'OPEN':
        return styles.open;
      case 'IN_PROGRESS':
        return styles.inProgress;
      case 'COMPLETED':
        return styles.completed;
      case 'CLOSED':
        return styles.closed;
      case 'CANCELLED':
        return styles.cancelled;
      case 'REFERRED':
        return styles.referred;
      case 'ACTIVE':
        return styles.active;
      default:
        return styles.default;
    }
  };

  const getStatusLabel = (): string => {
    switch (status) {
      case 'OPEN':
        return 'Open';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CLOSED':
        return 'Closed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'REFERRED':
        return 'Referred';
      case 'ACTIVE':
        return 'Active';
      default:
        return status;
    }
  };

  return (
    <span className={`${styles.statusBadge} ${styles[size]} ${getStatusColor()}`}>
      {getStatusLabel()}
    </span>
  );
};
