import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import styles from './VisitTrendsChart.module.css';

interface VisitTrendData {
  date: Date;
  count: number;
}

interface VisitTrendsChartProps {
  data: VisitTrendData[];
  loading?: boolean;
  height?: number;
}

/**
 * VisitTrendsChart component
 * Line chart showing daily/monthly visit trends
 */
export const VisitTrendsChart: React.FC<VisitTrendsChartProps> = ({
  data,
  loading = false,
  height = 400,
}) => {
  // Format data for Recharts
  const chartData = data.map((item) => ({
    date: item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: item.count,
    fullDate: item.date.toISOString(),
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipDate}>{data.fullDate}</p>
          <p className={styles.tooltipValue}>{data.count} visits</p>
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
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="Visits"
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
