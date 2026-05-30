import React from 'react';

interface LoadingIndicatorProps {
  visible: boolean;
  message?: string;
  position?: 'top' | 'bottom' | 'inline';
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  visible,
  message = 'Updating data...',
  position = 'bottom',
}) => {
  if (!visible) return null;

  const positionClasses = {
    top: 'absolute top-2 right-2',
    bottom: 'absolute bottom-2 right-2',
    inline: 'inline-flex',
  };

  return (
    <div className={`flex items-center gap-2 ${positionClasses[position]} bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm`}>
      <div className="relative">
        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <span className="text-xs text-gray-600">{message}</span>
    </div>
  );
};