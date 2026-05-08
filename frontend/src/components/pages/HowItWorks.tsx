import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../ui';
import styles from './HowItWorks.module.css';

/**
 * How It Works page component
 * Explains the workflow of the OHC-AHC healthcare system
 */
export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: 'Employee Visit to OHC',
      description:
        'Employees visit the Occupational Health Center for walk-in or scheduled appointments. Nurses collect basic information and vital signs.',
      details: ['Registration check', 'Triage assessment', 'Vitals collection'],
    },
    {
      number: 2,
      title: 'Doctor Consultation & Diagnosis',
      description:
        'OHC doctors examine patients, provide diagnoses, and determine fitness status. Prescriptions are issued when necessary.',
      details: ['Medical examination', 'Diagnosis entry', 'Fitness assessment', 'Prescription'],
    },
    {
      number: 3,
      title: 'Referral to AHC (if needed)',
      description:
        'For cases requiring specialist care, doctors create referrals to partner hospitals. Employees can select from network hospitals.',
      details: ['Referral creation', 'Hospital selection', 'Appointment scheduling'],
    },
    {
      number: 4,
      title: 'Treatment at Partner Hospital',
      description:
        'Employees receive treatment at selected AHC partner hospitals. Reports and discharge summaries are uploaded to the system.',
      details: ['Specialist consultation', 'Treatment & procedures', 'Report submission'],
    },
    {
      number: 5,
      title: 'Payment Processing',
      description:
        'Invoices are generated for services rendered. Multiple payment options are available including cash, card, UPI, and Razorpay.',
      details: ['Invoice generation', 'Payment processing', 'Receipt management'],
    },
    {
      number: 6,
      title: 'Reporting & Analytics',
      description:
        'Comprehensive reports are available for management. Track trends, department health stats, and individual employee history.',
      details: ['Health trends analysis', 'Department statistics', 'Employee health history'],
    },
  ];

  return (
    <div className={styles.howItWorks}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link to="/">
            <div className={styles.backLink}>← Back to Home</div>
          </Link>
          <h1 className={styles.title}>How It Works</h1>
          <p className={styles.subtitle}>
            Understanding the OHC-AHC healthcare workflow from visit to treatment
          </p>
        </header>

        <section className={styles.workflowSection}>
          <div className={styles.workflowGrid}>
            {steps.map((step) => (
              <div key={step.number} className={styles.workflowStep}>
                <div className={styles.stepNumber}>{step.number}</div>
                <Card title={step.title} className={styles.stepCard}>
                  <p className={styles.stepDescription}>{step.description}</p>
                  <ul className={styles.stepDetails}>
                    {step.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.keyFeatures}>
          <h2 className={styles.sectionTitle}>Key Features</h2>
          <div className={styles.featuresGrid}>
            <Card className={styles.featureCard}>
              <h3>📋 Digital Records</h3>
              <p>All medical records digitized and stored securely with easy access for authorized personnel</p>
            </Card>
            <Card className={styles.featureCard}>
              <h3>🏢 Hospital Network</h3>
              <p>Partner hospitals with cashless payment options and integrated report management</p>
            </Card>
            <Card className={styles.featureCard}>
              <h3>📊 Real-time Analytics</h3>
              <p>Dashboard with live statistics, trends, and health metrics across departments</p>
            </Card>
            <Card className={styles.featureCard}>
              <h3>🔒 Secure Access</h3>
              <p>Role-based access control ensuring patient data privacy and security</p>
            </Card>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <h2>Ready to Get Started?</h2>
          <p>Access the portal to manage occupational healthcare efficiently</p>
          <Link to="/login">
            <Button variant="brand" size="lg">
              Sign In to Portal
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
};
