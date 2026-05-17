import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '../ui';

interface ZoomControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  canZoomIn?: boolean;
  canZoomOut?: boolean;
  zoomLevel?: number;
  showZoomLevel?: boolean;
  disabled?: boolean;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  canZoomIn = true,
  canZoomOut = true,
  zoomLevel = 100,
  showZoomLevel = true,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 shadow-sm p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomOut}
        disabled={disabled || !canZoomOut || !onZoomOut}
        className="w-8 h-8 p-0"
      >
        <ZoomOut size={16} />
      </Button>

      {showZoomLevel && (
        <div className="px-2 text-xs font-medium text-gray-600 min-w-[45px] text-center">
          {zoomLevel}%
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomIn}
        disabled={disabled || !canZoomIn || !onZoomIn}
        className="w-8 h-8 p-0"
      >
        <ZoomIn size={16} />
      </Button>

      {onReset && (
        <div className="w-px h-6 bg-gray-200 mx-1" />
      )}

      {onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={disabled}
          className="w-8 h-8 p-0"
        >
          <Maximize2 size={16} />
        </Button>
      )}
    </div>
  );
};