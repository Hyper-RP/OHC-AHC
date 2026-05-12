import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../layout';
import { Button, Card, Loading } from '../ui';
import { exportEmployeeHealthHistory, getEmployeeHealthHistory } from '../../services/reports';
import type { EmployeeHealthHistory } from '../../types';
import styles from './EmployeeHealthHistory.module.css';

/**
 * Employee Health History detail page
 * Shows the complete history for one employee on a dedicated screen
 */
export const EmployeeHealthHistoryDetail: React.FC = () => {
  const { employeeId = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EmployeeHealthHistory | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const result = await getEmployeeHealthHistory(employeeId);
        if ('employee' in result) {
          setData(result);
        } else {
          alert('Failed to load employee history');
        }
      } catch {
        alert('Failed to load employee history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [employeeId]);

  const handleExport = async () => {
    if (!data) return;
    try {
      const blob = await exportEmployeeHealthHistory(data.employee.employee_code);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employee_${data.employee.employee_code}_health_receipt.pdf`;
      link.click();
    } catch {
      alert('Export failed');
    }
  };

  return (
    <div className={styles.healthHistory}>
      <Header title="Employee Health History" subtitle="View complete health records" />
      <main className={styles.healthMain}>
        {loading && <Loading />}

        {!loading && data && (
          <>
            <Card className={styles.summaryCard}>
              <h3>Employee Summary</h3>
              <p><strong>Name:</strong> {data.employee.user.first_name} {data.employee.user.last_name}</p>
              <p><strong>Employee ID:</strong> {data.employee.employee_code}</p>
              <p><strong>Department:</strong> {data.employee.department}</p>
              <p><strong>Designation:</strong> {data.employee.designation}</p>
              <p><strong>Fitness Status:</strong> {data.employee.fitness_status}</p>
            </Card>

            <Card className={styles.visitsCard}>
              <div className={styles.cardHeader}>
                <h3>Visits ({data.visits.length})</h3>
                <Button variant="outline-secondary" size="sm" onClick={handleExport}>
                  Export PDF Receipt
                </Button>
              </div>
              <div className={styles.visitsList}>
                {data.visits.map((visit) => (
                  <div key={visit.uuid} className={styles.visitItem}>
                    <p><strong>Date:</strong> {visit.visit_date}</p>
                    <p><strong>Type:</strong> {visit.visit_type}</p>
                    <p><strong>Triage Level:</strong> {visit.triage_level}</p>
                    <p><strong>Visit Status:</strong> {visit.visit_status}</p>
                    <p><strong>Doctor:</strong> {visit.doctor_name}</p>
                    <p><strong>Complaint:</strong> {visit.chief_complaint}</p>
                    <p><strong>Symptoms:</strong> {visit.symptoms}</p>
                    {Object.keys(visit.vitals).length > 0 && (
                      <div className={styles.detailBlock}>
                        <p><strong>Vitals:</strong></p>
                        <div className={styles.detailList}>
                          {Object.entries(visit.vitals).map(([key, value]) => (
                            <p key={key}><strong>{key}:</strong> {value}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {visit.preliminary_notes && (
                      <p><strong>Preliminary Notes:</strong> {visit.preliminary_notes}</p>
                    )}
                    <p><strong>Requires Referral:</strong> {visit.requires_referral ? 'Yes' : 'No'}</p>
                    {visit.follow_up_date && (
                      <p><strong>Follow-up Date:</strong> {visit.follow_up_date}</p>
                    )}
                    {visit.next_action && (
                      <p><strong>Next Action:</strong> {visit.next_action}</p>
                    )}
                    {visit.diagnoses.length > 0 && (
                      <div className={styles.detailBlock}>
                        <p><strong>Diagnoses:</strong></p>
                        <div className={styles.detailList}>
                          {visit.diagnoses.map((diagnosis) => (
                            <p key={`${visit.uuid}-${diagnosis.diagnosis_name}-${diagnosis.diagnosed_at}`}>
                              <strong>{diagnosis.diagnosis_name}</strong> | {diagnosis.severity} | {diagnosis.fitness_decision}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {visit.prescriptions.length > 0 && (
                      <div className={styles.detailBlock}>
                        <p><strong>Prescriptions:</strong></p>
                        <div className={styles.detailList}>
                          {visit.prescriptions.map((prescription) => (
                            <p key={`${visit.uuid}-${prescription.medicine_name}-${prescription.start_date}`}>
                              <strong>{prescription.medicine_name}</strong> | {prescription.dosage} | Start {prescription.start_date}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};
