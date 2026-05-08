import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Header.module.css';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  stats?: {
    visitCount?: number;
    referralCount?: number;
    pendingInvoices?: number;
  };
  className?: string;
}

/**
 * Header component for pages
 * Displays page title, breadcrumbs, stats, and action buttons
 */
export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  actions,
  stats,
  className = '',
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Generate breadcrumb from path
  const generateBreadcrumb = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const breadcrumbItems = [
      { label: 'Home', path: '/dashboard' },
      ...pathParts.slice(1).map((part, index, array) => {
        const isLast = index === array.length - 1;
        const path = `/${pathParts.slice(0, index + 2).join('/')}`;
        const label = part
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        return { label, path, isLast };
      }),
    ];

    return breadcrumbItems;
  };

  const breadcrumbItems = title ? generateBreadcrumb() : [];

  return (
    <header className={`${styles.header} ${className}`}>
      <div className={styles.headerLeft}>
        {breadcrumbItems.length > 1 && (
          <nav className={styles.breadcrumb}>
            {breadcrumbItems.map((item, index) => {
              const isLast = ('isLast' in item && item.isLast) || false;
              return (
                <React.Fragment key={item.path}>
                  {index > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
                  {isLast ? (
                    <span className={styles.breadcrumbItemActive}>{item.label}</span>
                  ) : (
                    <button
                      type="button"
                      className={styles.breadcrumbItem}
                      onClick={() => navigate(item.path)}
                    >
                      {item.label}
                    </button>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}
        {title && <h1 className={styles.headerTitle}>{title}</h1>}
        {subtitle && <p className={styles.headerSubtitle}>{subtitle}</p>}
      </div>

      <div className={styles.headerRight}>
        {stats && (stats.visitCount !== undefined || stats.referralCount !== undefined) && (
          <div className={styles.headerStats}>
            {stats.visitCount !== undefined && (
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Visits</span>
                <span className={styles.statValue}>{stats.visitCount}</span>
              </div>
            )}
            {stats.referralCount !== undefined && (
              <>
                <div className={styles.headerDivider} />
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Open Referrals</span>
                  <span className={styles.statValue}>{stats.referralCount}</span>
                </div>
              </>
            )}
            {stats.pendingInvoices !== undefined && (
              <>
                <div className={styles.headerDivider} />
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Pending</span>
                  <span className={styles.statValue}>{stats.pendingInvoices}</span>
                </div>
              </>
            )}
          </div>
        )}
        {actions && <div className={styles.headerActions}>{actions}</div>}
      </div>
    </header>
  );
};
