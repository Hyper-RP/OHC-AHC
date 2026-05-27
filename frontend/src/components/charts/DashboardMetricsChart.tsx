import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
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
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
          <defs>
            <linearGradient id={`dashboard-metric-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.38} />
              <stop offset="95%" stopColor={color} stopOpacity={0.04} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey={dataKey}
            name={label}
            stroke={color}
            strokeWidth={3}
            fill={`url(#dashboard-metric-${dataKey})`}
            dot={{ r: 4, fill: color, stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: color, stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
