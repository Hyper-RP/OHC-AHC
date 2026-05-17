import React from 'react';
import styles from './Switch.module.css';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  className = '',
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={`${styles.switch} ${checked ? styles.checked : ''} ${disabled ? styles.disabled : ''} ${className}`}
    >
      <span className={styles.thumb} />
    </button>
  );
};