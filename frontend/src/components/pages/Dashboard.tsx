import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../layout';
import { Card, Button, Loading } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import api, { handleApiError } from '../../services/api';
import { getDashboard, getEHSStatistics, getMedicineSummary } from '../../services/analytics';
import { listMedicines } from '../../services/medicine';
import {
  ChartContainer,
  DashboardMetricsChart,
  DepartmentComparisonChart,
  SeverityPieChart,
  DiagnosisTrendLineChart,
  OperationalBarChart,
} from '../charts';
import styles from './Dashboard.module.css';

type DashboardVisit = {
  id: number;
  employee?: {
    employee_code?: string;
    department?: string;
    user?: { first_name?: string; last_name?: string };
  };
  visit_type?: string;
  visit_status?: string;
  triage_level?: string;
  visit_date?: string;
  chief_complaint?: string;
  follow_up_date?: string | null;
  requires_referral?: boolean;
  prescriptions?: Array<{ id: number }>;
};

type SummaryTrendPoint = {
  period: string;
  ohcVisits: number;
  preamtiveCheckUps: number;
  annualCheckup: number;
  emergencyCount: number;
  incidentCount: number;
};

type DepartmentPoint = {
  department: string;
  visits: number;
  employees: number;
  referrals: number;
  preamtiveCheckUps: number;
  annualCheckup: number;
};

type SeverityPoint = {
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  count: number;
  color: string;
};

type DiagnosisTrendPoint = {
  diagnosis: string;
  color: string;
  data: Array<{ date: Date; count: number }>;
};

type ActivityItem = {
  title: string;
  description: string;
  time: string;
  tag: string;
};

type OperationalBarPoint = {
  label: string;
  value: number;
};

type ChartState = {
  summaryTrends: SummaryTrendPoint[];
  departmentComparison: DepartmentPoint[];
  severityBreakdown: SeverityPoint[];
  diagnosisTrends: DiagnosisTrendPoint[];
  medicineUsageBreakdown: OperationalBarPoint[];
  bioWasteBreakdown: OperationalBarPoint[];
};

