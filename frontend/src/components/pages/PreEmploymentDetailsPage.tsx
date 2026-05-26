import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Card, Alert, Button, FormInput } from '../ui';
import { Role } from '../../types';
import api from '../../services/api';
import styles from './PreEmploymentDetailsPage.module.css';

interface PreEmploymentVisit {
  id: number;
  employee_code: string;
  employee_name: string;
  department: string;
  visit_date: string;
  chief_complaint: string;
  visit_status: string;
  fitness_status?: string;
}

interface AnalyticsData {
  total_checks: number;
  fit_count: number;
  unfit_count: number;
  pending_count: number;
  fit_rate: number;
}

export const PreEmploymentDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visits, setVisits] = useState<PreEmploymentVisit[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    department: '',
    fitness_status: '',
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

      const params: Record<string, string> = {
        visit_type: 'PRE_EMPLOYMENT',
      };

      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.department) params.department = filters.department;
      if (filters.fitness_status) params.fitness_status = filters.fitness_status;

      const response = await api.get('/ohc/visits/', { params });
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
      setVisits(data);

      const fitCount = data.filter((v: any) => v.fitness_status === 'FIT').length;
      const unfitCount = data.filter((v: any) => v.fitness_status === 'UNFIT').length;
      const pendingCount = data.filter((v: any) => v.fitness_status === 'PENDING' || !v.fitness_status).length;

      setAnalytics({
        total_checks: data.length,
        fit_count: fitCount,
        unfit_count: unfitCount,
        pending_count: pendingCount,
        fit_rate: data.length > 0 ? Math.round((fitCount / data.length) * 100) : 0,
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
    <div className={styles.preEmploymentDetailsPage}>
      <Header
        title="Pre-Employment Checkup Details"
        subtitle="Detailed view of pre-employment checkups"
        actions={
          <Button type="button" variant="outline-secondary" onClick={() => navigate('/ehs/dashboard')}>
            ← Back to Dashboard
          </Button>
        }
      />

      {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

      <main className={styles.main}>
        {/* Filters */}
        <Card className={styles.filterCard}>
          <div className={styles.filterRow}>
            <FormInput
              label="From Date"
              type="date"
              value={filters.date_from}
              onChange={(value) => handleFilterChange('date_from', value)}
            />
            <FormInput
              label="To Date"
              type="date"
              value={filters.date_to}
              onChange={(value) => handleFilterChange('date_to', value)}
            />
            <FormInput
              label="Department"
              type="text"
              value={filters.department}
              onChange={(value) => handleFilterChange('department', value)}
              placeholder="All departments"
            />
            <FormInput
              type="select"
              label="Fitness Status"
              value={filters.fitness_status}
              onChange={(value) => handleFilterChange('fitness_status', value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'FIT', label: 'Fit' },
                { value: 'UNFIT', label: 'Unfit' },
                { value: 'PENDING', label: 'Pending' },
              ]}
            />
            <Button type="button" variant="brand" onClick={fetchData} loading={loading}>
              Apply Filters
            </Button>
            <Button type="button" variant="outline-secondary" onClick={() => setFilters({ date_from: '', date_to: '', department: '', fitness_status: '' })}>
              Clear
            </Button>
          </div>
        </Card>

        {analytics && (
          <>
            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
              <Card className={styles.summaryCard}>
                <div className={styles.summaryValue}>{analytics.total_checks}</div>
                <div className={styles.summaryLabel}>Total Checks</div>
              </Card>
              <Card className={`${styles.summaryCard} ${styles.fitCard}`}>
                <div className={styles.summaryValue}>{analytics.fit_count}</div>
                <div className={styles.summaryLabel}>Fit</div>
              </Card>
              <Card className={`${styles.summaryCard} ${styles.unfitCard}`}>
                <div className={styles.summaryValue}>{analytics.unfit_count}</div>
                <div className={styles.summaryLabel}>Unfit</div>
              </Card>
              <Card className={`${styles.summaryCard} ${styles.rateCard}`}>
                <div className={styles.summaryValue}>{analytics.fit_rate}%</div>
                <div className={styles.summaryLabel}>Fit Rate</div>
              </Card>
            </div>

            {/* Fitness Distribution */}
            <Card className={styles.chartCard}>
              <h3>Fitness Distribution</h3>
              <div className={styles.barContainer}>
                <div className={styles.barRow}>
                  <span className={styles.barLabel}>Fit</span>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${styles.fit}`}
                      style={{ width: `${analytics.total_checks > 0 ? (analytics.fit_count / analytics.total_checks) * 100 : 0}%` }}
                    />
                  </div>
                  <span className={styles.barValue}>{analytics.fit_count}</span>
                </div>
                <div className={styles.barRow}>
                  <span className={styles.barLabel}>Unfit</span>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${styles.unfit}`}
                      style={{ width: `${analytics.total_checks > 0 ? (analytics.unfit_count / analytics.total_checks) * 100 : 0}%` }}
                    />
                  </div>
                  <span className={styles.barValue}>{analytics.unfit_count}</span>
                </div>
                <div className={styles.barRow}>
                  <span className={styles.barLabel}>Pending</span>
                  <div className={styles.barTrack}>
                    <div
                      className={`${styles.barFill} ${styles.pending}`}
                      style={{ width: `${analytics.total_checks > 0 ? (analytics.pending_count / analytics.total_checks) * 100 : 0}%` }}
                    />
                  </div>
                  <span className={styles.barValue}>{analytics.pending_count}</span>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Visitor List */}
        <Card className={styles.listCard}>
          <h3>Pre-Employment Checks ({visits.length})</h3>
          {visits.length === 0 ? (
            <div className={styles.emptyState}>No pre-employment checks found</div>
          ) : (
            <table className={styles.visitorsTable}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Complaint</th>
                  <th>Fitness Status</th>
                  <th>Visit Status</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit) => (
                  <tr key={visit.id}>
                    <td>{visit.employee_name}</td>
                    <td>{visit.employee_code}</td>
                    <td>{visit.department}</td>
                    <td>{new Date(visit.visit_date).toLocaleDateString()}</td>
                    <td>{visit.chief_complaint || '-'}</td>
                    <td>
                      <span className={`${styles.fitnessBadge} ${styles[visit.fitness_status?.toLowerCase() || 'pending']}`}>
                        {visit.fitness_status || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[visit.visit_status.toLowerCase().replace('_', '')]}`}>
                        {visit.visit_status.replace('_', ' ')}
                      </span>
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