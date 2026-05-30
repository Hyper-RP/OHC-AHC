import React from 'react';
import { Clock } from 'lucide-react';
import { subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

interface QuickFilterPreset {
  id: string;
  label: string;
  start: Date;
  end: Date;
}

interface QuickFiltersProps {
  presets?: QuickFilterPreset[];
  activePreset: string | null;
  onSelect: (preset: QuickFilterPreset | null) => void;
  className?: string;
}

const DEFAULT_PRESETS: QuickFilterPreset[] = [
  { id: 'today', label: 'Today', start: new Date(), end: new Date() },
  { id: 'yesterday', label: 'Yesterday', start: subDays(new Date(), 1), end: subDays(new Date(), 1) },
  { id: 'this-week', label: 'This Week', start: startOfWeek(new Date()), end: endOfWeek(new Date()) },
  { id: 'last-7-days', label: 'Last 7 Days', start: subDays(new Date(), 6), end: new Date() },
  { id: 'last-14-days', label: 'Last 14 Days', start: subDays(new Date(), 13), end: new Date() },
  { id: 'last-30-days', label: 'Last 30 Days', start: subDays(new Date(), 29), end: new Date() },
  { id: 'this-month', label: 'This Month', start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
  { id: 'last-month', label: 'Last Month', start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
  { id: 'last-90-days', label: 'Last 90 Days', start: subDays(new Date(), 89), end: new Date() },
];

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  presets = DEFAULT_PRESETS,
  activePreset,
  onSelect,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock size={16} className="text-gray-500" />
      <div className="flex flex-wrap gap-1">
        {presets.map((preset) => {
          const isActive = activePreset === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => onSelect(isActive ? null : preset)}
              className={`
                px-2 py-1 text-xs rounded transition-all
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};