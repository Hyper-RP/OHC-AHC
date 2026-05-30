import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoice, mockPaginatedResponse } from '../../tests/test-utils';

vi.mock('../api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  handleApiError: vi.fn((e: unknown) => e instanceof Error ? e.message : 'API Error'),
}));

import api from '../api';
import { listInvoices, getInvoice, createPayment, getInvoicePayments } from '../payments';

describe('payments service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('listInvoices calls GET /payments/invoices/', async () => {
    const data = mockPaginatedResponse([mockInvoice()]);
    vi.mocked(api.get).mockResolvedValueOnce({ data });
    const result = await listInvoices();
    expect(api.get).toHaveBeenCalledWith('/payments/invoices/', { params: undefined });
    expect(result).toEqual(data);
  });

  it('listInvoices passes filter params', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockPaginatedResponse([]) });
    await listInvoices({ status: 'PAID', page: 2 });
    expect(api.get).toHaveBeenCalledWith('/payments/invoices/', { params: { status: 'PAID', page: 2 } });
  });

  it('listInvoices throws on error', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Fail'));
    await expect(listInvoices()).rejects.toThrow();
  });

  it('getInvoice calls correct endpoint', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: mockInvoice() });
    await getInvoice('inv-001');
    expect(api.get).toHaveBeenCalledWith('/payments/invoices/inv-001/');
  });

  it('createPayment calls POST with data', async () => {
    const formData = { invoice: 'inv-001', employee: 'EMP-001', amount: 5900, payment_method: 'UPI' as const };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { uuid: 'pay-001' } });
    await createPayment(formData);
    expect(api.post).toHaveBeenCalledWith('/payments/payments/', formData);
  });

  it('createPayment throws on error', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Fail'));
    await expect(createPayment({} as never)).rejects.toThrow();
  });

  it('getInvoicePayments calls correct endpoint', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
    await getInvoicePayments('inv-001');
    expect(api.get).toHaveBeenCalledWith('/payments/invoices/inv-001/payments/');
  });

  it('getInvoicePayments throws on error', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('Fail'));
    await expect(getInvoicePayments('bad')).rejects.toThrow();
  });
});
