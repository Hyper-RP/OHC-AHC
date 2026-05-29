import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Card, Alert, Button, FormInput } from '../ui';
import { Role } from '../../types';
import api from '../../services/api';
import styles from './IncidentDetailsPage.module.css';

interface IncidentCase {
  id: number;
  employee_code: string;
  employee_name: string;
  department: string;
  incident_date: string;
  chief_complaint: string;
  triage_level: string;
  severity: string;
  visit_status: string;
  description: string;
}

interface AnalyticsData {
  total_incidents: number;
  today_incidents: number;
  severity: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number };
  department_incidents: Array<{ department: string; count: number }>;
  trending_incidents: Array<{ month: string; count: number }>;
}

export const IncidentDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [incidents, setIncidents] = useState<IncidentCase[]>([]);
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

      const incidentKeywords = [
        "injury", "accident", "cut", "burn", "fall", "machine",
        "equipment", "crush", "puncture", "fracture", "sprain",
        "strain", "work", "occupational"
      ];

      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.department) params.employee__department__icontains = filters.department;
      if (filters.severity) params.triage_level = filters.severity;

      // Get visits and filter for incidents in frontend
      const response = await api.get('/ohc/visits/', { params });
      const data = Array.isArray(response.data) ? response.data : response.data?.results || [];

      // Filter for incident cases (not EMERGENCY)
      const incidentVisits = data.filter((visit: any) => {
        const complaint = visit.chief_complaint?.toLowerCase() || '';
        const isIncident = incidentKeywords.some((keyword: string) =>
          complaint.includes(keyword)
        );
        const isNotEmergency = visit.visit_type !== 'EMERGENCY';
        return isIncident && isNotEmergency;
      });

      setIncidents(incidentVisits);

      // Calculate analytics
      const severityMap = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
      const deptMap: Record<string, number> = {};
      const monthMap: Record<string, number> = {};

      const today = new Date().toISOString().split('T')[0];

      incidentVisits.forEach((visit: any) => {
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

      const todayIncidents = incidentVisits.filter((v: any) => v.visit_date?.split('T')[0] === today).length;

      const departmentIncidents = Object.entries(deptMap).map(([department, count]) => ({
        department,
        count,
      })).sort((a, b) => b.count - a.count);

      const trendingIncidents = Object.entries(monthMap).map(([month, count]) => ({
        month,
        count,
      }));

      setAnalytics({
        total_incidents: incidentVisits.length,
        today_incidents: todayIncidents,
        severity: severityMap,
        department_incidents: departmentIncidents,
        trending_incidents: trendingIncidents,
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
    <div className={styles.incidentDetailsPage}>
      <Header
        title="Incident Cases Details"
        subtitle="Detailed view of workplace incidents"
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
                <div className={styles.summaryValue}>{analytics.total_incidents}</div>
                <div className={styles.summaryLabel}>Total Incidents</div>
              </Card>
              <Card className={`${styles.summaryCard} ${styles.todayCard}`}>
                <div className={styles.summaryValue}>{analytics.today_incidents}</div>
                <div className={styles.summaryLabel}>Today's Incidents</div>
              </Card>
              <Card className={`${styles.summaryCard} ${styles.highCard}`}>
                <div className={styles.summaryValue}>{analytics.severity.HIGH + analytics.severity.CRITICAL}</div>
                <div className={styles.summaryLabel}>High/Critical</div>
              </Card>
              <Card className={styles.rateCard}>
                <div className={styles.summaryValue}>
                  {analytics.total_incidents > 0 ? Math.round(((analytics.severity.HIGH + analytics.severity.CRITICAL) / analytics.total_incidents) * 100) : 0}%
                </div>
                <div className={styles.summaryLabel}>Severity Rate</div>
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
              <h3>Department Incidents</h3>
              <div className={styles.barContainer}>
                {analytics.department_incidents.slice(0, 5).map((dept) => (
                  <div key={dept.department} className={styles.barRow}>
                    <span className={styles.barLabel}>{dept.department}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${analytics.total_incidents > 0 ? (dept.count / analytics.total_incidents) * 100 : 0}%`,
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
          <h3>Incident Cases ({incidents.length})</h3>
          {incidents.length === 0 ? (
            <div className={styles.emptyState}>No incident cases found</div>
          ) : (
            <table className={styles.incidentsTable}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Incident Date</th>
                  <th>Complaint</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td>{incident.employee_name || '-'}</td>
                    <td>{incident.employee_code || '-'}</td>
                    <td>{incident.department || '-'}</td>
                    <td>{new Date(incident.incident_date).toLocaleDateString()}</td>
                    <td className={styles.complaintCell}>{incident.chief_complaint || '-'}</td>
                    <td>
                      <span className={`${styles.severityBadge} ${styles[(incident.triage_level || 'LOW').toLowerCase()]}`}>
                        {incident.triage_level || 'LOW'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[(incident.visit_status || 'OPEN').toLowerCase().replace('_', '')]}`}>
                        {incident.visit_status?.replace('_', ' ') || 'Open'}
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