type MedicineInventoryItem = {
  name: string;
  used_quantity?: number;
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

const DIAGNOSIS_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const emptyCharts: ChartState = {
  summaryTrends: [],
  departmentComparison: [],
  severityBreakdown: [],
  diagnosisTrends: [],
  medicineUsageBreakdown: [],
  bioWasteBreakdown: [],
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'MILD':
      return '#10b981';
    case 'MODERATE':
      return '#f59e0b';
    case 'SEVERE':
      return '#f97316';
    case 'CRITICAL':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const formatRelativeTime = (dateValue?: string) => {
  if (!dateValue) {
    return 'Recently';
  }

  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) {
    return 'Recently';
  }

  const diffMs = Date.now() - timestamp;
  const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
};

const matchesKeywords = (text: string | undefined, keywords: string[]) => {
  const value = (text || '').toLowerCase();
  return keywords.some((keyword) => value.includes(keyword));
};

const isEmergencyVisit = (visit: DashboardVisit) =>
  visit.visit_type === 'EMERGENCY' || matchesKeywords(visit.chief_complaint, EMERGENCY_KEYWORDS);

const isIncidentVisit = (visit: DashboardVisit) =>
  visit.visit_type !== 'EMERGENCY' && matchesKeywords(visit.chief_complaint, INCIDENT_KEYWORDS);

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

const buildSummaryTrends = (visits: DashboardVisit[]) => {
  const monthlyMap = new Map<string, SummaryTrendPoint & { sortKey: number }>();

  visits.forEach((visit) => {
    if (!visit.visit_date) {
      return;
    }

    const visitDate = new Date(visit.visit_date);
    if (Number.isNaN(visitDate.getTime())) {
      return;
    }

    const year = visitDate.getFullYear();
    const month = visitDate.getMonth();
    const bucketKey = `${year}-${month}`;
    const period = visitDate.toLocaleDateString('en-US', { month: 'short' });

    if (!monthlyMap.has(bucketKey)) {
      monthlyMap.set(bucketKey, {
        period,
        sortKey: year * 100 + month,
        ohcVisits: 0,
        preamtiveCheckUps: 0,
        annualCheckup: 0,
        emergencyCount: 0,
        incidentCount: 0,
      });
    }

    const bucket = monthlyMap.get(bucketKey)!;
    bucket.ohcVisits += 1;

    if (visit.visit_type === 'PRE_EMPLOYMENT') {
      bucket.preamtiveCheckUps += 1;
    }

    if (visit.visit_type === 'PERIODIC') {
      bucket.annualCheckup += 1;
    }

    if (isEmergencyVisit(visit)) {
      bucket.emergencyCount += 1;
    }

    if (isIncidentVisit(visit)) {
      bucket.incidentCount += 1;
    }
  });

  return Array.from(monthlyMap.values())
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(-6)
    .map(({ sortKey: _sortKey, ...item }) => item);
};

const buildDepartmentComparison = (visits: DashboardVisit[]) => {
  const departmentMap = new Map<
    string,
    DepartmentPoint & { employeeCodes: Set<string> }
  >();

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
    .map(({ employeeCodes: _codes, ...item }) => item)
    .sort((a, b) => b.visits - a.visits);
};

const buildDiagnosisTrends = (visits: DashboardVisit[]) => {
  const complaintCounts = new Map<string, number>();

  visits.forEach((visit) => {
    const complaint = (visit.chief_complaint || '').trim();
    if (!complaint) {
      return;
    }
    complaintCounts.set(complaint, (complaintCounts.get(complaint) || 0) + 1);
  });

  const topComplaints = Array.from(complaintCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([complaint]) => complaint);

  const monthlyMap = new Map<string, Map<string, number>>();
  const monthDates = new Map<string, Date>();

  visits.forEach((visit) => {
    const complaint = (visit.chief_complaint || '').trim();
    if (!topComplaints.includes(complaint) || !visit.visit_date) {
      return;
    }

    const visitDate = new Date(visit.visit_date);
    if (Number.isNaN(visitDate.getTime())) {
      return;
    }

    const monthKey = `${visitDate.getFullYear()}-${visitDate.getMonth()}`;
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, new Map<string, number>());
      monthDates.set(monthKey, new Date(visitDate.getFullYear(), visitDate.getMonth(), 1));
    }

    const bucket = monthlyMap.get(monthKey)!;
    bucket.set(complaint, (bucket.get(complaint) || 0) + 1);
  });

  const sortedMonthKeys = Array.from(monthDates.entries())
    .sort((a, b) => a[1].getTime() - b[1].getTime())
    .slice(-6)
    .map(([key]) => key);

  return topComplaints.map((complaint, index) => ({
    diagnosis: complaint,
    color: DIAGNOSIS_COLORS[index % DIAGNOSIS_COLORS.length],
    data: sortedMonthKeys.map((monthKey) => ({
      date: monthDates.get(monthKey)!,
      count: monthlyMap.get(monthKey)?.get(complaint) || 0,
    })),
  }));
};

const buildActivityFeed = (visits: DashboardVisit[]): ActivityItem[] =>
  visits.slice(0, 3).map((visit) => {
    const employeeName = `${visit.employee?.user?.first_name || ''} ${visit.employee?.user?.last_name || ''}`.trim() || 'Unknown Employee';
    const employeeCode = visit.employee?.employee_code || 'EMP';
    const complaint = visit.chief_complaint || 'Visit recorded';

    let title = 'New OHC Visit';
    let tag = 'Intake';

    if (visit.visit_status === 'REFERRED' || visit.requires_referral) {
      title = 'Referral Created';
      tag = 'Referral';
    } else if (visit.visit_status === 'COMPLETED') {
      title = 'Diagnosis Completed';
      tag = 'Clinical';
    } else if (visit.visit_type === 'EMERGENCY') {
      title = 'Emergency Case';
      tag = 'Emergency';
    } else if (visit.visit_type === 'PRE_EMPLOYMENT') {
      title = 'Preamtive Check Up';
      tag = 'Preventive';
    } else if (visit.visit_type === 'PERIODIC') {
      title = 'Annual Checkup';
      tag = 'Annual';
    }

    return {
      title,
      description: `${employeeCode} - ${employeeName} - ${complaint}`,
      time: formatRelativeTime(visit.visit_date),
      tag,
    };
  });

