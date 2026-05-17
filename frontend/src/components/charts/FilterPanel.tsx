import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '../ui';

interface FilterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  filterCount: number;
  children: React.ReactNode;
  position?: 'left' | 'right';
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onToggle,
  onClear,
  filterCount,
  children,
  position = 'left',
}) => {
  const positionClasses = {
    left: 'left-0',
    right: 'right-0',
  };

  return (
    <div className={`relative ${position === 'left' ? 'flex' : 'flex justify-end'}`}>
      <Button
        variant={filterCount > 0 ? 'brand' : 'outline-secondary'}
        size="sm"
        onClick={onToggle}
        className="relative"
      >
        <Filter size={16} />
        Filters
        {filterCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {filterCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onToggle}
          />
          <div className={`absolute top-full mt-2 ${positionClasses[position]} z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <div className="flex items-center gap-2">
                {filterCount > 0 && (
                  <button
                    onClick={onClear}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear All
                  </button>
                )}
                <button onClick={onToggle}>
                  <X size={18} className="text-gray-500 hover:text-gray-700" />
                </button>
              </div>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {children}
            </div>

            {filterCount > 0 && (
              <div className="p-4 border-t border-gray-200">
                <Button variant="brand" size="sm" onClick={onToggle} className="w-full">
                  Apply Filters ({filterCount})
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};