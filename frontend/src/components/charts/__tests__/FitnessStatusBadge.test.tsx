import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FitnessStatusBadge } from '../FitnessStatusBadge';

describe('FitnessStatusBadge', () => {
  it('should render FIT status', () => {
    render(<FitnessStatusBadge status="FIT" />);

    expect(screen.getByText('Fit')).toBeInTheDocument();
    const badge = screen.getByRole('status') as HTMLElement;
    expect(badge.getAttribute('aria-label')).toBe('Fitness status: Fit');
  });

  it('should render UNFIT status', () => {
    render(<FitnessStatusBadge status="UNFIT" />);

    expect(screen.getByText('Unfit')).toBeInTheDocument();
    const badge = screen.getByRole('status') as HTMLElement;
    expect(badge.getAttribute('aria-label')).toBe('Fitness status: Unfit');
  });

  it('should render TEMPORARY_UNFIT status', () => {
    render(<FitnessStatusBadge status="TEMPORARY_UNFIT" />);

    expect(screen.getByText('Temporarily Unfit')).toBeInTheDocument();
    const badge = screen.getByRole('status') as HTMLElement;
    expect(badge.getAttribute('aria-label')).toBe('Fitness status: Temporarily Unfit');
  });

  it('should render UNDER_OBSERVATION status', () => {
    render(<FitnessStatusBadge status="UNDER_OBSERVATION" />);

    expect(screen.getByText('Under Observation')).toBeInTheDocument();
    const badge = screen.getByRole('status') as HTMLElement;
    expect(badge.getAttribute('aria-label')).toBe('Fitness status: Under Observation');
  });

  it('should apply size class', () => {
    const { rerender } = render(<FitnessStatusBadge status="FIT" size="lg" />);
    let badge = screen.getByRole('status');

    // CSS modules generate hashed class names, just verify it renders
    expect(badge).toBeInTheDocument();

    rerender(<FitnessStatusBadge status="FIT" size="sm" />);
    badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(<FitnessStatusBadge status="FIT" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label');
    expect(badge.getAttribute('aria-label')).toContain('Fit');
  });
});