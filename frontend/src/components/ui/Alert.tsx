import React from 'react';
import styles from './Alert.module.css';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Alert component for displaying messages with different severity levels
 */
export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onDismiss,
  className = '',
}) => {
  return (
    <div className={`${styles.alert} ${styles[type]} ${className}`}>
      <div className={styles.alertContent}>
        {title && <h4 className={styles.alertTitle}>{title}</h4>}
        <div className={styles.alertMessage}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          className={styles.alertDismiss}
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
};
