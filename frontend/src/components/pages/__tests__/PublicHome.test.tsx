import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../../tests/test-utils';
import { PublicHome } from '../PublicHome';

describe('PublicHome', () => {
  it('renders hero section with title', () => {
    renderWithRouter(<PublicHome />);
    expect(screen.getByText('Occupational Health & Affiliate Hospital Care')).toBeInTheDocument();
  });

  it('renders 4 stat cards', () => {
    renderWithRouter(<PublicHome />);
    expect(screen.getByText('Total Visits')).toBeInTheDocument();
    expect(screen.getByText('Active Referrals')).toBeInTheDocument();
    expect(screen.getByText('Partner Hospitals')).toBeInTheDocument();
    expect(screen.getByText('Reports Generated')).toBeInTheDocument();
  });

  it('renders 6 feature cards', () => {
    renderWithRouter(<PublicHome />);
    expect(screen.getByText('OHC Visit Management')).toBeInTheDocument();
    expect(screen.getByText('Diagnosis Entry')).toBeInTheDocument();
    expect(screen.getByText('AHC Referrals')).toBeInTheDocument();
    expect(screen.getByText('Payment Processing')).toBeInTheDocument();
    expect(screen.getByText('Analytics & Reports')).toBeInTheDocument();
    expect(screen.getByText('Role-Based Access')).toBeInTheDocument();
  });

  it('renders Sign In buttons linking to /login', () => {
    renderWithRouter(<PublicHome />);
    const signInButtons = screen.getAllByText('Sign In');
    expect(signInButtons.length).toBeGreaterThan(0);
  });

  it('renders How It Works button', () => {
    renderWithRouter(<PublicHome />);
    expect(screen.getByText('How It Works')).toBeInTheDocument();
  });

  it('renders footer', () => {
    renderWithRouter(<PublicHome />);
    expect(screen.getByText(/2026 OHC-AHC Health Portal/)).toBeInTheDocument();
  });
});
