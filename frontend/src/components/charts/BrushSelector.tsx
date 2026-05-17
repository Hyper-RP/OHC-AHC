import React from 'react';
import { Brush, CartesianGrid, XAxis } from 'recharts';

interface BrushSelectorProps {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  startIndex?: number;
  endIndex?: number;
  onChange?: (start: number, end: number) => void;
  height?: number;
  className?: string;
}

export const BrushSelector: React.FC<BrushSelectorProps> = ({
  data,
  dataKey,
  startIndex,
  endIndex,
  onChange,
  height = 100,
  className = '',
}) => {
  if (!data || data.length === 0) return null;

  const handleChange = (brushData: any) => {
    if (brushData?.startIndex !== undefined && brushData?.endIndex !== undefined) {
      onChange?.(brushData.startIndex, brushData.endIndex);
    }
  };

  return (
    <div className={className} style={{ height }}>
      <Brush
        dataKey={dataKey}
        height={height}
        stroke="#3b82f6"
        fill="#3b82f6"
        fillOpacity={0.1}
        travellerWidth={10}
        onChange={handleChange}
        startIndex={startIndex}
        endIndex={endIndex}
      />
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis
        dataKey={dataKey}
        tick={false}
        axisLine={false}
        tickLine={false}
      />
    </div>
  );
};