import React from 'react';
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
  if (loading) {
    return (
      <Card className={styles.card}>
        <div className={styles.header}>
          <h3>⚠️ Incident Cases</h3>
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
    <Card className={`${styles.card} ${statistics.attention_required ? styles.attentionRequired : ''}`}>
      <div className={styles.header}>
        <h3>⚠️ Incident Cases</h3>
        {statistics.attention_required && (
          <span className={styles.attentionBadge}>Attention Required</span>
        )}
      </div>

      <div className={styles.countsSection}>
        <div className={styles.countBox}>
          <span className={styles.countLabel}>Today</span>
          <span className={styles.countValue} style={{ color: statistics.today_count > 0 ? '#dc2626' : '#1f2937' }}>
            {statistics.today_count}
          </span>
        </div>
        <div className={styles.countBox}>
          <span className={styles.countLabel}>Till Date</span>
          <span className={styles.countValue}>{statistics.till_date_count}</span>
        </div>
      </div>

      <div className={styles.severitySection}>
        <span className={styles.severityLabel}>Severity Breakdown</span>
        <div className={styles.severityGrid}>
          <div className={styles.severityItem}>
            <span className={styles.severityLabel}>Low</span>
            <span className={styles.severityValue} style={{ color: '#10b981' }}>
              {statistics.severity.LOW}
            </span>
          </div>
          <div className={styles.severityItem}>
            <span className={styles.severityLabel}>Medium</span>
            <span className={styles.severityValue} style={{ color: '#f59e0b' }}>
              {statistics.severity.MEDIUM}
            </span>
          </div>
          <div className={styles.severityItem}>
            <span className={styles.severityLabel}>High</span>
            <span className={styles.severityValue} style={{ color: '#f97316' }}>
              {statistics.severity.HIGH}
            </span>
          </div>
          <div className={styles.severityItem}>
            <span className={styles.severityLabel}>Critical</span>
            <span className={styles.severityValue} style={{ color: '#dc2626' }}>
              {statistics.severity.CRITICAL}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};