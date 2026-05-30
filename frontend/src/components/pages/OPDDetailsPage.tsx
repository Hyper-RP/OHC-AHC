import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Card, Alert, Button, FormInput } from '../ui';
import { Role } from '../../types';
import api from '../../services/api';
import styles from './OPDDetailsPage.module.css';

interface OPDVisit {
  id: number;
  employee_code: string;
  employee_name: string;
  department: string;
  visit_date: string;
  visit_time: string;
  chief_complaint: string;
  visit_status: string;
  triage_level: string;
  patient_age?: number;
  patient_gender?: string;
}

interface AnalyticsData {
  total_visits: number;
  open_cases: number;
  completed_cases: number;
  department_distribution: Array<{ department: string; count: number }>;
}

/**
 * OPD Details Page
 * Shows detailed information about OPD visits
 */
export const OPDDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visits, setVisits] = useState<OPDVisit[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    department: '',
    visit_type: '',
    status: '',
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

      const params: Record<string, string> = {};

      // Filter by OPD visit types (WALK_IN, FOLLOW_UP, PERIODIC - exclude PRE_EMPLOYMENT and EMERGENCY)
      const opdTypes = ['WALK_IN', 'FOLLOW_UP', 'PERIODIC'];

      if (filters.visit_type) {
        params.visit_type = filters.visit_type;
      } else {
        // Default to OPD visits only
        params.visit_type__in = opdTypes.join(',');
      }

      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.department) params.employee__department__icontains = filters.department;
      if (filters.status) params.visit_status = filters.status;

      const response = await api.get('/ohc/visits/', { params });
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];
      setVisits(data);

      // Calculate analytics
      const deptMap: Record<string, number> = {};
      data.forEach((visit: any) => {
        const dept = visit.employee?.department || 'Unknown';
        deptMap[dept] = (deptMap[dept] || 0) + 1;
      });

      setAnalytics({
        total_visits: data.length,
        open_cases: data.filter((v: any) => v.visit_status === 'OPEN').length,
        completed_cases: data.filter((v: any) => v.visit_status === 'COMPLETED').length,
        department_distribution: Object.entries(deptMap).map(([department, count]) => ({ department, count })),
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
    <div className={styles.opdDetailsPage}>
      <Header
        title="OPD Visits Details"
        subtitle="Detailed view of all OPD visits"
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
              label="Visit Type"
              value={filters.visit_type || ''}
              onChange={(value) => handleFilterChange('visit_type', value)}
              options={[
                { value: '', label: 'All Types' },
                { value: 'WALK_IN', label: 'Walk In' },
                { value: 'PERIODIC', label: 'Periodic Checkup' },
                { value: 'PRE_EMPLOYMENT', label: 'Pre-Employment' },
                { value: 'FOLLOW_UP', label: 'Follow Up' },
                { value: 'EMERGENCY', label: 'Emergency' },
              ]}
            />
            <FormInput
              type="select"
              label="Visit Status"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'OPEN', label: 'Open' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'REFERRED', label: 'Referred' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
            <Button type="button" variant="brand" onClick={fetchData} loading={loading}>
              Apply Filters
            </Button>
            <Button type="button" variant="outline-secondary" onClick={() => setFilters({ date_from: '', date_to: '', department: '', visit_type: '', status: '' })}>
              Clear
            </Button>
          </div>
        </Card>

        {analytics && (
          <>
            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
              <Card className={styles.summaryCard}>
                <div className={styles.summaryValue}>{analytics.total_visits}</div>
                <div className={styles.summaryLabel}>Total Visits</div>
              </Card>
              <Card className={styles.summaryCard}>
                <div className={styles.summaryValue}>{analytics.open_cases}</div>
                <div className={styles.summaryLabel}>Open Cases</div>
              </Card>
              <Card className={styles.summaryCard}>
                <div className={styles.summaryValue}>{analytics.completed_cases}</div>
                <div className={styles.summaryLabel}>Completed Cases</div>
              </Card>
              <Card className={styles.summaryCard}>
                <div className={styles.summaryValue}>
                  {analytics.total_visits > 0
                    ? Math.round((analytics.completed_cases / analytics.total_visits) * 100)
                    : 0}%
                </div>
                <div className={styles.summaryLabel}>Completion Rate</div>
              </Card>
            </div>

            {/* Department Distribution */}
            <Card className={styles.chartCard}>
              <h3>Department Distribution</h3>
              <div className={styles.barContainer}>
                {analytics.department_distribution.map((dept) => (
                  <div key={dept.department} className={styles.barRow}>
                    <span className={styles.barLabel}>{dept.department}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${(dept.count / analytics.total_visits) * 100}%` }}
                      />
                    </div>
                    <span className={styles.barValue}>{dept.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Visitor List */}
        <Card className={styles.listCard}>
          <h3>Visitor Information ({visits.length})</h3>
          {visits.length === 0 ? (
            <div className={styles.emptyState}>No visits found</div>
          ) : (
            <table className={styles.visitorsTable}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Complaint</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit: any) => (
                  <tr key={visit.id}>
                    <td>{visit.employee?.user ? `${visit.employee.user.first_name} ${visit.employee.user.last_name}` : '-'}</td>
                    <td>{visit.employee?.employee_code || '-'}</td>
                    <td>{visit.employee?.department || '-'}</td>
                    <td>{visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : '-'}</td>
                    <td>{visit.visit_time ? new Date(visit.visit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td>{visit.chief_complaint || '-'}</td>
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
