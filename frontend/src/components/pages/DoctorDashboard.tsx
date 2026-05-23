import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { Card, Alert, Button, FormInput } from '../ui';
import { StatusBadge, LastUpdated } from '../charts';
import { RefreshControl } from '../charts';
import { createDiagnosis } from '../../services/ohc';
import { useDashboardData } from '../../hooks/useDashboardData';
import { Role, VisitStatus } from '../../types';
import { validatePrescriptions, formatSubmitError } from '../../utils/errorHandling';
import styles from './DoctorDashboard.module.css';

interface PrescriptionInput {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions?: string;
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

  const visitParams = useMemo(() => ({ status: VisitStatus.OPEN }), []);

  // Fetch visits assigned to doctor, with manual refresh option
  const { data: visitsData, isLoading: loading, refetch, lastUpdated } = useDashboardData<any>(
    '/ohc/visits/',
    visitParams,
    { onError: handleError }
  );

  const visits = Array.isArray(visitsData) ? visitsData : (visitsData?.results || []);

  // Track previous visit IDs to detect new visits
  const previousVisitIdsRef = useRef<Set<number>>(new Set());

  // Show new visits count after refresh
  useEffect(() => {
    if (visits.length > 0) {
      const currentIds = new Set<number>(visits.map((v: any) => v.id as number));
      const previousIds = previousVisitIdsRef.current;

      // Only show notification on refresh (when we had previous data)
      if (previousIds.size > 0) {
        const newVisits = visits.filter((v: any) => !previousIds.has(v.id));
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
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);

  // Diagnosis form state
  const [diagnosisName, setDiagnosisName] = useState('');
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [doctorRemarks, setDoctorRemarks] = useState('');

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

  useEffect(() => {
    if (!user || user.role !== Role.DOCTOR) {
      setError('Access restricted to doctors only');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleViewVisit = (visitId: number) => {
    setSelectedVisit(visits.find((v: any) => v.id === visitId) || null);
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
    setDiagnosisNotes('');
    setFollowUpDate('');
    setDoctorRemarks('');
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
        diagnosis_notes: diagnosisNotes || '',
        severity: 'MILD' as const,
        is_primary: true,
        is_referral_required: false,
        fitness_decision: 'FIT' as const,
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
          <div className={styles.visitsGrid}>
            {visits.map((visit: any) => (
              <Card key={visit.id} className={styles.visitCard} onClick={() => handleViewVisit(visit.id)}>
                <div className={styles.visitHeader}>
                  <div className={styles.visitInfo}>
                    <div>
                      <span className={styles.patientName}>
                        {visit.employee?.user?.first_name || visit.employee_name || 'N/A'} {visit.employee?.user?.last_name || ''}
                      </span>
                      <span className={styles.employeeCode}>
                        {visit.employee?.employee_code || visit.employee_id || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className={styles.label}>Department:</span>
                      <span className={styles.value}>{visit.employee?.department || visit.employee_department || 'N/A'}</span>
                    </div>
                    <div>
                      <span className={styles.label}>Date:</span>
                      <span className={styles.value}>
                        {new Date(visit.visit_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className={styles.visitStatus}>
                    <StatusBadge status={visit.visit_status} size="medium" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {selectedVisit && (
        <Card className={styles.visitDetailCard}>
          <div className={styles.detailHeader}>
            <h3>Visit Details</h3>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={handleCloseDetail}
            >
              Close
            </Button>
          </div>

          <div className={styles.detailContent}>
            <div className={styles.patientInfo}>
              <div>
                <span className={styles.label}>Patient:</span>
                <span>{selectedVisit.employee?.user?.first_name || selectedVisit.employee_name || 'N/A'} {selectedVisit.employee?.user?.last_name || ''}</span>
              </div>
              <div>
                <span className={styles.label}>Employee Code:</span>
                <span>{selectedVisit.employee?.employee_code || selectedVisit.employee_id || 'N/A'}</span>
              </div>
              <div>
                <span className={styles.label}>Department:</span>
                <span>{selectedVisit.employee?.department || selectedVisit.employee_department || 'N/A'}</span>
              </div>
              {selectedVisit.patient_name && (
                <div>
                  <span className={styles.label}>Patient Name:</span>
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
                <span>{selectedVisit.visit_time || 'N/A'}</span>
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
                          label="Diagnosis / Observation *"
                          value={diagnosisName}
                          onChange={(value) => { setDiagnosisName(value); setFieldErrors(prev => ({ ...prev, diagnosisName: '' })); }}
                          type="textarea"
                          rows={3}
                          required
                          error={fieldErrors.diagnosisName}
                        />
                        <FormInput
                          label="Doctor Remarks"
                          value={doctorRemarks}
                          onChange={(value) => { setDoctorRemarks(value); setFieldErrors(prev => ({ ...prev, doctorRemarks: '' })); }}
                          type="textarea"
                          rows={3}
                          placeholder="Additional remarks from doctor"
                        />
                        <FormInput
                          label="Follow-up Date (Optional)"
                          type="date"
                          value={followUpDate}
                          onChange={(value) => { setFollowUpDate(value); setFieldErrors(prev => ({ ...prev, followUpDate: '' })); }}
                        />
                      </div>

                      <h4>Medicine Given to Patient</h4>
                      {prescriptions.map((prescription, index) => (
                        <div key={index} className={styles.prescriptionRow}>
                          {prescriptions.length > 1 && (
                            <button
                              type="button"
                              className={styles.removePrescriptionBtn}
                              onClick={() => handleRemovePrescription(index)}
                            >
                              ×
                            </button>
                          )}
                          <div className={styles.prescriptionForm}>
                            <FormInput
                              label={`Medicine Name ${prescriptions.length > 1 ? index + 1 : ''} *`}
                              value={prescription.medicine_name}
                              onChange={(value) => handlePrescriptionChange(index, 'medicine_name', value)}
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
                              placeholder="Dosage instructions for patient"
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