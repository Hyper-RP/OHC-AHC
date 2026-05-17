import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../layout';
import { Card, Button, Loading } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChartContainer,
  VisitTrendsChart,
  DepartmentComparisonChart,
  SeverityPieChart,
  DiagnosisTrendLineChart,
} from '../charts';
import styles from './Dashboard.module.css';

/**
 * Dashboard page component
 * Main dashboard showing quick actions and key insights
 */
export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [stats, setStats] = useState({
    visitCount: 0,
    referralCount: 0,
    pendingInvoices: 0,
  });
  const [chartData, setChartData] = useState<any>({
    visitTrends: [],
    departmentComparison: [],
    severityBreakdown: [],
    diagnosisTrends: [],
  });
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load basic stats (simulated)
        await new Promise((resolve) => setTimeout(resolve, 500));
        setStats({
          visitCount: 1234,
          referralCount: 89,
          pendingInvoices: 23,
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to load stats:', error);
        setLoading(false);
      }
    };

    const loadChartData = async () => {
      try {
        setChartLoading(true);
        // Using dummy data as requested
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay

        const dummyData = {
          visitTrends: [
            { date: new Date('2026-05-01'), count: 12 },
            { date: new Date('2026-05-02'), count: 19 },
            { date: new Date('2026-05-03'), count: 15 },
            { date: new Date('2026-05-04'), count: 22 },
            { date: new Date('2026-05-05'), count: 28 },
            { date: new Date('2026-05-06'), count: 20 },
            { date: new Date('2026-05-07'), count: 35 },
          ],
          departmentComparison: [
            { department: 'Engineering', visits: 120, employees: 45, referrals: 15 },
            { department: 'HR', visits: 45, employees: 12, referrals: 2 },
            { department: 'Operations', visits: 85, employees: 30, referrals: 8 },
            { department: 'Sales', visits: 60, employees: 20, referrals: 5 },
          ],
          severityBreakdown: [
            { severity: 'MILD', count: 65, color: '#10b981' },
            { severity: 'MODERATE', count: 25, color: '#f59e0b' },
            { severity: 'SEVERE', count: 8, color: '#f97316' },
            { severity: 'CRITICAL', count: 2, color: '#ef4444' },
          ],
          diagnosisTrends: [
            {
              diagnosis: 'Fever',
              color: '#3b82f6',
              data: [
                { date: new Date('2026-05-01'), count: 10 },
                { date: new Date('2026-05-02'), count: 12 },
                { date: new Date('2026-05-03'), count: 15 },
                { date: new Date('2026-05-04'), count: 20 },
                { date: new Date('2026-05-05'), count: 18 },
              ]
            },
            {
              diagnosis: 'Cough',
              color: '#10b981',
              data: [
                { date: new Date('2026-05-01'), count: 15 },
                { date: new Date('2026-05-02'), count: 18 },
                { date: new Date('2026-05-03'), count: 12 },
                { date: new Date('2026-05-04'), count: 10 },
                { date: new Date('2026-05-05'), count: 15 },
              ]
            },
            {
              diagnosis: 'Headache',
              color: '#f59e0b',
              data: [
                { date: new Date('2026-05-01'), count: 8 },
                { date: new Date('2026-05-02'), count: 10 },
                { date: new Date('2026-05-03'), count: 11 },
                { date: new Date('2026-05-04'), count: 9 },
                { date: new Date('2026-05-05'), count: 12 },
              ]
            }
          ]
        };

        setChartData(dummyData);
        setChartError(null);
      } catch (error) {
        console.error('Failed to load chart data:', error);
        setChartError('Failed to load chart data');
      } finally {
        setChartLoading(false);
      }
    };

    loadData();
    loadChartData();
  }, []);

  if (loading) {
    return <Loading fullScreen text="Loading dashboard..." />;
  }

  /* Commented out - sections are not currently used
  const quickActions = [
    {
      title: 'New OHC Visit',
      description: 'Record a new patient visit',
      icon: '🏥',
      link: '/ohc/visit-form',
      variant: 'primary' as const,
    },
    {
      title: 'Diagnosis Entry',
      description: 'Enter diagnosis and prescriptions',
      icon: '🔬',
      link: '/ohc/diagnosis-entry',
      variant: 'secondary' as const,
    },
    {
      title: 'Create Referral',
      description: 'Refer patient to AHC',
      icon: '🏢',
      link: '/ahc/referrals',
      variant: 'tertiary' as const,
    },
    {
      title: 'Hospital Selection',
      description: 'Select partner hospital',
      icon: '🏨',
      link: '/ahc/hospital-selection',
      variant: 'primary' as const,
    },
    {
      title: 'View Reports',
      description: 'Access medical reports',
      icon: '📋',
      link: '/reports/medical',
      variant: 'secondary' as const,
    },
    {
      title: 'Analytics',
      description: 'View health trends',
      icon: '📊',
      link: '/reports/disease-trends',
      variant: 'tertiary' as const,
    },
  ];

  const insights = [
    {
      title: 'Most Common Diagnosis',
      value: 'Upper Respiratory Infection',
      trend: '+5%',
      trendColor: 'danger' as const,
    },
    {
      title: 'Department with Highest Visits',
      value: 'Engineering',
      trend: '+12%',
      trendColor: 'danger' as const,
    },
    {
      title: 'Average Treatment Time',
      value: '2.5 Days',
      trend: '-8%',
      trendColor: 'success' as const,
    },
  ];
  */

  return (
    <div className={styles.dashboard}>
      <Header
        title="Dashboard"
        subtitle={`Welcome back, ${user?.first_name}`}
        stats={stats}
      />

      <main className={styles.dashboardMain}>
        <section className={styles.chartsSection}>
          <h2 className={styles.sectionTitle}>Overview</h2>
          <div className={styles.chartsGrid}>
            <ChartContainer
              title="Visit Trends"
              description="Daily visits over time"
              loading={chartLoading}
              error={chartError}
              empty={chartData.visitTrends.length === 0}
              className={styles.chartCard}
            >
              <VisitTrendsChart data={chartData.visitTrends} height={300} />
            </ChartContainer>

            <ChartContainer
              title="Department Comparison"
              description="Visits by department"
              loading={chartLoading}
              error={chartError}
              empty={chartData.departmentComparison.length === 0}
              className={styles.chartCard}
            >
              <DepartmentComparisonChart data={chartData.departmentComparison} height={300} />
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
          </div>
        </section>

        <section className={styles.trendsSection}>
          <h2 className={styles.sectionTitle}>Top Diagnoses Trends</h2>
          <ChartContainer
            title="Common Diagnoses Over Time"
            description="Trends for top 5 diagnoses"
            loading={chartLoading}
            error={chartError}
            empty={chartData.diagnosisTrends.length === 0}
          >
            <DiagnosisTrendLineChart data={chartData.diagnosisTrends} height={350} />
          </ChartContainer>
        </section>

        {/* <section className={styles.welcomeSection}>
          <div className={styles.welcomeContent}>
            <h1>Welcome to OHC-AHC Health Portal</h1>
            <p>
              Manage occupational healthcare, track visits, handle referrals, and access
              comprehensive health reports.
            </p>
          </div>
        </section> */}

        {/* <section className={styles.actionsSection}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            {quickActions.map((action) => (
              <Link key={action.title} to={action.link}>
                <Card className={`${styles.actionCard} ${styles[action.variant]}`}>
                  <div className={styles.actionIcon}>{action.icon}</div>
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section> */}

        {/* <section className={styles.insightsSection}> */}
        {/* <h2 className={styles.sectionTitle}>Key Insights</h2> */}
        {/* <div className={styles.insightsGrid}> */}
        {/* {insights.map((insight) => ( */}
        {/* // <Card key={insight.title}> */}
        {/* //  <div className={styles.insightHeader}> */}
        {/* //  <h4>{insight.title}</h4> */}
        {/* //{insight.trend && ( */}
        {/* //<span className={`${styles.insightTrend} ${styles[insight.trendColor]}`}> */}
        {/* //{insight.trend} */}
        {/* //</span> */}
        {/* //)} */}
        {/* //</div> */}
        {/* //<div className={styles.insightValue}>{insight.value}</div> */}
        {/* //</Card> */}
        {/* //))} */}
        {/* //</div> */}
        {/* // </section> */}

        <section className={styles.recentSection}>
          <div className={styles.sectionHead}>
            <h2>Recent Activity</h2>
            <Link to="/reports/medical">
              <Button variant="outline-secondary" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <Card>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>🏥</div>
                <div className={styles.activityContent}>
                  <p className={styles.activityTitle}>New OHC Visit</p>
                  <p className={styles.activityDescription}>
                    EMP-001 - John Doe - Walk-in visit for headache
                  </p>
                  <p className={styles.activityTime}>2 hours ago</p>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>🔬</div>
                <div className={styles.activityContent}>
                  <p className={styles.activityTitle}>Diagnosis Completed</p>
                  <p className={styles.activityDescription}>
                    EMP-002 - Jane Smith - Mild fever, prescribed rest
                  </p>
                  <p className={styles.activityTime}>4 hours ago</p>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>🏢</div>
                <div className={styles.activityContent}>
                  <p className={styles.activityTitle}>Referral Created</p>
                  <p className={styles.activityDescription}>
                    EMP-003 - Bob Johnson - Referred to City Hospital
                  </p>
                  <p className={styles.activityTime}>6 hours ago</p>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
};