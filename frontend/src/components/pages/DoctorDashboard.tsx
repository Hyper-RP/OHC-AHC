import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Card, Alert, Button, FormInput } from '../ui';
import { StatusBadge, LastUpdated } from '../charts';
import { RefreshControl } from '../charts';
import { createDiagnosis } from '../../services/ohc';
import { listHospitals } from '../../services/ahc';
import { useDashboardData } from '../../hooks/useDashboardData';
import { FitnessDecision, Role, VisitStatus, VisitType, type Hospital } from '../../types';
import { FITNESS_DECISION_OPTIONS } from '../../utils/constants';
import { validatePrescriptions, formatSubmitError } from '../../utils/errorHandling';
import receiptLogo from '../../assets/mediGplus.png';
import { loadMedicineRecords } from './medicineInventory';
import styles from './DoctorDashboard.module.css';

interface PrescriptionInput {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions?: string;
}

const formatLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDateString = () => formatLocalDateString(new Date());

const getTomorrowDateString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatLocalDateString(tomorrow);
};

const FITNESS_STATUS_OPTIONS = [
  { value: '', label: 'Select fitness status' },
  ...FITNESS_DECISION_OPTIONS,
];

const OHC_VISIT_TYPES: string[] = [VisitType.WALK_IN, VisitType.FOLLOW_UP, VisitType.EMERGENCY];

interface Visit {
  id: number;
  visit_date: string;
  visit_time?: string;
  visit_type?: string;
  visit_status?: VisitStatus;
  chief_complaint?: string;
  symptoms?: string;
  vitals?: Record<string, unknown>;
  diagnoses?: Array<Record<string, unknown>>;
  prescriptions?: Array<{ id: number; medicine_name: string; dosage?: string }>;
  follow_up_date?: string;
  doctor_name?: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  patient_contact?: string;
  employee_name?: string;
  employee_id?: string;
  employee_department?: string;
  employee?: {
    user?: { first_name?: string; last_name?: string };
    employee_code?: string;
    department?: string;
  };
}

/**
 * Doctor Dashboard component
 * Shows visits assigned to the current doctor
 * Allows viewing details and adding diagnosis with prescriptions
 */
