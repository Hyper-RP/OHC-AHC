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
  const topHospitals = statistics?.hospitals.slice(0, 5) || [];
  const maxReferralCount = topHospitals.reduce(
    (highest, hospital) => Math.max(highest, hospital.referral_count),
    0,
  );

  if (loading) {
    return (
      <Card className={styles.card}>
        <div className={styles.header}>
          <h3>ðŸ¥ Referred Cases</h3>
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
        <h3>ðŸ¥ Referred Cases</h3>
      </div>

      <div className={styles.countsSection}>
        <div className={styles.countBox}>
          <span className={styles.countLabel}>Today Cases</span>
          <span className={styles.countValue}>{statistics.today_count}</span>
        </div>
        <div className={styles.countBox}>
          <span className={styles.countLabel}>Total Cases</span>
          <span className={styles.countValue}>{statistics.till_date_count}</span>
        </div>
      </div>

      {topHospitals.length > 0 ? (
        <div className={styles.hospitalsSection}>
          <span className={styles.hospitalsLabel}>Top Referral Destinations</span>
          <div className={styles.chartSection}>
            {topHospitals.map((hospital, index) => {
              const width = maxReferralCount > 0
                ? `${Math.max((hospital.referral_count / maxReferralCount) * 100, 12)}%`
                : '12%';

              return (
                <div key={`${hospital.hospital_name}-${index}`} className={styles.chartRow}>
                  <div className={styles.chartMeta}>
                    <span className={styles.chartName}>{hospital.hospital_name}</span>
                    <span className={styles.chartValue}>{hospital.referral_count}</span>
                  </div>
                  <div className={styles.chartTrack}>
                    <div className={styles.chartBar} style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.hospitalsList}>
            {topHospitals.map((hospital, index) => (
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
