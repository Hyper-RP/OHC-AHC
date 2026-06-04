import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Alert } from '../ui';
import { getPharmacistPrescriptions } from '../../services/ohc';
import { handleApiError } from '../../services/api';
import { Role, VisitType } from '../../types';
import styles from './PharmacistDashboard.module.css';

interface PrescriptionItem {
  id: number;
  visit: {
    employee?: {
      user: { first_name: string; last_name: string };
      employee_code: string;
    } | null;
    employee_id?: string;
    patient_name?: string;
    visit_date: string;
    visit_time?: string;
    visit_type?: string;
  };
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  is_dispensed?: boolean;
  medicine?: any;
}

export const AnnualHealthPharmacistDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);

  useEffect(() => {
    if (!user || user.role !== Role.PHARMACIST) {
      navigate('/dashboard');
      return;
    }

    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const data = await getPharmacistPrescriptions();
        setPrescriptions((data || []).filter((item: PrescriptionItem) => item.visit?.visit_type === VisitType.PERIODIC));
      } catch (err) {
        const message = handleApiError(err, 'Failed to fetch annual health checkup prescriptions');
        setError(message);
        show(message, 'error');
      } finally {
        setLoading(false);
      }
    };

    void fetchPrescriptions();
  }, [navigate, show, user]);

  const pendingCount = useMemo(() => prescriptions.filter((item) => !item.is_dispensed).length, [prescriptions]);
  const getDisplayName = (prescription: PrescriptionItem) =>
    prescription.visit.patient_name ||
    `${prescription.visit.employee?.user.first_name || ''} ${prescription.visit.employee?.user.last_name || ''}`.trim() ||
    'N/A';
  const getDisplayCode = (prescription: PrescriptionItem) =>
    prescription.visit.employee_id || prescription.visit.employee?.employee_code || 'N/A';

  return (
    <div className={styles.pharmacistDashboard}>
      <Header title="Annual Health Check Up Pharmacist" subtitle="Manage medicine requests for annual health checkups" />

      <main className={styles.dashboardMain}>
        {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

        <div className={styles.inventoryStats}>
          <div className={styles.statCard}>
            <h4>Total Requests</h4>
            <p>{prescriptions.length}</p>
          </div>
          <div className={styles.statCard}>
            <h4>Pending Requests</h4>
            <p>{pendingCount}</p>
          </div>
          <div className={styles.statCard}>
            <h4>Dispensed Requests</h4>
            <p>{prescriptions.length - pendingCount}</p>
          </div>
        </div>

        <div className={styles.prescriptionsTab}>
          <h3>Annual Health Check Up Medicine Queue</h3>

          {loading ? (
            <div className={styles.loadingState}>Loading prescriptions...</div>
          ) : prescriptions.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No annual health checkup prescriptions to process</p>
            </div>
          ) : (
            <div className={styles.prescriptionsList}>
              {prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className={`${styles.prescriptionListItem} ${prescription.is_dispensed ? styles.dispensedItem : ''}`}
                  onClick={() => !prescription.is_dispensed && prescription.medicine && navigate(`/annual-health-pharmacist/request/${prescription.id}`)}
                >
                  <div className={styles.listItemMain}>
                    <div className={styles.listItemPatient}>
                      <span className={styles.patientName}>{getDisplayName(prescription)}</span>
                      <span className={styles.employeeCode}>{getDisplayCode(prescription)}</span>
                    </div>
                    <div className={styles.listItemDate}>
                      <span>{new Date(prescription.visit.visit_date).toLocaleDateString()}</span>
                      {prescription.visit.visit_time && (
                        <span> {new Date(`2000-01-01T${prescription.visit.visit_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.listItemMedicine}>
                    <span className={styles.medicineName}>{prescription.medicine_name}</span>
                    <span className={styles.medicineDetails}>
                      {prescription.dosage || '-'} | {prescription.frequency} | {prescription.duration_days}d
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
      </main>
    </div>
  );
};
