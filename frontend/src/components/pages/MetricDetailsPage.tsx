import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Alert, Button, Card, FormInput, Loading } from '../ui';
import styles from './MetricDetailsPage.module.css';

type MetricSlug =
  | 'ohc-visits'
  | 'preamtive-check-ups'
  | 'annual-checkup'
  | 'referral-cases'
  | 'emergency-count'
  | 'incident-count'
  | 'critical-cases'
  | 'pending-follow-ups';

interface VisitRecord {
  id: number | string;
  employeeCode: string;
  employeeName: string;
  department: string;
  visitDate: string;
  visitTime: string;
  followUpDate: string;
  visitType: string;
  complaint: string;
  severity: string;
  status: string;
}

interface MetricConfig {
  title: string;
  subtitle: string;
  visitType?: string;
  requiresIncidentFilter?: boolean;
  requiresEmergencyFilter?: boolean;
  requiresReferralFilter?: boolean;
  requiresCriticalFilter?: boolean;
  requiresPendingFollowUpFilter?: boolean;
}

const METRIC_CONFIG: Record<MetricSlug, MetricConfig> = {
  'ohc-visits': {
    title: 'Total OHC Visits Details',
    subtitle: 'Detailed employee records for OHC visits',
  },
  'preamtive-check-ups': {
    title: 'Pre-Employment Checkup Details',
    subtitle: 'Detailed employee records for pre-employment checkups',
    visitType: 'PRE_EMPLOYMENT',
  },
  'annual-checkup': {
    title: 'Annual Health Checkup Details',
    subtitle: 'Detailed employee records for annual health checkups',
    visitType: 'PERIODIC',
  },
  'referral-cases': {
    title: 'Referral Cases Details',
    subtitle: 'Detailed employee records for referral cases',
    requiresReferralFilter: true,
  },
  'emergency-count': {
    title: 'Emergency Cases Details',
    subtitle: 'Detailed employee records for emergency cases',
    requiresEmergencyFilter: true,
  },
  'incident-count': {
    title: 'Incident Cases Details',
    subtitle: 'Detailed employee records for incident cases',
    requiresIncidentFilter: true,
  },
  'critical-cases': {
    title: 'Critical Cases Details',
    subtitle: 'Detailed employee records for critical medical cases',
    requiresCriticalFilter: true,
  },
  'pending-follow-ups': {
    title: 'Pending Follow-ups Details',
    subtitle: 'Detailed employee records for overdue follow-up cases',
    requiresPendingFollowUpFilter: true,
  },
};

const INCIDENT_KEYWORDS = [
  'injury', 'accident', 'cut', 'burn', 'fall', 'machine',
  'equipment', 'crush', 'puncture', 'fracture', 'sprain',
  'strain', 'work', 'occupational',
];

const EMERGENCY_KEYWORDS = [
  'heart attack', 'unconscious', 'fainted', 'seizure',
  'stroke', 'breathing difficulty', 'chest pain',
  'severe pain', 'emergency', 'collapse',
];

const matchesKeywords = (complaint: string, keywords: string[]) => {
  const normalized = complaint.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
};

const isPreEmploymentVisit = (visit: VisitRecord) => visit.visitType === 'PRE_EMPLOYMENT';

const isAnnualHealthCheckupVisit = (visit: VisitRecord) => visit.visitType === 'PERIODIC';

const isCoreOHCVisit = (visit: VisitRecord) =>
  !isPreEmploymentVisit(visit) && !isAnnualHealthCheckupVisit(visit);

const mapVisitRecord = (visit: any): VisitRecord => ({
  id: visit.id,
  employeeCode: visit.employee_code ?? visit.employee?.employee_code ?? '-',
  employeeName: (
    visit.employee_name ??
    `${visit.employee?.user?.first_name ?? ''} ${visit.employee?.user?.last_name ?? ''}`.trim() ??
    visit.patient_name ??
    '-'
  ),
  department: visit.department ?? visit.employee?.department ?? 'Unknown',
  visitDate: visit.visit_date ?? '',
  visitTime: visit.visit_time ?? '',
  followUpDate: visit.follow_up_date ?? '',
  visitType: visit.visit_type ?? '-',
  complaint: visit.chief_complaint ?? '-',
  severity: visit.triage_level ?? 'LOW',
  status: visit.visit_status ?? 'OPEN',
});

