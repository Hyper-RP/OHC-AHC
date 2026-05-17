import React, { useState, useEffect } from 'react';
import { Header } from '../layout';
import { Card, Button, Loading, Alert, FormInput } from '../ui';
import { listInvoices, createPayment } from '../../services/payments';
import { PAYMENT_METHOD_OPTIONS } from '../../utils/constants';
import type { Invoice } from '../../types';
import styles from './PaymentPage.module.css';

/**
 * Payment Page component
 * Display invoices and process payments
 */
export const PaymentPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await listInvoices({ status: 'ISSUED' });
      setInvoices(response.results);
    } catch {
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      loadInvoices();
    });
  }, []);

  const handlePayment = async () => {
    if (!selectedInvoice || !paymentAmount) return;

    try {
      await createPayment({
        invoice: selectedInvoice.id,
        employee: selectedInvoice.employee.id,
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod as 'RAZORPAY' | 'UPI' | 'CARD',
        provider: 'RAZORPAY',
      });
      alert('Payment processed successfully!');
      loadInvoices();
      setSelectedInvoice(null);
      setPaymentAmount('');
    } catch {
      setError('Payment failed');
    }
  };

  if (loading) {
    return <Loading fullScreen text="Loading invoices..." />;
  }

  return (
    <div className={styles.paymentPage}>
      <Header title="Payments" subtitle="Manage invoices and payments" />
      <main className={styles.paymentMain}>
        {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

        <div className={styles.paymentGrid}>
          <section className={styles.invoicesSection}>
            <h2>Pending Invoices</h2>
            <div className={styles.invoiceList}>
              {invoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className={`${styles.invoiceCard} ${selectedInvoice?.id === invoice.id ? styles.selected : ''}`}
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setPaymentAmount(invoice.total_amount.toString());
                  }}
                >
                  <div className={styles.invoiceHeader}>
                    <h3>{invoice.invoice_number}</h3>
                    <span className={styles.invoiceStatus}>{invoice.status}</span>
                  </div>
                  <div className={styles.invoiceDetails}>
                    <p><strong>Employee:</strong> {invoice.employee.user.first_name} {invoice.employee.user.last_name}</p>
                    <p><strong>Amount:</strong> ₹{invoice.total_amount.toLocaleString()}</p>
                    {invoice.due_date && <p><strong>Due:</strong> {invoice.due_date}</p>}
                  </div>
                </Card>
              ))}
              {invoices.length === 0 && <p className={styles.empty}>No pending invoices</p>}
            </div>
          </section>

          {selectedInvoice && (
            <section className={styles.paymentFormSection}>
              <Card>
                <h2>Process Payment</h2>
                <div className={styles.selectedInvoice}>
                  <p><strong>Invoice:</strong> {selectedInvoice.invoice_number}</p>
                  <p><strong>Total Amount:</strong> ₹{selectedInvoice.total_amount.toLocaleString()}</p>
                </div>
                <FormInput
                  label="Payment Amount"
                  type="number"
                  value={paymentAmount}
                  onChange={setPaymentAmount}
                />
                <FormInput
                  label="Payment Method"
                  type="select"
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={PAYMENT_METHOD_OPTIONS}
                />
                <Button variant="brand" onClick={handlePayment} className={styles.payButton}>
                  Process Payment
                </Button>
              </Card>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};
