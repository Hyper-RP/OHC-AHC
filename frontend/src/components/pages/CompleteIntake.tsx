import React, { useState } from 'react';
import { Header } from '../layout';
import { Card, Button, FormInput } from '../ui';
import styles from './CompleteIntake.module.css';

/**
 * Complete Intake page component
 * Complete the intake process for a visit
 */
export const CompleteIntake: React.FC = () => {
  const [visitId, setVisitId] = useState('');

  const handleComplete = () => {
    if (!visitId) {
      alert('Please enter a visit ID');
      return;
    }
    alert(`Completing intake for visit: ${visitId}`);
    // In a real app, this would call an API to complete the intake
  };

  return (
    <div className={styles.completeIntake}>
      <Header title="Complete Intake" subtitle="Finalize patient visit intake" />
      <main className={styles.intakeMain}>
        <Card>
          <h3>Complete Visit Intake</h3>
          <p className={styles.description}>
            This action will mark the visit as complete and close the intake process.
            Make sure all vitals, symptoms, and preliminary notes have been recorded.
          </p>
          <FormInput
            label="Visit UUID *"
            value={visitId}
            onChange={setVisitId}
            placeholder="Enter the visit UUID to complete"
            required
          />
          <Button variant="brand" onClick={handleComplete} className={styles.completeButton}>
            Complete Intake
          </Button>
        </Card>
      </main>
    </div>
  );
};
