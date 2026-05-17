import React from 'react';

interface DrillDownTooltipProps {
  active: boolean;
  payload?: Array<{
    name: string;
    value: number;
    dataKey: string;
    color: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  onDrillDown?: (data: Record<string, unknown>) => void;
  customContent?: (props: DrillDownTooltipProps) => React.ReactNode;
}

export const DrillDownTooltip: React.FC<DrillDownTooltipProps> = ({
  active,
  payload = [],
  label,
  onDrillDown,
  customContent,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  if (customContent) {
    return customContent({ active, payload, label, onDrillDown });
  }

  const mainData = payload[0];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[200px]">
      {label && (
        <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
      )}

      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.name}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>

      {mainData?.payload && Object.keys(mainData.payload).length > 2 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <details>
            <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
              View Details
            </summary>
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              {Object.entries(mainData.payload)
                .filter(([key]) => key !== 'name' && key !== 'value' && key !== 'fill')
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
            </div>
          </details>
        </div>
      )}

      {onDrillDown && mainData?.payload && (
        <button
          onClick={() => onDrillDown(mainData.payload!)}
          className="mt-3 w-full py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
        >
          Drill Down →
        </button>
      )}
    </div>
  );
};