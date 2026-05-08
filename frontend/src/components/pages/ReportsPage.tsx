import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../layout';
import { Card, StatCard } from '../ui';
import styles from './ReportsPage.module.css';

/**
 * Reports Page component
 * Main hub for accessing all reports
 */
export const ReportsPage: React.FC = () => {
  const reports = [
    {
      title: 'Medical Reports',
      description: 'View and download medical reports',
      icon: '📋',
      link: '/reports/medical',
    },
    {
      title: 'Employee Health History',
      description: 'Complete health history for employees',
      icon: '📜',
      link: '/reports/employee-history',
    },
    {
      title: 'Disease Trends',
      description: 'Analyze health trends across organization',
      icon: '📈',
      link: '/reports/disease-trends',
    },
    {
      title: 'Department Statistics',
      description: 'Health metrics by department',
      icon: '🏢',
      link: '/reports/department-stats',
    },
  ];

  return (
    <div className={styles.reportsPage}>
      <Header title="Reports" subtitle="Access healthcare reports and analytics" />
      <main className={styles.reportsMain}>
        <section className={styles.statsSection}>
          <StatCard label="Total Reports" value="1,234" icon="📊" />
          <StatCard label="Downloads Today" value="45" icon="⬇️" />
          <StatCard label="Reports Generated" value="89" icon="✨" />
        </section>

        <section className={styles.reportsGrid}>
          {reports.map((report) => (
            <Link key={report.title} to={report.link}>
              <Card className={styles.reportCard}>
                <div className={styles.reportIcon}>{report.icon}</div>
                <h3>{report.title}</h3>
                <p>{report.description}</p>
              </Card>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
};
