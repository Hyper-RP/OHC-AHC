import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ambulance } from 'lucide-react';
import { Card } from '../ui';
import type { EmergencyStatistics } from '../../types';
import styles from './EmergencyStatisticsCard.module.css';

interface EmergencyStatisticsCardProps {
  statistics: EmergencyStatistics | null;
  loading: boolean;
}

export const EmergencyStatisticsCard: React.FC<EmergencyStatisticsCardProps> = ({
  statistics,
  loading,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/ehs/emergency-details');
  };

  if (loading) {
    return (
      <Card className={styles.card}>
        <div className={styles.header}>
          <h3><Ambulance size={18} className={styles.headerIcon} /> Emergency Cases</h3>
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
    <Card className={`${styles.card} ${statistics.critical_alert ? styles.criticalAlert : ''}`} onClick={handleClick}>
      <div className={styles.header}>
        <h3><Ambulance size={18} className={styles.headerIcon} /> Emergency Cases</h3>
        {statistics.critical_alert && (
          <span className={styles.criticalBadge}>CRITICAL ALERT</span>
        )}
      </div>

      <div className={styles.countsSection}>
        <div className={styles.countBox}>
          <span className={styles.countLabel}>Today Cases</span>
          <span className={styles.countValue} style={{ color: statistics.today_count > 0 ? '#dc2626' : '#1f2937' }}>
            {statistics.today_count}
          </span>
        </div>
        <div className={styles.countBox}>
          <span className={styles.countLabel}>Total Cases</span>
          <span className={styles.countValue}>{statistics.till_date_count}</span>
        </div>
      </div>
    </Card>
  );
};
