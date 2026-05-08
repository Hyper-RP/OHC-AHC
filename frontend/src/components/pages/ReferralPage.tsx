import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../layout';
import { FormInput, Button, Card, Alert } from '../ui';
import { createReferral } from '../../services/ahc';
import { REFERRAL_PRIORITY_OPTIONS } from '../../utils/constants';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { ReferralPriority } from '../../types';
import styles from './ReferralPage.module.css';

/**
 * Referral Page component
 * Form to create AHC referrals for patients
 */
export const ReferralPage: React.FC = () => {
  const navigate = useNavigate();
  const { show } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    visit: '',
    diagnosis: '',
    employee: '',
    referred_by: '',
    hospital: '',
    referral_reason: '',
    specialist_department: '',
    priority: ReferralPriority.NORMAL,
  });

  const handleInputChange = (name: string, value: string | ReferralPriority) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.visit || !formData.employee || !formData.referral_reason) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await createReferral(formData);
      show('Referral created successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create referral';
      setError(errorMessage);
      show(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.referralPage}>
      <Header
        title="Create Referral"
        subtitle="Refer patient to AHC partner hospital"
      />
      <main className={styles.referralMain}>
        {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

        <Card>
          <form onSubmit={handleSubmit}>
            <div className={styles.formSection}>
              <h3>Referral Details</h3>
              <div className={styles.formGrid}>
                <FormInput
                  label="Visit UUID *"
                  name="visit"
                  type="text"
                  value={formData.visit}
                  onChange={(value) => handleInputChange('visit', value)}
                  required
                />
                <FormInput
                  label="Diagnosis ID"
                  name="diagnosis"
                  type="text"
                  value={formData.diagnosis}
                  onChange={(value) => handleInputChange('diagnosis', value)}
                />
                <FormInput
                  label="Employee ID *"
                  name="employee"
                  type="text"
                  value={formData.employee}
                  onChange={(value) => handleInputChange('employee', value)}
                  required
                />
                <FormInput
                  label="Priority *"
                  name="priority"
                  type="select"
                  value={formData.priority}
                  onChange={(value) => handleInputChange('priority', value)}
                  options={REFERRAL_PRIORITY_OPTIONS}
                  required
                />
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>Referral Information</h3>
              <FormInput
                label="Referral Reason *"
                name="referral_reason"
                type="textarea"
                value={formData.referral_reason}
                onChange={(value) => handleInputChange('referral_reason', value)}
                required
                rows={4}
                className={styles.fullWidth}
              />
              <FormInput
                label="Specialist Department"
                name="specialist_department"
                type="text"
                value={formData.specialist_department}
                onChange={(value) => handleInputChange('specialist_department', value)}
                placeholder="e.g., Cardiology, Orthopedics"
              />
            </div>

            <div className={styles.formActions}>
              <Button type="button" variant="outline-secondary" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" variant="brand" loading={loading}>
                Create Referral
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};
