import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import type { DashboardAnalytics, AnalyticsFilters, EHSStatistics } from '../../types';
import { Header } from '../layout';
import { Card, Alert, Button } from '../ui';
import { getDashboard, getEHSStatistics, exportAnalytics } from '../../services/analytics';
import { Role } from '../../types';
import {
  OPDStatisticsCard,
  PreEmploymentStatisticsCard,
  AHCStatisticsCard,
  IncidentStatisticsCard,
  EmergencyStatisticsCard,
  ReferredStatisticsCard,
} from '../dashboard';
import styles from './EHSDashboard.module.css';

/**
 * EHS Dashboard component
 * Displays analytics and reports for EHS users
 */
export const EHSDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [ehsStatistics, setEhsStatistics] = useState<EHSStatistics | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  useEffect(() => {
    if (!user || (user.role !== Role.EHS && user.role !== Role.MANAGEMENT)) {
      setError('Access restricted to EHS and Management users only');
      navigate('/dashboard');
      return;
    }
    fetchAnalytics();
    fetchEHSStatistics();
  }, [user, navigate, filters]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getDashboard(filters);
      setAnalytics(data);
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      show(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEHSStatistics = async () => {
    try {
      const data = await getEHSStatistics(filters);
      setEhsStatistics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch EHS statistics';
      show(errorMessage, 'error');
    }
  };

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics();
      fetchEHSStatistics();
    }, 60000);

    return () => clearInterval(interval);
  }, [filters]);

  const handleExport = async () => {
    try {
      const blob = await exportAnalytics(filters, 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      show('Analytics exported successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export analytics';
      show(errorMessage, 'error');
    }
  };

  const handleFilterChange = (key: keyof AnalyticsFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const isManagement = user?.role === Role.MANAGEMENT;

  if (loading) {
    return (
      <div className={styles.ehsDashboard}>
        <Header title={isManagement ? 'Management Dashboard' : 'EHS Dashboard'} subtitle="Analytics and reports" />
        <div className={styles.loadingState}>Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className={styles.ehsDashboard}>
      <Header title={isManagement ? 'Management Dashboard' : 'EHS Dashboard'} subtitle="Analytics and reports" />

      {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

      <main className={styles.dashboardMain}>
        {/* Filters */}
        <Card className={styles.filterCard}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label htmlFor="date-from">From Date</label>
              <input
                id="date-from"
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="date-to">To Date</label>
              <input
                id="date-to"
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label htmlFor="department">Department</label>
              <input
                id="department"
                type="text"
                value={filters.department || ''}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                placeholder="All departments"
              />
            </div>
            <Button type="button" variant="outline-secondary" onClick={fetchAnalytics}>
              Refresh
            </Button>
            <Button type="button" variant="outline-secondary" onClick={handleExport}>
              Export
            </Button>
          </div>
        </Card>

        {analytics && (
          <>
            {/* EHS Statistics Cards - New Section */}
            <div className={styles.ehsStatisticsGrid}>
              <OPDStatisticsCard statistics={ehsStatistics?.opd || null} loading={loading} />
              <PreEmploymentStatisticsCard statistics={ehsStatistics?.preEmployment || null} loading={loading} />
              <AHCStatisticsCard statistics={ehsStatistics?.ahc || null} loading={loading} />
              <IncidentStatisticsCard statistics={ehsStatistics?.incident || null} loading={loading} />
              <EmergencyStatisticsCard statistics={ehsStatistics?.emergency || null} loading={loading} />
              <ReferredStatisticsCard statistics={ehsStatistics?.referred || null} loading={loading} />
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryCards}>
              <Card className={styles.summaryCard}>
                <h3>Total Visits</h3>
                <p className={styles.summaryValue}>{analytics.summary.total_visits}</p>
              </Card>
              <Card className={styles.summaryCard}>
                <h3>Open Cases</h3>
                <p className={styles.summaryValue}>{analytics.summary.open_cases}</p>
              </Card>
              <Card className={styles.summaryCard}>
                <h3>Completed Cases</h3>
                <p className={styles.summaryValue}>{analytics.summary.completed_cases}</p>
              </Card>
              <Card className={styles.summaryCard}>
                <h3>Pending Follow-ups</h3>
                <p className={styles.summaryValue}>{analytics.summary.follow_up_pending}</p>
              </Card>
            </div>

            {/* Department-wise Visits */}
            <Card className={styles.chartCard}>
              <h3>Department-wise Visits</h3>
              <div className={styles.chartPlaceholder}>
                {analytics.department_wise.map((dept) => (
                  <div key={dept.department} className={styles.barRow}>
                    <span className={styles.barLabel}>{dept.department}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${dept.percentage}%` }}
                      />
                    </div>
                    <span className={styles.barValue}>{dept.visit_count}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Severity Distribution */}
            <Card className={styles.chartCard}>
              <h3>Severity Distribution</h3>
              <div className={styles.severityGrid}>
                <div className={styles.severityItem}>
                  <span className={styles.severityLabel}>Low</span>
                  <span className={styles.severityValue}>{analytics.severity_wise.LOW}</span>
                </div>
                <div className={styles.severityItem}>
                  <span className={styles.severityLabel}>Medium</span>
                  <span className={styles.severityValue}>{analytics.severity_wise.MEDIUM}</span>
                </div>
                <div className={styles.severityItem}>
                  <span className={styles.severityLabel}>High</span>
                  <span className={styles.severityValue}>{analytics.severity_wise.HIGH}</span>
                </div>
                <div className={styles.severityItem}>
                  <span className={styles.severityLabel}>Critical</span>
                  <span className={styles.severityValue}>{analytics.severity_wise.CRITICAL}</span>
                </div>
              </div>
            </Card>

            {/* Critical Cases */}
            {analytics.critical_cases.length > 0 && (
              <Card className={styles.listCard}>
                <h3>Critical Cases</h3>
                <div className={styles.listContainer}>
                  {analytics.critical_cases.map((item) => (
                    <div key={item.id} className={styles.listItem}>
                      <div>
                        <span className={styles.itemName}>{item.patient_name}</span>
                        <span className={styles.itemCode}>{item.employee_code}</span>
                      </div>
                      <div className={styles.itemMeta}>
                        <span>{new Date(item.visit_date).toLocaleDateString()}</span>
                        <span className={styles.itemComplaint}>{item.chief_complaint}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Pending Follow-ups */}
            {analytics.pending_follow_ups.length > 0 && (
              <Card className={styles.listCard}>
                <h3>Pending Follow-ups</h3>
                <div className={styles.listContainer}>
                  {analytics.pending_follow_ups.map((item) => (
                    <div key={item.id} className={styles.listItem}>
                      <div>
                        <span className={styles.itemName}>{item.patient_name}</span>
                        <span className={styles.itemCode}>{item.employee_code}</span>
                      </div>
                      <div className={styles.itemMeta}>
                        <span>{new Date(item.follow_up_date).toLocaleDateString()}</span>
                        {item.days_overdue > 0 && (
                          <span className={styles.overdueBadge}>{item.days_overdue}d overdue</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};