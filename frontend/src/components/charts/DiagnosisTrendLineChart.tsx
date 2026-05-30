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
import styles from './DiagnosisTrendLineChart.module.css';

interface DiagnosisData {
  diagnosis: string;
  data: Array<{ date: Date; count: number }>;
  color: string;
}

interface DiagnosisTrendLineChartProps {
  data: DiagnosisData[];
  loading?: boolean;
  showLegend?: boolean;
  height?: number;
}

const DIAGNOSIS_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
];

/**
 * DiagnosisTrendLineChart component
 * Multi-line chart showing top diagnoses trends
 */
export const DiagnosisTrendLineChart: React.FC<DiagnosisTrendLineChartProps> = ({
  data,
  loading = false,
  showLegend = true,
  height = 400,
}) => {
  // Transform data for Recharts
  const chartData = React.useMemo(() => {
    if (data.length === 0) return [];

    // Get all unique dates
    const allDates = new Set<string>();
    data.forEach((diagnosis) => {
      diagnosis.data.forEach((point) => {
        allDates.add(point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      });
    });

    // Create data points for each date
    const sortedDates = Array.from(allDates).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });

    return sortedDates.map((date) => {
      const point: any = { date };
      data.forEach((diagnosis) => {
        const dataPoint = diagnosis.data.find(
          (d) => d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === date
        );
        point[diagnosis.diagnosis] = dataPoint?.count || 0;
      });
      return point;
    });
  }, [data]);

  // Assign colors if not provided
  const coloredData = data.map((item, index) => ({
    ...item,
    color: item.color || DIAGNOSIS_COLORS[index % DIAGNOSIS_COLORS.length],
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipDate}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className={styles.tooltipRow}>
              <span className={styles.tooltipLabel} style={{ color: entry.color }}>
                {entry.dataKey}:
              </span>
              <span className={styles.tooltipValue}>{entry.value} cases</span>
            </p>
          ))}
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
          {showLegend && <Legend />}
          {coloredData.map((diagnosis) => (
            <Line
              key={diagnosis.diagnosis}
              type="monotone"
              dataKey={diagnosis.diagnosis}
              stroke={diagnosis.color}
              strokeWidth={2}
              dot={{ fill: diagnosis.color, strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
              name={diagnosis.diagnosis}
              animationDuration={500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
