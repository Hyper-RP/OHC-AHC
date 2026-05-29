import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { Header } from '../layout';
import { FormInput, Button, Card, Alert } from '../ui';
import { Role, VisitType } from '../../types';
import api from '../../services/api';
import styles from './OHCVisitForm.module.css';

interface DoctorOption {
  id: number;
  name: string;
  registration_number: string;
  specializations: string;
}

interface VisitFormData {
  patient_name: string;
  employee_id: string;
  department: string;
  date_of_birth: string;
  gender: string;
  contact_number: string;
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
  consulted_doctor?: number;
}

/**
 * Nurse Visit Form component
 * Create employee visit with employee details and vitals, then assign to doctor
 */
export const NurseVisitForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);

  const [formData, setFormData] = useState<VisitFormData>({
    patient_name: '',
    employee_id: '',
    department: '',
    date_of_birth: '',
    gender: '',
    contact_number: '',
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    vitals: {},
    consulted_doctor: undefined,
  });

  useEffect(() => {
    if (!user || user.role !== Role.NURSE) {
      navigate('/dashboard');
      return;
    }
    fetchDoctorOptions();
  }, [user, navigate]);

  const fetchDoctorOptions = async () => {
    try {
      const response = await api.get('/accounts/doctors/');
      const doctors: DoctorOption[] = response.data.map((doctor: any) => ({
        id: doctor.id,
        name: `${doctor.user.first_name} ${doctor.user.last_name}`,
        registration_number: doctor.registration_number,
        specializations: doctor.specializations || 'General Medicine',
      }));

      setDoctorOptions(doctors);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  const handleVitalChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      vitals: { ...prev.vitals, [name]: value },
    }));
  };

  const handleInputChange = (field: keyof VisitFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateAgeFromDob = (dateOfBirth: string) => {
    if (!dateOfBirth) return undefined;

    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return undefined;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDifference = today.getMonth() - dob.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
      age -= 1;
    }

    return age >= 0 ? age : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.patient_name.trim()) {
      setError('Employee name is required');
      show('Please enter employee name', 'error');
      return;
    }

    if (!formData.employee_id.trim()) {
      setError('Employee ID is required');
      show('Please enter employee ID', 'error');
      return;
    }

    if (!formData.department.trim()) {
      setError('Department is required');
      show('Please enter department', 'error');
      return;
    }

    if (!formData.date_of_birth) {
      setError('Date of birth is required');
      show('Please enter date of birth', 'error');
      return;
    }

    const calculatedAge = calculateAgeFromDob(formData.date_of_birth);
    if (calculatedAge === undefined) {
      setError('Valid date of birth is required');
      show('Please enter a valid date of birth', 'error');
      return;
    }

    if (!formData.gender) {
      setError('Gender is required');
      show('Please select gender', 'error');
      return;
    }

    if (!formData.contact_number.trim()) {
      setError('Contact number is required');
      show('Please enter contact number', 'error');
      return;
    }

    if (!formData.consulted_doctor) {
      setError('Please assign a doctor');
      show('Please assign a doctor', 'error');
      return;
    }

    setLoading(true);

    try {
      const visitData = {
        employee: formData.employee_id.trim(),
        employee_name: formData.patient_name,
        employee_department: formData.department,
        patient_name: formData.patient_name,
        patient_age: calculatedAge,
        patient_gender: formData.gender,
        patient_contact: formData.contact_number.trim(),
        visit_type: VisitType.WALK_IN,
        triage_level: 'LOW',
        visit_date: formData.visit_date,
        visit_time: formData.visit_time,
        vitals: formData.vitals,
        consulted_doctor: formData.consulted_doctor,
      };

      await api.post('/ohc/visits/', visitData);
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
      <Header title="Employee Registration Form" subtitle="Record employee visit and assign to doctor" />

      <main className={styles.visitFormMain}>
        {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

        <Card>
          <form onSubmit={handleSubmit}>
            {/* Employee Information */}
            <div className={styles.formSection}>
              <h3>Employee Information</h3>
              <div className={styles.formGrid}>
                <FormInput
                  label="Employee Name *"
                  type="text"
                  value={formData.patient_name}
                  onChange={(value) => handleInputChange('patient_name', value)}
                  required
                  helperText="Full name of the employee"
                />
                <FormInput
                  label="Employee ID *"
                  type="text"
                  value={formData.employee_id}
                  onChange={(value) => handleInputChange('employee_id', value)}
                  required
                  helperText="Employee code"
                />
                <FormInput
                  label="Department *"
                  type="text"
                  value={formData.department}
                  onChange={(value) => handleInputChange('department', value)}
                  required
                  helperText="Department name for the employee record"
                />
                <FormInput
                  label="DOB *"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(value) => handleInputChange('date_of_birth', value)}
                  required
                  helperText="Date of birth"
                  max={new Date().toISOString().split('T')[0]}
                />
                <FormInput
                  label="Gender *"
                  type="select"
                  value={formData.gender}
                  onChange={(value) => handleInputChange('gender', value)}
                  required
                  options={[
                    { value: '', label: 'Select gender' },
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                    { value: 'OTHER', label: 'Other' },
                  ]}
                />
                <FormInput
                  label="Contact Number *"
                  type="text"
                  value={formData.contact_number}
                  onChange={(value) => handleInputChange('contact_number', value)}
                  required
                  helperText="Phone number"
                  placeholder="+91 9876543210"
                />
                <FormInput
                  label="Visit Date *"
                  type="date"
                  value={formData.visit_date}
                  onChange={(value) => handleInputChange('visit_date', value)}
                  required
                />
                <FormInput
                  label="Visit Time *"
                  type="time"
                  value={formData.visit_time}
                  onChange={(value) => handleInputChange('visit_time', value)}
                  required
                />
              </div>
            </div>

            {/* Vital Signs */}
            <div className={styles.formSection}>
              <h3>Vital Signs</h3>
              <div className={styles.vitalsGrid}>
                <FormInput
                  label="Temperature (°F)"
                  type="text"
                  value={formData.vitals.temperature || ''}
                  onChange={(value) => handleVitalChange('temperature', value)}
                  placeholder="98.6"
                  helperText="Valid range: 80-120°F"
                />
                <FormInput
                  label="Blood Pressure"
                  type="text"
                  value={formData.vitals.blood_pressure || ''}
                  onChange={(value) => handleVitalChange('blood_pressure', value)}
                  placeholder="120/80"
                  helperText="Format: 120/80"
                />
                <FormInput
                  label="Pulse Rate (bpm)"
                  type="text"
                  value={formData.vitals.pulse || ''}
                  onChange={(value) => handleVitalChange('pulse', value)}
                  placeholder="76"
                  helperText="Valid range: 40-200 bpm"
                />
                <FormInput
                  label="SpO2 (%)"
                  type="text"
                  value={formData.vitals.spo2 || ''}
                  onChange={(value) => handleVitalChange('spo2', value)}
                  placeholder="98"
                  helperText="Valid range: 70-100%"
                />
                <FormInput
                  label="Weight (kg)"
                  type="text"
                  value={formData.vitals.weight || ''}
                  onChange={(value) => handleVitalChange('weight', value)}
                  placeholder="70"
                  helperText="Valid range: 1-300 kg"
                />
                <FormInput
                  label="Height (cm)"
                  type="text"
                  value={formData.vitals.height || ''}
                  onChange={(value) => handleVitalChange('height', value)}
                  placeholder="172"
                  helperText="Valid range: 50-250 cm"
                />
              </div>
            </div>

            {/* Doctor Selection */}
            <div className={styles.formSection}>
              <h3>Assign to Doctor *</h3>
              <div className={styles.formGrid}>
                <FormInput
                  label="Select Doctor"
                  type="select"
                  value={formData.consulted_doctor?.toString() || ''}
                  onChange={(value) => handleInputChange('consulted_doctor', parseInt(value))}
                  options={[
                    { value: '', label: 'Select a doctor' },
                    ...doctorOptions.map((doctor) => ({
                      value: doctor.id.toString(),
                      label: `${doctor.name} (${doctor.registration_number}) - ${doctor.specializations}`,
                    })),
                  ]}
                  required
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
                Submit to Doctor
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};
