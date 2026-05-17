import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../layout';
import { FormInput, Button, Card, Alert } from '../ui';
import { createDiagnosis } from '../../services/ohc';
import { SEVERITY_OPTIONS, FITNESS_DECISION_OPTIONS, DOSAGE_FREQUENCY_OPTIONS, PRESCRIPTION_ROUTE_OPTIONS } from '../../utils/constants';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Severity, FitnessDecision } from '../../types';
import styles from './DiagnosisEntry.module.css';

interface PrescriptionFormData {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  route: string;
  instructions: string;
  start_date: string;
}

/**
 * Diagnosis Entry page component
 * Form to enter diagnosis details with fitness assessment and prescriptions
 */
export const DiagnosisEntry: React.FC = () => {
  const navigate = useNavigate();
  const { show } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [visitId, setVisitId] = useState('');

  const [diagnosis, setDiagnosis] = useState({
    diagnosis_code: '',
    diagnosis_name: '',
    diagnosis_notes: '',
    severity: Severity.MILD,
    is_primary: true,
    is_referral_required: false,
    fitness_decision: FitnessDecision.FIT,
    work_restrictions: '',
    advised_rest_days: 0,
    follow_up_date: '',
  });

  const [prescriptions, setPrescriptions] = useState<PrescriptionFormData[]>([
    {
      medicine_name: '',
      dosage: '',
      frequency: 'Once daily',
      duration_days: 7,
      route: 'Oral',
      instructions: '',
      start_date: new Date().toISOString().split('T')[0],
    },
  ]);

  const handleInputChange = (name: string, value: string | number | boolean) => {
    setDiagnosis((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrescriptionChange = (index: number, name: string, value: string | number) => {
    setPrescriptions((prev) =>
      prev.map((prescription, i) =>
        i === index ? { ...prescription, [name]: value } : prescription
      )
    );
  };

  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      {
        medicine_name: '',
        dosage: '',
        frequency: 'Once daily',
        duration_days: 7,
        route: 'Oral',
        instructions: '',
        start_date: new Date().toISOString().split('T')[0],
      },
    ]);
  };

  const removePrescription = (index: number) => {
    if (prescriptions.length > 1) {
      setPrescriptions(prescriptions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!visitId || !diagnosis.diagnosis_name) {
      setError('Please provide visit ID and diagnosis name');
      show('Please provide visit ID and diagnosis name', 'error');
      return;
    }

    setLoading(true);

    try {
      const validPrescriptions = prescriptions.filter(
        (p) => p.medicine_name && p.dosage
      );

      await createDiagnosis({
        visit: parseInt(visitId, 10),
        diagnosed_by: 0, // Will be filled by backend
        diagnosis,
        prescriptions: validPrescriptions,
      });

      show('Diagnosis and prescriptions created successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create diagnosis';
      setError(errorMessage);
      show(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.diagnosisForm}>
      <Header
        title="Diagnosis Entry"
        subtitle="Enter diagnosis details with fitness assessment"
      />
      <main className={styles.diagnosisFormMain}>
        {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

        <Card>
          <form onSubmit={handleSubmit}>
            <div className={styles.formSection}>
              <h3>Visit Information</h3>
              <FormInput
                label="Visit UUID *"
                name="visit_id"
                type="text"
                value={visitId}
                onChange={setVisitId}
                placeholder="Enter visit UUID from OHC visit"
                required
                helperText="Find the visit UUID from the OHC visit list"
              />
            </div>

            <div className={styles.formSection}>
              <h3>Diagnosis Details</h3>
              <div className={styles.formGrid}>
                <FormInput
                  label="Diagnosis Code"
                  name="diagnosis_code"
                  type="text"
                  value={diagnosis.diagnosis_code}
                  onChange={(value) => handleInputChange('diagnosis_code', value)}
                  placeholder="e.g., J00.01"
                  helperText="Optional: ICD-10 or local diagnosis code"
                />
                <FormInput
                  label="Diagnosis Name *"
                  name="diagnosis_name"
                  type="text"
                  value={diagnosis.diagnosis_name}
                  onChange={(value) => handleInputChange('diagnosis_name', value)}
                  placeholder="e.g., Acute nasopharyngitis"
                  required
                />
              </div>
              <FormInput
                label="Diagnosis Notes"
                name="diagnosis_notes"
                type="textarea"
                value={diagnosis.diagnosis_notes}
                onChange={(value) => handleInputChange('diagnosis_notes', value)}
                placeholder="Additional clinical notes and observations"
                rows={4}
                className={styles.fullWidth}
              />
            </div>

            <div className={styles.formSection}>
              <h3>Severity & Status</h3>
              <div className={styles.formGrid}>
                <FormInput
                  label="Severity *"
                  name="severity"
                  type="select"
                  value={diagnosis.severity}
                  onChange={(value) => handleInputChange('severity', value)}
                  options={SEVERITY_OPTIONS}
                  required
                />
                <FormInput
                  label="Primary Diagnosis"
                  name="is_primary"
                  type="select"
                  value={diagnosis.is_primary.toString()}
                  onChange={(value) => handleInputChange('is_primary', value === 'true')}
                  options={[
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' },
                  ]}
                />
                <FormInput
                  label="Requires Referral"
                  name="is_referral_required"
                  type="select"
                  value={diagnosis.is_referral_required.toString()}
                  onChange={(value) => handleInputChange('is_referral_required', value === 'true')}
                  options={[
                    { value: 'true', label: 'Yes' },
                    { value: 'false', label: 'No' },
                  ]}
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>Fitness Assessment</h3>
              <div className={styles.formGrid}>
                <FormInput
                  label="Fitness Decision *"
                  name="fitness_decision"
                  type="select"
                  value={diagnosis.fitness_decision}
                  onChange={(value) => handleInputChange('fitness_decision', value)}
                  options={FITNESS_DECISION_OPTIONS}
                  required
                />
                <FormInput
                  label="Advised Rest Days"
                  name="advised_rest_days"
                  type="number"
                  value={diagnosis.advised_rest_days}
                  onChange={(value) => handleInputChange('advised_rest_days', parseInt(value) || 0)}
                  placeholder="0"
                  min="0"
                />
                <FormInput
                  label="Follow-up Date"
                  name="follow_up_date"
                  type="date"
                  value={diagnosis.follow_up_date}
                  onChange={(value) => handleInputChange('follow_up_date', value)}
                />
              </div>
              <FormInput
                label="Work Restrictions"
                name="work_restrictions"
                type="textarea"
                value={diagnosis.work_restrictions}
                onChange={(value) => handleInputChange('work_restrictions', value)}
                placeholder="Specify any work restrictions or modifications"
                rows={3}
                className={styles.fullWidth}
              />
            </div>

            <div className={styles.formSection}>
              <h3>Prescriptions</h3>
              {prescriptions.map((prescription, index) => (
                <div key={index} className={styles.prescriptionCard}>
                  <div className={styles.prescriptionHeader}>
                    <h4>Prescription {index + 1}</h4>
                    {prescriptions.length > 1 && (
                      <Button
                        type="button"
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removePrescription(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className={styles.formGrid}>
                    <FormInput
                      label="Medicine Name"
                      name={`medicine_name_${index}`}
                      type="text"
                      value={prescription.medicine_name}
                      onChange={(value) => handlePrescriptionChange(index, 'medicine_name', value)}
                      placeholder="e.g., Paracetamol 500mg"
                    />
                    <FormInput
                      label="Dosage"
                      name={`dosage_${index}`}
                      type="text"
                      value={prescription.dosage}
                      onChange={(value) => handlePrescriptionChange(index, 'dosage', value)}
                      placeholder="e.g., 1 tablet"
                    />
                    <FormInput
                      label="Frequency"
                      name={`frequency_${index}`}
                      type="select"
                      value={prescription.frequency}
                      onChange={(value) => handlePrescriptionChange(index, 'frequency', value)}
                      options={DOSAGE_FREQUENCY_OPTIONS}
                    />
                    <FormInput
                      label="Duration (days)"
                      name={`duration_days_${index}`}
                      type="number"
                      value={prescription.duration_days}
                      onChange={(value) =>
                        handlePrescriptionChange(index, 'duration_days', parseInt(value) || 7)
                      }
                      min="1"
                    />
                    <FormInput
                      label="Route"
                      name={`route_${index}`}
                      type="select"
                      value={prescription.route}
                      onChange={(value) => handlePrescriptionChange(index, 'route', value)}
                      options={PRESCRIPTION_ROUTE_OPTIONS}
                    />
                    <FormInput
                      label="Start Date"
                      name={`start_date_${index}`}
                      type="date"
                      value={prescription.start_date}
                      onChange={(value) => handlePrescriptionChange(index, 'start_date', value)}
                    />
                  </div>
                  <FormInput
                    label="Instructions"
                    name={`instructions_${index}`}
                    type="textarea"
                    value={prescription.instructions}
                    onChange={(value) => handlePrescriptionChange(index, 'instructions', value)}
                    placeholder="e.g., Take after meals"
                    rows={2}
                    className={styles.fullWidth}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline-brand"
                onClick={addPrescription}
                className={styles.addPrescriptionBtn}
              >
                + Add Prescription
              </Button>
            </div>

            <div className={styles.formActions}>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" loading={loading}>
                Create Diagnosis
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};
