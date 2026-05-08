import React from 'react';
import styles from './FormInput.module.css';

interface FormInputProps {
  label?: string;
  name?: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  helperText?: string;
  className?: string;
  rows?: number; // For textarea
  options?: Array<{ value: string; label: string }>; // For select
  onBlur?: () => void; // For blur event
  min?: string; // For number input min attribute
}

/**
 * Form input component supporting text, number, textarea, and select
 * Provides consistent styling with labels, errors, and helper text
 */
export const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  readonly = false,
  helperText,
  className = '',
  rows,
  options,
  onBlur,
  min,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    onBlur?.();
  };

  const inputClassName = [
    styles.input,
    error && styles.error,
    disabled && styles.disabled,
    readonly && styles.readonly,
  ]
    .filter(Boolean)
    .join(' ');

  const inputElement = type === 'textarea' ? (
    <textarea
      name={name}
      className={inputClassName}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readonly}
      rows={rows || 5}
      required={required}
    />
  ) : type === 'select' ? (
    <select
      name={name}
      className={inputClassName}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      required={required}
    >
      {options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ) : (
    <input
      name={name}
      type={type}
      className={inputClassName}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readonly}
      required={required}
      min={min}
    />
  );

  return (
    <div className={`${styles.container} ${className}`}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      {inputElement}
      {error && <p className={styles.errorText}>{error}</p>}
      {helperText && !error && <p className={styles.helperText}>{helperText}</p>}
    </div>
  );
};
