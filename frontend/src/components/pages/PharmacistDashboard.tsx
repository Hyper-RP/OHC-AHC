import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Card, Alert, Button, FormInput } from '../ui';
import { listMedicines, dispenseMedicine } from '../../services/medicine';
import { getPharmacistPrescriptions, updateVisitStatus } from '../../services/ohc';
import { handleApiError } from '../../services/api';
import { Role, VisitStatus } from '../../types';
import receiptLogo from '../../assets/mediGplus.png';
import styles from './PharmacistDashboard.module.css';

interface PrescriptionItem {
  id: number;
  visit: {
    id: number;
    employee: {
      user: { first_name: string; last_name: string };
      employee_code: string;
      department?: string;
      designation?: string;
      fitness_status?: string;
    };
    visit_date: string;
    visit_time?: string;
    visit_type?: string;
    triage_level?: string;
    visit_status?: string;
    vitals?: Record<string, any>;
    chief_complaint?: string;
    symptoms?: string;
    preliminary_notes?: string;
    follow_up_date?: string;
    next_action?: string;
    doctor_name?: string;
    diagnoses?: Array<{
      diagnosis_name?: string;
      severity?: string;
      fitness_decision?: string;
      work_restrictions?: string;
      advised_rest_days?: number;
      follow_up_date?: string;
      diagnosis_notes?: string;
    }>;
    prescriptions?: Array<{
      medicine_name?: string;
      dosage?: string;
      frequency?: string;
      duration_days?: number;
      route?: string;
      instructions?: string;
      start_date?: string;
      status?: string;
    }>;
  };
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions?: string;
  status: string;
  is_dispensed?: boolean;
  medicine?: any;
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

/**
 * Pharmacist Dashboard component
 * Shows prescriptions queue and medicine inventory management
 */
export const PharmacistDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [lowStockMedicines, setLowStockMedicines] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'inventory'>('prescriptions');
  const [search, setSearch] = useState('');

