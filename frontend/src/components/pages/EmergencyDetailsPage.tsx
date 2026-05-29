import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Card, Alert, Button, FormInput } from '../ui';
import { Role } from '../../types';
import api from '../../services/api';
import styles from './EmergencyDetailsPage.module.css';

interface EmergencyCase {
  id: number;
  employee_code: string;
  employee_name: string;
  department: string;
  emergency_date: string;
  chief_complaint: string;
  triage_level: string;
  severity: string;
  visit_status: string;
  description: string;
}

interface AnalyticsData {
  total_emergencies: number;
  today_emergencies: number;
  severity: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number };
  department_emergencies: Array<{ department: string; count: number }>;
  trending_emergencies: Array<{ month: string; count: number }>;
}

export const EmergencyDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emergencies, setEmergencies] = useState<EmergencyCase[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    department: '',
    severity: '',
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

      const emergencyKeywords = [
        "heart attack", "unconscious", "fainted", "seizure",
        "stroke", "breathing difficulty", "chest pain",
        "severe pain", "emergency", "collapse"
      ];

      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.department) params.employee__department__icontains = filters.department;
      if (filters.severity) params.triage_level = filters.severity;

      const response = await api.get('/ohc/visits/', { params });
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];

      // Filter for emergency cases (EMERGENCY type OR emergency keywords)
      const emergencyVisits = data.filter((visit: any) => {
        const complaint = visit.chief_complaint?.toLowerCase() || '';
        const isEmergency = emergencyKeywords.some((keyword: string) =>
          complaint.includes(keyword)
        );
        const isEmergencyType = visit.visit_type === 'EMERGENCY';
        return isEmergency || isEmergencyType;
      });

      setEmergencies(emergencyVisits);

      const severityMap = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
      const deptMap: Record<string, number> = {};
      const monthMap: Record<string, number> = {};

      const today = new Date().toISOString().split('T')[0];

      emergencyVisits.forEach((visit: any) => {
        const rawSeverity = visit.triage_level || 'LOW';
        const severity = rawSeverity as keyof typeof severityMap;

        // Only increment if severity is a valid key
        if (severity in severityMap) {
          severityMap[severity] = (severityMap[severity] || 0) + 1;
        }

        const dept = visit.employee?.department || 'Unknown';
        deptMap[dept] = (deptMap[dept] || 0) + 1;

        const month = visit.visit_date?.split('T')[0] || 'Unknown';
        monthMap[month] = (monthMap[month] || 0) + 1;
      });

      const todayEmergencies = emergencyVisits.filter((v: any) => v.visit_date?.split('T')[0] === today).length;

      const departmentEmergencies = Object.entries(deptMap).map(([department, count]) => ({
        department,
        count,
      })).sort((a, b) => b.count - a.count);

      const trendingEmergencies = Object.entries(monthMap).map(([month, count]) => ({
        month,
        count,
      }));

      setAnalytics({
        total_emergencies: emergencyVisits.length,
        today_emergencies: todayEmergencies,
        severity: severityMap,
        department_emergencies: departmentEmergencies,
        trending_emergencies: trendingEmergencies,
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
    <div className={styles.emergencyDetailsPage}>
      <Header
        title="Emergency Cases Details"
        subtitle="Detailed view of medical emergencies"
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
              label="Severity"
              value={filters.severity}
              onChange={(value) => handleFilterChange('severity', value)}
              options={[
                { value: '', label: 'All Severities' },
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'CRITICAL', label: 'Critical' },
              ]}
            />
            <Button type="button" variant="brand" onClick={fetchData} loading={loading}>
              Apply Filters
            </Button>
            <Button type="button" variant="outline-secondary" onClick={() => setFilters({ date_from: '', date_to: '', department: '', severity: '' })}>
              Clear
            </Button>
          </div>
        </Card>

        {analytics && (
          <>
            <div className={styles.summaryGrid}>
              <Card className={styles.summaryCard}>
                <div className={styles.summaryValue}>{analytics.total_emergencies}</div>
                <div className={styles.summaryLabel}>Total Emergencies</div>
              </Card>
              <Card className={`${styles.summaryCard} ${styles.todayCard}`}>
                <div className={styles.summaryValue}>{analytics.today_emergencies}</div>
                <div className={styles.summaryLabel}>Today's Emergencies</div>
              </Card>
              <Card className={`${styles.summaryCard} ${styles.criticalCard}`}>
                <div className={styles.summaryValue}>{analytics.severity.CRITICAL}</div>
                <div className={styles.summaryLabel}>Critical</div>
              </Card>
              <Card className={styles.rateCard}>
                <div className={styles.summaryValue}>
                  {analytics.total_emergencies > 0 ? Math.round(((analytics.severity.HIGH + analytics.severity.CRITICAL) / analytics.total_emergencies) * 100) : 0}%
                </div>
                <div className={styles.summaryLabel}>Critical Rate</div>
              </Card>
            </div>

            <Card className={styles.severityCard}>
              <h3>Severity Breakdown</h3>
              <div className={styles.severityGrid}>
                <div className={styles.severityItem}>
                  <span className={`${styles.severityBadge} ${styles.low}`}>
                    LOW
                  </span>
                  <span className={styles.severityValue}>{analytics.severity.LOW}</span>
                </div>
                <div className={styles.severityItem}>
                  <span className={`${styles.severityBadge} ${styles.medium}`}>
                    MEDIUM
                  </span>
                  <span className={styles.severityValue}>{analytics.severity.MEDIUM}</span>
                </div>
                <div className={styles.severityItem}>
                  <span className={`${styles.severityBadge} ${styles.high}`}>
                    HIGH
                  </span>
                  <span className={styles.severityValue}>{analytics.severity.HIGH}</span>
                </div>
                <div className={styles.severityItem}>
                  <span className={`${styles.severityBadge} ${styles.critical}`}>
                    CRITICAL
                  </span>
                  <span className={styles.severityValue}>{analytics.severity.CRITICAL}</span>
                </div>
              </div>
            </Card>

            <Card className={styles.chartCard}>
              <h3>Department Emergencies</h3>
              <div className={styles.barContainer}>
                {analytics.department_emergencies.slice(0, 5).map((dept) => (
                  <div key={dept.department} className={styles.barRow}>
                    <span className={styles.barLabel}>{dept.department}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${analytics.total_emergencies > 0 ? (dept.count / analytics.total_emergencies) * 100 : 0}%`,
                          background: dept.count > 5 ? '#dc2626' : dept.count > 2 ? '#f97316' : '#f59e0b',
                        }}
                      />
                    </div>
                    <span className={styles.barValue}>{dept.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        <Card className={styles.listCard}>
          <h3>Emergency Cases ({emergencies.length})</h3>
          {emergencies.length === 0 ? (
            <div className={styles.emptyState}>No emergency cases found</div>
          ) : (
            <table className={styles.emergenciesTable}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Emergency Date</th>
                  <th>Complaint</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {emergencies.map((emergency) => (
                  <tr key={emergency.id}>
                    <td>{emergency.employee_name || '-'}</td>
                    <td>{emergency.employee_code || '-'}</td>
                    <td>{emergency.department || '-'}</td>
                    <td>{new Date(emergency.emergency_date).toLocaleDateString()}</td>
                    <td className={styles.complaintCell}>{emergency.chief_complaint || '-'}</td>
                    <td>
                      <span className={`${styles.severityBadge} ${styles[(emergency.triage_level || 'LOW').toLowerCase()]}`}>
                        {emergency.triage_level || 'LOW'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[(emergency.visit_status || 'OPEN').toLowerCase().replace('_', '')]}`}>
                        {emergency.visit_status?.replace('_', ' ') || 'Open'}
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