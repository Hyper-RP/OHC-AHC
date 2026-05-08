import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'brand' | 'accent' | 'success' | 'danger';
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Card component for displaying content in a container
 * Supports title, subtitle, badge, and action buttons
 */
export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  badge,
  badgeColor = 'brand',
  actions,
  children,
  className = '',
  onClick,
}) => {
  return (
    <div className={`${styles.card} ${onClick ? styles.clickable : ''} ${className}`} onClick={onClick}>
      {(title || subtitle || badge || actions) && (
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            {title && <h3 className={styles.cardTitle}>{title}</h3>}
            {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
          </div>
          <div className={styles.cardHeaderRight}>
            {badge && (
              <span className={`${styles.cardBadge} ${styles[badgeColor]}`}>{badge}</span>
            )}
            {actions && <div className={styles.cardActions}>{actions}</div>}
          </div>
        </div>
      )}
      <div className={styles.cardBody}>{children}</div>
    </div>
  );
};
