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
import styles from './DepartmentComparisonChart.module.css';

interface DepartmentData {
  department: string;
  visits: number;
  employees: number;
  referrals: number;
}

interface DepartmentComparisonChartProps {
  data: DepartmentData[];
  sortBy?: 'department' | 'visits' | 'referrals';
  sortOrder?: 'asc' | 'desc';
  loading?: boolean;
  height?: number;
}

/**
 * DepartmentComparisonChart component
 * Horizontal bar chart comparing visits across departments
 */
export const DepartmentComparisonChart: React.FC<DepartmentComparisonChartProps> = ({
  data,
  sortBy = 'visits',
  sortOrder = 'desc',
  loading = false,
  height = 400,
}) => {
  // Sort data
  const sortedData = React.useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aValue = sortBy === 'department' ? a.department : a[sortBy];
      const bValue = sortBy === 'department' ? b.department : b[sortBy];
      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [data, sortBy, sortOrder]);

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
            <span className={styles.tooltipLabel}>Employees:</span>
            <span className={styles.tooltipValue}>{data.employees}</span>
          </p>
          <p className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Referrals:</span>
            <span className={styles.tooltipValue}>{data.referrals}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className={styles.skeleton} style={{ height }} />;
  }

  if (sortedData.length === 0) {
    return (
      <div className={styles.empty} style={{ height }}>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className={styles.chart} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="department"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="visits" fill="#3b82f6" name="Visits" radius={[0, 4, 4, 0]} animationDuration={500} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
