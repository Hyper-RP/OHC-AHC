import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DiagnosisDistributionData } from '../../utils/charts/employee-health-transformers';
import styles from './EmployeeDiagnosisDonutChart.module.css';

interface EmployeeDiagnosisDonutChartProps {
  data: DiagnosisDistributionData[];
  height?: number;
  maxItems?: number;
  loading?: boolean;
}

export const EmployeeDiagnosisDonutChart: React.FC<EmployeeDiagnosisDonutChartProps> = ({
  data,
  height = 300,
  maxItems = 5,
  loading = false,
}) => {
  if (loading) {
    return <div className={styles.skeleton} style={{ height }} />;
  }

  if (data.length === 0) {
    return (
      <div className={styles.empty} style={{ height }}>
        <p>No diagnosis data available</p>
      </div>
    );
  }

  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipDiagnosis}>{item.name}</p>
          <p className={styles.tooltipCount}>{item.count} cases</p>
          <p className={styles.tooltipPercentage}>{item.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ viewBox }: any) => {
    const { cx, cy } = viewBox;
    return (
      <text x={cx} y={cy} dy={-10} textAnchor="middle" className={styles.centerLabel}>
        {totalCount}
      </text>
    );
  };

  return (
    <div className={styles.chartContainer} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            innerRadius={60}
            paddingAngle={5}
            dataKey="count"
            name="Diagnosis"
            animationDuration={500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
