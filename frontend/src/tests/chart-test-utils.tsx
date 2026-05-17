import React from 'react';

// Create a mock wrapper for Recharts components that causes timeout issues
export const MockResponsiveContainer: React.FC<{ children: React.ReactNode; width?: string | number; height?: string | number }> = ({
  children,
  width = '100%',
  height = '100%',
}) => (
  <div style={{ width, height }} data-testid="recharts-responsive-container">
    {children}
  </div>
);

// Mock PieChart
export const MockPieChart: React.FC<{ children: React.ReactNode; data?: any[]; margin?: any }> = ({ children }) => (
  <svg data-testid="recharts-pie-chart">{children}</svg>
);

// Mock Pie
export const MockPie: React.FC<{
  children?: React.ReactNode;
  data?: any[];
  cx?: string | number;
  cy?: string | number;
  labelLine?: boolean;
  label?: any;
  outerRadius?: number;
  innerRadius?: number;
  paddingAngle?: number;
  dataKey?: string;
  name?: string;
}> = ({ children, data, label }) => {
  // Only render children if data exists (simplifies testing)
  return (
    <g data-testid="recharts-pie" data-has-data={data && data.length > 0}>
      {children}
      {/* If label is a component and has data, call it */}
      {label && data && data.length > 0 && React.createElement(label, { viewBox: { cx: 200, cy: 200 } })}
    </g>
  );
};

// Mock Cell
export const MockCell: React.FC<{ fill?: string; key?: string }> = ({ fill }) => (
  <circle r="10" fill={fill} data-testid="recharts-cell" />
);

// Mock BarChart
export const MockBarChart: React.FC<{ children: React.ReactNode; data?: any[]; margin?: any }> = ({ children }) => (
  <svg data-testid="recharts-bar-chart">{children}</svg>
);

// Mock Bar
export const MockBar: React.FC<{ children?: React.ReactNode; dataKey?: string; name?: string; fill?: string }> = ({ children }) => (
  <g data-testid="recharts-bar">{children}</g>
);

// Mock LineChart
export const MockLineChart: React.FC<{ children: React.ReactNode; data?: any[]; margin?: any }> = ({ children }) => (
  <svg data-testid="recharts-line-chart">{children}</svg>
);

// Mock Line
export const MockLine: React.FC<{ dataKey?: string; stroke?: string; strokeWidth?: number; name?: string }> = () => (
  <path data-testid="recharts-line" d="M0,0 L100,100" />
);

// Mock AreaChart
export const MockAreaChart: React.FC<{ children: React.ReactNode; data?: any[]; margin?: any }> = ({ children }) => (
  <svg data-testid="recharts-area-chart">{children}</svg>
);

// Mock Area
export const MockArea: React.FC<{ dataKey?: string; stroke?: string; fill?: string }> = () => (
  <path data-testid="recharts-area" d="M0,100 L100,0 L100,100 Z" />
);

// Mock XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ReferenceLine
export const MockXAxis: React.FC<any> = () => <g data-testid="recharts-x-axis" />;
export const MockYAxis: React.FC<any> = () => <g data-testid="recharts-y-axis" />;
export const MockCartesianGrid: React.FC<any> = () => <g data-testid="recharts-cartesian-grid" />;
export const MockTooltip: React.FC<any> = () => <g data-testid="recharts-tooltip" />;
export const MockLegend: React.FC<any> = () => <g data-testid="recharts-legend" />;
export const MockReferenceLine: React.FC<any> = () => <line data-testid="recharts-reference-line" x1="0" y1="60" x2="100" y2="60" />;

// Helper to wrap chart tests with Recharts mocks
export function withMockedRecharts<T extends React.FC<any>>(Component: T): T {
  return ((props: any) => {
    // For tests that don't have data (loading/empty states), render normally
    if (props.loading || (Array.isArray(props.data) && props.data.length === 0)) {
      return React.createElement(Component, props);
    }
    // For tests with data, also render normally but the test setup has mocked Recharts
    return React.createElement(Component, props);
  }) as T;
}