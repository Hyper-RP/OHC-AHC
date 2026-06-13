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

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      department: string;
      employees: number;
      referrals: number;
      [key: string]: string | number | boolean | undefined;
    };
  }>;
  titleLabel: string;
  dataKey: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, titleLabel, dataKey }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipTitle}>{data.department}</p>
        <p className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>{titleLabel}:</span>
          <span className={styles.tooltipValue}>{data[dataKey] ?? 0}</span>
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

interface DepartmentData {
  department: string;
  visits: number;
  employees: number;
  referrals: number;
  preamtiveCheckUps?: number;
  annualCheckup?: number;
}

interface DepartmentComparisonChartProps {
  data: DepartmentData[];
  dataKey?: 'visits' | 'referrals' | 'preamtiveCheckUps' | 'annualCheckup';
  titleLabel?: string;
  color?: string;
  sortBy?: 'department' | 'visits' | 'referrals' | 'preamtiveCheckUps' | 'annualCheckup';
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
  dataKey = 'visits',
  titleLabel = 'Visits',
  color = '#3b82f6',
  sortBy = 'visits',
  sortOrder = 'desc',
  loading = false,
  height = 400,
}) => {
  // Sort data
  const sortedData = React.useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aValue = sortBy === 'department' ? a.department : (a[sortBy] ?? 0);
      const bValue = sortBy === 'department' ? b.department : (b[sortBy] ?? 0);
      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [data, sortBy, sortOrder]);

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
          <Tooltip content={<CustomTooltip titleLabel={titleLabel} dataKey={dataKey} />} />
          <Legend />
          <Bar
            dataKey={dataKey}
            fill={color}
            name={titleLabel}
            radius={[0, 4, 4, 0]}
            animationDuration={500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
