import React from 'react';
import { Link } from 'react-router-dom';
import { Button, StatCard } from '../ui';
import styles from './PublicHome.module.css';

/**
 * Public home page component
 * Displays landing page with metrics and feature overview
 */
export const PublicHome: React.FC = () => {
  return (
    <div className={styles.publicHome}>
      <nav className={styles.publicNav}>
        <div className={styles.navContent}>
          <div className={styles.brandSection}>
            <div className={styles.brandMark}>OHC</div>
            <div>
              <h1 className={styles.brandTitle}>Health Portal</h1>
              <p className={styles.brandSubtitle}>OHC-AHC Integrated Healthcare</p>
            </div>
          </div>
          <Link to="/login">
            <Button variant="brand">Sign In</Button>
          </Link>
        </div>
      </nav>

      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1>Occupational Health & Affiliate Hospital Care</h1>
          <p>
            Comprehensive healthcare management system for organizations and their partner
            hospitals. Streamlined OHC visits, AHC referrals, and integrated reporting.
          </p>
          <div className={styles.heroActions}>
            <Link to="/login">
              <Button variant="brand" size="lg">
                Get Started
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="outline-brand" size="lg">
                How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.metricsSection}>
        <div className={styles.metricsGrid}>
          <StatCard
            label="Total Visits"
            value="1,234"
            icon="🏥"
            trend={12}
            trendLabel="vs last month"
          />
          <StatCard
            label="Active Referrals"
            value="89"
            icon="🏢"
            trend={5}
            trendLabel="vs last month"
            trendColor="success"
          />
          <StatCard
            label="Partner Hospitals"
            value="24"
            icon="🏨"
            trendLabel="Network"
          />
          <StatCard
            label="Reports Generated"
            value="456"
            icon="📊"
            trend={8}
            trendLabel="vs last month"
            trendColor="success"
          />
        </div>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Platform Features</h2>
          <p className={styles.sectionSubtitle}>
            Everything you need for comprehensive occupational healthcare management
          </p>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🏥</div>
              <h3>OHC Visit Management</h3>
              <p>
                Complete visit documentation with triage, vitals, symptoms, and preliminary notes
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔬</div>
              <h3>Diagnosis Entry</h3>
              <p>
                Comprehensive diagnosis documentation with fitness assessment and prescription
                management
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🏢</div>
              <h3>AHC Referrals</h3>
              <p>Seamless referral system with partner hospital selection and tracking</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💳</div>
              <h3>Payment Processing</h3>
              <p>Integrated invoicing and payment management with multiple payment options</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📊</div>
              <h3>Analytics & Reports</h3>
              <p>
                Comprehensive health trends, department statistics, and employee health history
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔒</div>
              <h3>Role-Based Access</h3>
              <p>Secure access control with role-based permissions for all user types</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2>Ready to Get Started?</h2>
          <p>Sign in to access the comprehensive healthcare management portal</p>
          <Link to="/login">
            <Button variant="brand" size="lg">
              Access Portal
            </Button>
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>&copy; 2026 OHC-AHC Health Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
