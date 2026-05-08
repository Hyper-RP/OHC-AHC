import React, { useEffect } from 'react';
import { useSnackbar } from '../../contexts/SnackbarContext';
import styles from './Snackbar.module.css';

/**
 * Snackbar component for displaying toast notifications
 * Automatically handles position, animation, and auto-dismissal
 */
export const Snackbar: React.FC = () => {
  const { isOpen, currentMessage, close } = useSnackbar();

  useEffect(() => {
    // Handle escape key to close
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, close]);

  if (!isOpen || !currentMessage) {
    return null;
  }

  return (
    <div className={`${styles.snackbar} ${styles[currentMessage.severity]}`}>
      <div className={styles.snackbarContent}>
        <span className={styles.snackbarIcon}>
          {currentMessage.severity === 'success' && '✓'}
          {currentMessage.severity === 'error' && '✕'}
          {currentMessage.severity === 'warning' && '⚠'}
          {currentMessage.severity === 'info' && 'ℹ'}
        </span>
        <span className={styles.snackbarMessage}>{currentMessage.message}</span>
      </div>
      <button
        type="button"
        className={styles.snackbarClose}
        onClick={close}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};
