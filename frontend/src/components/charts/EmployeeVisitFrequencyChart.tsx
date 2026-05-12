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
import type { VisitFrequencyData } from '../../utils/charts/employee-health-transformers';
import styles from './EmployeeVisitFrequencyChart.module.css';

interface EmployeeVisitFrequencyChartProps {
  data: VisitFrequencyData[];
  height?: number;
  loading?: boolean;
}

export const EmployeeVisitFrequencyChart: React.FC<EmployeeVisitFrequencyChartProps> = ({
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
        <p>No visit data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipDate}>{item.date}</p>
          <p className={styles.tooltipValue}>{item.count} visits</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartContainer} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
