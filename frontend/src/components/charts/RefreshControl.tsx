import React from 'react';
import { Button } from '../ui';
import { RefreshCw } from 'lucide-react';

interface RefreshControlProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const RefreshControl: React.FC<RefreshControlProps> = ({
  onRefresh,
  isRefreshing = false,
  disabled = false,
  size = 'sm',
  label = 'Refresh',
}) => {
  return (
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
  );
};