import React, { useEffect, useRef } from 'react';
import styles from './HealthScoreGauge.module.css';

interface HealthScoreGaugeProps {
  score: number;
  size?: number;
  showLabel?: boolean;
  animate?: boolean;
}

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({
  score,
  size = 150,
  showLabel = true,
  animate = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!animate || !circleRef.current) return;

    const circle = circleRef.current;
    const circumference = 2 * Math.PI * (size / 2 - 10);

    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    const offset = circumference - (score / 100) * circumference;
    const duration = 1000;

    circle.style.transition = `stroke-dashoffset ${duration}ms ease-out`;
    setTimeout(() => {
      circle.style.strokeDashoffset = `${offset}`;
    }, 100);
  }, [score, size, animate]);

  const circumference = 2 * Math.PI * (size / 2 - 10);
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = (s: number): string => {
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const scoreColor = getScoreColor(score);
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <div className={styles.gaugeContainer} style={{ width: size, height: size }}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={styles.gauge}
        role="img"
        aria-label={`Health score: ${score} out of 100`}
      >
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={10}
        />

        {/* Score circle */}
        <circle
          ref={circleRef}
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke={scoreColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : offset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: `${centerX}px ${centerY}px`,
          }}
        />

        {/* Zone markers */}
        <path
          d={`M ${centerX} ${centerY - radius} L ${centerX} ${centerY}`}
          stroke="#e5e7eb"
          strokeWidth={2}
        />
      </svg>

      {showLabel && (
        <div className={styles.scoreLabel} style={{ color: scoreColor }}>
          <span className={styles.scoreValue}>{score}</span>
          <span className={styles.scoreMax}>/100</span>
        </div>
      )}

      <div className={styles.tooltip}>
        <div className={styles.tooltipText}>
          {score >= 80 && 'Excellent health'}
          {score >= 60 && score < 80 && 'Good health'}
          {score < 60 && 'Needs attention'}
        </div>
      </div>
    </div>
  );
};
