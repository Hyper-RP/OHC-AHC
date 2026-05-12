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
  Cell,
} from 'recharts';
import type { VisitTypeData } from '../../utils/charts/employee-health-transformers';
import styles from './EmployeeVisitTypeChart.module.css';

const VISIT_TYPE_COLORS: Record<string, string> = {
  Routine: '#3b82f6',
  'Walk-in': '#10b981',
  'Follow-up': '#f59e0b',
} as const;

interface EmployeeVisitTypeChartProps {
  data: VisitTypeData[];
  height?: number;
  loading?: boolean;
}

export const EmployeeVisitTypeChart: React.FC<EmployeeVisitTypeChartProps> = ({
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
        <p>No visit type data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipType}>{item.type}</p>
          <p className={styles.tooltipCount}>{item.count} visits</p>
          <p className={styles.tooltipPercentage}>{item.percentage}%</p>
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
            dataKey="type"
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
          <Bar dataKey="count" name="Visits" animationDuration={500}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={VISIT_TYPE_COLORS[entry.type]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
