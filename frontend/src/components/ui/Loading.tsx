import React from 'react';
import styles from './Loading.module.css';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * Loading spinner component with optional text and full screen option
 */
export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  fullScreen = false,
  className = '',
}) => {
  const containerClassName = [
    styles.container,
    fullScreen && styles.fullScreen,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClassName}>
      <div className={`${styles.spinner} ${styles[size]}`} />
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
};
