import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Card, Alert, Button, FormInput } from '../ui';
import { Role } from '../../types';
import api from '../../services/api';
import styles from './ReferredDetailsPage.module.css';

interface ReferredCase {
  id: number;
  employee_code: string;
  employee_name: string;
  department: string;
  referral_date: string;
  referral_status: string;
  referral_reason: string;
  hospital_name: string;
  priority: string;
  consultant: string;
  diagnosis: string;
}

interface AnalyticsData {
  total_referrals: number;
  today_referrals: number;
  pending_referrals: number;
  completed_referrals: number;
  hospital_stats: Array<{ hospital_name: string; count: number }>;
  priority_stats: { NORMAL: number; URGENT: number; EMERGENCY: number };
}

export const ReferredDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referrals, setReferrals] = useState<ReferredCase[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    department: '',
    status: '',
    priority: '',
  });

  const handleError = useCallback((err: Error) => {
    const message = err.message || 'Failed to fetch data';
    setError(message);
    show(message, 'error');
  }, [show]);

interface ReferredVisit {
  id: number;
  visit_status: string;
  requires_referral?: boolean;
  employee_code?: string;
  employee_name?: string;
  department?: string;
  visit_date: string;
  chief_complaint?: string;
  employee?: {
    employee_code?: string;
    department?: string;
  } | null;
  diagnoses?: Array<{ diagnosis_name?: string }> | null;
}

