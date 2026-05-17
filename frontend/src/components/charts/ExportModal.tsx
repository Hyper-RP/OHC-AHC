import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '../ui';
import type { ExportFormat } from '../../hooks/useExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, options: ExportOptions) => void;
  isExporting: boolean;
  progress: number;
}

interface ExportOptions {
  quality: number;
  includeTitle: boolean;
  includeLegend: boolean;
  backgroundColor: string;
}

const FORMAT_OPTIONS: Array<{ value: ExportFormat; label: string; description: string }> = [
  { value: 'png', label: 'PNG Image', description: 'Best for presentations and documents' },
  { value: 'svg', label: 'SVG Image', description: 'Scalable vector format' },
  { value: 'pdf', label: 'PDF Document', description: 'Print-ready document' },
  { value: 'csv', label: 'CSV Data', description: 'Raw data in spreadsheet format' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  isExporting,
  progress,
}) => {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [options, setOptions] = useState<ExportOptions>({
    quality: 2,
    includeTitle: true,
    includeLegend: true,
    backgroundColor: '#ffffff',
  });

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(format, options);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Export Chart</h3>
          <button onClick={onClose} disabled={isExporting}>
            <X size={20} className="text-gray-500 hover:text-gray-700 disabled:opacity-50" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormat(opt.value)}
                  disabled={isExporting}
                  className={`
                    p-3 rounded-lg border-2 text-left transition-all
                    ${format === opt.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                    disabled:opacity-50
                  `}
                >
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {format !== 'csv' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality: {options.quality}x
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.5"
                  value={options.quality}
                  onChange={(e) => setOptions({ ...options, quality: parseFloat(e.target.value) })}
                  disabled={isExporting}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.includeTitle}
                    onChange={(e) => setOptions({ ...options, includeTitle: e.target.checked })}
                    disabled={isExporting}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Include chart title</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.includeLegend}
                    onChange={(e) => setOptions({ ...options, includeLegend: e.target.checked })}
                    disabled={isExporting}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Include legend</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={options.backgroundColor}
                    onChange={(e) => setOptions({ ...options, backgroundColor: e.target.value })}
                    disabled={isExporting}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={options.backgroundColor}
                    onChange={(e) => setOptions({ ...options, backgroundColor: e.target.value })}
                    disabled={isExporting}
                    className="flex-1 px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Exporting...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t border-gray-200">
          <Button
            variant="outline-secondary"
            onClick={onClose}
            disabled={isExporting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="brand"
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1"
          >
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};