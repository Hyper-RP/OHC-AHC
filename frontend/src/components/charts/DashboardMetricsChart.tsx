import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import styles from './DashboardMetricsChart.module.css';

export interface DashboardMetricsPoint {
  period: string;
  ohcVisits: number;
  preamtiveCheckUps: number;
  annualCheckup: number;
  emergencyCount: number;
  incidentCount: number;
}

interface DashboardMetricsChartProps {
  data: DashboardMetricsPoint[];
  dataKey:
    | 'ohcVisits'
    | 'preamtiveCheckUps'
    | 'annualCheckup'
    | 'emergencyCount'
    | 'incidentCount';
  color: string;
  label: string;
  height?: number;
}

/**
 * DashboardMetricsChart component
 * Single-series trend chart for an individual dashboard metric
 */
export const DashboardMetricsChart: React.FC<DashboardMetricsChartProps> = ({
  data,
  dataKey,
  color,
  label,
  height = 280,
}) => {
  return (
    <div className={styles.chart} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 8 }} barGap={10}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dce8eb" vertical={false} />
          <XAxis
            dataKey="period"
            stroke="#6b7f89"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7f89"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value) => [value, label]}
            cursor={{ stroke: color, strokeDasharray: '4 4' }}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid rgba(32, 85, 110, 0.12)',
              boxShadow: '0 14px 24px rgba(27, 61, 82, 0.10)',
            }}
          />
          <Bar
            dataKey={dataKey}
            name={label}
            fill={color}
            radius={[10, 10, 0, 0]}
            maxBarSize={48}
          >
            {data.map((entry) => (
              <Cell
                key={`${entry.period}-${dataKey}`}
                fill={color}
                fillOpacity={entry[dataKey] === 0 ? 0.32 : 0.95}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
