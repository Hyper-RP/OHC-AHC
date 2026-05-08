import React, { useState, useEffect } from 'react';
import { Header } from '../layout';
import { Card, FormInput, Loading, Button } from '../ui';
import { getDiseaseTrends, exportAnalyticsSummary } from '../../services/reports';
import { REPORT_PERIOD_OPTIONS } from '../../utils/constants';
import type { DiseaseTrends as DiseaseTrendsType } from '../../types';
import styles from './DiseaseTrends.module.css';

/**
 * Disease Trends page component
 * Display health trends and analytics
 */
export const DiseaseTrends: React.FC = () => {
  const [period, setPeriod] = useState(90);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DiseaseTrendsType | null>(null);

  useEffect(() => {
    const loadTrends = async () => {
      setLoading(true);
      try {
        const result = await getDiseaseTrends(period);
        setData(result);
      } catch {
        alert('Failed to load trends');
      } finally {
        setLoading(false);
      }
    };
    loadTrends();
  }, [period]);

  const handleExport = async () => {
    try {
      const blob = await exportAnalyticsSummary(period, 'trends');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `disease_trends_${period}days.pdf`;
      link.click();
    } catch {
      alert('Export failed');
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className={styles.diseaseTrends}>
      <Header
        title="Disease Trends"
        subtitle="Analyze health trends across organization"
        actions={
          <FormInput
            type="select"
            value={period.toString()}
            onChange={(v) => setPeriod(parseInt(v, 10))}
            options={REPORT_PERIOD_OPTIONS}
            className={styles.periodSelect}
          />
        }
      />
      <main className={styles.trendsMain}>
        {data && (
          <>
            <div className={styles.statsGrid}>
              <Card className={styles.statCard}>
                <h3>Total Diagnoses</h3>
                <div className={styles.statValue}>{data.total_diagnoses}</div>
                <p>{data.period_start} to {data.period_end}</p>
              </Card>
              <Card className={styles.statCard}>
                <h3>Most Common</h3>
                <div className={styles.statValue}>{data.trends[0]?.diagnosis_name || 'N/A'}</div>
                <p>{data.trends[0]?.count || 0} cases</p>
              </Card>
            </div>

            <Card>
              <div className={styles.cardHeader}>
                <h3>Diagnosis Trends</h3>
                <Button variant="outline-secondary" size="sm" onClick={handleExport}>
                  Export PDF
                </Button>
              </div>
              <div className={styles.trendsList}>
                {data.trends.map((trend, index) => (
                  <div key={index} className={styles.trendItem}>
                    <div className={styles.trendInfo}>
                      <strong>{trend.diagnosis_name}</strong>
                      <span className={`${styles.severity} ${styles[trend.severity.toLowerCase()]}`}>
                        {trend.severity}
                      </span>
                    </div>
                    <div className={styles.trendStats}>
                      <span className={styles.count}>{trend.count} cases</span>
                      <span className={`${styles.change} ${trend.change_from_previous >= 0 ? styles.up : styles.down}`}>
                        {trend.change_from_previous >= 0 ? '↑' : '↓'} {Math.abs(trend.percentage)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3>Severity Breakdown</h3>
              <div className={styles.severityGrid}>
                {Object.entries(data.severity_breakdown).map(([severity, count]) => (
                  <div key={severity} className={styles.severityItem}>
                    <span className={styles.severityLabel}>{severity}</span>
                    <span className={styles.severityCount}>{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};
