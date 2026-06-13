import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import type { DashboardAnalytics, MedicineSummary } from '../../types';
import { Header } from '../layout';
import { Card, Alert } from '../ui';
import { getDashboard, getMedicineSummary } from '../../services/analytics';
import { Role } from '../../types';
import styles from './ManagementDashboard.module.css';

/**
 * Management Dashboard component
 * Read-only view of EHS analytics and medicine reports
 */
export const ManagementDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [medicineSummary, setMedicineSummary] = useState<MedicineSummary | null>(null);
  const [activeView, setActiveView] = useState<'analytics' | 'medicine'>('analytics');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [analyticsData, medicineData] = await Promise.all([
        getDashboard(),
        getMedicineSummary(),
      ]);
      setAnalytics(analyticsData);
      setMedicineSummary(medicineData);
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      show(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    if (!user || user.role !== Role.MANAGEMENT) {
      const timer = setTimeout(() => {
        setError('Access restricted to Management users only');
        navigate('/dashboard');
      }, 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [user, navigate, fetchData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className={styles.managementDashboard}>
        <Header title="Management Dashboard" subtitle="Analytics and medicine reports" />
        <div className={styles.loadingState}>Loading data...</div>
      </div>
    );
  }

  return (
    <div className={styles.managementDashboard}>
      <Header title="Management Dashboard" subtitle="Analytics and medicine reports" />

      {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

      <main className={styles.dashboardMain}>
        {/* View Toggle */}
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.toggleButton} ${activeView === 'analytics' ? styles.active : ''}`}
            onClick={() => setActiveView('analytics')}
          >
            Analytics
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${activeView === 'medicine' ? styles.active : ''}`}
            onClick={() => setActiveView('medicine')}
          >
            Medicine Reports
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${styles.refreshButton}`}
            onClick={fetchData}
          >
            Refresh
          </button>
        </div>

        {activeView === 'analytics' && analytics && (
          <>
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

            {/* Common Diagnoses */}
            <Card className={styles.chartCard}>
              <h3>Top Diagnoses</h3>
              <div className={styles.chartPlaceholder}>
                {analytics.common_diagnoses.map((diag) => (
                  <div key={diag.diagnosis_name} className={styles.barRow}>
                    <span className={styles.barLabel}>{diag.diagnosis_name}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${diag.percentage}%` }}
                      />
                    </div>
                    <span className={styles.barValue}>{diag.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Monthly Trends */}
            <Card className={styles.chartCard}>
              <h3>Monthly Trends</h3>
              <div className={styles.chartPlaceholder}>
                {analytics.monthly_trends.map((trend) => (
                  <div key={trend.month} className={styles.barRow}>
                    <span className={styles.barLabel}>{trend.month}</span>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${(trend.visit_count / Math.max(...analytics.monthly_trends.map((t) => t.visit_count), 1)) * 100}%` }}
                      />
                    </div>
                    <span className={styles.barValue}>{trend.visit_count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {activeView === 'medicine' && medicineSummary && (
          <>
            {/* Medicine Summary Cards */}
            <div className={styles.summaryCards}>
              <Card className={styles.summaryCard}>
                <h3>Total OHC Visits</h3>
                <p className={styles.summaryValue}>{medicineSummary.summary.total_ohc_visits}</p>
              </Card>
              <Card className={styles.summaryCard}>
                <h3>Medicine Used</h3>
                <p className={styles.summaryValue}>{medicineSummary.summary.total_medicine_used}</p>
              </Card>
              <Card className={styles.summaryCard}>
                <h3>Stock Value</h3>
                <p className={styles.summaryValue}>₹{medicineSummary.summary.total_medicine_value.toLocaleString()}</p>
              </Card>
              <Card className={styles.summaryCard}>
                <h3>Low Stock Items</h3>
                <p className={styles.summaryValue}>{medicineSummary.summary.stock_summary.low_stock_items}</p>
              </Card>
            </div>

            {/* Stock Summary */}
            <Card className={styles.chartCard}>
              <h3>Stock Summary</h3>
              <div className={styles.stockSummaryGrid}>
                <div className={styles.stockItem}>
                  <span className={styles.stockLabel}>Total Items</span>
                  <span className={styles.stockValue}>{medicineSummary.summary.stock_summary.total_items}</span>
                </div>
                <div className={styles.stockItem}>
                  <span className={styles.stockLabel}>Low Stock</span>
                  <span className={`${styles.stockValue} ${styles.lowStock}`}>
                    {medicineSummary.summary.stock_summary.low_stock_items}
                  </span>
                </div>
                <div className={styles.stockItem}>
                  <span className={styles.stockLabel}>Expiring Soon</span>
                  <span className={`${styles.stockValue} ${styles.expiring}`}>
                    {medicineSummary.summary.stock_summary.expiring_items}
                  </span>
                </div>
                <div className={styles.stockItem}>
                  <span className={styles.stockLabel}>Total Value</span>
                  <span className={styles.stockValue}>
                    ₹{medicineSummary.summary.stock_summary.total_stock_value.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            {/* Monthly Medicine Reports */}
            <Card className={styles.chartCard}>
              <h3>Monthly Medicine Reports</h3>
              <div className={styles.tableContainer}>
                <table className={styles.reportsTable}>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Visits</th>
                      <th>Medicine Cost</th>
                      <th>Top Diagnoses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicineSummary.monthly_reports.map((report) => (
                      <tr key={report.month}>
                        <td>{report.month}</td>
                        <td>{report.visits}</td>
                        <td>₹{report.medicine_cost.toLocaleString()}</td>
                        <td>{report.top_diagnoses.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};