import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../tests/test-utils';
import { HowItWorks } from '../HowItWorks';

describe('HowItWorks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    renderWithProviders(<HowItWorks />);
    expect(screen.getByText('How It Works')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    renderWithProviders(<HowItWorks />);
    expect(screen.getByText(/Understanding the OHC-AHC healthcare workflow/)).toBeInTheDocument();
  });

  it('renders back to home link', () => {
    renderWithProviders(<HowItWorks />);
    expect(screen.getByText('← Back to Home')).toBeInTheDocument();
  });

  it('renders all 6 workflow steps', () => {
    renderWithProviders(<HowItWorks />);
    expect(screen.getByText('Employee Visit to OHC')).toBeInTheDocument();
    expect(screen.getByText('Doctor Consultation & Diagnosis')).toBeInTheDocument();
    expect(screen.getByText('Referral to AHC (if needed)')).toBeInTheDocument();
    expect(screen.getByText('Treatment at Partner Hospital')).toBeInTheDocument();
    expect(screen.getByText('Payment Processing')).toBeInTheDocument();
    expect(screen.getByText('Reporting & Analytics')).toBeInTheDocument();
  });

  it('renders step numbers 1 through 6', () => {
    renderWithProviders(<HowItWorks />);
    for (let i = 1; i <= 6; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
  });

  it('renders key features section', () => {
    renderWithProviders(<HowItWorks />);
    expect(screen.getByText('Key Features')).toBeInTheDocument();
    expect(screen.getByText(/Digital Records/)).toBeInTheDocument();
    expect(screen.getByText(/Hospital Network/)).toBeInTheDocument();
    expect(screen.getByText(/Real-time Analytics/)).toBeInTheDocument();
    expect(screen.getByText(/Secure Access/)).toBeInTheDocument();
  });

  it('renders CTA section with Sign In button', () => {
    renderWithProviders(<HowItWorks />);
    expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument();
    expect(screen.getByText('Sign In to Portal')).toBeInTheDocument();
  });

  it('renders step details as list items', () => {
    renderWithProviders(<HowItWorks />);
    expect(screen.getByText('Registration check')).toBeInTheDocument();
    expect(screen.getByText('Triage assessment')).toBeInTheDocument();
    expect(screen.getByText('Vitals collection')).toBeInTheDocument();
  });
});
