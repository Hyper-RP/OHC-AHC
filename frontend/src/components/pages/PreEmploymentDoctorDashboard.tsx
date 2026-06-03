import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Card, Alert, Button, FormInput } from '../ui';
import { StatusBadge } from '../charts';
import { RefreshControl } from '../charts';
import api from '../../services/api';
import { FitnessDecision, Role, VisitStatus, VisitType } from '../../types';
import { FITNESS_DECISION_OPTIONS } from '../../utils/constants';
import styles from './PreEmploymentDoctorDashboard.module.css';

interface PrescriptionInput {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions?: string;
}

interface PreEmploymentVisit {
  id: number;
  employee?: {
    id: number;
    employee_code: string;
    user: { first_name: string; last_name: string };
    department: string;
  } | null;
  candidate_id?: string;
  candidate_department?: string;
  candidate_designation?: string;
  employee_name?: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_contact: string;
  visit_date: string;
  visit_time: string;
  vitals: {
    temperature?: string;
    blood_pressure?: string;
    pulse?: string;
    spo2?: string;
    weight?: string;
    height?: string;
  };
  visit_status: VisitStatus;
  consulted_doctor: {
    user: { first_name: string; last_name: string };
  };
}

/**
 * Pre-Employment Doctor Dashboard component
 * Shows pre-employment checkup visits assigned to the current doctor
 * Allows adding diagnosis with optional medicines
 */
