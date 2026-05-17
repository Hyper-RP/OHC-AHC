import React from 'react';
import { Switch } from '../ui';

interface AutoRefreshToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  interval?: number;
  onIntervalChange?: (interval: number) => void;
  disabled?: boolean;
  label?: string;
}

const INTERVAL_OPTIONS = [
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 300, label: '5m' },
  { value: 600, label: '10m' },
];

export const AutoRefreshToggle: React.FC<AutoRefreshToggleProps> = ({
  enabled,
  onToggle,
  interval = 60,
  onIntervalChange,
  disabled = false,
  label = 'Auto-refresh',
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Switch checked={enabled} onCheckedChange={onToggle} disabled={disabled} />
        <span className="text-sm text-gray-700">{label}</span>
      </div>

      {enabled && onIntervalChange && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Interval:</span>
          <select
            value={interval}
            onChange={(e) => onIntervalChange(Number(e.target.value))}
            disabled={disabled}
            className="text-sm border rounded px-2 py-1"
          >
            {INTERVAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};