interface ReferralRecord {
  id: number;
  referral_status?: string;
  referral_reason?: string;
  priority?: string;
  hospital?: { name?: string } | null;
  referred_by_user?: { name?: string } | null;
}

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params: Record<string, string> = {};

      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.department) params.employee__department__icontains = filters.department;
      if (filters.status) params.referral_status = filters.status;
      if (filters.priority) params.priority = filters.priority;

      const response = await api.get('/ohc/visits/', { params });
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];

      // Get referrals from AHC (has referrals relationship)
      const referralsResponse = await api.get('/ahc/referrals/', { params: params });
      const referralData = Array.isArray(referralsResponse.data) ? referralsResponse.data : referralsResponse.data?.results || [];

      // Map referrals to get full details
      const referralMap = new Map<number, ReferralRecord>();
      (referralData as ReferralRecord[]).forEach((ref) => {
        referralMap.set(ref.id, ref);
      });

      // Combine visits that were referred with referral details
      const referredCases = (data as ReferredVisit[])
        .filter((visit) => visit.visit_status === 'REFERRED' || visit.requires_referral)
        .map((visit) => {
          const referral = referralMap.get(visit.id);
          return {
            id: visit.id,
            employee_code: visit.employee?.employee_code || visit.employee_code || '',
            employee_name: visit.employee_name || '',
            department: visit.employee?.department || visit.department || '',
            referral_date: visit.visit_date,
            referral_status: referral?.referral_status || visit.visit_status,
            referral_reason: referral?.referral_reason || visit.chief_complaint || '',
            hospital_name: referral?.hospital?.name || 'N/A',
            priority: referral?.priority || 'NORMAL',
            consultant: referral?.referred_by_user?.name || 'N/A',
            diagnosis: visit.diagnoses?.[0]?.diagnosis_name || 'N/A',
          };
        });

      setReferrals(referredCases);

      // Calculate analytics
      const pending = referredCases.filter((r: ReferredCase) => r.referral_status === 'PENDING').length;
      const completed = referredCases.filter((r: ReferredCase) => r.referral_status === 'COMPLETED').length;
      const priorityStats = { NORMAL: 0, URGENT: 0, EMERGENCY: 0 };
      const hospitalMap: Record<string, number> = {};

      referredCases.forEach((referral: ReferredCase) => {
        const priority = referral.priority as keyof typeof priorityStats;
        if (priority in priorityStats) {
          priorityStats[priority] = (priorityStats[priority] || 0) + 1;
        }
        if (referral.hospital_name !== 'N/A') {
          hospitalMap[referral.hospital_name] = (hospitalMap[referral.hospital_name] || 0) + 1;
        }
      });

      const today = new Date().toISOString().split('T')[0];
      const todayReferrals = referredCases.filter((r: ReferredCase) => r.referral_date?.split('T')[0] === today).length;

      const hospitalStats = Object.entries(hospitalMap).map(([hospital, count]) => ({
        hospital_name: hospital,
        count,
      })).sort((a, b) => b.count - a.count);

      setAnalytics({
        total_referrals: referredCases.length,
        today_referrals: todayReferrals,
        pending_referrals: pending,
        completed_referrals: completed,
        hospital_stats: hospitalStats,
        priority_stats: priorityStats,
      });
    } catch (err) {
      handleError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [filters, handleError]);

  useEffect(() => {
    if (user && user.role !== Role.EHS && user.role !== Role.MANAGEMENT) {
      show('Access restricted to EHS and Management users only', 'error');
      navigate('/dashboard');
    }
  }, [user, navigate, show]);

  useEffect(() => {
    if (user && (user.role === Role.EHS || user.role === Role.MANAGEMENT)) {
      const timer = setTimeout(() => {
        fetchData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, fetchData]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={styles.referredDetailsPage}>
      <Header
        title="Referred Cases Details"
        subtitle="Detailed view of external referrals"
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
              label="Referral Status"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'ACCEPTED', label: 'Accepted' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
            />
            <FormInput
              type="select"
              label="Priority"
              value={filters.priority}
              onChange={(value) => handleFilterChange('priority', value)}
              options={[
                { value: '', label: 'All Priorities' },
                { value: 'NORMAL', label: 'Normal' },
                { value: 'URGENT', label: 'Urgent' },
                { value: 'EMERGENCY', label: 'Emergency' },
              ]}
            />
            <Button type="button" variant="brand" onClick={fetchData} loading={loading}>
              Apply Filters
            </Button>
            <Button type="button" variant="outline-secondary" onClick={() => setFilters({ date_from: '', date_to: '', department: '', status: '', priority: '' })}>
              Clear
            </Button>
          </div>
        </Card>

        {analytics && (
          <>
            <div className={styles.summaryGrid}>
              <Card className={styles.summaryCard}>
                <div className={styles.summaryValue}>{analytics.total_referrals}</div>
                <div className={styles.summaryLabel}>Total Referrals</div>
              </Card>
              <Card className={`${styles.summaryCard} ${styles.todayCard}`}>
                <div className={styles.summaryValue}>{analytics.today_referrals}</div>
                <div className={styles.summaryLabel}>Today's Referrals</div>
              </Card>
              <Card className={`${styles.summaryCard} ${styles.pendingCard}`}>
                <div className={styles.summaryValue}>{analytics.pending_referrals}</div>
                <div className={styles.summaryLabel}>Pending</div>
              </Card>
              <Card className={`${styles.summaryCard} ${styles.completedCard}`}>
                <div className={styles.summaryValue}>{analytics.completed_referrals}</div>
                <div className={styles.summaryLabel}>Completed</div>
              </Card>
            </div>

            <Card className={styles.priorityCard}>
              <h3>Priority Distribution</h3>
              <div className={styles.priorityGrid}>
                <div className={styles.priorityItem}>
                  <span className={`${styles.priorityBadge} ${styles.normal}`}>
                    NORMAL
                  </span>
                  <span className={styles.priorityValue}>{analytics.priority_stats.NORMAL}</span>
                </div>
                <div className={styles.priorityItem}>
                  <span className={`${styles.priorityBadge} ${styles.urgent}`}>
                    URGENT
                  </span>
                  <span className={styles.priorityValue}>{analytics.priority_stats.URGENT}</span>
                </div>
                <div className={styles.priorityItem}>
                  <span className={`${styles.priorityBadge} ${styles.emergency}`}>
                    EMERGENCY
                  </span>
                  <span className={styles.priorityValue}>{analytics.priority_stats.EMERGENCY}</span>
                </div>
              </div>
            </Card>

            <Card className={styles.chartCard}>
              <h3>Top Referral Destinations</h3>
              <div className={styles.barContainer}>
                {analytics.hospital_stats.slice(0, 5).map((hospital) => (
                  <div key={hospital.hospital_name} className={styles.barRow}>
                    <span className={styles.barLabel}>{hospital.hospital_name}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${analytics.total_referrals > 0 ? (hospital.count / analytics.total_referrals) * 100 : 0}%`,
                          background: hospital.count > 10 ? '#dc2626' : hospital.count > 5 ? '#f59e0b' : '#10b981',
                        }}
                      />
                    </div>
                    <span className={styles.barValue}>{hospital.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        <Card className={styles.listCard}>
          <h3>Referred Cases ({referrals.length})</h3>
          {referrals.length === 0 ? (
            <div className={styles.emptyState}>No referred cases found</div>
          ) : (
            <table className={styles.referralsTable}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Referral Date</th>
                  <th>Reason</th>
                  <th>Diagnosis</th>
                  <th>Hospital</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id}>
                    <td>{referral.employee_name || '-'}</td>
                    <td>{referral.employee_code || '-'}</td>
                    <td>{referral.department || '-'}</td>
                    <td>{new Date(referral.referral_date).toLocaleDateString()}</td>
                    <td className={styles.reasonCell}>{referral.referral_reason || referral.diagnosis || '-'}</td>
                    <td className={styles.diagnosisCell}>{referral.diagnosis || '-'}</td>
                    <td>{referral.hospital_name}</td>
                    <td>
                      <span className={`${styles.priorityBadge} ${styles[(referral.priority || 'NORMAL').toLowerCase()]}`}>
                        {referral.priority || 'NORMAL'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[(referral.referral_status || 'PENDING').toLowerCase()]}`}>
                        {referral.referral_status || 'PENDING'}
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