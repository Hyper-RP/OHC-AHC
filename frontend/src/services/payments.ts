import api, { handleApiError } from './api';
import type {
  Invoice,
  Payment,
  PaymentFormData,
  PaginatedResponse,
} from '../types';

/**
 * List invoices with optional filters
 * @param params - Query parameters for filtering
 * @returns Promise resolving to paginated invoices
 */
export const listInvoices = async (params?: {
  employee?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedResponse<Invoice>> => {
  try {
    const response = await api.get<PaginatedResponse<Invoice>>('/payments/invoices/', { params });
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Get a single invoice by UUID
 * @param uuid - Invoice UUID
 * @returns Promise resolving to invoice data
 */
export const getInvoice = async (uuid: string): Promise<Invoice> => {
  try {
    const response = await api.get<Invoice>(`/payments/invoices/${uuid}/`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Create a payment
 * @param data - Payment form data
 * @returns Promise resolving to created payment
 */
export const createPayment = async (data: PaymentFormData): Promise<Payment> => {
  try {
    const response = await api.post<Payment>('/payments/payments/', data);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};

/**
 * Get payment details for an invoice
 * @param invoiceUuid - Invoice UUID
 * @returns Promise resolving to array of payments
 */
export const getInvoicePayments = async (invoiceUuid: string): Promise<Payment[]> => {
  try {
    const response = await api.get<Payment[]>(`/payments/invoices/${invoiceUuid}/payments/`);
    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error), { cause: error });
  }
};
