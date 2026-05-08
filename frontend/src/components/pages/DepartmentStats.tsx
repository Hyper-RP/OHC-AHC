import React, { useState, useEffect } from 'react';
import { Header } from '../layout';
import { Card, FormInput, Loading, Button } from '../ui';
import { getDepartmentHealthStats, exportDepartmentHealthStats } from '../../services/reports';
import { REPORT_PERIOD_OPTIONS } from '../../utils/constants';
import type { DepartmentStats as DepartmentStatsType } from '../../types';
import styles from './DepartmentStats.module.css';

/**
 * Department Stats page component
 * Display health statistics by department
 */
export const DepartmentStats: React.FC = () => {
  const [period, setPeriod] = useState(90);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DepartmentStatsType | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const result = await getDepartmentHealthStats(period);
        setData(result);
      } catch {
        alert('Failed to load stats');
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
        {data && (
          <>
            <div className={styles.summaryGrid}>
              <Card className={styles.summaryCard}>
                <h3>Total Departments</h3>
                <div className={styles.summaryValue}>{data.summary.total_departments}</div>
              </Card>
              <Card className={styles.summaryCard}>
                <h3>Total Employees</h3>
                <div className={styles.summaryValue}>{data.summary.total_employees}</div>
              </Card>
              <Card className={styles.summaryCard}>
                <h3>Total Visits</h3>
                <div className={styles.summaryValue}>{data.summary.total_visits}</div>
              </Card>
              <Card className={styles.summaryCard}>
                <h3>Referrals</h3>
                <div className={styles.summaryValue}>{data.summary.total_referrals}</div>
              </Card>
            </div>

            <div className={styles.departmentsGrid}>
              {data.departments.map((dept) => (
                <Card key={dept.department} className={styles.deptCard}>
                  <h3>{dept.department}</h3>
                  <div className={styles.deptStats}>
                    <div className={styles.deptStat}>
                      <span className={styles.statLabel}>Employees</span>
                      <span className={styles.statValue}>{dept.total_employees}</span>
                    </div>
                    <div className={styles.deptStat}>
                      <span className={styles.statLabel}>Visits</span>
                      <span className={styles.statValue}>{dept.total_visits}</span>
                    </div>
                    <div className={styles.deptStat}>
                      <span className={styles.statLabel}>Referrals</span>
                      <span className={styles.statValue}>{dept.referred_cases}</span>
                    </div>
                    <div className={styles.deptStat}>
                      <span className={styles.statLabel}>Unfit</span>
                      <span className={styles.statValue}>{dept.unfit_employees}</span>
                    </div>
                  </div>
                  <div className={styles.healthIndex}>
                    <span>Health Index:</span>
                    <strong>{dept.health_index}%</strong>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