export const PreEmploymentDoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useSnackbar();

  const handleError = useCallback((err: Error) => {
    show(err.message, 'error');
  }, [show]);

  const [selectedFilter, setSelectedFilter] = useState<string>(VisitStatus.OPEN);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedVisit, setSelectedVisit] = useState<PreEmploymentVisit | null>(null);
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);

  // Fetch pre-employment visits
  const [visits, setVisits] = useState<PreEmploymentVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFilter) params.append('visit_status', selectedFilter);
      params.append('visit_type', VisitType.PRE_EMPLOYMENT);

      const response = await api.get(`/ohc/visits/?${params.toString()}`);
      const visitsData = response.data.results || response.data || [];
      setVisits(Array.isArray(visitsData) ? visitsData : []);
      setLastUpdated(new Date());
    } catch (err) {
      handleError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [selectedFilter, handleError]);

  useEffect(() => {
    if (!user || user.role !== Role.DOCTOR) {
      setError('Access restricted to doctors only');
      navigate('/dashboard');
      return;
    }
    fetchVisits();
  }, [user, navigate, fetchVisits]);

  // Diagnosis form state
  const [diagnosisName, setDiagnosisName] = useState('');
  const [examinationNotes, setExaminationNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [fitnessDecision, setFitnessDecision] = useState<FitnessDecision | ''>('');

  // NEW: Medicine required checkbox for pre-employment
  const [medicineRequired, setMedicineRequired] = useState(false);

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

  // Fetch medicines for dropdown
  const [medicines, setMedicines] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await api.get('/ohc/medicines/');
        const medicineData = response.data.results || response.data || [];
        const inStockMedicines = [
          { value: '', label: 'Select medicine' },
          ...medicineData
            .filter((m: any) => m.stock_quantity > 0)
            .map((m: any) => ({ value: m.name, label: m.name })),
        ];
        setMedicines(inStockMedicines);
      } catch (err) {
        console.error('Failed to fetch medicines:', err);
      }
    };
    fetchMedicines();
  }, []);

  const handleViewVisit = (visitId: number) => {
    navigate(`/pre-employment-doctor/request/${visitId}`);
  };

  const getDisplayName = (visit: PreEmploymentVisit) =>
    visit.patient_name ||
    visit.employee_name ||
    `${visit.employee?.user.first_name || ''} ${visit.employee?.user.last_name || ''}`.trim() ||
    'N/A';

  const getDisplayCode = (visit: PreEmploymentVisit) => visit.candidate_id || visit.employee?.employee_code || 'N/A';
  const getDisplayDepartment = (visit: PreEmploymentVisit) => visit.candidate_department || visit.employee?.department || 'N/A';

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
    setMedicineRequired(false);
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

  const handleAddPrescription = () => {
    setPrescriptions([
      ...prescriptions,
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
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handlePrescriptionChange = (index: number, field: keyof PrescriptionInput, value: any) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

    if (!fitnessDecision) {
      setFieldErrors({ fitnessDecision: 'Please select fitness status' });
      show('Please select fitness status', 'error');
      return;
    }

    // If medicine is required, validate prescriptions
    if (medicineRequired) {
      const hasValidPrescription = prescriptions.some(p => p.medicine_name.trim() !== '');
      if (!hasValidPrescription) {
        setFieldErrors({ prescriptions: 'At least one medicine is required when medicine is marked as required' });
        show('Please add at least one medicine or uncheck "Medicine Required"', 'error');
        return;
      }
    }

    // Validate prescription fields if medicines are required
    if (medicineRequired) {
      for (let i = 0; i < prescriptions.length; i++) {
        const p = prescriptions[i];
        if (p.medicine_name.trim()) {
          /* if (!p.dosage.trim()) {
            setFieldErrors({ [`prescription_${i}_dosage`]: 'Dosage is required' });
            show('Please enter dosage for all medicines', 'error');
            return;
          } */
          if (!p.frequency.trim()) {
            setFieldErrors({ [`prescription_${i}_frequency`]: 'Frequency is required' });
            show('Please enter frequency for all medicines', 'error');
            return;
          }
        }
      }
    }

    if (followUpDate && followUpDate <= getTodayDateString()) {
      setFieldErrors({ followUpDate: 'Follow-up date must be after today' });
      show('Please select a follow-up date after today', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const validPrescriptions = prescriptions.filter(p => p.medicine_name.trim() !== '');

      const diagnosisData = {
        visit: selectedVisit.id,
        diagnosis_code: '',
        diagnosis_name: diagnosisName,
        diagnosis_notes: examinationNotes || '',
        examination_notes: examinationNotes || '',
        severity: 'MILD' as const,
        condition_status: 'ACTIVE' as const,
        fitness_decision: fitnessDecision,
        work_restrictions: '',
        advised_rest_days: 0,
        follow_up_date: followUpDate || null,
        prescriptions: medicineRequired ? validPrescriptions : [],
      };

      await api.post('/ohc/diagnosis-prescriptions/', diagnosisData);
      show('Diagnosis created successfully!', 'success');
      handleCloseDetail();
      fetchVisits();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create diagnosis';
      setError(errorMessage);
      show(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getVitalsDisplay = (vitals: Record<string, string>) => {
    const entries = Object.entries(vitals).filter(([_, v]) => v && v.trim() !== '');
    if (entries.length === 0) return null;

    return (
      <div className={styles.vitalsDisplay}>
        {entries.map(([key, value]) => (
          <div key={key} className={styles.vitalChip}>
            <strong>{key.replace(/_/g, ' ')}:</strong> {value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.dashboard}>
      <Header title="Pre-Employment Checkup - Doctor" subtitle="Review and diagnose pre-employment medical checkups" />

      <main className={styles.dashboardMain}>
        {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

        {!selectedVisit ? (
          <Card>
            <div className={styles.cardHeader}>
              <h2>Assigned Pre-Employment Checkups</h2>
              <RefreshControl onRefresh={fetchVisits} lastUpdated={lastUpdated} />
            </div>

            <div className={styles.filterTabs}>
              {Object.values(VisitStatus).map((status) => (
                <button
                  key={status}
                  className={`${styles.filterTab} ${selectedFilter === status ? styles.active : ''}`}
                  onClick={() => setSelectedFilter(status)}
                >
                  {status.replace('_', ' ')}
                  {visits.filter((v) => v.visit_status === status).length > 0 && (
                    <span className={styles.count}>{
                      visits.filter((v) => v.visit_status === status).length
                    }</span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className={styles.loading}>Loading visits...</div>
            ) : visits.length === 0 ? (
              <div className={styles.emptyState}>No pre-employment checkups found</div>
            ) : (
              <div className={styles.visitsList}>
                {visits.map((visit) => (
                  <div key={visit.id} className={styles.visitCard} onClick={() => handleViewVisit(visit.id)}>
                    <div className={styles.visitHeader}>
                      <div className={styles.visitInfo}>
                        <h3>{getDisplayName(visit)}</h3>
                        <p className={styles.employeeCode}>{getDisplayCode(visit)}</p>
                        <p className={styles.department}>{getDisplayDepartment(visit)}</p>
                      </div>
                      <StatusBadge status={visit.visit_status} />
                    </div>
                    <div className={styles.visitDetails}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Age:</span>
                        <span>{visit.patient_age || 'N/A'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Gender:</span>
                        <span>{visit.patient_gender || 'N/A'}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Date:</span>
                        <span>{formatDate(visit.visit_date)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Time:</span>
                        <span>{formatTime(visit.visit_time || '')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <div className={styles.detailHeader}>
              <h2>Pre-Employment Checkup Details</h2>
              <Button variant="outline-secondary" onClick={handleCloseDetail}>
                ← Back to List
              </Button>
            </div>

            <div className={styles.detailSection}>
              <h3>Employee Information</h3>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Name:</span>
                  <span>{getDisplayName(selectedVisit)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Candidate ID:</span>
                  <span>{getDisplayCode(selectedVisit)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Department:</span>
                  <span>{getDisplayDepartment(selectedVisit)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Age:</span>
                  <span>{selectedVisit.patient_age}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Gender:</span>
                  <span>{selectedVisit.patient_gender}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Contact:</span>
                  <span>{selectedVisit.patient_contact || 'N/A'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Checkup Date:</span>
                  <span>{formatDate(selectedVisit.visit_date)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Checkup Time:</span>
                  <span>{formatTime(selectedVisit.visit_time || '')}</span>
                </div>
              </div>

              {getVitalsDisplay(selectedVisit.vitals)}
            </div>

            {!showDiagnosisForm ? (
              <div className={styles.detailActions}>
                <Button variant="brand" onClick={handleOpenDiagnosisForm}>
                  Add Diagnosis
                </Button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSubmitDiagnosis(); }}>
                <div className={styles.formSection}>
                  <h3>Diagnosis Details</h3>

                  <FormInput
                    label="Diagnosis *"
                    type="text"
                    value={diagnosisName}
                    onChange={setDiagnosisName}
                    required
                    error={fieldErrors.diagnosisName}
                    helperText="Primary diagnosis or 'Fit for employment'"
                  />

                  <FormInput
                    label="Examination Notes"
                    type="textarea"
                    rows={3}
                    value={examinationNotes}
                    onChange={setExaminationNotes}
                    helperText="Doctor's examination findings"
                  />

                  <FormInput
                    label="Fitness Status *"
                    type="select"
                    value={fitnessDecision}
                    onChange={(value) => setFitnessDecision(value as FitnessDecision | '')}
                    required
                    error={fieldErrors.fitnessDecision}
                    options={FITNESS_DECISION_OPTIONS}
                    helperText="Employee's fitness status for employment"
                  />

                  <FormInput
                    label="Follow-up Date"
                    type="date"
                    value={followUpDate}
                    onChange={setFollowUpDate}
                    min={getTomorrowDateString()}
                    error={fieldErrors.followUpDate}
                    helperText="Optional follow-up date"
                  />
                </div>

                <div className={styles.formSection}>
                  <h3>Medicines</h3>

                  {/* NEW: Medicine Required Checkbox */}
                  <div className={styles.medicineRequiredSection}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={medicineRequired}
                        onChange={(e) => setMedicineRequired(e.target.checked)}
                        className={styles.checkbox}
                      />
                      <span>Medicine Required for this Pre-Employment Checkup?</span>
                    </label>
                    <span className={styles.checkboxHelper}>
                      Check if medicines need to be prescribed. Uncheck if no medicines are needed.
                    </span>
                  </div>

                  {/* Conditional: Show medicines section only when medicineRequired is true */}
                  {medicineRequired && (
                    <>
                      <div className={styles.prescriptionsList}>
                        {prescriptions.map((prescription, index) => (
                          <div key={index} className={styles.prescriptionCard}>
                            <div className={styles.prescriptionHeader}>
                              <h4>Prescription</h4>
                              {prescriptions.length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleRemovePrescription(index)}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            <div className={styles.prescriptionForm}>
                              <FormInput
                                label="Medicine *"
                                type="select"
                                value={prescription.medicine_name}
                                onChange={(value) => handlePrescriptionChange(index, 'medicine_name', value)}
                                options={medicines}
                                error={fieldErrors[`prescription_${index}_medicine_name`]}
                              />
                              {/* <FormInput
                                label="Dosage *"
                                type="text"
                                value={prescription.dosage}
                                onChange={(value) => handlePrescriptionChange(index, 'dosage', value)}
                                placeholder="e.g., 500mg"
                                error={fieldErrors[`prescription_${index}_dosage`]}
                              /> */}
                              <FormInput
                                label="Frequency *"
                                type="text"
                                value={prescription.frequency}
                                onChange={(value) => handlePrescriptionChange(index, 'frequency', value)}
                                placeholder="e.g., Twice daily"
                                error={fieldErrors[`prescription_${index}_frequency`]}
                              />
                              <FormInput
                                label="Duration (days)"
                                type="number"
                                value={prescription.duration_days}
                                onChange={(value) => handlePrescriptionChange(index, 'duration_days', parseInt(value) || 0)}
                                min={1}
                              />
                              <FormInput
                                label="Instructions"
                                type="text"
                                value={prescription.instructions || ''}
                                onChange={(value) => handlePrescriptionChange(index, 'instructions', value)}
                                placeholder="e.g., Take after food"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={handleAddPrescription}
                      >
                        + Add Another Medicine
                      </Button>
                      {fieldErrors.prescriptions && (
                        <div className={styles.error}>{fieldErrors.prescriptions}</div>
                      )}
                    </>
                  )}
                </div>

                <div className={styles.formActions}>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={handleCloseDetail}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="brand" loading={submitting}>
                    Submit Diagnosis
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}
      </main>
    </div>
  );
};
