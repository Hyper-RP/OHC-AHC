import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../layout';
import { Alert, Card, FormInput, Button, Loading } from '../ui';
import {
  exportEmployeeHealthHistoryExcel,
  getEmployeeHealthHistory,
} from '../../services/reports';
import { REPORT_PERIOD_OPTIONS } from '../../utils/constants';
import type {
  EmployeeHealthHistoryList,
} from '../../types';
import styles from './EmployeeHealthHistory.module.css';

/**
 * Employee Health History page component
 * Display and export employee health records
 */
export const EmployeeHealthHistory: React.FC = () => {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [period, setPeriod] = useState(90);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EmployeeHealthHistoryList | null>(null);
  const [error, setError] = useState('');

  const loadHistory = async (targetEmployeeId?: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await getEmployeeHealthHistory(targetEmployeeId || undefined);
      if ('records' in result) {
        setData(result);
      } else if (targetEmployeeId) {
        navigate(`/reports/employee-history/${targetEmployeeId}`);
      }
    } catch {
      setError('Failed to load employee history');
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async () => {
    await loadHistory(employeeId || undefined);
  };

  const handleExportAll = async () => {
    try {
      const blob = await exportEmployeeHealthHistoryExcel(employeeId || undefined);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = employeeId
        ? `employee_${employeeId}_health_history.csv`
        : 'all_employee_health_history.csv';
      link.click();
    } catch {
      setError('Export failed');
    }
  };

  const handleViewRecord = async (targetEmployeeId: string) => {
    setEmployeeId(targetEmployeeId);
    navigate(`/reports/employee-history/${targetEmployeeId}`);
  };

  const isListMode = data !== null;
  const records = data?.records || [];
  const summary = useMemo(() => {
    const uniqueEmployees = new Set(records.map((record) => record.employee_code)).size;
    const fitCases = records.filter((record) => String(record.fitness_decision || '').includes('FIT')).length;
    const referredCases = records.filter((record) => record.referral_status).length;

    return {
      totalRecords: records.length,
      uniqueEmployees,
      fitCases,
      referredCases,
    };
  }, [records]);

  return (
    <div className={styles.healthHistory}>
      <Header title="Employee Health History" subtitle="View complete health records" />
      <main className={styles.healthMain}>
        {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

        <Card className={styles.heroCard}>
          <div className={styles.heroContent}>
            <div>
              <p className={styles.eyebrow}>History Workspace</p>
              <h2 className={styles.heroTitle}>Track employee health records in one place</h2>
              <p className={styles.heroText}>
                Search by employee ID, review visit history, and export records for reporting.
              </p>
            </div>
            <div className={styles.heroMeta}>
              <span className={styles.heroMetaLabel}>Selected period</span>
              <strong className={styles.heroMetaValue}>{period} days</strong>
            </div>
          </div>
        </Card>

        <Card className={styles.searchCard}>
          <div className={styles.searchHeader}>
            <div>
              <h3>Find Records</h3>
              <p>Load a single employee history or review all available records.</p>
            </div>
          </div>
          <div className={styles.searchGrid}>
            <FormInput
              label="Employee ID"
              value={employeeId}
              onChange={setEmployeeId}
              placeholder="Enter employee ID or leave blank"
            />
            <FormInput
              label="Period"
              type="select"
              value={period.toString()}
              onChange={(v) => setPeriod(parseInt(v, 10))}
              options={REPORT_PERIOD_OPTIONS}
            />
            <Button variant="outline-secondary" onClick={handleExportAll}>
              Export Excel
            </Button>
            <Button onClick={handleLoad}>Load</Button>
          </div>
        </Card>

        {loading && <Loading />}

        {isListMode && data && (
          <>
            <section className={styles.summaryCards}>
              <Card className={styles.metricCard}>
                <span className={styles.metricLabel}>Total Records</span>
                <strong className={styles.metricValue}>{summary.totalRecords}</strong>
              </Card>
              <Card className={styles.metricCard}>
                <span className={styles.metricLabel}>Employees</span>
                <strong className={styles.metricValue}>{summary.uniqueEmployees}</strong>
              </Card>
              <Card className={styles.metricCard}>
                <span className={styles.metricLabel}>Fit Cases</span>
                <strong className={styles.metricValue}>{summary.fitCases}</strong>
              </Card>
              <Card className={styles.metricCard}>
                <span className={styles.metricLabel}>Referred Cases</span>
                <strong className={styles.metricValue}>{summary.referredCases}</strong>
              </Card>
            </section>

            <Card className={styles.visitsCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3>Employee Records</h3>
                  <p className={styles.cardSubtext}>{data.records.length} records loaded</p>
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.recordsTable}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Visit Date</th>
                      <th>Complaint</th>
                      <th>Doctor</th>
                      <th>Fitness</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.records.map((record) => (
                      <tr key={record.visit_id}>
                        <td>
                          <div className={styles.employeeCell}>
                            <strong>{record.employee_name}</strong>
                            <span>{record.employee_code}</span>
                          </div>
                        </td>
                        <td>{record.visit_date}</td>
                        <td className={styles.complaintCell}>{record.chief_complaint}</td>
                        <td>{record.doctor_name}</td>
                        <td>
                          <span className={styles.fitnessBadge}>
                            {record.fitness_decision || '-'}
                          </span>
                        </td>
                        <td>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleViewRecord(record.employee_code)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {isListMode && data && data.records.length === 0 && (
          <Card className={styles.emptyCard}>
            <h3>No records found</h3>
            <p>Try another employee ID or load all records without a filter.</p>
          </Card>
        )}
      </main>
    </div>
  );
};
