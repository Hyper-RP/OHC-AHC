import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Alert, Button, Card, FormInput } from '../ui';
import { handleApiError } from '../../services/api';
import { dispenseMedicine } from '../../services/medicine';
import { getPharmacistPrescriptions, updateVisitStatus } from '../../services/ohc';
import { Role, VisitStatus } from '../../types';
import dashboardStyles from './PharmacistDashboard.module.css';
import pageStyles from './RequestPage.module.css';

interface PrescriptionItem {
  id: number;
  visit: {
    id: number;
    employee: {
      user: { first_name: string; last_name: string };
      employee_code: string;
    };
    chief_complaint?: string;
    symptoms?: string;
    vitals?: Record<string, unknown>;
  };
  dosage: string;
  frequency: string;
  instructions?: string;
  medicine?: {
    id: number;
    name: string;
    stock_quantity: number;
    unit: string;
  };
}

interface DispenseFormData {
  medicine_id: number;
  medicine_name: string;
  stock_available: number;
  quantity_dispensed: number;
  remaining_stock: number;
  issue_date: string;
  remarks: string;
}

export const PharmacistRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { prescriptionId } = useParams<{ prescriptionId: string }>();
  const { user } = useAuth();
  const { show } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionItem | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<PrescriptionItem['medicine'] | null>(null);
  const [dispenseForm, setDispenseForm] = useState<DispenseFormData>({
    medicine_id: 0,
    medicine_name: '',
    stock_available: 0,
    quantity_dispensed: 1,
    remaining_stock: 0,
    issue_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  useEffect(() => {
    if (!user || user.role !== Role.PHARMACIST) {
      navigate('/dashboard');
    }
  }, [navigate, user]);

  useEffect(() => {
    const fetchPrescription = async () => {
      if (!prescriptionId) {
        navigate('/pharmacist/dashboard', { replace: true });
        return;
      }

      try {
        setLoading(true);
        const data = (await getPharmacistPrescriptions()) as PrescriptionItem[];
        const prescription = data.find((item) => String(item.id) === prescriptionId) || null;

        if (!prescription) {
          setError('Prescription details were not found');
          return;
        }

        setSelectedPrescription(prescription);
      } catch (err) {
        const errorMessage = handleApiError(err, 'Failed to fetch prescription');
        setError(errorMessage);
        show(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    void fetchPrescription();
  }, [navigate, prescriptionId, show]);

  useEffect(() => {
    if (selectedPrescription && selectedPrescription.medicine) {
      const medicine = selectedPrescription.medicine;
      const timer = setTimeout(() => {
        setSelectedMedicine(medicine);
        setDispenseForm({
          medicine_id: medicine.id,
          medicine_name: medicine.name,
          stock_available: medicine.stock_quantity,
          quantity_dispensed: 1,
          remaining_stock: medicine.stock_quantity - 1,
          issue_date: new Date().toISOString().split('T')[0],
          remarks: '',
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedPrescription]);

  const handleQuantityChange = (value: string) => {
    const quantity = parseInt(value, 10) || 0;
    setDispenseForm((prev) => ({
      ...prev,
      quantity_dispensed: quantity,
      remaining_stock: prev.stock_available - quantity,
    }));
  };

  const handleDispense = async () => {
    if (!selectedMedicine || !selectedPrescription) return;

    if (dispenseForm.quantity_dispensed > dispenseForm.stock_available) {
      setError('Insufficient stock');
      show('Cannot dispense more than available stock', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await dispenseMedicine(selectedMedicine.id, {
        visit_id: selectedPrescription.visit.id,
        prescription_id: selectedPrescription.id,
        quantity_dispensed: dispenseForm.quantity_dispensed,
        issue_date: dispenseForm.issue_date,
        remarks: dispenseForm.remarks,
      });

      await updateVisitStatus(selectedPrescription.visit.id, VisitStatus.COMPLETED);
      show('Medicine dispensed successfully. Visit status set to Completed.', 'success');
      navigate('/pharmacist/dashboard');
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to dispense medicine');
      setError(errorMessage);
      show(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={pageStyles.page}>
        <Header title="Pharmacist Request" subtitle="Loading prescription details" />
        <div className={dashboardStyles.loadingState}>Loading prescription details...</div>
      </div>
    );
  }

  return (
    <div className={pageStyles.page}>
      <Header title="Pharmacist Request" subtitle="Review and dispense prescribed medicine" />

      <main className={pageStyles.main}>
        {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

        {selectedMedicine && selectedPrescription ? (
          <>
            <section className={pageStyles.hero}>
              <div className={pageStyles.heroText}>
                <span className={pageStyles.eyebrow}>Pharmacist Request</span>
                <h2 className={pageStyles.heroTitle}>Dispense Medicine</h2>
                <p className={pageStyles.heroSubtitle}>
                  Review the prescription, confirm available stock, and complete dispensing from this full page.
                </p>
              </div>
              <div className={pageStyles.heroActions}>
                <Button type="button" variant="outline-secondary" onClick={() => navigate('/pharmacist/dashboard')}>
                  Back
                </Button>
              </div>
            </section>

            <section className={pageStyles.summaryGrid}>
              <div className={pageStyles.summaryCard}>
                <span className={pageStyles.summaryLabel}>Employee</span>
                <span className={pageStyles.summaryValue}>
                  {selectedPrescription.visit.employee.user.first_name} {selectedPrescription.visit.employee.user.last_name}
                </span>
              </div>
              <div className={pageStyles.summaryCard}>
                <span className={pageStyles.summaryLabel}>Employee Code</span>
                <span className={pageStyles.summaryValue}>{selectedPrescription.visit.employee.employee_code}</span>
              </div>
              <div className={pageStyles.summaryCard}>
                <span className={pageStyles.summaryLabel}>Medicine</span>
                <span className={pageStyles.summaryValue}>{dispenseForm.medicine_name}</span>
              </div>
              <div className={pageStyles.summaryCard}>
                <span className={pageStyles.summaryLabel}>Stock Available</span>
                <span className={pageStyles.summaryValue}>{dispenseForm.stock_available} {selectedMedicine.unit}</span>
              </div>
            </section>

            <div className={pageStyles.contentGrid}>
              <div className={pageStyles.stack}>
                <Card className={pageStyles.panel}>
                  <div className={pageStyles.panelHeader}>
                    <div>
                      <h3 className={pageStyles.panelTitle}>Employee Details</h3>
                      <p className={pageStyles.panelSubtitle}>Clinical context before dispensing.</p>
                    </div>
                  </div>

                  <div className={pageStyles.detailGrid}>
                    <div className={pageStyles.detailItem}>
                      <span className={pageStyles.detailLabel}>Name</span>
                      <span className={pageStyles.detailValue}>
                        {selectedPrescription.visit.employee.user.first_name} {selectedPrescription.visit.employee.user.last_name}
                      </span>
                    </div>
                    <div className={pageStyles.detailItem}>
                      <span className={pageStyles.detailLabel}>Employee Code</span>
                      <span className={pageStyles.detailValue}>{selectedPrescription.visit.employee.employee_code}</span>
                    </div>
                    {selectedPrescription.visit.chief_complaint && (
                      <div className={pageStyles.detailItem}>
                        <span className={pageStyles.detailLabel}>Chief Complaint</span>
                        <span className={pageStyles.detailValue}>{selectedPrescription.visit.chief_complaint}</span>
                      </div>
                    )}
                    {selectedPrescription.visit.symptoms && (
                      <div className={pageStyles.detailItem}>
                        <span className={pageStyles.detailLabel}>Symptoms</span>
                        <span className={pageStyles.detailValue}>{selectedPrescription.visit.symptoms}</span>
                      </div>
                    )}
                  </div>
                </Card>

                {selectedPrescription.visit.vitals && Object.keys(selectedPrescription.visit.vitals).length > 0 && (
                  <Card className={pageStyles.panel}>
                    <div className={pageStyles.panelHeader}>
                      <div>
                        <h3 className={pageStyles.panelTitle}>Vital Signs</h3>
                        <p className={pageStyles.panelSubtitle}>Recorded measurements attached to this prescription.</p>
                      </div>
                    </div>

                    <div className={pageStyles.vitalsGrid}>
                      {Object.entries(selectedPrescription.visit.vitals).map(([key, value]) => (
                        <div key={key} className={pageStyles.vitalCard}>
                          <span className={pageStyles.vitalName}>{key}</span>
                          <span className={pageStyles.vitalReading}>{String(value || '-')}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Card className={pageStyles.panel}>
                  <div className={pageStyles.panelHeader}>
                    <div>
                      <h3 className={pageStyles.panelTitle}>Prescription</h3>
                      <p className={pageStyles.panelSubtitle}>Dosage instructions from the doctor.</p>
                    </div>
                  </div>

                  <div className={pageStyles.detailGrid}>
                    <div className={pageStyles.detailItem}>
                      <span className={pageStyles.detailLabel}>Dosage</span>
                      <span className={pageStyles.detailValue}>{selectedPrescription.dosage}</span>
                    </div>
                    <div className={pageStyles.detailItem}>
                      <span className={pageStyles.detailLabel}>Frequency</span>
                      <span className={pageStyles.detailValue}>{selectedPrescription.frequency}</span>
                    </div>
                  </div>

                  {selectedPrescription.instructions && (
                    <div className={pageStyles.noteBox}>{selectedPrescription.instructions}</div>
                  )}
                </Card>
              </div>

              <div className={pageStyles.stack}>
                <Card className={pageStyles.panel}>
                  <div className={pageStyles.panelHeader}>
                    <div>
                      <h3 className={pageStyles.panelTitle}>Dispense Details</h3>
                      <p className={pageStyles.panelSubtitle}>Update quantity, issue date, and remarks before completing.</p>
                    </div>
                  </div>

                  <div className={pageStyles.detailGrid}>
                    <div className={pageStyles.detailItem}>
                      <span className={pageStyles.detailLabel}>Medicine Name</span>
                      <span className={pageStyles.detailValue}>{dispenseForm.medicine_name}</span>
                    </div>
                    <div className={pageStyles.detailItem}>
                      <span className={pageStyles.detailLabel}>Remaining After Dispense</span>
                      <span className={pageStyles.detailValue}>
                        {dispenseForm.remaining_stock} {selectedMedicine.unit}
                      </span>
                    </div>
                  </div>

                  <div className={pageStyles.formStack}>
                    <FormInput
                      label="Quantity to Dispense *"
                      type="number"
                      value={dispenseForm.quantity_dispensed.toString()}
                      onChange={handleQuantityChange}
                      min="1"
                      max={dispenseForm.stock_available}
                      required
                      helperText={`Maximum: ${dispenseForm.stock_available}`}
                    />
                    <FormInput
                      label="Issue Date *"
                      type="date"
                      value={dispenseForm.issue_date}
                      onChange={(value) => setDispenseForm((prev) => ({ ...prev, issue_date: value }))}
                      required
                    />
                    <FormInput
                      label="Pharmacist Remarks (Optional)"
                      type="textarea"
                      value={dispenseForm.remarks}
                      onChange={(value) => setDispenseForm((prev) => ({ ...prev, remarks: value }))}
                      rows={3}
                      placeholder="Any additional notes..."
                    />
                    <div className={pageStyles.noteBox}>
                      After dispensing, the visit status will be automatically updated to Completed.
                    </div>
                  </div>

                  <div className={pageStyles.actionRow}>
                    <Button type="button" variant="outline-secondary" onClick={() => navigate('/pharmacist/dashboard')}>
                      Cancel
                    </Button>
                    <Button type="button" variant="brand" onClick={handleDispense} loading={submitting}>
                      Dispense & Complete
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <div className={pageStyles.emptyState}>Prescription details are unavailable.</div>
        )}
      </main>
    </div>
  );
};
