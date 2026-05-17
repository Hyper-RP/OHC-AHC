import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DailyMonthlyToggle } from '../DailyMonthlyToggle';

describe('DailyMonthlyToggle', () => {
  it('should render daily and monthly buttons', () => {
    const onChange = vi.fn();
    render(<DailyMonthlyToggle value="daily" onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'View by day' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View by month' })).toBeInTheDocument();
  });

  it('should highlight active button', () => {
    const onChange = vi.fn();
    render(<DailyMonthlyToggle value="daily" onChange={onChange} />);

    const dailyBtn = screen.getByRole('button', { name: 'View by day' });
    const monthlyBtn = screen.getByRole('button', { name: 'View by month' });

    // CSS modules generate hashed class names, so use aria-pressed to check active state
    expect(dailyBtn).toHaveAttribute('aria-pressed', 'true');
    expect(monthlyBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('should call onChange when button is clicked', async () => {
    const onChange = vi.fn();
    render(<DailyMonthlyToggle value="daily" onChange={onChange} />);

    const monthlyBtn = screen.getByRole('button', { name: 'View by month' });
    await userEvent.click(monthlyBtn);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('monthly');
  });

  it('should disable buttons when disabled prop is true', () => {
    const onChange = vi.fn();
    render(<DailyMonthlyToggle value="daily" onChange={onChange} disabled />);

    const dailyBtn = screen.getByRole('button', { name: 'View by day' });
    const monthlyBtn = screen.getByRole('button', { name: 'View by month' });

    expect(dailyBtn).toBeDisabled();
    expect(monthlyBtn).toBeDisabled();
  });

  it('should have proper ARIA attributes', () => {
    render(<DailyMonthlyToggle value="daily" onChange={vi.fn()} />);

    const dailyBtn = screen.getByRole('button', { name: 'View by day' });
    const monthlyBtn = screen.getByRole('button', { name: 'View by month' });

    expect(dailyBtn).toHaveAttribute('aria-pressed', 'true');
    expect(monthlyBtn).toHaveAttribute('aria-pressed', 'false');
  });
});
