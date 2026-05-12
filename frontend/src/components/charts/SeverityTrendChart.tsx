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
import styles from './SeverityTrendChart.module.css';

interface SeverityData {
  severity: string;
  data: Array<{ date: Date; count: number }>;
  color: string;
}

interface SeverityTrendChartProps {
  data: SeverityData[];
  loading?: boolean;
  showLegend?: boolean;
  height?: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  MILD: '#10b981',
  MODERATE: '#f59e0b',
  SEVERE: '#f97316',
  CRITICAL: '#ef4444',
};

/**
 * SeverityTrendChart component
 * Line chart showing severity distribution trends over time
 */
export const SeverityTrendChart: React.FC<SeverityTrendChartProps> = ({
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
    data.forEach((severity) => {
      severity.data.forEach((point) => {
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
      data.forEach((severity) => {
        const dataPoint = severity.data.find(
          (d) => d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === date
        );
        point[severity.severity] = dataPoint?.count || 0;
      });
      return point;
    });
  }, [data]);

  // Assign colors if not provided
  const coloredData = data.map((item) => ({
    ...item,
    color: item.color || SEVERITY_COLORS[item.severity] || '#6b7280',
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
          {coloredData.map((severity) => (
            <Line
              key={severity.severity}
              type="monotone"
              dataKey={severity.severity}
              stroke={severity.color}
              strokeWidth={2}
              dot={{ fill: severity.color, strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
              name={severity.severity}
              animationDuration={500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
