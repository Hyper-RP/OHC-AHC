import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  variant?: 'brand' | 'outline-brand' | 'outline-light' | 'outline-secondary' | 'outline-danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Button component with multiple variants and sizes
 * Provides consistent styling across the application
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'brand',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  children,
  onClick,
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.();
  };

  const buttonClassName = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={buttonClassName}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading && <span className={styles.spinner} />}
      <span className={loading ? styles.hidden : ''}>{children}</span>
    </button>
  );
};