  // Dispense modal state
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionItem | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<any | null>(null);
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
      setError('Access restricted to pharmacists only');
      navigate('/dashboard');
      return;
    }
    fetchPrescriptions();
    fetchMedicines();
  }, [user, navigate]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await getPharmacistPrescriptions();
      setPrescriptions(data || []);
      setError('');
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to fetch prescriptions');
      setError(errorMessage);
      show(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const data = await listMedicines();
      setMedicines(data.results || []);
      setLowStockMedicines(data.results?.filter((m: any) => m.is_low_stock) || []);
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to fetch medicines');
      setError(errorMessage);
      show(errorMessage, 'error');
    }
  };

  const handleOpenDispenseModal = (prescription: PrescriptionItem, medicine: any) => {
    setSelectedPrescription(prescription);
    setSelectedMedicine(medicine);
    const stockAvailable = medicine.stock_quantity;
    const quantityDispensed = 1;
    setDispenseForm({
      medicine_id: medicine.id,
      medicine_name: medicine.name,
      stock_available: stockAvailable,
      quantity_dispensed: quantityDispensed,
      remaining_stock: stockAvailable - quantityDispensed,
      issue_date: new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setShowDispenseModal(true);
  };

  const handleCloseDispenseModal = () => {
    setShowDispenseModal(false);
    setSelectedPrescription(null);
    setSelectedMedicine(null);
    setDispenseForm({
      medicine_id: 0,
      medicine_name: '',
      stock_available: 0,
      quantity_dispensed: 1,
      remaining_stock: 0,
      issue_date: new Date().toISOString().split('T')[0],
      remarks: '',
    });
  };

  const handleDispense = async () => {
    if (!selectedMedicine || !selectedPrescription) return;

    if (dispenseForm.quantity_dispensed > dispenseForm.stock_available) {
      setError('Insufficient stock');
      show('Cannot dispense more than available stock', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await dispenseMedicine(selectedMedicine.id, {
        visit_id: selectedPrescription.visit.id,
        prescription_id: selectedPrescription.id,
        quantity_dispensed: dispenseForm.quantity_dispensed,
        issue_date: dispenseForm.issue_date,
        remarks: dispenseForm.remarks,
      });

      // Update visit status to COMPLETED after dispensing
      await updateVisitStatus(selectedPrescription.visit.id, VisitStatus.COMPLETED);

      show('Medicine dispensed successfully. Visit status set to Completed.', 'success');
      handleCloseDispenseModal();
      fetchMedicines();
      fetchPrescriptions();
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to dispense medicine');
      setError(errorMessage);
      show(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuantityChange = (value: string) => {
    const quantity = parseInt(value) || 0;
    setDispenseForm((prev) => ({
      ...prev,
      quantity_dispensed: quantity,
      remaining_stock: prev.stock_available - quantity,
    }));
  };

  const filteredMedicines = medicines.filter((medicine) =>
    medicine.name.toLowerCase().includes(search.toLowerCase()) ||
    medicine.medicine_id.toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = medicines.reduce((sum, m) => sum + m.stock_quantity, 0);
  const totalUsed = medicines.reduce((sum, m) => sum + m.used_quantity, 0);

  const escapeHtml = (value: unknown) =>
    String(value ?? '-')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const formatFieldLabel = (value: string) =>
    value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const formatTime = (value?: string) => {
    if (!value) return '-';
    const time = new Date(`2000-01-01T${value}`);
    if (Number.isNaN(time.getTime())) return value;
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const buildKeyValueRows = (rows: Array<[string, unknown]>) =>
    rows
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(
        ([label, value]) => `
          <div class="receipt-row">
            <span class="receipt-label">${escapeHtml(label)}</span>
            <span class="receipt-value">${escapeHtml(value)}</span>
          </div>
        `,
      )
      .join('');

  const handlePrintReceipt = () => {
    if (!selectedPrescription || !selectedMedicine) return;

    const { visit } = selectedPrescription;
    const employeeName = `${visit.employee.user.first_name} ${visit.employee.user.last_name}`;
    const logoUrl = new URL(receiptLogo, window.location.origin).href;
    const diagnosisItems = visit.diagnoses ?? [];
    const prescriptionItems =
      visit.prescriptions && visit.prescriptions.length > 0
        ? visit.prescriptions
        : [
            {
              medicine_name: selectedPrescription.medicine_name,
              dosage: selectedPrescription.dosage,
              frequency: selectedPrescription.frequency,
              duration_days: selectedPrescription.duration_days,
              instructions: selectedPrescription.instructions,
            },
          ];

    const diagnosisMarkup =
      diagnosisItems.length > 0
        ? diagnosisItems
            .map(
              (diagnosis, index) => `
                <div class="receipt-card">
                  <h4>Diagnosis ${index + 1}</h4>
                  ${buildKeyValueRows([
                    ['Diagnosis Name', diagnosis.diagnosis_name],
                    ['Work Restrictions', diagnosis.work_restrictions],
                    ['Follow-up Date', diagnosis.follow_up_date ? formatDate(diagnosis.follow_up_date) : ''],
                    ['Diagnosis Notes', diagnosis.diagnosis_notes],
                  ])}
                </div>
              `,
            )
            .join('')
        : '<p class="receipt-empty">No diagnosis details available.</p>';

    const prescriptionMarkup =
      prescriptionItems.length > 0
        ? prescriptionItems
            .map(
              (prescription, index) => `
                <div class="receipt-card">
                  <h4>Prescription ${index + 1}</h4>
                  ${buildKeyValueRows([
                    ['Medicine', prescription.medicine_name],
                    ['Dosage', prescription.dosage],
                    ['Frequency', prescription.frequency],
                    ['Duration (Days)', prescription.duration_days],
                    ['Route', prescription.route],
                    ['Start Date', prescription.start_date ? formatDate(prescription.start_date) : ''],
                    ['Instructions', prescription.instructions],
                    ['Status', prescription.status],
                  ])}
                </div>
              `,
            )
            .join('')
        : '<p class="receipt-empty">No prescription details available.</p>';

    const vitalsMarkup =
      visit.vitals && Object.keys(visit.vitals).length > 0
        ? Object.entries(visit.vitals)
            .map(
              ([key, value]) => `
                <div class="receipt-pill">
                  <strong>${escapeHtml(formatFieldLabel(key))}:</strong> ${escapeHtml(value)}
                </div>
              `,
            )
            .join('')
        : '<p class="receipt-empty">No vitals recorded.</p>';

    const receiptHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Employee Visit Receipt</title>
          <style>
            body {
              margin: 0;
              padding: 32px;
              font-family: Arial, Helvetica, sans-serif;
              color: #0f172a;
              background: #f8fafc;
            }
            .receipt-shell {
              max-width: 920px;
              margin: 0 auto;
              background: #ffffff;
              border: 1px solid #dbe4ee;
              border-radius: 16px;
              padding: 28px;
            }
            .receipt-header {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              align-items: flex-start;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 18px;
              margin-bottom: 24px;
            }
            .receipt-brand {
              display: flex;
              align-items: flex-start;
              gap: 16px;
            }
            .receipt-logo {
              width: 220px;
              max-width: 100%;
              height: auto;
              display: block;
            }
            .receipt-brand-copy {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
            .receipt-header h1 {
              margin: 0 0 6px;
              font-size: 28px;
            }
            .receipt-header p {
              margin: 0;
              color: #475569;
            }
            .receipt-badge {
              background: #e0f2fe;
              color: #075985;
              border-radius: 999px;
              padding: 8px 14px;
              font-weight: 700;
              font-size: 12px;
            }
            .receipt-section {
              margin-top: 24px;
            }
            .receipt-section h2 {
              margin: 0 0 14px;
              font-size: 18px;
              color: #0f172a;
            }
            .receipt-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px 24px;
            }
            .receipt-row {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              padding: 8px 0;
              border-bottom: 1px solid #eef2f7;
            }
            .receipt-label {
              color: #475569;
              font-weight: 600;
            }
            .receipt-value {
              text-align: right;
              color: #0f172a;
            }
            .receipt-card {
              border: 1px solid #dbe4ee;
              border-radius: 12px;
              padding: 14px 16px;
              margin-bottom: 12px;
            }
            .receipt-card h4 {
              margin: 0 0 10px;
              font-size: 15px;
            }
            .receipt-pills {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }
            .receipt-pill {
              background: #eff6ff;
              color: #1d4ed8;
              border-radius: 999px;
              padding: 8px 12px;
              font-size: 13px;
            }
            .receipt-empty {
              margin: 0;
              color: #64748b;
            }
            .receipt-footer {
              margin-top: 28px;
              padding-top: 18px;
              border-top: 2px solid #e2e8f0;
              color: #475569;
              font-size: 12px;
            }
            @media print {
              body {
                padding: 0;
                background: #ffffff;
              }
              .receipt-shell {
                border: none;
                border-radius: 0;
                max-width: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-shell">
            <div class="receipt-header">
              <div class="receipt-brand">
                <img class="receipt-logo" src="${logoUrl}" alt="MediGPlus Healthcare logo" />
                <div class="receipt-brand-copy">
                  <h1>Employee Visit Receipt</h1>
                  <p>Consolidated nurse, doctor, and pharmacist visit details.</p>
                </div>
              </div>
              <div class="receipt-badge">Visit ID: ${escapeHtml(visit.id)}</div>
            </div>

            <section class="receipt-section">
              <h2>Employee Summary</h2>
              <div class="receipt-grid">
                ${buildKeyValueRows([
                  ['Employee Name', employeeName],
                  ['Employee Code', visit.employee.employee_code],
                  ['Department', visit.employee.department],
                  ['Designation', visit.employee.designation],
                  ['Fitness Status', visit.employee.fitness_status],
                ])}
              </div>
            </section>

            <section class="receipt-section">
              <h2>Nurse Entry</h2>
              <div class="receipt-grid">
                ${buildKeyValueRows([
                  ['Visit Date', formatDate(visit.visit_date)],
                  ['Visit Time', formatTime(visit.visit_time)],
                  ['Visit Type', visit.visit_type],
                  ['Chief Complaint', visit.chief_complaint],
                  ['Symptoms', visit.symptoms],
                  ['Preliminary Notes', visit.preliminary_notes],
                  ['Follow-up Date', visit.follow_up_date ? formatDate(visit.follow_up_date) : ''],
                ])}
              </div>
              <div class="receipt-section">
                <h2>Vitals</h2>
                <div class="receipt-pills">${vitalsMarkup}</div>
              </div>
            </section>

            <section class="receipt-section">
              <h2>Doctor Entry</h2>
              <div class="receipt-grid">
                ${buildKeyValueRows([['Doctor', visit.doctor_name]])}
              </div>
              <div class="receipt-section">
                <h2>Diagnoses</h2>
                ${diagnosisMarkup}
              </div>
              <div class="receipt-section">
                <h2>Prescriptions</h2>
                ${prescriptionMarkup}
              </div>
            </section>

            <section class="receipt-section">
              <h2>Pharmacist Entry</h2>
              <div class="receipt-grid">
                ${buildKeyValueRows([
                  ['Dispensed Medicine', dispenseForm.medicine_name],
                  ['Quantity Dispensed', `${dispenseForm.quantity_dispensed} ${selectedMedicine.unit}`],
                  ['Issue Date', formatDate(dispenseForm.issue_date)],
                  ['Stock Available', `${dispenseForm.stock_available} ${selectedMedicine.unit}`],
                  ['Remaining Stock', `${dispenseForm.remaining_stock} ${selectedMedicine.unit}`],
                  ['Pharmacist Remarks', dispenseForm.remarks],
                ])}
              </div>
            </section>

            <div class="receipt-footer">
              Printed on ${escapeHtml(new Date().toLocaleString())}
            </div>
          </div>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=960,height=900');
    if (!printWindow) {
      show('Unable to open print window. Please allow pop-ups and try again.', 'error');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className={styles.pharmacistDashboard}>
        <Header title="Pharmacist Dashboard" subtitle="Manage prescriptions and inventory" />
        <div className={styles.loadingState}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.pharmacistDashboard}>
      <Header title="Pharmacist Dashboard" subtitle="Manage prescriptions and inventory" />

      {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

      <main className={styles.dashboardMain}>
        <div className={styles.tabsContainer}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'prescriptions' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('prescriptions')}
          >
            Prescriptions
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'inventory' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
        </div>

        {activeTab === 'prescriptions' ? (
          <div className={styles.prescriptionsTab}>
            <h3>Doctor-Prescribed Medicine Details</h3>

            {prescriptions.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No pending prescriptions to process</p>
              </div>
            ) : (
              <div className={styles.prescriptionsList}>
                {prescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className={`${styles.prescriptionListItem} ${prescription.is_dispensed ? styles.dispensedItem : ''}`}
                    onClick={() => prescription.medicine && !prescription.is_dispensed && handleOpenDispenseModal(prescription, prescription.medicine)}
                  >
                    <div className={styles.listItemMain}>
                      <div className={styles.listItemPatient}>
                        <span className={styles.patientName}>
                          {prescription.visit.employee.user.first_name} {prescription.visit.employee.user.last_name}
                        </span>
                        <span className={styles.employeeCode}>
                          {prescription.visit.employee.employee_code}
                        </span>
                      </div>
                      <div className={styles.listItemDate}>
                        <span>{new Date(prescription.visit.visit_date).toLocaleDateString()}</span>
                        {prescription.visit.visit_time && (
                          <span> {new Date(`2000-01-01T${prescription.visit.visit_time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.listItemMedicine}>
                      <span className={styles.medicineName}>{prescription.medicine_name}</span>
                      <span className={styles.medicineDetails}>
                        {prescription.dosage} | {prescription.frequency} | {prescription.duration_days}d
                      </span>
                    </div>
                    <div className={styles.listItemStatus}>
                      {prescription.is_dispensed ? (
                        <span className={styles.statusBadgeDispensed}>Dispensed</span>
                      ) : (
                        <span className={styles.statusBadgePending}>Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.inventoryTab}>
            <div className={styles.inventoryStats}>
              <div className={styles.statCard}>
                <h4>Total Medicine Stock</h4>
                <p>{totalStock}</p>
              </div>
              <div className={styles.statCard}>
                <h4>Used Medicine</h4>
                <p>{totalUsed}</p>
              </div>
              <div className={styles.statCard}>
                <h4>Remaining Medicine</h4>
                <p>{totalStock - totalUsed}</p>
              </div>
              <div className={styles.statCard}>
                <h4>Low Stock Items</h4>
                <p>{lowStockMedicines.length}</p>
              </div>
            </div>

            {lowStockMedicines.length > 0 && (
              <Card className={styles.alertCard}>
                <h4>⚠️ Low Stock Alerts</h4>
                <div className={styles.alertList}>
                  {lowStockMedicines.map((medicine) => (
                    <div key={medicine.id} className={styles.alertItem}>
                      <span>{medicine.name}</span>
                      <span className={styles.stockWarning}>
                        {medicine.stock_quantity} / {medicine.reorder_level}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Search medicines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              <Button type="button" variant="outline-secondary" onClick={fetchMedicines}>
                Refresh
              </Button>
            </div>

            <div className={styles.medicinesList}>
              {filteredMedicines.length === 0 ? (
                <div className={styles.emptyState}>No medicines found</div>
              ) : (
                filteredMedicines.map((medicine) => (
                  <Card key={medicine.id} className={styles.medicineCard}>
                    <div className={styles.medicineHeader}>
                      <div>
                        <h4>{medicine.name}</h4>
                        <span className={styles.medicineId}>{medicine.medicine_id}</span>
                      </div>
                      <div className={styles.stockLevel}>
                        <span className={styles.stockValue}>{medicine.stock_quantity}</span>
                        <span className={styles.stockUnit}>{medicine.unit}</span>
                      </div>
                    </div>

                    <div className={styles.medicineDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Supplier:</span>
                        <span>{medicine.supplier || '-'}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Batch Number:</span>
                        <span>{medicine.batch_number || '-'}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Expiry Date:</span>
                        <span className={medicine.is_expired ? styles.expired : ''}>
                          {medicine.expiry_date ? new Date(medicine.expiry_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Reorder Level:</span>
                        <span>{medicine.reorder_level}</span>
                      </div>
                    </div>

                    {medicine.is_low_stock && (
                      <div className={styles.lowStockBadge}>Low Stock</div>
                    )}
                    {medicine.is_expiring_soon && (
                      <div className={styles.expiringBadge}>Expiring Soon</div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Dispense Modal */}
      {showDispenseModal && selectedMedicine && selectedPrescription && (
        <div className={styles.modalOverlay} onClick={handleCloseDispenseModal}>
          <div onClick={(e) => e.stopPropagation()}>
            <Card className={styles.modalCard}>
              <div className={styles.modalHeader}>
                <h3>Dispense Medicine</h3>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={handleCloseDispenseModal}
                >
                  ×
                </button>
              </div>

            <div className={styles.modalContent}>
              <div className={styles.modalSection}>
                <h4>Employee Details</h4>
                <div className={styles.modalDetailRow}>
                  <span>Name:</span>
                  <span>
                    {selectedPrescription.visit.employee.user.first_name} {selectedPrescription.visit.employee.user.last_name}
                  </span>
                </div>
                <div className={styles.modalDetailRow}>
                  <span>Employee Code:</span>
                  <span>{selectedPrescription.visit.employee.employee_code}</span>
                </div>
                {selectedPrescription.visit.chief_complaint && (
                  <div className={styles.modalDetailRow}>
                    <span>Chief Complaint:</span>
                    <span>{selectedPrescription.visit.chief_complaint}</span>
                  </div>
                )}
                {selectedPrescription.visit.symptoms && (
                  <div className={styles.modalDetailRow}>
                    <span>Symptoms:</span>
                    <span>{selectedPrescription.visit.symptoms}</span>
                  </div>
                )}
              </div>

              {selectedPrescription.visit.vitals && Object.keys(selectedPrescription.visit.vitals).length > 0 && (
                <div className={styles.modalSection}>
                  <h4>Vital Signs</h4>
                  <div className={styles.vitalsGrid}>
                    {Object.entries(selectedPrescription.visit.vitals).map(([key, value]) => (
                      <div key={key} className={styles.vitalItem}>
                        <span className={styles.vitalLabel}>{key}:</span>
                        <span className={styles.vitalValue}>{String(value || '-')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.modalSection}>
                <h4>Medicine Details</h4>
                <div className={styles.modalDetailRow}>
                  <span>Medicine Name:</span>
                  <span>{dispenseForm.medicine_name}</span>
                </div>
                <div className={styles.modalDetailRow}>
                  <span>Stock Available:</span>
                  <span>{dispenseForm.stock_available} {selectedMedicine.unit}</span>
                </div>
                <div className={styles.modalDetailRow}>
                  <span>Remaining After Dispense:</span>
                  <span>{dispenseForm.remaining_stock} {selectedMedicine.unit}</span>
                </div>
              </div>

              <div className={styles.modalSection}>
                <h4>Prescription</h4>
                <div className={styles.modalDetailRow}>
                  <span>Dosage:</span>
                  <span>{selectedPrescription.dosage}</span>
                </div>
                <div className={styles.modalDetailRow}>
                  <span>Frequency:</span>
                  <span>{selectedPrescription.frequency}</span>
                </div>
                {selectedPrescription.instructions && (
                  <div className={styles.modalDetailRow}>
                    <span>Instructions:</span>
                    <span>{selectedPrescription.instructions}</span>
                  </div>
                )}
              </div>

              <div className={styles.formSection}>
                <h4>Dispense Details</h4>
                <FormInput
                  label="Quantity to Dispense *"
                  type="number"
                  value={dispenseForm.quantity_dispensed.toString()}
                  onChange={(value) => handleQuantityChange(value)}
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
              </div>

              <div className={styles.formSection}>
                <p className={styles.statusNote}>
                  Note: After dispensing, the visit status will be automatically set to "Completed".
                </p>
              </div>
            </div>

            <div className={styles.modalActions}>
              <Button
                type="button"
                variant="outline-brand"
                onClick={handlePrintReceipt}
              >
                Print
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={handleCloseDispenseModal}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="brand"
                onClick={handleDispense}
                loading={submitting}
              >
                Dispense & Complete
              </Button>
            </div>
          </Card>
        </div>
        </div>
      )}
    </div>
  );
};
