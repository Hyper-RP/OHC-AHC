import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import styles from './SeverityPieChart.module.css';

interface SeverityData {
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  count: number;
  color: string;
  percentage?: number;
}

interface SeverityPieChartProps {
  data: SeverityData[];
  loading?: boolean;
  showTotal?: boolean;
  height?: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  MILD: '#10b981',
  MODERATE: '#f59e0b',
  SEVERE: '#f97316',
  CRITICAL: '#ef4444',
};

/**
 * SeverityPieChart component
 * Donut/pie chart showing disease severity breakdown
 */
export const SeverityPieChart: React.FC<SeverityPieChartProps> = ({
  data,
  loading = false,
  showTotal = true,
  height = 400,
}) => {
  // Calculate total
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Prepare chart data with colors
  const chartData = data.map((item) => ({
    name: item.severity,
    value: item.count,
    color: item.color || SEVERITY_COLORS[item.severity],
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipSeverity}>{data.name}</p>
          <p className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Count:</span>
            <span className={styles.tooltipValue}>{data.value}</span>
          </p>
          <p className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Percentage:</span>
            <span className={styles.tooltipValue}>{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for center of donut
  const renderCenterText = () => {
    if (!showTotal) return null;
    return (
      <div className={styles.centerText}>
        <p className={styles.centerLabel}>Total</p>
        <p className={styles.centerValue}>{total}</p>
      </div>
    );
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
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({
              cx,
              cy,
              midAngle,
              innerRadius,
              outerRadius,
              percent,
            }: any) => {
              const RADIAN = Math.PI / 180;
              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);

              if (percent < 0.05) return null; // Don't show label for small slices

              return (
                <text
                  x={x}
                  y={y}
                  fill="white"
                  textAnchor={x > cx ? 'start' : 'end'}
                  dominantBaseline="central"
                  fontSize={12}
                  fontWeight={500}
                >
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              );
            }}
            animationDuration={500}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
        {renderCenterText()}
      </ResponsiveContainer>
    </div>
  );
};
