import React from 'react';

interface LastUpdatedProps {
  lastUpdated: Date | null;
  isLoading?: boolean;
  showRelative?: boolean;
}

export const LastUpdated: React.FC<LastUpdatedProps> = ({
  lastUpdated,
  isLoading = false,
  showRelative = true,
}) => {
  const [relativeTime, setRelativeTime] = React.useState<string>('');

  React.useEffect(() => {
    if (!lastUpdated) return;

    const updateRelativeTime = () => {
      const now = new Date();
      const diff = now.getTime() - lastUpdated.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) {
        setRelativeTime('just now');
      } else if (minutes < 60) {
        setRelativeTime(`${minutes}m ago`);
      } else if (hours < 24) {
        setRelativeTime(`${hours}h ago`);
      } else {
        setRelativeTime(`${days}d ago`);
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 60000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  if (!lastUpdated) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Not updated yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      {showRelative && <span>Last updated: {relativeTime}</span>}
      <span className="text-gray-400">({formatDate(lastUpdated)} at {formatTime(lastUpdated)})</span>
    </div>
  );
};