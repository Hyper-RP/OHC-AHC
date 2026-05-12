import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FitnessStatusBadge } from '../FitnessStatusBadge';

describe('FitnessStatusBadge', () => {
  it('should render FIT status with green color', () => {
    render(<FitnessStatusBadge status="FIT" />);

    expect(screen.getByRole('status')).toHaveTextContent('FIT');
    const badge = screen.getByRole('status') as HTMLElement;
    expect(badge.style.getPropertyValue('--badge-color')).toBe('#10b981');
  });

  it('should render UNFIT status with red color', () => {
    render(<FitnessStatusBadge status="UNFIT" />);

    expect(screen.getByRole('status')).toHaveTextContent('UNFIT');
    const badge = screen.getByRole('status') as HTMLElement;
    expect(badge.style.getPropertyValue('--badge-color')).toBe('#ef4444');
  });

  it('should render TEMPORARY_UNFIT status with yellow color', () => {
    render(<FitnessStatusBadge status="TEMPORARY_UNFIT" />);

    expect(screen.getByRole('status')).toHaveTextContent('TEMPORARY_UNFIT');
    const badge = screen.getByRole('status') as HTMLElement;
    expect(badge.style.getPropertyValue('--badge-color')).toBe('#f59e0b');
  });

  it('should apply size class', () => {
    const { rerender } = render(<FitnessStatusBadge status="FIT" size="lg" />);
    let badge = screen.getByRole('status');

    expect(badge).toHaveClass('lg');

    rerender(<FitnessStatusBadge status="FIT" size="sm" />);
    badge = screen.getByRole('status');
    expect(badge).toHaveClass('sm');
  });

  it('should have proper ARIA attributes', () => {
    render(<FitnessStatusBadge status="FIT" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label');
  });
});
