import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui';
import type { PreEmploymentStatistics } from '../../types';
import styles from './PreEmploymentStatisticsCard.module.css';

interface PreEmploymentStatisticsCardProps {
  statistics: PreEmploymentStatistics | null;
  loading: boolean;
}

export const PreEmploymentStatisticsCard: React.FC<PreEmploymentStatisticsCardProps> = ({
  statistics,
  loading,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/ehs/pre-employment-details');
  };

  if (loading) {
    return (
      <Card className={styles.card}>
        <div className={styles.header}>
          <h3>🩺 Pre-Employment Checkups</h3>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.skeleton}></div>
          <div className={styles.skeleton}></div>
        </div>
      </Card>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <Card className={styles.card} onClick={handleClick}>
      <div className={styles.header}>
        <h3>🩺 Pre-Employment Checkups</h3>
        <span className={styles.todayBadge}>Today: {statistics.today_count}</span>
      </div>

      <div className={styles.totalSection}>
        <span className={styles.totalLabel}>Total Checks</span>
        <span className={styles.totalValue}>{statistics.total_checks}</span>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Fit</span>
            <span className={styles.statValue} style={{ color: '#10b981' }}>
              {statistics.fit_count}
            </span>
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statIcon}>❌</div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Unfit</span>
            <span className={styles.statValue} style={{ color: '#dc2626' }}>
              {statistics.unfit_count}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.fitRateSection}>
        <span className={styles.fitRateLabel}>Fit Rate</span>
        <div className={styles.gaugeContainer}>
          <div className={styles.gaugeBackground}>
            <div
              className={styles.gaugeFill}
              style={{
                width: `${statistics.fit_rate}%`,
                background: statistics.fit_rate >= 80
                  ? '#10b981'
                  : statistics.fit_rate >= 60
                  ? '#f59e0b'
                  : '#dc2626',
              }}
            />
          </div>
          <span className={styles.fitRateValue}>{statistics.fit_rate.toFixed(1)}%</span>
        </div>
      </div>
    </Card>
  );
};