export const MetricDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { metricSlug } = useParams<{ metricSlug: MetricSlug }>();
  const { user } = useAuth();
  const { show } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    department: '',
    status: '',
  });

  const metricConfig = metricSlug ? METRIC_CONFIG[metricSlug] : null;

  const applyMetricSpecificFilter = useCallback((records: VisitRecord[]) => {
    if (!metricConfig) {
      return records;
    }

    if (metricConfig.requiresEmergencyFilter) {
      return records.filter((visit) =>
        visit.visitType === 'EMERGENCY' || matchesKeywords(visit.complaint, EMERGENCY_KEYWORDS)
      );
    }

    if (metricConfig.requiresReferralFilter) {
      return records.filter(
        (visit) => visit.status === 'REFERRED'
      );
    }

    if (metricConfig.requiresIncidentFilter) {
      return records.filter(
        (visit) =>
          visit.visitType !== 'EMERGENCY' &&
          matchesKeywords(visit.complaint, INCIDENT_KEYWORDS)
      );
    }

    if (metricConfig.requiresCriticalFilter) {
      return records.filter((visit) => visit.severity === 'CRITICAL');
    }

    if (metricConfig.requiresPendingFollowUpFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return records.filter((visit) => {
        if (!visit.followUpDate) {
          return false;
        }
        const followUp = new Date(visit.followUpDate);
        followUp.setHours(0, 0, 0, 0);
        return followUp < today && visit.status !== 'COMPLETED' && visit.status !== 'CLOSED';
      });
    }

    if (metricSlug === 'ohc-visits') {
      return records.filter(isCoreOHCVisit);
    }

    return records;
  }, [metricConfig, metricSlug]);

  const fetchData = useCallback(async () => {
    if (!metricConfig) {
      setError('Metric not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const params: Record<string, string> = {};
      if (metricConfig.visitType) params.visit_type = metricConfig.visitType;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.department) params.department = filters.department;
      if (filters.status) params.visit_status = filters.status;
      const response = await api.get('/ohc/visits/', { params });
      const rawData = Array.isArray(response.data) ? response.data : response.data?.results || [];
      setVisits(applyMetricSpecificFilter(rawData.map(mapVisitRecord)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch records';
      setError(message);
      show(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [applyMetricSpecificFilter, filters, metricConfig, show]);

  useEffect(() => {
    if (!user) {
      setError('Please sign in to view records');
      setLoading(false);
      return;
    }
    fetchData();
  }, [user, fetchData]);

  const summary = useMemo(() => ({
    total: visits.length,
    open: visits.filter((visit) => visit.status === 'OPEN').length,
    critical: visits.filter((visit) => visit.severity === 'CRITICAL').length,
    departments: new Set(visits.map((visit) => visit.department)).size,
  }), [visits]);

  if (!metricConfig) {
    return <Loading fullScreen text="Loading records..." />;
  }

  return (
    <div className={styles.page}>
      <Header
        title={metricConfig.title}
        subtitle={metricConfig.subtitle}
        actions={(
          <Button type="button" variant="outline-secondary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        )}
      />

      {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

      <main className={styles.main}>
        <Card className={styles.filterCard}>
          <div className={styles.filterGrid}>
            <FormInput
              label="From Date"
              type="date"
              value={filters.date_from}
              onChange={(value) => setFilters((prev) => ({ ...prev, date_from: value }))}
            />
            <FormInput
              label="To Date"
              type="date"
              value={filters.date_to}
              onChange={(value) => setFilters((prev) => ({ ...prev, date_to: value }))}
            />
            <FormInput
              label="Department"
              value={filters.department}
              onChange={(value) => setFilters((prev) => ({ ...prev, department: value }))}
              placeholder="All departments"
            />
            <FormInput
              type="select"
              label="Status"
              value={filters.status}
              onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'OPEN', label: 'Open' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'REFERRED', label: 'Referred' },
                { value: 'CLOSED', label: 'Closed' },
              ]}
            />
            <div className={styles.filterActions}>
              <Button type="button" variant="brand" onClick={fetchData} loading={loading}>
                Apply Filters
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() =>
                  setFilters({
                    date_from: '',
                    date_to: '',
                    department: '',
                    status: '',
                  })
                }
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>

        <section className={styles.summaryGrid}>
          <Card className={styles.summaryCard}>
            <div className={styles.summaryValue}>{summary.total}</div>
            <div className={styles.summaryLabel}>Total Records</div>
          </Card>
          <Card className={styles.summaryCard}>
            <div className={styles.summaryValue}>{summary.open}</div>
            <div className={styles.summaryLabel}>Open Cases</div>
          </Card>
          <Card className={styles.summaryCard}>
            <div className={styles.summaryValue}>{summary.critical}</div>
            <div className={styles.summaryLabel}>Critical Cases</div>
          </Card>
          <Card className={styles.summaryCard}>
            <div className={styles.summaryValue}>{summary.departments}</div>
            <div className={styles.summaryLabel}>Departments</div>
          </Card>
        </section>

        <Card className={styles.tableCard}>
          <div className={styles.tableHead}>
            <h3>Employee Records</h3>
            <span>{visits.length} results</span>
          </div>
          {loading ? (
            <div className={styles.loadingState}>Loading records...</div>
          ) : visits.length === 0 ? (
            <div className={styles.emptyState}>No records found for this metric.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Code</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Visit Type</th>
                    <th>Complaint</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((visit) => (
                    <tr key={`${visit.id}-${visit.visitDate}`}>
                      <td>{visit.employeeName}</td>
                      <td>{visit.employeeCode}</td>
                      <td>{visit.department}</td>
                      <td>{visit.visitDate ? new Date(visit.visitDate).toLocaleDateString() : '-'}</td>
                      <td>{visit.visitTime || '-'}</td>
                      <td>{visit.visitType}</td>
                      <td>{visit.complaint}</td>
                      <td>{visit.status.replace('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};
