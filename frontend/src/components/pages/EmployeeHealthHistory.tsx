import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../layout';
import { Card, FormInput, Button, Loading } from '../ui';
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

  const loadHistory = async (targetEmployeeId?: string) => {
    setLoading(true);
    try {
      const result = await getEmployeeHealthHistory(targetEmployeeId || undefined);
      if ('records' in result) {
        setData(result);
      } else if (targetEmployeeId) {
        navigate(`/reports/employee-history/${targetEmployeeId}`);
      }
    } catch {
      alert('Failed to load employee history');
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
      alert('Export failed');
    }
  };

  const handleViewRecord = async (targetEmployeeId: string) => {
    setEmployeeId(targetEmployeeId);
    navigate(`/reports/employee-history/${targetEmployeeId}`);
  };

  const isListMode = data !== null;

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
          <Card className={styles.visitsCard}>
            <div className={styles.cardHeader}>
              <h3>Patient Records ({data.records.length})</h3>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.recordsTable}>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Patient Name</th>
                    <th>Visit Date</th>
                    <th>Chief Complaint</th>
                    <th>Doctor</th>
                    <th>Fit/Unfit</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((record) => (
                    <tr key={record.visit_uuid}>
                      <td>{record.employee_code}</td>
                      <td>{record.employee_name}</td>
                      <td>{record.visit_date}</td>
                      <td>{record.chief_complaint}</td>
                      <td>{record.doctor_name}</td>
                      <td>{record.fitness_decision || '-'}</td>
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
        )}
      </main>
    </div>
  );
};