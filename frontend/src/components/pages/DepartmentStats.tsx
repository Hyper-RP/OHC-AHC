import React, { useState, useEffect } from 'react';
import { Header } from '../layout';
import { Card, FormInput, Loading, Button } from '../ui';
import { getDepartmentHealthStats, exportDepartmentHealthStats } from '../../services/reports';
import { REPORT_PERIOD_OPTIONS } from '../../utils/constants';
import { HealthIndexGauge, VisitsReferralsStackedBar } from '../charts';
import { transformDepartmentStatsData } from '../../utils/charts/transformers';
import styles from './DepartmentStats.module.css';

/**
 * Department Stats page component
 * Display health statistics by department
 */
export const DepartmentStats: React.FC = () => {
  const [period, setPeriod] = useState(90);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>({
    healthIndex: [],
    visitsReferrals: [],
  });
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setChartError(null);
      try {
        const result = await getDepartmentHealthStats(period);
        const transformed = transformDepartmentStatsData(result);
        setChartData(transformed);
      } catch (error) {
        console.error('Failed to load stats:', error);
        setChartError('Failed to load department stats');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [period]);

  const handleExport = async () => {
    try {
      const blob = await exportDepartmentHealthStats(period);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `department_stats_${period}days.csv`;
      link.click();
    } catch {
      alert('Export failed');
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className={styles.departmentStats}>
      <Header
        title="Department Health Statistics"
        subtitle="Health metrics by department"
        actions={
          <>
            <FormInput
              type="select"
              value={period.toString()}
              onChange={(v) => setPeriod(parseInt(v, 10))}
              options={REPORT_PERIOD_OPTIONS}
              className={styles.periodSelect}
            />
            <Button variant="outline-secondary" onClick={handleExport}>
              Export CSV
            </Button>
          </>
        }
      />
      <main className={styles.statsMain}>
        {!loading && chartError && (
          <div className={styles.errorBanner}>
            <p>{chartError}</p>
            <Button variant="brand" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <Loading fullScreen />
        ) : (
          <>
            <section className={styles.healthIndexSection}>
              <h2 className={styles.sectionTitle}>Department Health Index</h2>
              <div className={styles.gaugesGrid}>
                {chartData.healthIndex.map((dept: any) => (
                  <div key={dept.department} className={styles.gaugeCard}>
                    <HealthIndexGauge data={dept} size={180} showLabel={true} animate={true} />
                    <p className={styles.gaugeLabel}>{dept.department}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.stackedBarSection}>
              <Card>
                <div className={styles.cardHeader}>
                  <h3>Visits vs Referrals</h3>
                  <Button variant="outline-secondary" size="sm" onClick={handleExport}>
                    Export CSV
                  </Button>
                </div>
                <VisitsReferralsStackedBar data={chartData.visitsReferrals} height={400} />
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
};
