import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../../tests/test-utils';
import { ReportsPage } from '../ReportsPage';

describe('ReportsPage', () => {
  it('renders Header with title', () => {
    renderWithRouter(<ReportsPage />, { initialEntries: ['/reports/medical'] });
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Access healthcare reports and analytics')).toBeInTheDocument();
  });

  it('renders 4 report category cards', () => {
    renderWithRouter(<ReportsPage />, { initialEntries: ['/reports/medical'] });
    expect(screen.getByText('Medical Reports')).toBeInTheDocument();
    expect(screen.getByText('Employee Health History')).toBeInTheDocument();
    expect(screen.getByText('Disease Trends')).toBeInTheDocument();
    expect(screen.getByText('Department Statistics')).toBeInTheDocument();
  });

  it('renders stat cards', () => {
    renderWithRouter(<ReportsPage />, { initialEntries: ['/reports/medical'] });
    expect(screen.getByText('Total Reports')).toBeInTheDocument();
    expect(screen.getByText('Downloads Today')).toBeInTheDocument();
    expect(screen.getByText('Reports Generated')).toBeInTheDocument();
  });

  it('report cards have correct descriptions', () => {
    renderWithRouter(<ReportsPage />, { initialEntries: ['/reports/medical'] });
    expect(screen.getByText('View and download medical reports')).toBeInTheDocument();
    expect(screen.getByText('Complete health history for employees')).toBeInTheDocument();
    expect(screen.getByText('Analyze health trends across organization')).toBeInTheDocument();
    expect(screen.getByText('Health metrics by department')).toBeInTheDocument();
  });
});
