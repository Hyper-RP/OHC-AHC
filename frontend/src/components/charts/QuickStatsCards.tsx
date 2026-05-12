import React from 'react';
import styles from './QuickStatsCards.module.css';

interface QuickStatsData {
  totalVisits: number;
  avgRecoveryTime: number;
  fitnessTrend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

interface QuickStatsCardsProps {
  data: QuickStatsData;
}

export const QuickStatsCards: React.FC<QuickStatsCardsProps> = ({ data }) => {
  const stats = [
    {
      label: 'Total Visits',
      value: data.totalVisits,
      icon: '🏥',
    },
    {
      label: 'Avg Recovery Time',
      value: `${data.avgRecoveryTime} days`,
      icon: '⏱️',
    },
    {
      label: 'Fitness Trend',
      value: `${data.fitnessTrend.percentage}%`,
      icon: data.fitnessTrend.direction === 'up' ? '📈' : data.fitnessTrend.direction === 'down' ? '📉' : '➡️',
      trend: data.fitnessTrend.direction,
    },
  ];

  return (
    <div className={styles.statsGrid}>
      {stats.map((stat, index) => (
        <div key={index} className={styles.statCard}>
          <div className={styles.statIcon}>{stat.icon}</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>{stat.label}</p>
            <p className={`${styles.statValue} ${stat.trend ? styles[stat.trend] : ''}`}>
              {stat.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
