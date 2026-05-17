import React from 'react';
import { Calendar, X } from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface DateRangeFilterProps {
  start: Date | null;
  end: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  presets?: Array<{
    label: string;
    start: Date;
    end: Date;
  }>;
}

const DEFAULT_PRESETS = [
  { label: 'Today', start: new Date(), end: new Date() },
  { label: 'Last 7 days', start: subDays(new Date(), 6), end: new Date() },
  { label: 'Last 30 days', start: subDays(new Date(), 29), end: new Date() },
  { label: 'Last 90 days', start: subDays(new Date(), 89), end: new Date() },
  { label: 'This month', start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
  { label: 'Last month', start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  start,
  end,
  onChange,
  presets = DEFAULT_PRESETS,
}) => {
  const [startInput, setStartInput] = React.useState(
    start ? format(start, 'yyyy-MM-dd') : ''
  );
  const [endInput, setEndInput] = React.useState(
    end ? format(end, 'yyyy-MM-dd') : ''
  );

  const handleStartChange = (value: string) => {
    setStartInput(value);
    if (value) {
      const newStart = new Date(value);
      onChange(newStart, end);
    } else {
      onChange(null, end);
    }
  };

  const handleEndChange = (value: string) => {
    setEndInput(value);
    if (value) {
      const newEnd = new Date(value);
      onChange(start, newEnd);
    } else {
      onChange(start, null);
    }
  };

  const handlePresetClick = (preset: typeof presets[0]) => {
    onChange(preset.start, preset.end);
    setStartInput(format(preset.start, 'yyyy-MM-dd'));
    setEndInput(format(preset.end, 'yyyy-MM-dd'));
  };

  const handleClear = () => {
    onChange(null, null);
    setStartInput('');
    setEndInput('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Date Range</span>
        {start && <button onClick={handleClear}><X size={14} className="text-gray-400 hover:text-gray-600" /></button>}
      </div>

      <div className="space-y-2">
        <label className="text-xs text-gray-500">From</label>
        <input
          type="date"
          value={startInput}
          onChange={(e) => handleStartChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-gray-500">To</label>
        <input
          type="date"
          value={endInput}
          onChange={(e) => handleEndChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="pt-2 border-t border-gray-200">
        <label className="text-xs text-gray-500 mb-2 block">Quick presets</label>
        <div className="flex flex-wrap gap-1">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => handlePresetClick(preset)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};