import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { Card } from '../ui';
import type { AHCStatistics } from '../../types';
import styles from './AHCStatisticsCard.module.css';

interface AHCStatisticsCardProps {
  statistics: AHCStatistics | null;
  loading: boolean;
}

export const AHCStatisticsCard: React.FC<AHCStatisticsCardProps> = ({
  statistics,
  loading,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/ehs/ahc-details');
  };

  if (loading) {
    return (
      <Card className={styles.card}>
        <div className={styles.header}>
          <h3><HeartPulse size={18} className={styles.headerIcon} /> Annual Health Checkups</h3>
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
        <h3><HeartPulse size={18} className={styles.headerIcon} /> Annual Health Checkups</h3>
        <span className={styles.todayBadge}>Today: {statistics.today_count} cases</span>
      </div>

      <div className={styles.completionSection}>
        <div className={styles.completionHeader}>
          <span className={styles.completionLabel}>Completion Rate</span>
          <span className={styles.completionValue}>{statistics.completion_percentage.toFixed(1)}%</span>
        </div>
        <div className={styles.progressBarBackground}>
          <div
            className={styles.progressBarFill}
            style={{
              width: `${statistics.completion_percentage}%`,
              background: statistics.completion_percentage >= 80
                ? '#10b981'
                : statistics.completion_percentage >= 60
                  ? '#f59e0b'
                  : '#dc2626',
            }}
          />
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Completed AHC</span>
          <span className={styles.statValue}>{statistics.till_date_count}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Total Employees</span>
          <span className={styles.statValue}>{statistics.total_employees}</span>
        </div>
      </div>

      <div className={styles.pendingSection}>
        <span className={styles.pendingLabel}>Pending</span>
        <span className={styles.pendingValue}>
          {statistics.total_employees - statistics.till_date_count}
        </span>
      </div>
    </Card>
  );
};
