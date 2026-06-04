import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Alert, Button } from '../ui';
import { RefreshControl } from '../charts';
import api, { handleApiError } from '../../services/api';
import { Role, VisitStatus, VisitType } from '../../types';
import styles from './PreEmploymentDoctorDashboard.module.css';

interface AnnualHealthVisit {
  id: number;
  employee?: {
    employee_code: string;
    department?: string;
    user?: { first_name?: string; last_name?: string };
  } | null;
  employee_name?: string;
  employee_id?: string;
  employee_department?: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  visit_date: string;
  visit_time?: string;
  visit_status: VisitStatus;
}

export const AnnualHealthDoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>(VisitStatus.OPEN);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [visits, setVisits] = useState<AnnualHealthVisit[]>([]);

  const handleError = useCallback((err: unknown) => {
    const message = handleApiError(err, 'Failed to fetch annual health checkups');
    setError(message);
    show(message, 'error');
  }, [show]);

  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFilter) params.append('visit_status', selectedFilter);
      params.append('visit_type', VisitType.PERIODIC);

      const response = await api.get(`/ohc/visits/?${params.toString()}`);
      const visitsData = response.data.results || response.data || [];
      setVisits(Array.isArray(visitsData) ? visitsData : []);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError, selectedFilter]);

  useEffect(() => {
    if (!user || user.role !== Role.DOCTOR) {
      navigate('/dashboard');
      return;
    }
    void fetchVisits();
  }, [fetchVisits, navigate, user]);

  const stats = useMemo(() => ({
    total: visits.length,
    open: visits.filter((visit) => visit.visit_status === VisitStatus.OPEN).length,
    completed: visits.filter((visit) => visit.visit_status === VisitStatus.COMPLETED).length,
  }), [visits]);

  const getDisplayName = (visit: AnnualHealthVisit) =>
    visit.patient_name ||
    visit.employee_name ||
    `${visit.employee?.user?.first_name || ''} ${visit.employee?.user?.last_name || ''}`.trim() ||
    'N/A';

  const getDisplayCode = (visit: AnnualHealthVisit) => visit.employee_id || visit.employee?.employee_code || 'N/A';
  const getDisplayDepartment = (visit: AnnualHealthVisit) => visit.employee_department || visit.employee?.department || 'N/A';

  return (
    <div className={styles.dashboard}>
      <Header title="Annual Health Check Up - Doctor" subtitle="Review and diagnose annual health checkups" />

      <main className={styles.dashboardMain}>
        {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

        <div className={styles.cardHeader}>
          <h2>Doctor Queue</h2>
          <RefreshControl onRefresh={() => void fetchVisits()} isRefreshing={loading} lastUpdated={lastUpdated ?? undefined} />
        </div>

        <div className={styles.filterTabs}>
          <button type="button" className={`${styles.filterTab} ${selectedFilter === VisitStatus.OPEN ? styles.active : ''}`} onClick={() => setSelectedFilter(VisitStatus.OPEN)}>
            Open
          </button>
          <button type="button" className={`${styles.filterTab} ${selectedFilter === VisitStatus.IN_PROGRESS ? styles.active : ''}`} onClick={() => setSelectedFilter(VisitStatus.IN_PROGRESS)}>
            In Progress
          </button>
          <button type="button" className={`${styles.filterTab} ${selectedFilter === VisitStatus.COMPLETED ? styles.active : ''}`} onClick={() => setSelectedFilter(VisitStatus.COMPLETED)}>
            Completed
          </button>
        </div>

        <div className={styles.visitDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Total</span>
            <span>{stats.total}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Open</span>
            <span>{stats.open}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Completed</span>
            <span>{stats.completed}</span>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading annual health checkups...</div>
        ) : visits.length === 0 ? (
          <div className={styles.emptyState}>No annual health checkups found</div>
        ) : (
          <div className={styles.visitsList}>
            {visits.map((visit) => (
              <div key={visit.id} className={styles.visitCard}>
                <div className={styles.visitHeader}>
                  <div className={styles.visitInfo}>
                    <h3>{getDisplayName(visit)}</h3>
                    <p className={styles.employeeCode}>{getDisplayCode(visit)}</p>
                    <p className={styles.department}>{getDisplayDepartment(visit)}</p>
                  </div>
                  <span>{visit.visit_status}</span>
                </div>

                <div className={styles.visitDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Date</span>
                    <span>{new Date(visit.visit_date).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Time</span>
                    <span>{visit.visit_time ? new Date(`2000-01-01T${visit.visit_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Gender</span>
                    <span>{visit.patient_gender || '-'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Age</span>
                    <span>{visit.patient_age ? `${visit.patient_age} yrs` : '-'}</span>
                  </div>
                </div>

                <div className={styles.detailActions}>
                  <Button type="button" variant="brand" onClick={() => navigate(`/annual-health-doctor/request/${visit.id}`)}>
                    View Request
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
