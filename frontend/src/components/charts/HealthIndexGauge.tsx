import React from 'react';
import styles from './HealthIndexGauge.module.css';

interface HealthIndexData {
  department: string;
  healthIndex: number;
  visits: number;
  referrals: number;
  unfit: number;
  employees: number;
}

interface HealthIndexGaugeProps {
  data: HealthIndexData;
  size?: number;
  showLabel?: boolean;
  animate?: boolean;
}

/**
 * HealthIndexGauge component
 * Custom gauge/meter showing health index (0-100%)
 */
export const HealthIndexGauge: React.FC<HealthIndexGaugeProps> = ({
  data,
  size = 180,
  showLabel = true,
  animate = true,
}) => {
  const [animatedIndex, setAnimatedIndex] = React.useState(0);

  React.useEffect(() => {
    if (animate) {
      const duration = 1000;
      const start = 0;
      const end = data.healthIndex;
      const startTime = performance.now();

      const animateValue = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setAnimatedIndex(start + (end - start) * easeOutQuart);

        if (progress < 1) {
          requestAnimationFrame(animateValue);
        }
      };

      requestAnimationFrame(animateValue);
    } else {
      setAnimatedIndex(data.healthIndex);
    }
  }, [data.healthIndex, animate]);

  // Determine color based on health index
  const getColor = (index: number) => {
    if (index >= 80) return '#10b981'; // Green
    if (index >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const color = getColor(animatedIndex);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedIndex / 100) * circumference;

  return (
    <div className={styles.gaugeContainer} style={{ width: size, height: size }}>
      <svg width={size} height={size} className={styles.gauge}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={12}
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={styles.progressCircle}
        />

        {/* Center text */}
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className={styles.centerText}>
          <tspan x="50%" dy="-0.3em" className={styles.percentage}>
            {Math.round(animatedIndex)}%
          </tspan>
          {showLabel && (
            <tspan x="50%" dy="1.2em" className={styles.label}>
              Health
            </tspan>
          )}
        </text>
      </svg>

      {/* Tooltip with details */}
      <div className={styles.tooltip}>
        <p className={styles.tooltipTitle}>{data.department}</p>
        <div className={styles.tooltipDetails}>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Employees:</span>
            <span className={styles.tooltipValue}>{data.employees}</span>
          </div>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Visits:</span>
            <span className={styles.tooltipValue}>{data.visits}</span>
          </div>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Referrals:</span>
            <span className={styles.tooltipValue}>{data.referrals}</span>
          </div>
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Unfit:</span>
            <span className={styles.tooltipValue}>{data.unfit}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
