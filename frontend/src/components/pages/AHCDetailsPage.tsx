import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Card, Alert, Button, FormInput } from '../ui';
import { Role } from '../../types';
import api from '../../services/api';
import styles from './AHCDetailsPage.module.css';

interface AHCEmployee {
  employee_id: number;
  employee_code: string;
  employee_name: string;
  department: string;
  last_checkup_date: string;
  health_index: number;
}

interface AnalyticsData {
  total_employees: number;
  completed_ahc: number;
  pending_ahc: number;
  completion_rate: number;
  department_completion: Array<{ department: string; completed: number; total: number }>;
}

export const AHCDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState<AHCEmployee[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [filters, setFilters] = useState({
    department: '',
    year: new Date().getFullYear().toString(),
  });

  const handleError = useCallback((err: Error) => {
    const message = err.message || 'Failed to fetch data';
    setError(message);
    show(message, 'error');
  }, [show]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/ohc/analytics/ehs-statistics/');
      const data = response.data;

      const employeeMap = new Map<number, AHCEmployee>();

      data.ahc.till_date_count_visits?.forEach?.((visit: any) => {
        const key = visit.employee_id || visit.employee?.id;
        if (!employeeMap.has(key)) {
          employeeMap.set(key, {
            employee_id: key,
            employee_code: visit.employee?.employee_code || visit.employee_code,
            employee_name: visit.employee_name,
            department: visit.department || visit.employee?.department,
            last_checkup_date: visit.visit_date,
            health_index: visit.health_index || 75,
          });
        }
      });

      setEmployees(Array.from(employeeMap.values()));

      const deptMap: Record<string, { completed: number; total: number }> = {};

      employees.forEach((emp) => {
        const dept = emp.department || 'Unknown';
        if (!deptMap[dept]) {
          deptMap[dept] = { completed: 0, total: 0 };
        }
        deptMap[dept].completed += 1;
      });

      Object.entries(deptMap).forEach(([_dept, stats]) => {
        stats.total = Math.round(stats.completed / (data.ahc.completion_percentage / 100));
      });

      setAnalytics({
        total_employees: data.ahc.total_employees || 0,
        completed_ahc: data.ahc.till_date_count || 0,
        pending_ahc: (data.ahc.total_employees || 0) - (data.ahc.till_date_count || 0),
        completion_rate: data.ahc.completion_percentage || 0,
        department_completion: Object.entries(deptMap).map(([department, stats]) => ({
          department,
          completed: stats.completed,
          total: stats.total,
        })),
      });
    } catch (err) {
      handleError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || (user.role !== Role.EHS && user.role !== Role.MANAGEMENT)) {
      setError('Access restricted to EHS and Management users only');
      return;
    }
    fetchData();
  }, [user, filters]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={styles.ahcDetailsPage}>
      <Header
        title="Annual Health Checkup (AHC) Details"
        subtitle="Detailed view of AHC completion status"
        actions={
          <Button type="button" variant="outline-secondary" onClick={() => navigate('/ehs/dashboard')}>
            ← Back to Dashboard
          </Button>
        }
      />

      {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

      <main className={styles.main}>
        <Card className={styles.filterCard}>
          <div className={styles.filterRow}>
            <FormInput
              label="Year"
              type="select"
              value={filters.year}
              onChange={(value) => handleFilterChange('year', value)}
              options={[
                { value: '2026', label: '2026' },
                { value: '2025', label: '2025' },
                { value: '2024', label: '2024' },
                { value: '2023', label: '2023' },
                { value: '2022', label: '2022' },
              ]}
            />
            <FormInput
              label="Department"
              type="text"
              value={filters.department}
              onChange={(value) => handleFilterChange('department', value)}
              placeholder="All departments"
            />
            <Button type="button" variant="brand" onClick={fetchData} loading={loading}>
              Apply Filters
            </Button>
            <Button type="button" variant="outline-secondary" onClick={() => setFilters({ department: '', year: new Date().getFullYear().toString() })}>
              Clear
            </Button>
          </div>
        </Card>

        {analytics && (
          <>
            <div className={styles.summaryGrid}>
              <Card className={styles.summaryCard}>
                <div className={styles.summaryValue}>{analytics.total_employees}</div>
                <div className={styles.summaryLabel}>Total Employees</div>
              </Card>
              <Card className={`${styles.summaryCard} ${styles.completedCard}`}>
                <div className={styles.summaryValue}>{analytics.completed_ahc}</div>
                <div className={styles.summaryLabel}>Completed AHC</div>
              </Card>
              <Card className={`${styles.summaryCard} ${styles.pendingCard}`}>
                <div className={styles.summaryValue}>{analytics.pending_ahc}</div>
                <div className={styles.summaryLabel}>Pending AHC</div>
              </Card>
              <Card className={styles.rateCard}>
                <div className={styles.summaryValue}>{analytics.completion_rate.toFixed(1)}%</div>
                <div className={styles.summaryLabel}>Completion Rate</div>
              </Card>
            </div>

            <Card className={styles.chartCard}>
              <h3>Department Completion Rate</h3>
              <div className={styles.barContainer}>
                {analytics.department_completion.map((dept) => (
                  <div key={dept.department} className={styles.barRow}>
                    <span className={styles.barLabel}>{dept.department}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${dept.total > 0 ? (dept.completed / dept.total) * 100 : 0}%`,
                          background: dept.total > 0 && dept.completed / dept.total >= 0.8 ? '#10b981' : dept.completed / dept.total >= 0.6 ? '#f59e0b' : '#dc2626',
                        }}
                      />
                    </div>
                    <span className={styles.barValue}>{dept.completed}/{dept.total}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        <Card className={styles.listCard}>
          <h3>Employees with AHC ({employees.length})</h3>
          {employees.length === 0 ? (
            <div className={styles.emptyState}>No AHC records found</div>
          ) : (
            <table className={styles.employeesTable}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Last Checkup Date</th>
                  <th>Health Index</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.employee_id}>
                    <td>{employee.employee_name}</td>
                    <td>{employee.employee_code}</td>
                    <td>{employee.department}</td>
                    <td>{new Date(employee.last_checkup_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`${styles.healthIndex} ${employee.health_index >= 80 ? styles.good : employee.health_index >= 60 ? styles.fair : styles.poor}`}>
                        {employee.health_index}/100
                      </span>
                    </td>
                    <td>
                      <span className={styles.completedBadge}>Completed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </main>
    </div>
  );
};