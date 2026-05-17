import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../layout';
import { FormInput, Button, Card, Alert } from '../ui';
import { createVisit } from '../../services/ohc';
import { VISIT_TYPE_OPTIONS, TRIAGE_LEVEL_OPTIONS } from '../../utils/constants';
import { aggregateVitals, validateVitals } from '../../services/vitals';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { VisitType, TriageLevel } from '../../types';
import { loadMedicineRecords, type MedicineRecord } from './medicineInventory';
import styles from './OHCVisitForm.module.css';

interface DispensedMedicineForm {
  medicineId: string;
  quantity: string;
  instructions: string;
}

/**
 * OHC Visit Form page component
 * Form to record new patient visits with vitals and symptoms
 */
export const OHCVisitForm: React.FC = () => {
  const navigate = useNavigate();
  const { show } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    employee: '',
    employee_name: '',
    employee_department: '',
    visit_type: VisitType.WALK_IN,
    triage_level: TriageLevel.LOW,
    visit_date: new Date().toISOString().split('T')[0],
    chief_complaint: '',
    symptoms: '',
    preliminary_notes: '',
    requires_referral: false,
    follow_up_date: '',
  });

  const [vitals, setVitals] = useState<Record<string, string>>({
    temperature: '',
    blood_pressure: '',
    pulse: '',
    spo2: '',
    weight: '',
    height: '',
  });

  const [vitalsErrors, setVitalsErrors] = useState<Record<string, string>>({});
  const [vitalsPreview, setVitalsPreview] = useState<string>('{}');
  const [medicineOptions, setMedicineOptions] = useState<MedicineRecord[]>([]);
  const [dispensedMedicines, setDispensedMedicines] = useState<DispensedMedicineForm[]>([
    { medicineId: '', quantity: '', instructions: '' },
  ]);

  useEffect(() => {
    // Update vitals preview when vitals change
    const aggregated = aggregateVitals(vitals);
    requestAnimationFrame(() => {
      setVitalsPreview(JSON.stringify(aggregated, null, 2));
    });
  }, [vitals]);

  useEffect(() => {
    setMedicineOptions(loadMedicineRecords());
  }, []);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVitalChange = (name: string, value: string) => {
    setVitals((prev) => ({ ...prev, [name]: value }));
    // Validate and clear error for this field
    const newVitals = { ...vitals, [name]: value };
    const errors = validateVitals(newVitals);
    if (!errors[name]) {
      setVitalsErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlurVital = () => {
    const errors = validateVitals(vitals);
    setVitalsErrors(errors);
  };

  const handleDispensedMedicineChange = (
    index: number,
    field: keyof DispensedMedicineForm,
    value: string
  ) => {
    setDispensedMedicines((current) =>
      current.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [field]: value } : medicine
      )
    );
  };

  const addDispensedMedicineRow = () => {
    setDispensedMedicines((current) => [
      ...current,
      { medicineId: '', quantity: '', instructions: '' },
    ]);
  };

  const removeDispensedMedicineRow = (index: number) => {
    setDispensedMedicines((current) =>
      current.length === 1 ? current : current.filter((_, medicineIndex) => medicineIndex !== index)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!formData.employee || !formData.chief_complaint || !formData.symptoms) {
      setError('Please fill in all required fields');
      show('Please fill in all required fields', 'error');
      return;
    }

    // Validate vitals
    const vitalsError = validateVitals(vitals);
    if (Object.keys(vitalsError).length > 0) {
      setVitalsErrors(vitalsError);
      setError('Please correct the errors in vitals');
      show('Please correct the errors in vitals', 'error');
      return;
    }

    const usedMedicineRows = dispensedMedicines.filter(
      (medicine) => medicine.medicineId || medicine.quantity || medicine.instructions.trim()
    );

    const incompleteMedicineRow = usedMedicineRows.find(
      (medicine) => !medicine.medicineId || !medicine.quantity
    );
    if (incompleteMedicineRow) {
      setError('Please select a medicine and quantity for every medicine entry');
      show('Please select a medicine and quantity for every medicine entry', 'error');
      return;
    }

    setLoading(true);

    try {
      const medicineSummary = usedMedicineRows
        .map((medicine) => {
          const selectedMedicine = medicineOptions.find((option) => option.id === medicine.medicineId);
          const medicineName = selectedMedicine?.name || medicine.medicineId;
          const extraInstructions = medicine.instructions.trim()
            ? ` | Instructions: ${medicine.instructions.trim()}`
            : '';
          return `- ${medicineName} | Quantity: ${medicine.quantity}${extraInstructions}`;
        })
        .join('\n');

      const combinedPreliminaryNotes = [
        formData.preliminary_notes.trim(),
        medicineSummary ? `Medicine Given To Patient:\n${medicineSummary}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const visitData = {
        ...formData,
        employee: parseInt(formData.employee, 10) || 0,
        vitals: aggregateVitals(vitals),
        preliminary_notes: combinedPreliminaryNotes,
      };

      await createVisit(visitData);
      show('Visit created successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create visit';
      setError(errorMessage);
      show(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.visitForm}>
      <Header title="OHC Visit Form" subtitle="Record new patient visit" />
      <main className={styles.visitFormMain}>
        {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

        <Card>
          <form onSubmit={handleSubmit}>
            <div className={styles.formSection}>
              <h3>Patient Information</h3>
              <div className={styles.formGrid}>
                <FormInput
                  label="Employee Code *"
                  name="employee"
                  type="text"
                  value={formData.employee}
                  onChange={(value) => handleInputChange('employee', value)}
                  placeholder="EMP-001"
                  required
                  helperText="Enter the employee code"
                />
                <FormInput
                  label="Employee Name (If New)"
                  name="employee_name"
                  type="text"
                  value={formData.employee_name}
                  onChange={(value) => handleInputChange('employee_name', value)}
                  placeholder="John Doe"
                  helperText="Only needed if employee code is new"
                />
                <FormInput
                  label="Department (If New)"
                  name="employee_department"
                  type="text"
                  value={formData.employee_department}
                  onChange={(value) => handleInputChange('employee_department', value)}
                  placeholder="Manufacturing"
                  helperText="Only needed if employee code is new"
                />
                <FormInput
                  label="Visit Type *"
                  name="visit_type"
                  type="select"
                  value={formData.visit_type}
                  onChange={(value) => handleInputChange('visit_type', value)}
                  options={VISIT_TYPE_OPTIONS}
                  required
                />
                <FormInput
                  label="Triage Level *"
                  name="triage_level"
                  type="select"
                  value={formData.triage_level}
                  onChange={(value) => handleInputChange('triage_level', value)}
                  options={TRIAGE_LEVEL_OPTIONS}
                  required
                />
                <FormInput
                  label="Visit Date *"
                  name="visit_date"
                  type="date"
                  value={formData.visit_date}
                  onChange={(value) => handleInputChange('visit_date', value)}
                  required
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>Chief Complaint & Symptoms</h3>
              <div className={styles.formGrid}>
                <FormInput
                  label="Chief Complaint *"
                  name="chief_complaint"
                  type="text"
                  value={formData.chief_complaint}
                  onChange={(value) => handleInputChange('chief_complaint', value)}
                  placeholder="e.g., Headache, Fever, etc."
                  required
                  className={styles.fullWidth}
                />
                <FormInput
                  label="Symptoms *"
                  name="symptoms"
                  type="textarea"
                  value={formData.symptoms}
                  onChange={(value) => handleInputChange('symptoms', value)}
                  placeholder="Describe the symptoms in detail"
                  required
                  rows={5}
                  className={styles.fullWidth}
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>Vital Signs</h3>
              <div className={styles.vitalsGrid}>
                <FormInput
                  label="Temperature (°F)"
                  name="temperature"
                  type="text"
                  value={vitals.temperature}
                  onChange={(value) => handleVitalChange('temperature', value)}
                  onBlur={handleBlurVital}
                  placeholder="98.6"
                  error={vitalsErrors.temperature}
                  helperText="Valid range: 80-120°F"
                />
                <FormInput
                  label="Blood Pressure"
                  name="blood_pressure"
                  type="text"
                  value={vitals.blood_pressure}
                  onChange={(value) => handleVitalChange('blood_pressure', value)}
                  onBlur={handleBlurVital}
                  placeholder="120/80"
                  error={vitalsErrors.blood_pressure}
                  helperText="Format: 120/80 or 120/80 mmHg"
                />
                <FormInput
                  label="Pulse (bpm)"
                  name="pulse"
                  type="text"
                  value={vitals.pulse}
                  onChange={(value) => handleVitalChange('pulse', value)}
                  onBlur={handleBlurVital}
                  placeholder="76"
                  error={vitalsErrors.pulse}
                  helperText="Valid range: 40-200 bpm"
                />
                <FormInput
                  label="SpO2 (%)"
                  name="spo2"
                  type="text"
                  value={vitals.spo2}
                  onChange={(value) => handleVitalChange('spo2', value)}
                  onBlur={handleBlurVital}
                  placeholder="98"
                  error={vitalsErrors.spo2}
                  helperText="Valid range: 70-100%"
                />
                <FormInput
                  label="Weight (kg)"
                  name="weight"
                  type="text"
                  value={vitals.weight}
                  onChange={(value) => handleVitalChange('weight', value)}
                  onBlur={handleBlurVital}
                  placeholder="70"
                  error={vitalsErrors.weight}
                  helperText="Valid range: 1-300 kg"
                />
                <FormInput
                  label="Height (cm)"
                  name="height"
                  type="text"
                  value={vitals.height}
                  onChange={(value) => handleVitalChange('height', value)}
                  onBlur={handleBlurVital}
                  placeholder="172"
                  error={vitalsErrors.height}
                  helperText="Valid range: 50-250 cm"
                />
              </div>

              {vitalsPreview !== '{}' && (
                <div className={styles.vitalsPreview}>
                  <h4>Vitals Preview</h4>
                  <pre>{vitalsPreview}</pre>
                </div>
              )}
            </div>

            <div className={styles.formSection}>
              <div className={styles.sectionHeaderRow}>
                <h3>Medicine Given to Patient</h3>
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  onClick={addDispensedMedicineRow}
                  disabled={medicineOptions.length === 0}
                >
                  Add Medicine
                </Button>
              </div>
              {medicineOptions.length === 0 ? (
                <Alert type="info">
                  No medicines available yet. Add medicine records from Medicine Management first.
                </Alert>
              ) : (
                <div className={styles.medicineList}>
                  {dispensedMedicines.map((medicine, index) => (
                    <div key={`${index}-${medicine.medicineId}`} className={styles.medicineCard}>
                      <div className={styles.medicineCardHeader}>
                        <h4>Medicine {index + 1}</h4>
                        {dispensedMedicines.length > 1 && (
                          <Button
                            type="button"
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeDispensedMedicineRow(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className={styles.formGrid}>
                        <FormInput
                          label="Medicine"
                          type="select"
                          value={medicine.medicineId}
                          onChange={(value) => handleDispensedMedicineChange(index, 'medicineId', value)}
                          options={[
                            { value: '', label: 'Select medicine' },
                            ...medicineOptions.map((option) => ({
                              value: option.id,
                              label: `${option.name} (${option.stock} ${option.unit})`,
                            })),
                          ]}
                        />
                        <FormInput
                          label="Quantity Given"
                          type="number"
                          value={medicine.quantity}
                          onChange={(value) => handleDispensedMedicineChange(index, 'quantity', value)}
                          min="1"
                        />
                        <FormInput
                          label="Instructions"
                          type="textarea"
                          value={medicine.instructions}
                          onChange={(value) => handleDispensedMedicineChange(index, 'instructions', value)}
                          placeholder="Optional instructions for the patient"
                          rows={3}
                          className={styles.fullWidth}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.formSection}>
              <h3>Additional Information</h3>
              <div className={styles.formGrid}>
                <FormInput
                  label="Preliminary Notes"
                  name="preliminary_notes"
                  type="textarea"
                  value={formData.preliminary_notes}
                  onChange={(value) => handleInputChange('preliminary_notes', value)}
                  placeholder="Any additional observations or notes"
                  rows={4}
                  className={styles.fullWidth}
                />
                <FormInput
                  label="Follow-up Date"
                  name="follow_up_date"
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(value) => handleInputChange('follow_up_date', value)}
                  helperText="Optional: Schedule follow-up if needed"
                />
              </div>
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
                Create Visit
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};
