import React, { useState, useEffect } from 'react';
import { Header } from '../layout';
import { Card, FormInput, Loading, Button } from '../ui';
import { getDiseaseTrends, exportAnalyticsSummary } from '../../services/reports';
import { REPORT_PERIOD_OPTIONS } from '../../utils/constants';
import { DiagnosisAreaChart, SeverityTrendChart } from '../charts';
import { transformDiseaseTrendsData } from '../../utils/charts/transformers';
import styles from './DiseaseTrends.module.css';

/**
 * Disease Trends page component
 * Display health trends and analytics
 */
export const DiseaseTrends: React.FC = () => {
  const [period, setPeriod] = useState(90);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>({
    diagnosisArea: [],
    severityTrends: [],
  });
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrends = async () => {
      setLoading(true);
      setChartError(null);
      try {
        const result = await getDiseaseTrends(period);
        const transformed = transformDiseaseTrendsData(result);
        setChartData(transformed);
      } catch (error) {
        console.error('Failed to load trends:', error);
        setChartError('Failed to load disease trends');
      } finally {
        setLoading(false);
      }
    };
    loadTrends();
  }, [period]);

  const handleExport = async () => {
    try {
      const blob = await exportAnalyticsSummary(period, 'trends');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `disease_trends_${period}days.pdf`;
      link.click();
    } catch {
      alert('Export failed');
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className={styles.diseaseTrends}>
      <Header
        title="Disease Trends"
        subtitle="Analyze health trends across organization"
        actions={
          <FormInput
            type="select"
            value={period.toString()}
            onChange={(v) => setPeriod(parseInt(v, 10))}
            options={REPORT_PERIOD_OPTIONS}
            className={styles.periodSelect}
          />
        }
      />
      <main className={styles.trendsMain}>
        {!loading && chartError && (
          <div className={styles.errorBanner}>
            <p>{chartError}</p>
            <Button variant="brand" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <Loading fullScreen />
        ) : (
          <>
            <section className={styles.chartSection}>
              <Card>
                <div className={styles.cardHeader}>
                  <h3>Diagnosis Volume Over Time</h3>
                  <Button variant="outline-secondary" size="sm" onClick={handleExport}>
                    Export PDF
                  </Button>
                </div>
                <DiagnosisAreaChart data={chartData.diagnosisArea} height={400} />
              </Card>
            </section>

            <section className={styles.chartSection}>
              <Card>
                <h3>Severity Distribution Trends</h3>
                <SeverityTrendChart data={chartData.severityTrends} height={350} />
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
};
