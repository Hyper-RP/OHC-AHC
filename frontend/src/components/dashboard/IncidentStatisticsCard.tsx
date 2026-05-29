import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui';
import type { IncidentStatistics } from '../../types';
import styles from './IncidentStatisticsCard.module.css';

interface IncidentStatisticsCardProps {
  statistics: IncidentStatistics | null;
  loading: boolean;
}

export const IncidentStatisticsCard: React.FC<IncidentStatisticsCardProps> = ({
  statistics,
  loading,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/ehs/incident-details');
  };

  if (loading) {
    return (
      <Card className={styles.card}>
        <div className={styles.header}>
          <h3>âš ï¸ Incident Cases</h3>
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
    <Card className={`${styles.card} ${statistics.attention_required ? styles.attentionRequired : ''}`} onClick={handleClick}>
      <div className={styles.header}>
        <h3>âš ï¸ Incident Cases</h3>
        {statistics.attention_required && (
          <span className={styles.attentionBadge}>Attention Required</span>
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
