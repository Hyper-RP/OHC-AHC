import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Alert, Button, Card, FormInput } from '../ui';
import api, { handleApiError } from '../../services/api';
import { listMedicines } from '../../services/medicine';
import { FitnessDecision, Role, VisitStatus } from '../../types';
import { FITNESS_DECISION_OPTIONS } from '../../utils/constants';
import { validatePrescription } from '../../utils/errorHandling';
import { loadMedicineRecords } from './medicineInventory';
import pageStyles from './RequestPage.module.css';
import dashboardStyles from './PreEmploymentDoctorDashboard.module.css';

interface PreEmploymentVisit {
  id: number;
  visit_status: VisitStatus;
  patient_name?: string;
  employee_name?: string;
  employee?: {
    id: number;
    employee_code: string;
    user: { first_name: string; last_name: string };
    department: string;
  } | null;
  candidate_id?: string;
  candidate_department?: string;
  candidate_designation?: string;
  patient_age?: number;
  patient_gender?: string;
  patient_contact?: string;
  visit_date?: string;
  visit_time?: string;
  vitals?: Record<string, string>;
}

interface PrescriptionInput {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions?: string;
}

const FITNESS_STATUS_OPTIONS = [
  { value: '', label: 'Select fitness status' },
  ...FITNESS_DECISION_OPTIONS,
];

