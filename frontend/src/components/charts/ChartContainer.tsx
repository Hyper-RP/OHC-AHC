import React from 'react';
import { Card, Button, Loading } from '../ui';
import styles from './ChartContainer.module.css';

interface ChartContainerProps {
  title: string;
  description?: string;
  loading: boolean;
  error: string | null;
  empty: boolean;
  onExport?: (format: 'png' | 'svg') => void;
  exportFormats?: Array<'png' | 'svg'>;
  children: React.ReactNode;
  className?: string;
}

/**
 * ChartContainer component
 * Wrapper for all charts with loading, error, and empty states
 */
export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  description,
  loading,
  error,
  empty,
  onExport,
  exportFormats = ['png', 'svg'],
  children,
  className = '',
}) => {
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  const handleExport = (format: 'png' | 'svg') => {
    onExport?.(format);
    setShowExportMenu(false);
  };

  return (
    <Card className={`${styles.chartContainer} ${className}`}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitleSection}>
          <h3 className={styles.chartTitle}>{title}</h3>
          {description && <p className={styles.chartDescription}>{description}</p>}
        </div>
        {onExport && (
          <div className={styles.chartActions}>
            <div className={styles.exportMenu}>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className={styles.exportButton}
              >
                ⬇ Export
              </Button>
              {showExportMenu && (
                <div className={styles.exportDropdown}>
                  {exportFormats.includes('png') && (
                    <button
                      className={styles.exportOption}
                      onClick={() => handleExport('png')}
                    >
                      PNG Image
                    </button>
                  )}
                  {exportFormats.includes('svg') && (
                    <button
                      className={styles.exportOption}
                      onClick={() => handleExport('svg')}
                    >
                      SVG Image
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.chartContent}>
        {loading ? (
          <div className={styles.loadingState}>
            <Loading />
            <p className={styles.loadingText}>Loading chart...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p className={styles.errorIcon}>⚠️</p>
            <p className={styles.errorText}>{error}</p>
            <Button variant="brand" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : empty ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}>📊</p>
            <p className={styles.emptyText}>No data available</p>
          </div>
        ) : (
          <div className={styles.chartWrapper}>{children}</div>
        )}
      </div>
    </Card>
  );
};
