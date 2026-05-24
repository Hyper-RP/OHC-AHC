import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreEmploymentStatisticsCard } from '../PreEmploymentStatisticsCard';

describe('PreEmploymentStatisticsCard', () => {
  const mockStatistics = {
    total_checks: 48,
    fit_count: 45,
    unfit_count: 3,
    fit_rate: 93.75,
    today_count: 2,
  };

  describe('Loading State', () => {
    it('should display loading skeleton when loading is true', () => {
      render(<PreEmploymentStatisticsCard statistics={null} loading={true} />);
      const skeleton = document.querySelector('.skeleton');
      expect(skeleton).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display pre-employment header', () => {
      render(<PreEmploymentStatisticsCard statistics={mockStatistics} loading={false} />);

      expect(screen.getByText('🩺 Pre-Employment Checkups')).toBeInTheDocument();
      expect(screen.getByText('Today: 2')).toBeInTheDocument();
    });

    it('should display total checks', () => {
      render(<PreEmploymentStatisticsCard statistics={mockStatistics} loading={false} />);

      expect(screen.getByText('Total Checks')).toBeInTheDocument();
      expect(screen.getByText('48')).toBeInTheDocument();
    });

    it('should display fit and unfit counts', () => {
      render(<PreEmploymentStatisticsCard statistics={mockStatistics} loading={false} />);

      expect(screen.getByText('Fit')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('Unfit')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display fit rate', () => {
      render(<PreEmploymentStatisticsCard statistics={mockStatistics} loading={false} />);

      expect(screen.getByText('Fit Rate')).toBeInTheDocument();
      expect(screen.getByText('93.8%')).toBeInTheDocument();
    });
  });

  describe('Gauge Colors', () => {
    it('should display green gauge when fit rate is >= 80%', () => {
      const highFitRate = { ...mockStatistics, fit_rate: 85 };
      render(<PreEmploymentStatisticsCard statistics={highFitRate} loading={false} />);

      const gaugeFill = document.querySelector('.gaugeFill');
      expect(gaugeFill).toHaveStyle({ background: '#10b981' });
    });

    it('should display yellow gauge when fit rate is between 60% and 80%', () => {
      const mediumFitRate = { ...mockStatistics, fit_rate: 70 };
      render(<PreEmploymentStatisticsCard statistics={mediumFitRate} loading={false} />);

      const gaugeFill = document.querySelector('.gaugeFill');
      expect(gaugeFill).toHaveStyle({ background: '#f59e0b' });
    });

    it('should display red gauge when fit rate is < 60%', () => {
      const lowFitRate = { ...mockStatistics, fit_rate: 50 };
      render(<PreEmploymentStatisticsCard statistics={lowFitRate} loading={false} />);

      const gaugeFill = document.querySelector('.gaugeFill');
      expect(gaugeFill).toHaveStyle({ background: '#dc2626' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero total checks', () => {
      const zeroStats = {
        ...mockStatistics,
        total_checks: 0,
        fit_count: 0,
        unfit_count: 0,
        fit_rate: 0,
      };
      render(<PreEmploymentStatisticsCard statistics={zeroStats} loading={false} />);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('should handle all unfit employees', () => {
      const allUnfit = {
        ...mockStatistics,
        total_checks: 10,
        fit_count: 0,
        unfit_count: 10,
        fit_rate: 0,
      };
      render(<PreEmploymentStatisticsCard statistics={allUnfit} loading={false} />);

      expect(screen.getByText('0')).toBeInTheDocument(); // Fit count
      expect(screen.getByText('10')).toBeInTheDocument(); // Unfit count
    });
  });
});