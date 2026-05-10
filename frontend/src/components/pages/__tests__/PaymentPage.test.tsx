import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../tests/test-utils';
import { PaymentPage } from '../PaymentPage';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { first_name: 'Admin', role: 'ADMIN' },
    isAuthenticated: true, loading: false,
    login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(),
  })),
}));

const mockInvoices = [
  {
    uuid: 'inv-1', invoice_number: 'INV-2026-001',
    employee: { id: 1, employee_code: 'EMP-001', user: { first_name: 'John', last_name: 'Doe' } },
    status: 'ISSUED', subtotal_amount: 5000, tax_amount: 900, total_amount: 5900,
    due_date: '2026-06-01', issued_at: '2026-05-01', notes: '', created_at: '2026-05-01',
  },
];

vi.mock('../../../services/payments', () => ({
  listInvoices: vi.fn(),
  createPayment: vi.fn(),
}));

import { listInvoices, createPayment } from '../../../services/payments';

describe('PaymentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listInvoices).mockResolvedValue({ count: 1, next: null, previous: null, results: mockInvoices });
  });

  it('shows loading state initially', () => {
    renderWithProviders(<PaymentPage />);
    expect(screen.getByText('Loading invoices...')).toBeInTheDocument();
  });

  it('renders page header after loading', async () => {
    renderWithProviders(<PaymentPage />);
    await waitFor(() => {
      expect(screen.getByText('Pending Invoices')).toBeInTheDocument();
    });
  });

  it('renders invoice card after loading', async () => {
    renderWithProviders(<PaymentPage />);
    await waitFor(() => {
      expect(screen.getByText('INV-2026-001')).toBeInTheDocument();
    });
  });

  it('shows employee name on invoice', async () => {
    renderWithProviders(<PaymentPage />);
    await waitFor(() => {
      expect(screen.getByText(/John/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no invoices', async () => {
    vi.mocked(listInvoices).mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    renderWithProviders(<PaymentPage />);
    await waitFor(() => {
      expect(screen.getByText('No pending invoices')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(listInvoices).mockRejectedValue(new Error('Network error'));
    renderWithProviders(<PaymentPage />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load invoices')).toBeInTheDocument();
    });
  });

  it('shows payment form when invoice is selected', async () => {
    renderWithProviders(<PaymentPage />);
    await waitFor(() => {
      expect(screen.getByText('INV-2026-001')).toBeInTheDocument();
    });

    // Click on the invoice card — use the h3 text which is inside the clickable card
    const invoiceHeading = screen.getByText('INV-2026-001');
    fireEvent.click(invoiceHeading.closest('div[class*="card"]') || invoiceHeading);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Process Payment/ })).toBeInTheDocument();
    });
  });

  it('processes payment successfully', async () => {
    vi.mocked(createPayment).mockResolvedValue({});
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithProviders(<PaymentPage />);
    await waitFor(() => {
      expect(screen.getByText('INV-2026-001')).toBeInTheDocument();
    });

    // Select invoice
    const invoiceHeading = screen.getByText('INV-2026-001');
    fireEvent.click(invoiceHeading.closest('div[class*="card"]') || invoiceHeading);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Process Payment/ })).toBeInTheDocument();
    });

    // Click process payment
    fireEvent.click(screen.getByRole('button', { name: /Process Payment/ }));

    await waitFor(() => {
      expect(createPayment).toHaveBeenCalled();
    });
  });
});
