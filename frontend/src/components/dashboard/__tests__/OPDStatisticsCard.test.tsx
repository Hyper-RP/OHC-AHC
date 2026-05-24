import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OPDStatisticsCard } from '../OPDStatisticsCard';

describe('OPDStatisticsCard', () => {
  const mockStatistics = {
    today_count: 5,
    till_date_count: 123,
    visits: [
      {
        id: '1',
        employee_code: 'EMP-001',
        employee_name: 'John Doe',
        department: 'Engineering',
        visit_time: '2026-05-24T09:30:00Z',
        chief_complaint: 'Headache',
        status: 'IN_PROGRESS',
      },
      {
        id: '2',
        employee_code: 'EMP-002',
        employee_name: 'Jane Smith',
        department: 'HR',
        visit_time: '2026-05-24T10:15:00Z',
        chief_complaint: 'Back pain',
        status: 'COMPLETED',
      },
    ],
  };

  describe('Loading State', () => {
    it('should display loading skeleton when loading is true', () => {
      render(<OPDStatisticsCard statistics={null} loading={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display OPD visits when statistics are loaded', () => {
      render(<OPDStatisticsCard statistics={mockStatistics} loading={false} />);

      expect(screen.getByText('📋 OPD Visits Today')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should display department and complaint for each visit', () => {
      render(<OPDStatisticsCard statistics={mockStatistics} loading={false} />);

      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Headache')).toBeInTheDocument();
      expect(screen.getByText('HR')).toBeInTheDocument();
      expect(screen.getByText('Back pain')).toBeInTheDocument();
    });

    it('should display "Total OPD visits (till date)" count', () => {
      render(<OPDStatisticsCard statistics={mockStatistics} loading={false} />);
      expect(screen.getByText('Total OPD visits (till date)')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should show view more message when more than 5 visits', () => {
      const manyVisits = {
        ...mockStatistics,
        visits: Array(7).fill(null).map((_, i) => ({
          id: `${i}`,
          employee_code: `EMP-00${i}`,
          employee_name: `Employee ${i}`,
          department: 'Engineering',
          visit_time: '2026-05-24T09:00:00Z',
          chief_complaint: 'Test complaint',
          status: 'COMPLETED',
        })),
      };

      render(<OPDStatisticsCard statistics={manyVisits} loading={false} />);
      expect(screen.getByText('+2 more visits today')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state message when no visits today', () => {
      const emptyStats = { ...mockStatistics, visits: [] };
      render(<OPDStatisticsCard statistics={emptyStats} loading={false} />);

      expect(screen.getByText('No OPD visits recorded today')).toBeInTheDocument();
      expect(
        screen.getByText('Visit activity will appear here when employees check in')
      ).toBeInTheDocument();
    });

    it('should display 0 for today count when no visits', () => {
      const emptyStats = { ...mockStatistics, visits: [], today_count: 0 };
      render(<OPDStatisticsCard statistics={emptyStats} loading={false} />);

      const todayBadge = screen.getByText('0');
      expect(todayBadge).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should render correct status badges', () => {
      render(<OPDStatisticsCard statistics={mockStatistics} loading={false} />);

      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('Null Statistics', () => {
    it('should not render anything when statistics is null and loading is false', () => {
      const { container } = render(
        <OPDStatisticsCard statistics={null} loading={false} />
      );
      expect(container.firstChild).toBeNull();
    });
  });
});