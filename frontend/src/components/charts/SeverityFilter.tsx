import React from 'react';
import type { Severity } from '../../types';

interface SeverityFilterProps {
  selected: Severity[];
  onChange: (selected: Severity[]) => void;
  showCount?: boolean;
  severityCounts?: Partial<Record<Severity, number>>;
}

const SEVERITY_INFO: Record<Severity, { label: string; color: string; bgColor: string }> = {
  MILD: { label: 'Mild', color: '#10b981', bgColor: '#d1fae5' },
  MODERATE: { label: 'Moderate', color: '#f59e0b', bgColor: '#fef3c7' },
  SERIOUS: { label: 'Serious', color: '#f97316', bgColor: '#ffedd5' },
  CRITICAL: { label: 'Critical', color: '#ef4444', bgColor: '#fee2e2' },
};

export const SeverityFilter: React.FC<SeverityFilterProps> = ({
  selected,
  onChange,
  showCount = false,
  severityCounts,
}) => {
  const toggleSeverity = (severity: Severity) => {
    const newSelected = selected.includes(severity)
      ? selected.filter((s) => s !== severity)
      : [...selected, severity];
    onChange(newSelected);
  };

  const toggleAll = () => {
    if (selected.length === Object.keys(SEVERITY_INFO).length) {
      onChange([]);
    } else {
      onChange(Object.keys(SEVERITY_INFO) as Severity[]);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={toggleAll}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        {selected.length === 4 ? 'Deselect All' : 'Select All'}
      </button>

      <div className="space-y-2">
        {(Object.keys(SEVERITY_INFO) as Severity[]).map((severity) => {
          const info = SEVERITY_INFO[severity];
          const count = severityCounts?.[severity];
          const isSelected = selected.includes(severity);

          return (
            <label
              key={severity}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              style={{ borderColor: info.color }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSeverity(severity)}
                className="w-4 h-4 rounded focus:ring-blue-500"
              />
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: info.color }}
              />
              <span className="text-sm font-medium text-gray-700">{info.label}</span>
              {showCount && count !== undefined && (
                <span className="ml-auto text-sm text-gray-500">{count}</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
};