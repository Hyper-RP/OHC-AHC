import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../layout';
import { Card, Button, Loading } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Dashboard.module.css';

/**
 * Dashboard page component
 * Main dashboard showing quick actions and key insights
 */
export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    visitCount: 0,
    referralCount: 0,
    pendingInvoices: 0,
  });

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      // In a real app, fetch from API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStats({
        visitCount: 1234,
        referralCount: 89,
        pendingInvoices: 23,
      });
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <Loading fullScreen text="Loading dashboard..." />;
  }

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

  return (
    <div className={styles.dashboard}>
      <Header
        title="Dashboard"
        subtitle={`Welcome back, ${user?.first_name}`}
        stats={stats}
      />

      <main className={styles.dashboardMain}>
        <section className={styles.welcomeSection}>
          <div className={styles.welcomeContent}>
            <h1>Welcome to OHC-AHC Health Portal</h1>
            <p>
              Manage occupational healthcare, track visits, handle referrals, and access
              comprehensive health reports.
            </p>
          </div>
        </section>

        <section className={styles.actionsSection}>
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
        </section>

        <section className={styles.insightsSection}>
          <h2 className={styles.sectionTitle}>Key Insights</h2>
          <div className={styles.insightsGrid}>
            {insights.map((insight) => (
              <Card key={insight.title}>
                <div className={styles.insightHeader}>
                  <h4>{insight.title}</h4>
                  {insight.trend && (
                    <span className={`${styles.insightTrend} ${styles[insight.trendColor]}`}>
                      {insight.trend}
                    </span>
                  )}
                </div>
                <div className={styles.insightValue}>{insight.value}</div>
              </Card>
            ))}
          </div>
        </section>

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
