import React from 'react';
import { Card } from '../ui';
import type { ReferredStatistics } from '../../types';
import styles from './ReferredStatisticsCard.module.css';

interface ReferredStatisticsCardProps {
  statistics: ReferredStatistics | null;
  loading: boolean;
}

export const ReferredStatisticsCard: React.FC<ReferredStatisticsCardProps> = ({
  statistics,
  loading,
}) => {
  if (loading) {
    return (
      <Card className={styles.card}>
        <div className={styles.header}>
          <h3>🏥 Referred Cases</h3>
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
    <Card className={styles.card}>
      <div className={styles.header}>
        <h3>🏥 Referred Cases</h3>
      </div>

      <div className={styles.countsSection}>
        <div className={styles.countBox}>
          <span className={styles.countLabel}>Today</span>
          <span className={styles.countValue}>{statistics.today_count}</span>
        </div>
        <div className={styles.countBox}>
          <span className={styles.countLabel}>Till Date</span>
          <span className={styles.countValue}>{statistics.till_date_count}</span>
        </div>
      </div>

      {statistics.hospitals.length > 0 ? (
        <div className={styles.hospitalsSection}>
          <span className={styles.hospitalsLabel}>Top Referral Destinations</span>
          <div className={styles.hospitalsList}>
            {statistics.hospitals.slice(0, 5).map((hospital, index) => (
              <div key={index} className={styles.hospitalItem}>
                <span className={styles.hospitalName}>{hospital.hospital_name}</span>
                <span className={styles.referralCount}>{hospital.referral_count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.emptyText}>No referrals recorded</span>
        </div>
      )}
    </Card>
  );
};