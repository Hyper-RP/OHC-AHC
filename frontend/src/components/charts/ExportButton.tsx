import React, { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { Button } from '../ui';
import type { ExportFormat } from '../../hooks/useExport';

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void;
  isExporting: boolean;
  availableFormats?: ExportFormat[];
  label?: string;
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  png: 'PNG Image',
  svg: 'SVG Image',
  pdf: 'PDF Document',
  csv: 'CSV Data',
};

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  isExporting,
  availableFormats = ['png', 'svg', 'pdf'],
  label = 'Export',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={() => !isExporting && setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2"
      >
        <Download size={16} />
        {label}
        <ChevronDown size={14} />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1">
            {availableFormats.map((format) => (
              <button
                key={format}
                onClick={() => {
                  onExport(format);
                  setIsOpen(false);
                }}
                disabled={isExporting}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
              >
                <span>{FORMAT_LABELS[format]}</span>
                {isExporting && <span className="text-xs text-gray-500">...</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};