import React from 'react';

interface LineFilterOption {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

interface LineFilterProps {
  options: LineFilterOption[];
  onChange: (id: string) => void;
  onToggleAll?: (visible: boolean) => void;
  compact?: boolean;
  className?: string;
}

export const LineFilter: React.FC<LineFilterProps> = ({
  options,
  onChange,
  onToggleAll,
  compact = false,
  className = '',
}) => {
  const allVisible = options.every((o) => o.visible);
  const anyVisible = options.some((o) => o.visible);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {onToggleAll && (
        <button
          onClick={() => onToggleAll(!allVisible)}
          className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        >
          {allVisible ? 'Hide All' : 'Show All'}
        </button>
      )}

      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-all
            ${option.visible
              ? 'bg-gray-100 text-gray-900'
              : 'bg-gray-50 text-gray-400 line-through'}
          `}
          style={{
            borderColor: option.color,
            borderWidth: compact ? '1px' : '0',
          }}
        >
          <div
            className={`w-3 h-3 rounded-full ${option.visible ? '' : 'opacity-50'}`}
            style={{ backgroundColor: option.color }}
          />
          <span>{option.name}</span>
        </button>
      ))}

      {!anyVisible && (
        <span className="text-xs text-gray-500 italic">No lines visible</span>
      )}
    </div>
  );
};