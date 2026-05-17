/**
 * Chart Test Helper
 *
 * Utility for rendering chart components with explicit dimensions in tests.
 * Recharts ResponsiveContainer requires explicit width/height in test environment.
 */

import React from 'react';

export const ChartTestWrapper: React.FC<{ children: React.ReactNode; width?: number; height?: number }> = ({
  children,
  width = 400,
  height = 300,
}) => {
  return <div style={{ width: `${width}px`, height: `${height}px` }}>{children}</div>;
};

export const defaultChartDimensions = { width: 400, height: 300 };