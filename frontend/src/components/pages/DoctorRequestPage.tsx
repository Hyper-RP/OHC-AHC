import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Alert, Button, Card, FormInput } from '../ui';
import api from '../../services/api';
import { listHospitals } from '../../services/ahc';
import { createDiagnosis } from '../../services/ohc';
import { listMedicines } from '../../services/medicine';
import { FitnessDecision, Role, VisitStatus, type Hospital } from '../../types';
import { FITNESS_DECISION_OPTIONS } from '../../utils/constants';
import { formatSubmitError, validatePrescriptions } from '../../utils/errorHandling';
import { loadMedicineRecords } from './medicineInventory';
import pageStyles from './RequestPage.module.css';
import dashboardStyles from './DoctorDashboard.module.css';

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

export const DoctorRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { visitId } = useParams<{ visitId: string }>();
  const { user } = useAuth();
  const { show } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [hospitalOptions, setHospitalOptions] = useState<Array<{ value: string; label: string }>>([
    { value: '', label: 'Select hospital' },
  ]);
  const [medicines, setMedicines] = useState<Array<{ value: string; label: string }>>([]);
  const [diagnosisName, setDiagnosisName] = useState('');
  const [examinationNotes, setExaminationNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [fitnessDecision, setFitnessDecision] = useState<FitnessDecision | ''>('');
  const [requiresReferral, setRequiresReferral] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
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
  }, [navigate, user]);

  useEffect(() => {
    const fetchVisit = async () => {
      if (!visitId) {
        navigate('/doctor/dashboard', { replace: true });
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/ohc/visits/${visitId}/`);
        setSelectedVisit(response.data);
        setError('');
      } catch (err) {
        const errorMessage = formatSubmitError(err);
        setError(errorMessage);
        show(errorMessage, 'error');
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
              .filter((medicine: any) => medicine.stock_quantity > 0)
              .map((medicine: any) => String(medicine.name || '').trim())
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
      } catch {
        // Keep fallback option only.
      }
    };

    void fetchHospitals();
  }, []);

  const getVisitDisplayName = (visit: any) => {
    const explicitVisitName = visit.patient_name?.trim() || visit.employee_name?.trim();
    if (explicitVisitName) {
      return explicitVisitName;
    }

    const firstName = visit.employee?.user?.first_name || '';
    const lastName = visit.employee?.user?.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'N/A';
  };

  const getVisitDisplayCode = (visit: any) => visit.employee_id || visit.employee?.employee_code || 'N/A';
  const getVisitDisplayDepartment = (visit: any) => visit.employee_department || visit.employee?.department || 'N/A';

  const getVisitDisplayTime = (visit: any) => {
    if (!visit.visit_time) return 'N/A';
    const time = new Date(`2000-01-01T${visit.visit_time}`);
    return Number.isNaN(time.getTime())
      ? visit.visit_time
      : time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const handlePrescriptionChange = (index: number, field: keyof PrescriptionInput, value: string | number) => {
    setPrescriptions((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
    setFieldErrors((prev) => ({ ...prev, [`prescriptions_${index}_${field}`]: '' }));
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
      const errorsMap = prescriptionValidation.errors.reduce((acc, current) => {
        acc[current.field] = current.message;
        return acc;
      }, {} as Record<string, string>);
      setFieldErrors((prev) => ({ ...prev, ...errorsMap }));
      show('Please correct the prescription errors', 'error');
      return;
    }

    const validPrescriptions = prescriptions.filter((item) => item.medicine_name.trim() !== '');

    try {
      setSubmitting(true);
      const result = await createDiagnosis({
        visit: selectedVisit.id,
        diagnosis_code: '',
        diagnosis_name: diagnosisName,
        diagnosis_notes: examinationNotes || '',
        severity: 'MILD',
        is_primary: true,
        is_referral_required: requiresReferral,
        hospital: requiresReferral ? Number(selectedHospitalId) : undefined,
        fitness_decision: fitnessDecision,
        work_restrictions: '',
        advised_rest_days: 0,
        follow_up_date: followUpDate || undefined,
        prescriptions: validPrescriptions.map((item) => ({
          ...item,
          start_date: new Date().toISOString().split('T')[0],
          status: 'ACTIVE',
        })),
      });

      show('Diagnosis and prescriptions submitted successfully!', 'success');
      if (result.referral) {
        show(`Referral created: ${result.referral.referral_status}`, 'info');
      }
      navigate('/doctor/dashboard');
    } catch (err) {
      const errorMessage = formatSubmitError(err);
      setError(errorMessage);
      show(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={pageStyles.page}>
        <Header title="Doctor Request" subtitle="Loading visit details" />
        <div className={dashboardStyles.loadingState}>Loading visit details...</div>
      </div>
    );
  }

  if (!selectedVisit) {
    return (
      <div className={pageStyles.page}>
        <Header title="Doctor Request" subtitle="Visit details" />
        <main className={pageStyles.main}>
          {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}
        </main>
      </div>
    );
  }

  return (
    <div className={pageStyles.page}>
      <Header title="Doctor Request" subtitle="Review visit details and submit diagnosis" />

      <main className={pageStyles.main}>
        {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

        <section className={pageStyles.hero}>
          <div className={pageStyles.heroText}>
            <span className={pageStyles.eyebrow}>Doctor Request</span>
            <h2 className={pageStyles.heroTitle}>Visit Details</h2>
            <p className={pageStyles.heroSubtitle}>
              Review the employee visit, check vitals, and complete diagnosis with prescription details from this full page.
            </p>
          </div>
          <div className={pageStyles.heroActions}>
            <span className={pageStyles.statusPill}>{selectedVisit.visit_status}</span>
            <Button type="button" variant="outline-secondary" onClick={() => navigate('/doctor/dashboard')}>
              Back
            </Button>
          </div>
        </section>

        <section className={pageStyles.summaryGrid}>
          <div className={pageStyles.summaryCard}>
            <span className={pageStyles.summaryLabel}>Employee</span>
            <span className={pageStyles.summaryValue}>{getVisitDisplayName(selectedVisit)}</span>
          </div>
          <div className={pageStyles.summaryCard}>
            <span className={pageStyles.summaryLabel}>Employee Code</span>
            <span className={pageStyles.summaryValue}>{getVisitDisplayCode(selectedVisit)}</span>
          </div>
          <div className={pageStyles.summaryCard}>
            <span className={pageStyles.summaryLabel}>Department</span>
            <span className={pageStyles.summaryValue}>{getVisitDisplayDepartment(selectedVisit)}</span>
          </div>
          <div className={pageStyles.summaryCard}>
            <span className={pageStyles.summaryLabel}>Visit Date</span>
            <span className={pageStyles.summaryValue}>{new Date(selectedVisit.visit_date).toLocaleDateString()}</span>
          </div>
        </section>

        <div className={pageStyles.contentGrid}>
          <div className={pageStyles.stack}>
            <Card className={pageStyles.panel}>
              <div className={pageStyles.panelHeader}>
                <div>
                  <h3 className={pageStyles.panelTitle}>Employee Overview</h3>
                  <p className={pageStyles.panelSubtitle}>Core visit information and triage context.</p>
                </div>
              </div>

              <div className={pageStyles.detailGrid}>
                <div className={pageStyles.detailItem}>
                  <span className={pageStyles.detailLabel}>Visit Time</span>
                  <span className={pageStyles.detailValue}>{getVisitDisplayTime(selectedVisit)}</span>
                </div>
                <div className={pageStyles.detailItem}>
                  <span className={pageStyles.detailLabel}>Status</span>
                  <span className={pageStyles.detailValue}>{selectedVisit.visit_status}</span>
                </div>
                {selectedVisit.patient_age && (
                  <div className={pageStyles.detailItem}>
                    <span className={pageStyles.detailLabel}>Age</span>
                    <span className={pageStyles.detailValue}>{selectedVisit.patient_age} years</span>
                  </div>
                )}
                {selectedVisit.patient_gender && (
                  <div className={pageStyles.detailItem}>
                    <span className={pageStyles.detailLabel}>Gender</span>
                    <span className={pageStyles.detailValue}>{selectedVisit.patient_gender}</span>
                  </div>
                )}
                {selectedVisit.patient_contact && (
                  <div className={pageStyles.detailItem}>
                    <span className={pageStyles.detailLabel}>Contact</span>
                    <span className={pageStyles.detailValue}>{selectedVisit.patient_contact}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className={pageStyles.panel}>
              <div className={pageStyles.panelHeader}>
                <div>
                  <h3 className={pageStyles.panelTitle}>Vital Signs</h3>
                  <p className={pageStyles.panelSubtitle}>Recorded measurements for this visit.</p>
                </div>
              </div>

              {selectedVisit.vitals && Object.keys(selectedVisit.vitals).length > 0 ? (
                <div className={pageStyles.vitalsGrid}>
                  {Object.entries(selectedVisit.vitals).map(([key, value]) => (
                    <div key={key} className={pageStyles.vitalCard}>
                      <span className={pageStyles.vitalName}>{key}</span>
                      <span className={pageStyles.vitalReading}>{String(value || '-')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={pageStyles.emptyState}>No vitals recorded.</div>
              )}
            </Card>

            {(selectedVisit.visit_status === VisitStatus.IN_PROGRESS ||
              selectedVisit.visit_status === VisitStatus.COMPLETED ||
              selectedVisit.visit_status === VisitStatus.REFERRED) &&
              selectedVisit.prescriptions &&
              selectedVisit.prescriptions.length > 0 && (
              <Card className={pageStyles.panel}>
                <div className={pageStyles.panelHeader}>
                  <div>
                    <h3 className={pageStyles.panelTitle}>Medicines Prescribed</h3>
                    <p className={pageStyles.panelSubtitle}>Prescription details already attached to this visit.</p>
                  </div>
                </div>

                <div className={pageStyles.prescriptionList}>
                  {selectedVisit.prescriptions.map((prescription: any) => (
                    <div key={prescription.id} className={pageStyles.prescriptionCard}>
                      <span className={pageStyles.prescriptionTitle}>{prescription.medicine_name}</span>
                      <span className={pageStyles.prescriptionMeta}>{prescription.dosage}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className={pageStyles.stack}>
            <Card className={pageStyles.panel}>
              <div className={pageStyles.panelHeader}>
                <div>
                  <h3 className={pageStyles.panelTitle}>Diagnosis Workspace</h3>
                  <p className={pageStyles.panelSubtitle}>Add observations, referral details, and medicine instructions.</p>
                </div>
              </div>

              {selectedVisit.visit_status === VisitStatus.OPEN ? (
                !showDiagnosisForm ? (
                  <div className={pageStyles.actionRow}>
                    <Button type="button" variant="brand" onClick={() => setShowDiagnosisForm(true)}>
                      Add Diagnosis
                    </Button>
                  </div>
                ) : (
                  <div className={pageStyles.formStack}>
                    <div className={pageStyles.formSection}>
                      <h4 className={pageStyles.sectionTitle}>Assessment</h4>
                      <div className={dashboardStyles.formGrid}>
                        <FormInput
                          label="Examination"
                          value={examinationNotes}
                          onChange={(value) => {
                            setExaminationNotes(value);
                            setFieldErrors((prev) => ({ ...prev, examinationNotes: '' }));
                          }}
                          type="textarea"
                          rows={3}
                          placeholder="Enter examination findings"
                        />
                        <FormInput
                          label="Diagnosis / Observation *"
                          value={diagnosisName}
                          onChange={(value) => {
                            setDiagnosisName(value);
                            setFieldErrors((prev) => ({ ...prev, diagnosisName: '' }));
                          }}
                          type="textarea"
                          rows={3}
                          required
                          error={fieldErrors.diagnosisName}
                        />
                        <FormInput
                          label="Follow-up Date (Optional)"
                          type="date"
                          value={followUpDate}
                          onChange={(value) => {
                            setFollowUpDate(value);
                            setFieldErrors((prev) => ({ ...prev, followUpDate: '' }));
                          }}
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
                    </div>

                    <div className={pageStyles.formSection}>
                      <h4 className={pageStyles.sectionTitle}>Referral</h4>
                      <label className={pageStyles.checkboxRow}>
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

                    <div className={pageStyles.formSection}>
                      <h4 className={pageStyles.sectionTitle}>Medicine Given to Employee</h4>
                      {prescriptions.map((prescription, index) => (
                        <div key={index} className={pageStyles.prescriptionRow}>
                          <div className={pageStyles.prescriptionTop}>
                            <span className={pageStyles.prescriptionIndex}>Medicine {index + 1}</span>
                            {prescriptions.length > 1 && (
                              <Button
                                type="button"
                                variant="outline-danger"
                                onClick={() => handleRemovePrescription(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>

                          <div className={pageStyles.prescriptionFormGrid}>
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
                              className={pageStyles.fullWidth}
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

                      <div className={pageStyles.actionRow}>
                        <Button type="button" variant="outline-secondary" onClick={handleAddPrescription}>
                          Add Medicine
                        </Button>
                      </div>
                    </div>

                    <div className={pageStyles.actionRow}>
                      <Button type="button" variant="outline-secondary" onClick={() => navigate('/doctor/dashboard')}>
                        Cancel
                      </Button>
                      <Button type="button" variant="brand" onClick={handleSubmitDiagnosis} loading={submitting}>
                        Submit Diagnosis
                      </Button>
                    </div>
                  </div>
                )
              ) : (
                <div className={pageStyles.emptyState}>This visit is no longer open for diagnosis updates.</div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