const buildMedicineUsageBreakdown = (
  medicines: MedicineInventoryItem[],
  medicineSummary?: Awaited<ReturnType<typeof getMedicineSummary>> | null
) => {
  const topUsed = medicines
    .map((medicine) => ({
      label: medicine.name,
      value: medicine.used_quantity ?? 0,
    }))
    .filter((medicine) => medicine.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  if (topUsed.length > 0) {
    return topUsed;
  }

  if (!medicineSummary) {
    return [];
  }

  return [
    { label: 'Total Items', value: medicineSummary.summary.stock_summary.total_items },
    { label: 'Low Stock', value: medicineSummary.summary.stock_summary.low_stock_items },
    { label: 'Expiring', value: medicineSummary.summary.stock_summary.expiring_items },
  ];
};

const buildBioWasteBreakdown = (visits: DashboardVisit[]) => {
  const totals = visits.reduce(
    (accumulator, visit) => {
      const baseUnits = visit.visit_type === 'EMERGENCY' ? 4 : visit.visit_type === 'PERIODIC' ? 3 : 2;
      accumulator.general += baseUnits;
      accumulator.infectious += visit.triage_level === 'CRITICAL' || visit.triage_level === 'HIGH' ? 3 : 1;
      accumulator.sharps += visit.visit_type === 'EMERGENCY' ? 2 : visit.visit_status === 'COMPLETED' ? 1 : 0;
      return accumulator;
    },
    { general: 0, infectious: 0, sharps: 0 }
  );

  return [
    { label: 'General Waste', value: totals.general },
    { label: 'Infectious Waste', value: totals.infectious },
    { label: 'Sharps Waste', value: totals.sharps },
  ];
};

/**
 * Dashboard page component
 * Main dashboard showing operational summaries and key insights
 */
export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [stats, setStats] = useState({
    visitCount: 0,
    referralCount: 0,
    pendingInvoices: 0,
  });
  const [chartData, setChartData] = useState<ChartState>(emptyCharts);
  const [chartError, setChartError] = useState<string | null>(null);
  const [priorityItems, setPriorityItems] = useState([
    {
      label: 'Critical Cases',
      value: 0,
      detail: 'No critical cases right now.',
      tone: styles.priorityCritical,
      route: '/dashboard/metric-details/critical-cases',
    },
    {
      label: 'Pending Follow-ups',
      value: 0,
      detail: 'No overdue follow-ups right now.',
      tone: styles.priorityFollowUp,
      route: '/dashboard/metric-details/pending-follow-ups',
    },
    {
      label: 'Medicine Alerts',
      value: 0,
      detail: 'No low stock medicines right now.',
      tone: styles.prioritySupply,
      route: '/medicine-management',
    },
  ]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setChartLoading(true);
      setChartError(null);

      const [analyticsResult, ehsStatisticsResult, medicineSummaryResult, visitsResult, medicinesResult] = await Promise.allSettled([
        getDashboard(),
        getEHSStatistics(),
        getMedicineSummary(),
        fetchAllVisits(),
        listMedicines({ page_size: 100 }),
      ]);

      const analytics = analyticsResult.status === 'fulfilled' ? analyticsResult.value : null;
      const ehsStatistics = ehsStatisticsResult.status === 'fulfilled' ? ehsStatisticsResult.value : null;
      const medicineSummary = medicineSummaryResult.status === 'fulfilled' ? medicineSummaryResult.value : null;
      const visits = visitsResult.status === 'fulfilled' ? visitsResult.value : [];
      const medicines =
        medicinesResult.status === 'fulfilled' && Array.isArray(medicinesResult.value?.results)
          ? medicinesResult.value.results as MedicineInventoryItem[]
          : [];

      if (visits.length > 0) {
        setChartData({
          summaryTrends: buildSummaryTrends(visits),
          departmentComparison: buildDepartmentComparison(visits),
          severityBreakdown: analytics
            ? [
              { severity: 'MILD', count: analytics.severity_wise.LOW, color: getSeverityColor('MILD') },
              { severity: 'MODERATE', count: analytics.severity_wise.MEDIUM, color: getSeverityColor('MODERATE') },
              { severity: 'SEVERE', count: analytics.severity_wise.HIGH, color: getSeverityColor('SEVERE') },
              { severity: 'CRITICAL', count: analytics.severity_wise.CRITICAL, color: getSeverityColor('CRITICAL') },
            ]
            : [],
          diagnosisTrends: buildDiagnosisTrends(visits),
          medicineUsageBreakdown: buildMedicineUsageBreakdown(medicines, medicineSummary),
          bioWasteBreakdown: buildBioWasteBreakdown(visits),
        });
        setActivityFeed(buildActivityFeed(visits));
      } else {
        setChartData((current) => ({
          ...current,
          severityBreakdown: analytics
            ? [
              { severity: 'MILD', count: analytics.severity_wise.LOW, color: getSeverityColor('MILD') },
              { severity: 'MODERATE', count: analytics.severity_wise.MEDIUM, color: getSeverityColor('MODERATE') },
              { severity: 'SEVERE', count: analytics.severity_wise.HIGH, color: getSeverityColor('SEVERE') },
              { severity: 'CRITICAL', count: analytics.severity_wise.CRITICAL, color: getSeverityColor('CRITICAL') },
            ]
            : [],
          medicineUsageBreakdown: buildMedicineUsageBreakdown(medicines, medicineSummary),
          bioWasteBreakdown: [],
        }));
        setActivityFeed([]);
      }

      setStats({
        visitCount: analytics?.summary.total_visits ?? visits.length,
        referralCount: ehsStatistics?.preEmployment.total_checks ?? visits.filter((visit) => visit.visit_type === 'PRE_EMPLOYMENT').length,
        pendingInvoices: ehsStatistics?.ahc.till_date_count ?? visits.filter((visit) => visit.visit_type === 'PERIODIC').length,
      });

      setPriorityItems([
        {
          label: 'Critical Cases',
          value: analytics?.critical_cases.length ?? visits.filter((visit) => visit.triage_level === 'CRITICAL').length,
          detail:
            analytics && analytics.critical_cases.length > 0
              ? `${analytics.critical_cases[0].employee_code} needs immediate attention.`
              : 'No critical cases right now.',
          tone: styles.priorityCritical,
          route: '/dashboard/metric-details/critical-cases',
        },
        {
          label: 'Pending Follow-ups',
          value:
            analytics?.summary.follow_up_pending ??
            visits.filter((visit) => {
              if (!visit.follow_up_date) {
                return false;
              }
              return new Date(visit.follow_up_date).getTime() < Date.now();
            }).length,
          detail:
            analytics && analytics.pending_follow_ups.length > 0
              ? `${analytics.pending_follow_ups[0].employee_code} is overdue for follow-up.`
              : 'No overdue follow-ups right now.',
          tone: styles.priorityFollowUp,
          route: '/dashboard/metric-details/pending-follow-ups',
        },
        {
          label: 'Medicine Alerts',
          value: medicineSummary?.summary.stock_summary.low_stock_items ?? 0,
          detail:
            medicineSummary && medicineSummary.summary.stock_summary.low_stock_items > 0
              ? `${medicineSummary.summary.stock_summary.low_stock_items} medicines need reorder attention.`
              : 'No low stock medicines right now.',
          tone: styles.prioritySupply,
          route: '/medicine-management',
        },
      ]);

      if (visitsResult.status === 'rejected') {
        console.error('Dashboard visits failed to load:', visitsResult.reason);
        setChartError(handleApiError(visitsResult.reason, 'Dashboard charts could not be loaded.'));
      } else if (analyticsResult.status === 'rejected' && visits.length === 0) {
        console.error('Dashboard analytics failed to load:', analyticsResult.reason);
        setChartError(handleApiError(analyticsResult.reason, 'Dashboard charts could not be loaded.'));
      }

      setLoading(false);
      setChartLoading(false);
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <Loading fullScreen text="Loading dashboard..." />;
  }

  const latestSummary =
    chartData.summaryTrends.length > 0
      ? chartData.summaryTrends[chartData.summaryTrends.length - 1]
      : null;

  const metricConfigs: Array<{
    key: 'ohcVisits' | 'preamtiveCheckUps' | 'annualCheckup' | 'emergencyCount' | 'incidentCount';
    title: string;
    description: string;
    color: string;
    detailRoute: string;
  }> = [
    {
      key: 'ohcVisits',
      title: 'Total OHC Visits',
      description: 'Monthly trend for OHC visit volume.',
      color: '#0a5f78',
      detailRoute: '/dashboard/metric-details/ohc-visits',
    },
    {
      key: 'preamtiveCheckUps',
      title: 'Preamtive Check Ups',
      description: 'Monthly trend for preamtive health checks.',
      color: '#f0b24b',
      detailRoute: '/dashboard/metric-details/preamtive-check-ups',
    },
    {
      key: 'annualCheckup',
      title: 'Annual Checkup',
      description: 'Monthly trend for annual checkup cases.',
      color: '#5aa488',
      detailRoute: '/dashboard/metric-details/annual-checkup',
    },
    {
      key: 'emergencyCount',
      title: 'Emergency Count',
      description: 'Monthly trend for emergency cases.',
      color: '#d95f5f',
      detailRoute: '/dashboard/metric-details/emergency-count',
    },
    {
      key: 'incidentCount',
      title: 'Incident Count',
      description: 'Monthly trend for incident cases.',
      color: '#7b6fd6',
      detailRoute: '/dashboard/metric-details/incident-count',
    },
  ];

  return (
    <div className={styles.dashboard}>
      <Header
        title="Dashboard"
        subtitle={`Welcome back, ${user?.first_name}`}
        stats={stats}
      />

      <main className={styles.dashboardMain}>
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className={styles.sectionTitle}>Performance Snapshot</h2>
              <p className={styles.sectionSubtitle}>
                Graph view of the core OHC programs tracked on this dashboard.
              </p>
            </div>
          </div>
          <div className={styles.summaryMetricsGrid}>
            {metricConfigs.slice(0, 3).map((metric) => (
              <ChartContainer
                key={metric.key}
                title={metric.title}
                description={metric.description}
                loading={chartLoading}
                error={chartError}
                empty={chartData.summaryTrends.length === 0}
                className={styles.summaryChartCard}
                onClick={() => navigate(metric.detailRoute)}
              >
                <div className={styles.metricCount}>{latestSummary?.[metric.key] ?? 0}</div>
                <DashboardMetricsChart
                  data={chartData.summaryTrends}
                  dataKey={metric.key}
                  color={metric.color}
                  label={metric.title}
                  height={280}
                />
              </ChartContainer>
            ))}
          </div>
          <div className={styles.summaryMetricsCenterRow}>
            {metricConfigs.slice(3).map((metric) => (
              <ChartContainer
                key={metric.key}
                title={metric.title}
                description={metric.description}
                loading={chartLoading}
                error={chartError}
                empty={chartData.summaryTrends.length === 0}
                className={styles.summaryChartCard}
                onClick={() => navigate(metric.detailRoute)}
              >
                <div className={styles.metricCount}>{latestSummary?.[metric.key] ?? 0}</div>
                <DashboardMetricsChart
                  data={chartData.summaryTrends}
                  dataKey={metric.key}
                  color={metric.color}
                  label={metric.title}
                  height={280}
                />
              </ChartContainer>
            ))}
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className={styles.sectionTitle}>Priority Queue</h2>
              <p className={styles.sectionSubtitle}>
                The most important items to review before routine reporting.
              </p>
            </div>
            <Link to="/reports/medical">
              <Button variant="outline-secondary" size="sm">
                Open Reports
              </Button>
            </Link>
          </div>
          <div className={styles.priorityGrid}>
            {priorityItems.map((item) => (
              <Card
                key={item.label}
                className={`${styles.priorityCard} ${item.tone}`}
                onClick={() => navigate(item.route)}
              >
                <p className={styles.priorityLabel}>{item.label}</p>
                <p className={styles.priorityValue}>{item.value}</p>
                <p className={styles.priorityDetail}>{item.detail}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHead}>
            <div>
              <h2 className={styles.sectionTitle}>Overview</h2>
              <p className={styles.sectionSubtitle}>
                A quick read on demand, distribution, and department load.
              </p>
            </div>
          </div>
          <div className={styles.chartsGrid}>
            <ChartContainer
              title="Department-wise OHC"
              description="OHC visits by department"
              loading={chartLoading}
              error={chartError}
              empty={chartData.departmentComparison.length === 0}
              className={styles.chartCard}
            >
              <DepartmentComparisonChart
                data={chartData.departmentComparison}
                dataKey="visits"
                titleLabel="OHC Visits"
                color="#0a5f78"
                height={300}
              />
            </ChartContainer>

            <ChartContainer
              title="Department-wise Preamtive"
              description="Preamtive check ups by department"
              loading={chartLoading}
              error={chartError}
              empty={chartData.departmentComparison.length === 0}
              className={styles.chartCard}
            >
              <DepartmentComparisonChart
                data={chartData.departmentComparison}
                dataKey="preamtiveCheckUps"
                titleLabel="Preamtive Check Ups"
                color="#f0b24b"
                sortBy="preamtiveCheckUps"
                height={300}
              />
            </ChartContainer>

            <ChartContainer
              title="Department-wise Annual"
              description="Annual checkup counts by department"
              loading={chartLoading}
              error={chartError}
              empty={chartData.departmentComparison.length === 0}
              className={styles.chartCard}
            >
              <DepartmentComparisonChart
                data={chartData.departmentComparison}
                dataKey="annualCheckup"
                titleLabel="Annual Checkup"
                color="#5aa488"
                sortBy="annualCheckup"
                height={300}
              />
            </ChartContainer>

            <ChartContainer
              title="Severity Breakdown"
              description="Case severity distribution"
              loading={chartLoading}
              error={chartError}
              empty={chartData.severityBreakdown.length === 0}
              className={styles.chartCard}
            >
              <SeverityPieChart data={chartData.severityBreakdown} height={300} />
            </ChartContainer>

            <ChartContainer
              title="Medicine Usage"
              description="Top used medicines from live stock records"
              loading={chartLoading}
              error={chartError}
              empty={chartData.medicineUsageBreakdown.length === 0}
              className={styles.chartCard}
            >
              <OperationalBarChart
                data={chartData.medicineUsageBreakdown}
                color="#0a7b83"
                valueLabel="Used Units"
                height={300}
              />
            </ChartContainer>

            <ChartContainer
              title="Biomedical Waste"
              description="Estimated waste mix based on current visit activity"
              loading={chartLoading}
              error={chartError}
              empty={chartData.bioWasteBreakdown.length === 0}
              className={styles.chartCard}
            >
              <OperationalBarChart
                data={chartData.bioWasteBreakdown}
                color="#b56d2a"
                valueLabel="Estimated Units"
                height={300}
              />
            </ChartContainer>
          </div>
        </section>

        <section className={styles.analyticsRail}>
          <div className={styles.analyticsMain}>
            <div className={styles.sectionHead}>
              <div>
                <h2 className={styles.sectionTitle}>Top Diagnoses Trends</h2>
                <p className={styles.sectionSubtitle}>
                  Common conditions moving across the current reporting window.
                </p>
              </div>
            </div>
            <ChartContainer
              title="Common Diagnoses Over Time"
              description="Trends built from live visit complaints"
              loading={chartLoading}
              error={chartError}
              empty={chartData.diagnosisTrends.length === 0}
            >
              <DiagnosisTrendLineChart data={chartData.diagnosisTrends} height={350} />
            </ChartContainer>
          </div>

          <aside className={styles.activityAside}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Recent Activity</h2>
              <Link to="/reports/medical">
                <Button variant="outline-secondary" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <Card className={styles.activityPanel}>
              <div className={styles.activityList}>
                {activityFeed.length === 0 ? (
                  <div className={styles.activityItem}>
                    <div className={styles.activityContent}>
                      <p className={styles.activityDescription}>No recent activity available.</p>
                    </div>
                  </div>
                ) : (
                  activityFeed.map((item) => (
                    <div key={`${item.title}-${item.time}-${item.description}`} className={styles.activityItem}>
                      <div className={styles.activityMarker} />
                      <div className={styles.activityContent}>
                        <div className={styles.activityTop}>
                          <p className={styles.activityTitle}>{item.title}</p>
                          <span className={styles.activityTag}>{item.tag}</span>
                        </div>
                        <p className={styles.activityDescription}>{item.description}</p>
                        <p className={styles.activityTime}>{item.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </aside>
        </section>
      </main>
    </div>
  );
};
