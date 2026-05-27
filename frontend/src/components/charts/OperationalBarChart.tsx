import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import styles from './OperationalBarChart.module.css';

interface OperationalBarChartPoint {
  label: string;
  value: number;
}

interface OperationalBarChartProps {
  data: OperationalBarChartPoint[];
  color?: string;
  valueLabel?: string;
  height?: number;
}

export const OperationalBarChart: React.FC<OperationalBarChartProps> = ({
  data,
  color = '#0a5f78',
  valueLabel = 'Count',
  height = 300,
}) => {
  if (data.length === 0) {
    return (
      <div className={styles.empty} style={{ height }}>
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className={styles.chart} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 12, left: -18, bottom: 18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dce8eb" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#6b7f89"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            angle={data.length > 4 ? -12 : 0}
            textAnchor={data.length > 4 ? 'end' : 'middle'}
            height={data.length > 4 ? 56 : 32}
          />
          <YAxis
            stroke="#6b7f89"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value) => [value, valueLabel]}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid rgba(32, 85, 110, 0.12)',
              boxShadow: '0 14px 24px rgba(27, 61, 82, 0.10)',
            }}
          />
          <Bar
            dataKey="value"
            fill={color}
            radius={[8, 8, 0, 0]}
            animationDuration={500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
