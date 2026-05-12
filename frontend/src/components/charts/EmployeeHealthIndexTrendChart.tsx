import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { HealthIndexTrendData } from '../../utils/charts/employee-health-transformers';
import styles from './EmployeeHealthIndexTrendChart.module.css';

interface EmployeeHealthIndexTrendChartProps {
  data: HealthIndexTrendData[];
  height?: number;
  loading?: boolean;
}

export const EmployeeHealthIndexTrendChart: React.FC<EmployeeHealthIndexTrendChartProps> = ({
  data,
  height = 300,
  loading = false,
}) => {
  if (loading) {
    return <div className={styles.skeleton} style={{ height }} />;
  }

  if (data.length === 0) {
    return (
      <div className={styles.empty} style={{ height }}>
        <p>No health index data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const statusLabel = item.status === 'good' ? 'Excellent' : item.status === 'warning' ? 'Good' : 'Needs Attention';
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipDate}>{item.date}</p>
          <p className={styles.tooltipScore}>Health Index: {item.healthIndex}</p>
          <p className={`${styles.tooltipStatus} ${styles[item.status]}`}>{statusLabel}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartContainer} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="healthIndex"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={0.3}
            fill="#3b82f6"
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
