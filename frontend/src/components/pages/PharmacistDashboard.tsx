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
import styles from './PharmacistDashboard.module.css';

interface PrescriptionItem {
  id: number;
  visit: {
    id: number;
    employee: {
      user: { first_name: string; last_name: string };
      employee_code: string;
    };
    visit_date: string;
    visit_time?: string;
    vitals?: Record<string, any>;
    chief_complaint?: string;
    symptoms?: string;
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
                  <Card key={prescription.id} className={styles.prescriptionCard}>
                    <div className={styles.prescriptionHeader}>
                      <div>
                        <span className={styles.patientName}>
                          {prescription.visit.employee.user.first_name} {prescription.visit.employee.user.last_name}
                        </span>
                        <span className={styles.employeeCode}>
                          {prescription.visit.employee.employee_code}
                        </span>
                        <span className={styles.visitDate}>
                          {new Date(prescription.visit.visit_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={styles.medicineInfo}>
                        <span>Medicine: {prescription.medicine_name}</span>
                        <span>Dosage: {prescription.dosage} | Freq: {prescription.frequency} | Duration: {prescription.duration_days} days</span>
                        {prescription.instructions && <span>Instructions: {prescription.instructions}</span>}
                      </div>
                    </div>

                    {prescription.visit.vitals && Object.keys(prescription.visit.vitals).length > 0 && (
                      <div className={styles.prescriptionVitals}>
                        <strong>Vitals:</strong> {Object.entries(prescription.visit.vitals).map(([key, value]) => (
                          <span key={key} className={styles.vitalTag}>{key}: {value}</span>
                        ))}
                      </div>
                    )}
                    {prescription.visit.chief_complaint && (
                      <div className={styles.prescriptionVitals}>
                        <strong>Complaint:</strong> {prescription.visit.chief_complaint}
                      </div>
                    )}

                    {!prescription.is_dispensed && (
                      <Button
                        type="button"
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => prescription.medicine && handleOpenDispenseModal(prescription, prescription.medicine)}
                      >
                        Dispense
                      </Button>
                    )}
                  </Card>
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
                <h4>Patient Details</h4>
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