import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import styles from './VisitsReferralsStackedBar.module.css';

interface VisitsReferralsData {
  department: string;
  visits: number;
  referrals: number;
}

interface VisitsReferralsStackedBarProps {
  data: VisitsReferralsData[];
  loading?: boolean;
  height?: number;
}

/**
 * VisitsReferralsStackedBar component
 * Stacked bar chart showing visits vs referrals per department
 */
export const VisitsReferralsStackedBar: React.FC<VisitsReferralsStackedBarProps> = ({
  data,
  loading = false,
  height = 400,
}) => {
  // Calculate referral rate for each department
  const chartData = data.map((item) => ({
    ...item,
    referralRate: item.visits > 0 ? ((item.referrals / item.visits) * 100).toFixed(1) : 0,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipTitle}>{data.department}</p>
          <p className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Visits:</span>
            <span className={styles.tooltipValue}>{data.visits}</span>
          </p>
          <p className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Referrals:</span>
            <span className={styles.tooltipValue}>{data.referrals}</span>
          </p>
          <p className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Referral Rate:</span>
            <span className={styles.tooltipValue}>{data.referralRate}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className={styles.skeleton} style={{ height }} />;
  }

  if (chartData.length === 0) {
    return (
      <div className={styles.empty} style={{ height }}>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className={styles.chart} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="department"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="visits"
            fill="#3b82f6"
            name="Visits"
            radius={[0, 0, 0, 0]}
            animationDuration={500}
          />
          <Bar
            dataKey="referrals"
            fill="#f59e0b"
            name="Referrals"
            radius={[4, 4, 0, 0]}
            animationDuration={500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
