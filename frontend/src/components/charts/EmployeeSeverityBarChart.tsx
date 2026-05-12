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
import type { SeverityBreakdownData } from '../../utils/charts/employee-health-transformers';
import styles from './EmployeeSeverityBarChart.module.css';

interface EmployeeSeverityBarChartProps {
  data: SeverityBreakdownData[];
  height?: number;
  loading?: boolean;
}

export const EmployeeSeverityBarChart: React.FC<EmployeeSeverityBarChartProps> = ({
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
        <p>No severity data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipSeverity}>{item.severity}</p>
          <p className={styles.tooltipCount}>{item.count} cases</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartContainer} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="severity"
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
          <Bar dataKey="count" name="Cases" animationDuration={500}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
