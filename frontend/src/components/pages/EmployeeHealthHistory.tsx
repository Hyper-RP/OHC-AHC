import React, { useState } from 'react';
import { Header } from '../layout';
import { Card, FormInput, Button, Loading } from '../ui';
import { getEmployeeHealthHistory, exportEmployeeHealthHistory } from '../../services/reports';
import { REPORT_PERIOD_OPTIONS } from '../../utils/constants';
import type { EmployeeHealthHistory as EmployeeHealthHistoryType } from '../../types';
import styles from './EmployeeHealthHistory.module.css';

/**
 * Employee Health History page component
 * Display and export employee health records
 */
export const EmployeeHealthHistory: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [period, setPeriod] = useState(90);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EmployeeHealthHistoryType | null>(null);

  const handleLoad = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const result = await getEmployeeHealthHistory(employeeId);
      setData(result);
    } catch {
      alert('Failed to load employee history');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!employeeId) return;
    try {
      const blob = await exportEmployeeHealthHistory(employeeId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employee_${employeeId}_history.csv`;
      link.click();
    } catch {
      alert('Export failed');
    }
  };

  return (
    <div className={styles.healthHistory}>
      <Header title="Employee Health History" subtitle="View complete health records" />
      <main className={styles.healthMain}>
        <Card className={styles.searchCard}>
          <div className={styles.searchGrid}>
            <FormInput
              label="Employee ID"
              value={employeeId}
              onChange={setEmployeeId}
              placeholder="Enter employee ID"
            />
            <FormInput
              label="Period"
              type="select"
              value={period.toString()}
              onChange={(v) => setPeriod(parseInt(v, 10))}
              options={REPORT_PERIOD_OPTIONS}
            />
            <Button onClick={handleLoad}>Load</Button>
          </div>
        </Card>

        {loading && <Loading />}

        {data && (
          <>
            <Card className={styles.summaryCard}>
              <h3>Employee Summary</h3>
              <p><strong>Name:</strong> {data.employee.user.first_name} {data.employee.user.last_name}</p>
              <p><strong>Department:</strong> {data.employee.department}</p>
              <p><strong>Designation:</strong> {data.employee.designation}</p>
              <p><strong>Fitness Status:</strong> {data.employee.fitness_status}</p>
            </Card>

            <Card className={styles.visitsCard}>
              <div className={styles.cardHeader}>
                <h3>Visits ({data.visits.length})</h3>
                <Button variant="outline-secondary" size="sm" onClick={handleExport}>
                  Export CSV
                </Button>
              </div>
              <div className={styles.visitsList}>
                {data.visits.map((visit) => (
                  <div key={visit.uuid} className={styles.visitItem}>
                    <p><strong>Date:</strong> {visit.visit_date}</p>
                    <p><strong>Type:</strong> {visit.visit_type}</p>
                    <p><strong>Complaint:</strong> {visit.chief_complaint}</p>
                    {visit.diagnoses.length > 0 && (
                      <p><strong>Diagnosis:</strong> {visit.diagnoses[0].diagnosis_name}</p>
                    )}
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