export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useSnackbar();

  const handleError = useCallback((err: Error) => {
    show(err.message, 'error');
  }, [show]);

  const [selectedFilter, setSelectedFilter] = useState<string>(VisitStatus.OPEN);

  const visitParams = useMemo(() => ({ visit_status: selectedFilter }), [selectedFilter]);

  // Fetch visits assigned to doctor, with manual refresh option
  const { data: visitsData, isLoading: loading, refetch, lastUpdated } = useDashboardData<{
    results?: Visit[];
  } | Visit[]>(
    '/ohc/visits/',
    visitParams,
    { onError: handleError }
  );

  const rawVisits = Array.isArray(visitsData) ? visitsData : (visitsData?.results || []);
  const visits = rawVisits.filter((visit: Visit) => OHC_VISIT_TYPES.includes(visit.visit_type || ''));

  // Track previous visit IDs to detect new visits
  const previousVisitIdsRef = useRef<Set<number>>(new Set());

  // Show new visits count after refresh
  useEffect(() => {
    if (visits.length > 0) {
      const currentIds = new Set<number>(visits.map((v: Visit) => v.id));
      const previousIds = previousVisitIdsRef.current;

      // Only show notification on refresh (when we had previous data)
      if (previousIds.size > 0) {
        const newVisits = visits.filter((v: Visit) => !previousIds.has(v.id));
        if (newVisits.length > 0) {
          show(`${newVisits.length} new visit${newVisits.length === 1 ? '' : 's'} assigned`, 'info');
        }
      }

      previousVisitIdsRef.current = currentIds;
    }
  }, [visits, show]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [hospitalOptions, setHospitalOptions] = useState<Array<{ value: string; label: string }>>([
    { value: '', label: 'Select hospital' },
  ]);

  const getVisitDisplayName = (visit: Visit) => {
    const explicitVisitName = visit.patient_name?.trim() || visit.employee_name?.trim();
    if (explicitVisitName) {
      return explicitVisitName;
    }

    const firstName = visit.employee?.user?.first_name || '';
    const lastName = visit.employee?.user?.last_name || '';
    const linkedEmployeeName = `${firstName} ${lastName}`.trim();
    return linkedEmployeeName || 'N/A';
  };

  const getVisitDisplayCode = (visit: Visit) => {
    return visit.employee_id || visit.employee?.employee_code || 'N/A';
  };

  const getVisitDisplayDepartment = (visit: Visit) => {
    return visit.employee_department || visit.employee?.department || 'N/A';
  };

  const getVisitDisplayTime = (visit: Visit) => {
    if (!visit.visit_time) {
      return 'N/A';
    }

    const time = new Date(`2000-01-01T${visit.visit_time}`);
    if (Number.isNaN(time.getTime())) {
      return visit.visit_time;
    }

    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Fetch medicines for dropdown
  const [medicines, setMedicines] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const data = loadMedicineRecords();
        const medicineNames = Array.from(
          new Set<string>(
            data
              .filter((medicine) => medicine.stock > 0)
              .map((medicine) => String(medicine.name || '').trim())
              .filter((name: string) => Boolean(name)),
          ),
        ).sort((left, right) => left.localeCompare(right));
        const inStockMedicines = [
          { value: '', label: 'Select medicine' },
          ...medicineNames.map((name) => ({ value: name, label: name })),
        ];
        setMedicines(inStockMedicines);
      } catch (err) {
        console.error('Failed to fetch medicines:', err);
      }
    };
    fetchMedicines();
  }, []);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await listHospitals({ status: 'ACTIVE', page_size: 100 });
        const hospitals = (response.results || []) as Hospital[];
        setHospitalOptions([
          { value: '', label: 'Select hospital' },
          ...hospitals.map((hospital) => ({
            value: String(hospital.id),
            label: hospital.name,
          })),
        ]);
      } catch (err) {
        console.error('Failed to fetch hospitals:', err);
      }
    };

    fetchHospitals();
  }, []);

  // Diagnosis form state
  const [diagnosisName, setDiagnosisName] = useState('');
  const [examinationNotes, setExaminationNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [fitnessDecision, setFitnessDecision] = useState<FitnessDecision | ''>('');
  const [requiresReferral, setRequiresReferral] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');

  // Prescriptions state
  const [prescriptions, setPrescriptions] = useState<PrescriptionInput[]>([
    {
      medicine_name: '',
      dosage: '',
      frequency: '',
      duration_days: 7,
      instructions: '',
    },
  ]);
  const minimumFollowUpDate = getTomorrowDateString();

  useEffect(() => {
    if (!user || user.role !== Role.DOCTOR) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleViewVisit = (visitId: number) => {
    navigate(`/doctor/request/${visitId}`);
  };

  const handleCloseDetail = () => {
    setSelectedVisit(null);
    setShowDiagnosisForm(false);
    resetForm();
  };

  const handleOpenDiagnosisForm = () => {
    setShowDiagnosisForm(true);
  };

  const resetForm = () => {
    setDiagnosisName('');
    setExaminationNotes('');
    setFollowUpDate('');
    setFitnessDecision('');
    setRequiresReferral(false);
    setSelectedHospitalId('');
    setFieldErrors({});
    setPrescriptions([
      {
        medicine_name: '',
        dosage: '',
        frequency: '',
        duration_days: 7,
        instructions: '',
      },
    ]);
  };

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

  const handlePrintVisit = () => {
    if (!selectedVisit) return;

    const employeeName = getVisitDisplayName(selectedVisit);
    const doctorName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Doctor';
    const logoUrl = new URL(receiptLogo, window.location.origin).href;
    const vitalsSummary =
      selectedVisit.vitals && Object.keys(selectedVisit.vitals).length > 0
        ? Object.entries(selectedVisit.vitals)
            .map(
              ([key, value]) =>
                `<div class="vital-chip"><strong>${escapeHtml(formatFieldLabel(key))}:</strong> ${escapeHtml(
                  String(value),
                )}</div>`,
            )
            .join('')
        : 'No vitals recorded';
    const prescriptionRows = prescriptions.filter((item) => item.medicine_name.trim() !== '');
    const prescriptionsMarkup =
      prescriptionRows.length > 0
        ? `
          <table class="medicine-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Medicine</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${prescriptionRows
                .map(
                  (prescription, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${escapeHtml([prescription.medicine_name, prescription.dosage].filter(Boolean).join(' ') || '-')}</td>
                      <td>${escapeHtml(prescription.frequency || '-')}</td>
                      <td>${escapeHtml(
                        prescription.duration_days ? `${prescription.duration_days} day(s)` : '-',
                      )}</td>
                      <td>${escapeHtml(prescription.instructions || '-')}</td>
                    </tr>
                  `,
                )
                .join('')}
            </tbody>
          </table>
        `
        : '<div class="plain-line">No medicines added.</div>';
    const selectedHospitalName =
      hospitalOptions.find((hospital) => hospital.value === selectedHospitalId)?.label || '-';

    const printHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Doctor Visit Print</title>
          <style>
            @page { margin: 18mm; }
            body { margin: 0; padding: 0; font-family: "Times New Roman", Georgia, serif; color: #111111; background: #ffffff; }
            .sheet { max-width: 760px; margin: 0 auto; padding: 18px 24px 12px; }
            .header { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; padding-bottom: 8px; border-bottom: 1px solid #111111; }
            .logo { width: 150px; height: auto; display: block; }
            .meta { text-align: right; font-size: 12px; line-height: 1.5; }
            .section { padding: 8px 0 6px; border-bottom: 1px solid #111111; }
            .section-title { margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; }
            .row { display: flex; justify-content: flex-start; gap: 28px; flex-wrap: wrap; font-size: 12px; line-height: 1.45; margin-top: 4px; }
            .row div { min-width: 210px; }
            .single-line { font-size: 12px; line-height: 1.45; margin-top: 4px; }
            .plain-line { font-size: 12px; line-height: 1.45; margin-top: 4px; }
            .vitals-grid { display: flex; flex-wrap: wrap; gap: 6px 12px; margin-top: 6px; }
            .vital-chip { font-size: 12px; line-height: 1.45; min-width: 140px; }
            .medicine-table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 12px; }
            .medicine-table th, .medicine-table td { border: 1px solid #111111; padding: 6px 8px; text-align: left; vertical-align: top; line-height: 1.35; }
            .medicine-table th { font-weight: 700; background: #f4f4f4; }
            .signature-wrap { display: flex; justify-content: flex-end; margin-top: 34px; }
            .signature-box { width: 220px; text-align: center; }
            .signature-mark { font-family: "Brush Script MT", "Segoe Script", cursive; font-size: 28px; line-height: 1; margin-bottom: 6px; }
            .signature-name { font-size: 12px; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <img class="logo" src="${logoUrl}" alt="MediGPlus Healthcare logo" />
              <div class="meta">
                <div><strong>Date:</strong> ${escapeHtml(formatDate(selectedVisit.visit_date))}</div>
                <div><strong>Time:</strong> ${escapeHtml(formatTime(selectedVisit.visit_time))}</div>
                <div><strong>Visit No:</strong> ${escapeHtml(selectedVisit.id)}</div>
              </div>
            </div>

            <section class="section">
              <h2 class="section-title">Employee Details</h2>
              <div class="single-line"><strong>Employee Name:</strong> ${escapeHtml(employeeName)}</div>
              <div class="row">
                <div><strong>Employee Code:</strong> ${escapeHtml(getVisitDisplayCode(selectedVisit))}</div>
                <div><strong>Department:</strong> ${escapeHtml(getVisitDisplayDepartment(selectedVisit))}</div>
                ${fitnessDecision
                  ? `<div><strong>Fitness Status:</strong> ${escapeHtml(formatFieldLabel(fitnessDecision))}</div>`
                  : ''}
              </div>
            </section>

            <section class="section">
              <h2 class="section-title">Visit Notes</h2>
              <div class="plain-line"><strong>Chief Complaint:</strong> ${escapeHtml(selectedVisit.chief_complaint || '-')}</div>
              <div class="plain-line"><strong>Symptoms:</strong> ${escapeHtml(selectedVisit.symptoms || '-')}</div>
              <div class="plain-line"><strong>Examination:</strong> ${escapeHtml(examinationNotes || '-')}</div>
              <div class="plain-line"><strong>Diagnosis:</strong> ${escapeHtml(diagnosisName || '-')}</div>
            </section>

            <section class="section">
              <h2 class="section-title">Vitals</h2>
              <div class="vitals-grid">${vitalsSummary}</div>
            </section>

            <section class="section">
              <h2 class="section-title">Medicines</h2>
              ${prescriptionsMarkup}
            </section>

            ${requiresReferral
              ? `
            <section class="section">
              <h2 class="section-title">Referral</h2>
              <div class="plain-line"><strong>Referral Required:</strong> Yes</div>
              ${selectedHospitalId
                ? `<div class="plain-line"><strong>Hospital:</strong> ${escapeHtml(selectedHospitalName)}</div>`
                : ''}
              ${followUpDate
                ? `<div class="plain-line"><strong>Follow-up Date:</strong> ${escapeHtml(formatDate(followUpDate))}</div>`
                : ''}
            </section>`
              : ''}

            <div class="signature-wrap">
              <div class="signature-box">
                <div class="signature-mark">${escapeHtml(doctorName)}</div>
                <div class="signature-name">${escapeHtml(doctorName)}</div>
              </div>
            </div>

            <script>
              window.onload = function () {
                window.print();
              };
            </script>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=960,height=900');
    if (!printWindow) {
      show('Unable to open print window. Please allow pop-ups and try again.', 'error');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  const handleAddPrescription = () => {
    setPrescriptions((prev) => [
      ...prev,
      {
        medicine_name: '',
        dosage: '',
        frequency: '',
        duration_days: 7,
        instructions: '',
      },
    ]);
  };

  const handleRemovePrescription = (index: number) => {
    if (prescriptions.length > 1) {
      setPrescriptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handlePrescriptionChange = (
    index: number,
    field: keyof PrescriptionInput,
    value: string | number
  ) => {
    setPrescriptions((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    );
    setFieldErrors(prev => ({ ...prev, [`prescriptions_${index}_${field}`]: '' }));
  };

  const handleSubmitDiagnosis = async () => {
    if (!selectedVisit) return;

    setFieldErrors({});
    setError('');

    if (!diagnosisName.trim()) {
      setFieldErrors({ diagnosisName: 'Diagnosis is required' });
      show('Please enter diagnosis', 'error');
      return;
    }

    if (requiresReferral && !selectedHospitalId) {
      setFieldErrors({ selectedHospitalId: 'Please select hospital' });
      show('Please select a hospital for the referral', 'error');
      return;
    }

    if (!fitnessDecision) {
      setFieldErrors({ fitnessDecision: 'Please select fitness status' });
      show('Please select fitness status', 'error');
      return;
    }

    if (followUpDate && followUpDate <= getTodayDateString()) {
      setFieldErrors({ followUpDate: 'Follow-up date must be after today' });
      show('Please select a follow-up date after today', 'error');
      return;
    }

    const prescriptionValidation = validatePrescriptions(prescriptions);
    if (!prescriptionValidation.isValid) {
      const errorsMap = prescriptionValidation.errors.reduce((acc, err) => {
        acc[err.field] = err.message;
        return acc;
      }, {} as Record<string, string>);
      setFieldErrors(prev => ({ ...prev, ...errorsMap }));
      show('Please correct the prescription errors', 'error');
      return;
    }

    const validPrescriptions = prescriptions.filter((p) => p.medicine_name.trim() !== '');

    setSubmitting(true);
    try {
      const diagnosisData = {
        visit: selectedVisit.id,
        diagnosis_code: '',
        diagnosis_name: diagnosisName,
        diagnosis_notes: examinationNotes || '',
        severity: 'MILD' as const,
        is_primary: true,
        is_referral_required: requiresReferral,
        hospital: requiresReferral ? Number(selectedHospitalId) : undefined,
        fitness_decision: fitnessDecision as FitnessDecision,
        work_restrictions: '',
        advised_rest_days: 0,
        follow_up_date: followUpDate || undefined,
        prescriptions: validPrescriptions.map((p) => ({
          ...p,
          start_date: new Date().toISOString().split('T')[0],
          status: 'ACTIVE' as const,
        })),
      };

      const result = await createDiagnosis(diagnosisData);

      show('Diagnosis and prescriptions submitted successfully!', 'success');
      handleCloseDetail();
      refetch();

      if (result.referral) {
        show(`Referral created: ${result.referral.referral_status}`, 'info');
      }
    } catch (err) {
      const errorMessage = formatSubmitError(err);
      setError(errorMessage);
      show(errorMessage, 'error');

      if (err && typeof err === 'object') {
        const apiErrors = err as Record<string, unknown>;
        const errorFields: Record<string, string> = {};
        Object.entries(apiErrors).forEach(([key, value]) => {
          if (key !== 'detail' && key !== 'non_field_errors') {
            if (Array.isArray(value)) {
              errorFields[key] = value[0] as string;
            } else if (typeof value === 'string') {
              errorFields[key] = value;
            }
          }
        });
        if (Object.keys(errorFields).length > 0) {
          setFieldErrors(errorFields);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.doctorDashboard}>
        <Header title="Doctor Dashboard" subtitle="Manage your assigned patient visits" />
        <div className={styles.loadingState}>Loading visits...</div>
      </div>
    );
  }

  return (
    <div className={styles.doctorDashboard}>
      <Header title="Doctor Dashboard" subtitle="Manage your assigned patient visits" />

      {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

      <main className={styles.dashboardMain}>
        <div className={styles.headerRow}>
          <h2>Assigned Visits</h2>
          <div className={styles.filterBar}>
            <span>{visits.length} visit{visits.length === 1 ? '' : 's'}</span>
            <FormInput
              type="select"
              value={selectedFilter}
              onChange={setSelectedFilter}
              options={[
                { value: VisitStatus.OPEN, label: 'OPEN' },
                { value: VisitStatus.IN_PROGRESS, label: 'IN PROGRESS' },
                { value: VisitStatus.COMPLETED, label: 'COMPLETED' },
                { value: VisitStatus.REFERRED, label: 'REFERRED' },
              ]}
              className={styles.filterSelect}
            />
            <LastUpdated lastUpdated={lastUpdated} isLoading={loading} />
            <RefreshControl onRefresh={refetch} isRefreshing={loading} label="Refresh" />
          </div>
        </div>

        {visits.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No visits assigned to you.</p>
            <p>Create a new visit from the OHC Visit Form to get started.</p>
          </div>
        ) : (
          <div className={styles.visitsList}>
            <div className={styles.listHeader}>
              <div className={styles.columnHeader}>Employee</div>
              <div className={styles.columnHeader}>Department</div>
              <div className={styles.columnHeader}>Date</div>
              <div className={styles.columnHeader}>Status</div>
            </div>
            {visits.map((visit: Visit) => (
              <div key={visit.id} className={styles.visitListItem} onClick={() => handleViewVisit(visit.id)}>
                <div className={styles.listCell}>
                  <span className={styles.patientName}>
                    {getVisitDisplayName(visit)}
                  </span>
                  <span className={styles.employeeCode}>
                    {getVisitDisplayCode(visit)}
                  </span>
                </div>
                <div className={styles.listCell}>
                  <span className={styles.value}>{getVisitDisplayDepartment(visit)}</span>
                </div>
                <div className={styles.listCell}>
                  <span className={styles.value}>
                    {new Date(visit.visit_date).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.listCell}>
                  <StatusBadge status={visit.visit_status} size="medium" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedVisit && (
        <Card className={styles.visitDetailCard}>
          <div className={styles.detailHeader}>
            <h3>Visit Details</h3>
            <div className={styles.detailActions}>
              <Button
                type="button"
                variant="outline-brand"
                onClick={handlePrintVisit}
              >
                Print
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={handleCloseDetail}
              >
                Close
              </Button>
            </div>
          </div>

          <div className={styles.detailContent}>
            <div className={styles.patientInfo}>
              <div>
                <span className={styles.label}>Employee:</span>
                <span>{getVisitDisplayName(selectedVisit)}</span>
              </div>
              <div>
                <span className={styles.label}>Employee Code:</span>
                <span>{getVisitDisplayCode(selectedVisit)}</span>
              </div>
              <div>
                <span className={styles.label}>Department:</span>
                <span>{getVisitDisplayDepartment(selectedVisit)}</span>
              </div>
              {selectedVisit.patient_name && selectedVisit.patient_name.trim() !== getVisitDisplayName(selectedVisit) && (
                <div>
                  <span className={styles.label}>Employee Name:</span>
                  <span>{selectedVisit.patient_name}</span>
                </div>
              )}
              {selectedVisit.patient_age && (
                <div>
                  <span className={styles.label}>Age:</span>
                  <span>{selectedVisit.patient_age} years</span>
                </div>
              )}
              {selectedVisit.patient_gender && (
                <div>
                  <span className={styles.label}>Gender:</span>
                  <span>{selectedVisit.patient_gender}</span>
                </div>
              )}
              {selectedVisit.patient_contact && (
                <div>
                  <span className={styles.label}>Contact:</span>
                  <span>{selectedVisit.patient_contact}</span>
                </div>
              )}
            </div>

            <div className={styles.visitInfo}>
              <div>
                <span className={styles.label}>Visit Date:</span>
                <span>{new Date(selectedVisit.visit_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className={styles.label}>Visit Time:</span>
                <span>{getVisitDisplayTime(selectedVisit)}</span>
              </div>
              <div>
                <span className={styles.label}>Status:</span>
                <StatusBadge status={selectedVisit.visit_status} size="medium" />
              </div>
            </div>

            <div className={styles.vitals}>
              <h4>Vital Signs</h4>
              {selectedVisit.vitals && Object.entries(selectedVisit.vitals).map(([key, value]) => (
                <div key={key} className={styles.vitalItem}>
                  <span className={styles.vitalLabel}>{key}:</span>
                  <span className={styles.vitalValue}>{String(value || '-')}</span>
                </div>
              ))}
              {!selectedVisit.vitals && <p>No vitals recorded</p>}
            </div>

            {(selectedVisit.visit_status === VisitStatus.IN_PROGRESS ||
              selectedVisit.visit_status === VisitStatus.COMPLETED ||
              selectedVisit.visit_status === VisitStatus.REFERRED) &&
              selectedVisit.prescriptions &&
              selectedVisit.prescriptions.length > 0 && (
              <div className={styles.section}>
                <h4>Medicines Prescribed</h4>
                <div className={styles.medicinesList}>
                  {selectedVisit.prescriptions.map((prescription: { id: number; medicine_name: string; dosage?: string }) => (
                    <div key={prescription.id} className={styles.medicineItem}>
                      <span className={styles.medicineName}>{prescription.medicine_name}</span>
                      <span className={styles.medicineDosage}>{prescription.dosage}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedVisit.visit_status === VisitStatus.OPEN && (
              <div className={styles.actionSection}>
                {!showDiagnosisForm ? (
                  <Button type="button" variant="brand" onClick={handleOpenDiagnosisForm}>
                    Add Diagnosis
                  </Button>
                ) : (
                  <>
                    <div className={styles.diagnosisForm}>
                      <h4>Diagnosis / Observation</h4>
                      <div className={styles.formGrid}>
                        <FormInput
                          label="Examination"
                          value={examinationNotes}
                          onChange={(value) => { setExaminationNotes(value); setFieldErrors(prev => ({ ...prev, examinationNotes: '' })); }}
                          type="textarea"
                          rows={3}
                          placeholder="Enter examination findings"
                        />
                        <FormInput
                          label="Diagnosis / Observation *"
                          value={diagnosisName}
                          onChange={(value) => { setDiagnosisName(value); setFieldErrors(prev => ({ ...prev, diagnosisName: '' })); }}
                          type="textarea"
                          rows={3}
                          required
                          error={fieldErrors.diagnosisName}
                        />
                        <FormInput
                          label="Follow-up Date (Optional)"
                          type="date"
                          value={followUpDate}
                          onChange={(value) => { setFollowUpDate(value); setFieldErrors(prev => ({ ...prev, followUpDate: '' })); }}
                          min={minimumFollowUpDate}
                          error={fieldErrors.followUpDate}
                        />
                        <FormInput
                          label="Fitness Status *"
                          type="select"
                          value={fitnessDecision}
                          onChange={(value) => {
                            setFitnessDecision(value as FitnessDecision | '');
                            setFieldErrors((prev) => ({ ...prev, fitnessDecision: '' }));
                          }}
                          options={FITNESS_STATUS_OPTIONS}
                          required
                          error={fieldErrors.fitnessDecision}
                        />
                      </div>

                      <div className={styles.referralSection}>
                        <label className={styles.checkboxRow}>
                          <input
                            type="checkbox"
                            checked={requiresReferral}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setRequiresReferral(checked);
                              setFieldErrors((prev) => ({ ...prev, selectedHospitalId: '' }));
                              if (!checked) {
                                setSelectedHospitalId('');
                              }
                            }}
                          />
                          <span>Referral required</span>
                        </label>

                        {requiresReferral && (
                          <FormInput
                            label="Hospital Name *"
                            type="select"
                            value={selectedHospitalId}
                            onChange={(value) => {
                              setSelectedHospitalId(value);
                              setFieldErrors((prev) => ({ ...prev, selectedHospitalId: '' }));
                            }}
                            options={hospitalOptions}
                            required
                            error={fieldErrors.selectedHospitalId}
                          />
                        )}
                      </div>

                      <h4>Medicine Given to Employee</h4>
                      {prescriptions.map((prescription, index) => (
                        <div key={index} className={styles.prescriptionRow}>
                          {prescriptions.length > 1 && (
                            <button
                              type="button"
                              className={styles.removePrescriptionBtn}
                              onClick={() => handleRemovePrescription(index)}
                            >
                              Ã—
                            </button>
                          )}
                          <div className={styles.prescriptionForm}>
                            <FormInput
                              type="select"
                              label={`Medicine Name ${prescriptions.length > 1 ? index + 1 : ''} *`}
                              value={prescription.medicine_name}
                              onChange={(value) => handlePrescriptionChange(index, 'medicine_name', value)}
                              options={medicines}
                              required
                              error={fieldErrors[`prescriptions_${index}_medicine_name`]}
                            />
                            <FormInput
                              label="Dosage *"
                              value={prescription.dosage}
                              onChange={(value) => handlePrescriptionChange(index, 'dosage', value)}
                              placeholder="e.g., 500mg"
                              required
                              error={fieldErrors[`prescriptions_${index}_dosage`]}
                            />
                            <FormInput
                              label="Frequency *"
                              value={prescription.frequency}
                              onChange={(value) => handlePrescriptionChange(index, 'frequency', value)}
                              placeholder="e.g., 3 times daily"
                              required
                              error={fieldErrors[`prescriptions_${index}_frequency`]}
                            />
                            <FormInput
                              label="Duration (days) *"
                              type="number"
                              value={prescription.duration_days.toString()}
                              onChange={(value) => handlePrescriptionChange(index, 'duration_days', value)}
                              min="1"
                              required
                              error={fieldErrors[`prescriptions_${index}_duration_days`]}
                            />
                            <FormInput
                              label="Instructions (Optional)"
                              type="textarea"
                              value={prescription.instructions || ''}
                              onChange={(value) => handlePrescriptionChange(index, 'instructions', value)}
                              rows={2}
                              placeholder="Dosage instructions for employee"
                            />
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={handleAddPrescription}
                      >
                        + Add Medicine
                      </Button>
                    </div>

                    <div className={styles.formActions}>
                      <Button
                        type="button"
                        variant="outline-brand"
                        onClick={handlePrintVisit}
                      >
                        Print
                      </Button>
                      <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={() => setShowDiagnosisForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="brand"
                        onClick={handleSubmitDiagnosis}
                        loading={submitting}
                      >
                        Submit to Pharmacist
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
