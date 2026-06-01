import React from 'react';
import { Button } from '../ui';
import { RefreshCw } from 'lucide-react';

interface RefreshControlProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  lastUpdated?: Date | null;
}

export const RefreshControl: React.FC<RefreshControlProps> = ({
  onRefresh,
  isRefreshing = false,
  disabled = false,
  size = 'sm',
  label = 'Refresh',
  lastUpdated,
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline-secondary"
        size={size}
        onClick={onRefresh}
        disabled={disabled || isRefreshing}
        className="flex items-center gap-2"
      >
        <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={16} />
        {label}
      </Button>
      {lastUpdated && (
        <span className="text-sm text-gray-500">
          Last updated: {formatTime(lastUpdated)}
        </span>
      )}
    </div>
  );
};