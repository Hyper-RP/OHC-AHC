import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { Header } from '../layout';
import { Alert, Button, Card, Loading } from '../ui';
import { DepartmentComparisonChart } from '../charts';
import styles from './DepartmentDetailsPage.module.css';

type DepartmentMetricSlug = 'ohc' | 'preamtive' | 'annual';

type DashboardVisit = {
  id: number;
  employee?: {
    employee_code?: string;
    department?: string;
  };
  visit_type?: string;
  visit_status?: string;
  requires_referral?: boolean;
  visit_date?: string;
};

type TrendGranularity = 'daily' | 'monthly' | 'yearly';

type DepartmentPoint = {
  department: string;
  visits: number;
  employees: number;
  referrals: number;
  preamtiveCheckUps: number;
  annualCheckup: number;
};

const METRIC_CONFIG: Record<
  DepartmentMetricSlug,
  {
    title: string;
    subtitle: string;
    dataKey: 'visits' | 'preamtiveCheckUps' | 'annualCheckup';
    titleLabel: string;
    color: string;
  }
> = {
  ohc: {
    title: 'Department-wise OHC Details',
    subtitle: 'Full OHC visit counts for each department',
    dataKey: 'visits',
    titleLabel: 'OHC Visits',
    color: '#0a5f78',
  },
  preamtive: {
    title: 'Department-wise Pre-employement Details',
    subtitle: 'Full pre-employement check up cases for each department',
    dataKey: 'preamtiveCheckUps',
    titleLabel: 'Pre-employement Check Ups',
    color: '#f0b24b',
  },
  annual: {
    title: 'Department-wise Annual Health Checkup Details',
    subtitle: 'Full annual health checkup cases for each department',
    dataKey: 'annualCheckup',
    titleLabel: 'Annual Health Checkup',
    color: '#5aa488',
  },
};

const fetchAllVisits = async (): Promise<DashboardVisit[]> => {
  const visits: DashboardVisit[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext && page <= 25) {
    const response = await api.get('/ohc/visits/', {
      params: { page, page_size: 200, ordering: '-visit_date' },
    });
    const payload = response.data;
    const batch = Array.isArray(payload) ? payload : payload?.results || [];
    visits.push(...batch);
    hasNext = !Array.isArray(payload) && Boolean(payload?.next);
    page += 1;
  }

  return visits;
};

const isWithinGranularity = (visitDateValue: string | undefined, granularity: TrendGranularity) => {
  if (!visitDateValue) {
    return false;
  }

  const visitDate = new Date(visitDateValue);
  if (Number.isNaN(visitDate.getTime())) {
    return false;
  }

  const now = new Date();

  if (granularity === 'daily') {
    return (
      visitDate.getFullYear() === now.getFullYear() &&
      visitDate.getMonth() === now.getMonth() &&
      visitDate.getDate() === now.getDate()
    );
  }

  if (granularity === 'monthly') {
    return (
      visitDate.getFullYear() === now.getFullYear() &&
      visitDate.getMonth() === now.getMonth()
    );
  }

  return visitDate.getFullYear() === now.getFullYear();
};

const buildDepartmentComparison = (visits: DashboardVisit[]) => {
  const departmentMap = new Map<string, DepartmentPoint & { employeeCodes: Set<string> }>();

  visits.forEach((visit) => {
    const department = visit.employee?.department || 'Unknown';
    const employeeCode = visit.employee?.employee_code || '';

    if (!departmentMap.has(department)) {
      departmentMap.set(department, {
        department,
        visits: 0,
        employees: 0,
        referrals: 0,
        preamtiveCheckUps: 0,
        annualCheckup: 0,
        employeeCodes: new Set<string>(),
      });
    }

    const bucket = departmentMap.get(department)!;
    bucket.visits += 1;

    if (employeeCode) {
      bucket.employeeCodes.add(employeeCode);
      bucket.employees = bucket.employeeCodes.size;
    }

    if (visit.requires_referral || visit.visit_status === 'REFERRED') {
      bucket.referrals += 1;
    }

    if (visit.visit_type === 'PRE_EMPLOYMENT') {
      bucket.preamtiveCheckUps += 1;
    }

    if (visit.visit_type === 'PERIODIC') {
      bucket.annualCheckup += 1;
    }
  });

  return Array.from(departmentMap.values())
    .map(({ employeeCodes: _employeeCodes, ...item }) => item)
    .sort((a, b) => b.visits - a.visits);
};

export const DepartmentDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { departmentMetricSlug } = useParams<{ departmentMetricSlug: DepartmentMetricSlug }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allVisits, setAllVisits] = useState<DashboardVisit[]>([]);
  const [granularity, setGranularity] = useState<TrendGranularity>('monthly');

  const metricConfig = departmentMetricSlug ? METRIC_CONFIG[departmentMetricSlug] : null;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedGranularity = params.get('granularity');

    if (
      requestedGranularity === 'daily' ||
      requestedGranularity === 'monthly' ||
      requestedGranularity === 'yearly'
    ) {
      setGranularity(requestedGranularity);
    }
  }, [location.search]);

  useEffect(() => {
    const loadData = async () => {
      if (!metricConfig) {
        setError('Department metric not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const visits = await fetchAllVisits();
        setAllVisits(visits);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load department details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [metricConfig]);

  const filteredVisits = useMemo(
    () => allVisits.filter((visit) => isWithinGranularity(visit.visit_date, granularity)),
    [allVisits, granularity]
  );

  const departmentData = useMemo(
    () => buildDepartmentComparison(filteredVisits),
    [filteredVisits]
  );

  const total = useMemo(
    () => departmentData.reduce((sum, row) => sum + (row[metricConfig?.dataKey ?? 'visits'] ?? 0), 0),
    [departmentData, metricConfig]
  );

  const granularityLabel =
    granularity === 'daily' ? 'Today' : granularity === 'monthly' ? 'Monthly' : 'Yearly';

  if (loading) {
    return <Loading fullScreen text="Loading department details..." />;
  }

  if (!metricConfig) {
    return <Loading fullScreen text="Loading department details..." />;
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
        <div className={styles.controlsRow}>
          <div className={styles.metricFilterWrap}>
            <select
              className={styles.metricFilterSelect}
              value={granularity}
              onChange={(event) => setGranularity(event.target.value as TrendGranularity)}
            >
              <option value="daily">Today</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div className={styles.summaryGrid}>
          <Card className={styles.summaryCard}>
            <p className={styles.summaryLabel}>{granularityLabel} {metricConfig.titleLabel}</p>
            <p className={styles.summaryValue}>{total}</p>
          </Card>
          <Card className={styles.summaryCard}>
            <p className={styles.summaryLabel}>{granularityLabel} Departments</p>
            <p className={styles.summaryValue}>{departmentData.length}</p>
          </Card>
        </div>

        <Card className={styles.chartCard}>
          <DepartmentComparisonChart
            data={departmentData}
            dataKey={metricConfig.dataKey}
            titleLabel={metricConfig.titleLabel}
            color={metricConfig.color}
            sortBy={metricConfig.dataKey}
            height={420}
          />
        </Card>

        <Card className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>{metricConfig.titleLabel}</th>
                  <th>Employees</th>
                  <th>Referrals</th>
                </tr>
              </thead>
              <tbody>
                {departmentData.map((row) => (
                  <tr key={row.department}>
                    <td>{row.department}</td>
                    <td>{row[metricConfig.dataKey]}</td>
                    <td>{row.employees}</td>
                    <td>{row.referrals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
};