export const PreEmploymentDoctorRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { visitId } = useParams<{ visitId: string }>();
  const { user } = useAuth();
  const { show } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedVisit, setSelectedVisit] = useState<PreEmploymentVisit | null>(null);
  const [medicines, setMedicines] = useState<Array<{ value: string; label: string }>>([]);
  const [diagnosisName, setDiagnosisName] = useState('');
  const [examinationNotes, setExaminationNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [fitnessDecision, setFitnessDecision] = useState<FitnessDecision | ''>('');
  const [medicineRequired, setMedicineRequired] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionInput[]>([
    { medicine_name: '', dosage: '', frequency: '', duration_days: 7, instructions: '' },
  ]);

  useEffect(() => {
    if (!user || user.role !== Role.DOCTOR) {
      navigate('/dashboard');
    }
  }, [navigate, user]);

  useEffect(() => {
    const fetchVisit = async () => {
      if (!visitId) {
        navigate('/pre-employment-doctor', { replace: true });
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/ohc/visits/${visitId}/`);
        setSelectedVisit(response.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load pre-employment checkup';
        setError(message);
        show(message, 'error');
      } finally {
        setLoading(false);
      }
    };

    void fetchVisit();
  }, [navigate, show, visitId]);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const localMedicineNames = Array.from(
          new Set<string>(
            loadMedicineRecords()
              .filter((medicine) => medicine.stock > 0)
              .map((medicine) => String(medicine.name || '').trim())
              .filter(Boolean),
          ),
        ).sort((left, right) => left.localeCompare(right));

        if (localMedicineNames.length > 0) {
          setMedicines([
            { value: '', label: 'Select medicine' },
            ...localMedicineNames.map((name) => ({ value: name, label: name })),
          ]);
          return;
        }

        const response = await listMedicines({ page_size: 500 });
        const medicineNames = Array.from(
          new Set<string>(
            (response.results || [])
              .filter((item: { stock_quantity: number }) => item.stock_quantity > 0)
              .map((item: { name?: string }) => String(item.name || '').trim())
              .filter(Boolean),
          ),
        ).sort((left, right) => left.localeCompare(right));

        setMedicines([
          { value: '', label: 'Select medicine' },
          ...medicineNames.map((name) => ({ value: name, label: name })),
        ]);
      } catch {
        setMedicines([{ value: '', label: 'Select medicine' }]);
      }
    };

    void fetchMedicines();
  }, []);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

  const formatTime = (value?: string) => {
    if (!value) return '-';
    const time = new Date(`2000-01-01T${value}`);
    return Number.isNaN(time.getTime()) ? value : time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const handleAddPrescription = () => {
    setPrescriptions((prev) => [
      ...prev,
      { medicine_name: '', dosage: '', frequency: '', duration_days: 7, instructions: '' },
    ]);
  };

  const handleRemovePrescription = (index: number) => {
    if (prescriptions.length > 1) {
      setPrescriptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handlePrescriptionChange = <K extends keyof PrescriptionInput>(
    index: number,
    field: K,
    value: PrescriptionInput[K]
  ) => {
    setPrescriptions((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
    setFieldErrors((prev) => ({ ...prev, [`prescription_${index}_${field}`]: '' }));
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

    if (medicineRequired) {
      const filledPrescriptions = prescriptions.filter((item) => item.medicine_name.trim() !== '');
      if (filledPrescriptions.length === 0) {
        setFieldErrors({ prescriptions: 'At least one medicine is required when medicine is marked as required' });
        show('Please add at least one medicine or uncheck "Medicine Required"', 'error');
        return;
      }

      const prescriptionErrors: Record<string, string> = {};
      for (let i = 0; i < prescriptions.length; i += 1) {
        const item = prescriptions[i];
        if (!item.medicine_name.trim()) {
          continue;
        }

        const validation = validatePrescription(item);
        if (!validation.isValid) {
          validation.errors.forEach((fieldError) => {
            prescriptionErrors[`prescription_${i}_${fieldError.field}`] = fieldError.message;
          });
        }
      }

      if (Object.keys(prescriptionErrors).length > 0) {
        setFieldErrors(prescriptionErrors);
        show('Please correct the medicine details before submitting', 'error');
        return;
      }
    }

    if (followUpDate && followUpDate <= getTodayDateString()) {
      setFieldErrors({ followUpDate: 'Follow-up date must be after today' });
      show('Please select a follow-up date after today', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const validPrescriptions = prescriptions.filter((item) => item.medicine_name.trim() !== '');
      await api.post('/ohc/diagnosis-prescriptions/', {
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
        prescriptions: medicineRequired
          ? validPrescriptions.map((item) => ({
              ...item,
              start_date: new Date().toISOString().split('T')[0],
            }))
          : [],
      });
      show('Diagnosis created successfully!', 'success');
      navigate('/pre-employment-doctor');
    } catch (err) {
      const message = handleApiError(err, 'Failed to create diagnosis');
      setError(message);
      show(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={pageStyles.page}>
        <Header title="Pre-Employment Doctor Request" subtitle="Loading checkup details" />
        <div className={dashboardStyles.loading}>Loading visit details...</div>
      </div>
    );
  }

  if (!selectedVisit) {
    return (
      <div className={pageStyles.page}>
        <Header title="Pre-Employment Doctor Request" subtitle="Checkup details" />
        <main className={pageStyles.main}>
          {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}
        </main>
      </div>
    );
  }

  const displayName =
    selectedVisit.patient_name ||
    `${selectedVisit.employee?.user?.first_name || ''} ${selectedVisit.employee?.user?.last_name || ''}`.trim() ||
    'N/A';
  const displayCode = selectedVisit.candidate_id || selectedVisit.employee?.employee_code || 'N/A';
  const displayDepartment = selectedVisit.candidate_department || selectedVisit.employee?.department || 'N/A';

  return (
    <div className={pageStyles.page}>
      <Header title="Pre-Employment Doctor Request" subtitle="Review and diagnose pre-employment medical checkups" />

      <main className={pageStyles.main}>
        {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

        <section className={pageStyles.hero}>
          <div className={pageStyles.heroText}>
            <span className={pageStyles.eyebrow}>Pre-Employment Doctor</span>
            <h2 className={pageStyles.heroTitle}>Checkup Details</h2>
            <p className={pageStyles.heroSubtitle}>
              Review employee information, vitals, and complete the pre-employment diagnosis workflow on a dedicated page.
            </p>
          </div>
          <div className={pageStyles.heroActions}>
            <span className={pageStyles.statusPill}>{selectedVisit.visit_status}</span>
            <Button type="button" variant="outline-secondary" onClick={() => navigate('/pre-employment-doctor')}>
              Back
            </Button>
          </div>
        </section>

        <section className={pageStyles.summaryGrid}>
          <div className={pageStyles.summaryCard}>
            <span className={pageStyles.summaryLabel}>Employee</span>
            <span className={pageStyles.summaryValue}>{displayName}</span>
          </div>
          <div className={pageStyles.summaryCard}>
            <span className={pageStyles.summaryLabel}>Candidate ID</span>
            <span className={pageStyles.summaryValue}>{displayCode}</span>
          </div>
          <div className={pageStyles.summaryCard}>
            <span className={pageStyles.summaryLabel}>Department</span>
            <span className={pageStyles.summaryValue}>{displayDepartment}</span>
          </div>
          <div className={pageStyles.summaryCard}>
            <span className={pageStyles.summaryLabel}>Checkup Date</span>
            <span className={pageStyles.summaryValue}>{formatDate(selectedVisit.visit_date)}</span>
          </div>
        </section>

        <div className={pageStyles.contentGrid}>
          <div className={pageStyles.stack}>
            <Card className={pageStyles.panel}>
              <div className={pageStyles.panelHeader}>
                <div>
                  <h3 className={pageStyles.panelTitle}>Employee Information</h3>
                  <p className={pageStyles.panelSubtitle}>Core pre-employment checkup details.</p>
                </div>
              </div>

              <div className={pageStyles.detailGrid}>
                <div className={pageStyles.detailItem}>
                  <span className={pageStyles.detailLabel}>Name</span>
                  <span className={pageStyles.detailValue}>{displayName}</span>
                </div>
                <div className={pageStyles.detailItem}>
                  <span className={pageStyles.detailLabel}>Age</span>
                  <span className={pageStyles.detailValue}>{selectedVisit.patient_age || 'N/A'}</span>
                </div>
                <div className={pageStyles.detailItem}>
                  <span className={pageStyles.detailLabel}>Gender</span>
                  <span className={pageStyles.detailValue}>{selectedVisit.patient_gender || 'N/A'}</span>
                </div>
                <div className={pageStyles.detailItem}>
                  <span className={pageStyles.detailLabel}>Contact</span>
                  <span className={pageStyles.detailValue}>{selectedVisit.patient_contact || 'N/A'}</span>
                </div>
                <div className={pageStyles.detailItem}>
                  <span className={pageStyles.detailLabel}>Checkup Time</span>
                  <span className={pageStyles.detailValue}>{formatTime(selectedVisit.visit_time)}</span>
                </div>
              </div>
            </Card>

            <Card className={pageStyles.panel}>
              <div className={pageStyles.panelHeader}>
                <div>
                  <h3 className={pageStyles.panelTitle}>Vital Signs</h3>
                  <p className={pageStyles.panelSubtitle}>Recorded measurements for this pre-employment visit.</p>
                </div>
              </div>

              {selectedVisit.vitals && Object.keys(selectedVisit.vitals).filter((key) => selectedVisit.vitals![key]).length > 0 ? (
                <div className={pageStyles.vitalsGrid}>
                  {Object.entries(selectedVisit.vitals)
                    .filter(([, value]) => Boolean(value))
                    .map(([key, value]) => (
                      <div key={key} className={pageStyles.vitalCard}>
                        <span className={pageStyles.vitalName}>{key.replace(/_/g, ' ')}</span>
                        <span className={pageStyles.vitalReading}>{String(value || '-')}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className={pageStyles.emptyState}>No vitals recorded.</div>
              )}
            </Card>
          </div>

          <div className={pageStyles.stack}>
            <Card className={pageStyles.panel}>
              <div className={pageStyles.panelHeader}>
                <div>
                  <h3 className={pageStyles.panelTitle}>Diagnosis Workspace</h3>
                  <p className={pageStyles.panelSubtitle}>Complete the doctor review and optionally prescribe medicine.</p>
                </div>
              </div>

              {selectedVisit.visit_status === VisitStatus.OPEN ? (
                <div className={pageStyles.formStack}>
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
                    options={FITNESS_STATUS_OPTIONS}
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

                  <div className={pageStyles.formSection}>
                    <h4 className={pageStyles.sectionTitle}>Medicines</h4>
                    <label className={pageStyles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={medicineRequired}
                        onChange={(e) => setMedicineRequired(e.target.checked)}
                      />
                      <span>Medicine Required for this Pre-Employment Checkup?</span>
                    </label>
                    <div className={pageStyles.noteBox}>Check this only if medicines need to be prescribed for the candidate.</div>

                    {medicineRequired && (
                      <>
                        {prescriptions.map((prescription, index) => (
                          <div key={index} className={pageStyles.prescriptionRow}>
                            <div className={pageStyles.prescriptionTop}>
                              <span className={pageStyles.prescriptionIndex}>Medicine {index + 1}</span>
                              {prescriptions.length > 1 && (
                                <Button type="button" variant="outline-danger" onClick={() => handleRemovePrescription(index)}>
                                  Remove
                                </Button>
                              )}
                            </div>

                            <div className={pageStyles.prescriptionFormGrid}>
                              <FormInput
                                label="Medicine *"
                                type="select"
                                value={prescription.medicine_name}
                                onChange={(value) => handlePrescriptionChange(index, 'medicine_name', value)}
                                options={medicines}
                                error={fieldErrors[`prescription_${index}_medicine_name`]}
                              />
                              <FormInput
                                label="Dosage *"
                                type="text"
                                value={prescription.dosage}
                                onChange={(value) => handlePrescriptionChange(index, 'dosage', value)}
                                placeholder="e.g., 500mg"
                                error={fieldErrors[`prescription_${index}_dosage`]}
                              />
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
                                value={prescription.duration_days.toString()}
                                onChange={(value) => handlePrescriptionChange(index, 'duration_days', parseInt(value, 10) || 0)}
                                min="1"
                              />
                              <FormInput
                                className={pageStyles.fullWidth}
                                label="Instructions"
                                type="text"
                                value={prescription.instructions || ''}
                                onChange={(value) => handlePrescriptionChange(index, 'instructions', value)}
                                placeholder="e.g., Take after food"
                              />
                            </div>
                          </div>
                        ))}

                        <div className={pageStyles.actionRow}>
                          <Button type="button" variant="outline-secondary" onClick={handleAddPrescription}>
                            Add Another Medicine
                          </Button>
                        </div>
                        {fieldErrors.prescriptions && <div className={dashboardStyles.error}>{fieldErrors.prescriptions}</div>}
                      </>
                    )}
                  </div>

                  <div className={pageStyles.actionRow}>
                    <Button type="button" variant="outline-secondary" onClick={() => navigate('/pre-employment-doctor')}>
                      Cancel
                    </Button>
                    <Button type="button" variant="brand" onClick={handleSubmitDiagnosis} loading={submitting}>
                      Submit Diagnosis
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={pageStyles.emptyState}>This checkup is no longer open for diagnosis updates.</div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
