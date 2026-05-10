import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../../tests/test-utils';
import { Header } from '../Header';

describe('Header', () => {
  it('renders title when provided', () => {
    renderWithRouter(<Header title="Dashboard" />, { initialEntries: ['/dashboard'] });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    renderWithRouter(<Header title="Dashboard" subtitle="Welcome back" />, { initialEntries: ['/dashboard'] });
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('does not render title when not provided', () => {
    const { container } = renderWithRouter(<Header />, { initialEntries: ['/'] });
    expect(container.querySelector('h1')).toBeNull();
  });

  it('renders actions slot', () => {
    renderWithRouter(
      <Header title="Test" actions={<button>Export</button>} />,
      { initialEntries: ['/dashboard'] }
    );
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('displays visitCount stat', () => {
    renderWithRouter(
      <Header title="Test" stats={{ visitCount: 1234 }} />,
      { initialEntries: ['/dashboard'] }
    );
    expect(screen.getByText('1234')).toBeInTheDocument();
    expect(screen.getByText('Total Visits')).toBeInTheDocument();
  });

  it('displays referralCount stat', () => {
    renderWithRouter(
      <Header title="Test" stats={{ visitCount: 100, referralCount: 50 }} />,
      { initialEntries: ['/dashboard'] }
    );
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Open Referrals')).toBeInTheDocument();
  });

  it('displays pendingInvoices stat', () => {
    renderWithRouter(
      <Header title="Test" stats={{ visitCount: 100, pendingInvoices: 23 }} />,
      { initialEntries: ['/dashboard'] }
    );
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('hides stats when not provided', () => {
    renderWithRouter(<Header title="Test" />, { initialEntries: ['/dashboard'] });
    expect(screen.queryByText('Total Visits')).not.toBeInTheDocument();
  });

  it('applies className prop', () => {
    const { container } = renderWithRouter(
      <Header title="Test" className="my-header" />,
      { initialEntries: ['/dashboard'] }
    );
    expect(container.querySelector('header')?.className).toContain('my-header');
  });
});
