import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../layout';
import { Alert, Button, Card, Loading } from '../ui';
import { exportEmployeeHealthHistory, getEmployeeHealthHistory } from '../../services/reports';
import type { EmployeeHealthHistory } from '../../types';
import styles from './EmployeeHealthHistory.module.css';

/**
 * Employee Health History detail page
 * Shows the complete history for one employee on a dedicated screen
 */
export const EmployeeHealthHistoryDetail: React.FC = () => {
  const navigate = useNavigate();
  const { employeeId = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EmployeeHealthHistory | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getEmployeeHealthHistory(employeeId);
        if ('employee' in result) {
          setData(result);
        } else {
          setError('Failed to load employee history');
        }
      } catch {
        setError('Failed to load employee history');
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
      setError('Export failed');
    }
  };

  return (
    <div className={styles.healthHistory}>
      <Header
        title="Employee Health History"
        subtitle="View complete health records"
        actions={(
          <Button type="button" variant="outline-secondary" onClick={() => navigate('/reports/employee-history')}>
            Back
          </Button>
        )}
      />
      <main className={styles.healthMain}>
        {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}
        {loading && <Loading />}

        {!loading && data && (
          <>
            <Card className={styles.summaryCard}>
              <div className={styles.summaryTop}>
                <div>
                  <p className={styles.eyebrow}>Employee Summary</p>
                  <h2 className={styles.summaryName}>
                    {data.employee.user.first_name} {data.employee.user.last_name}
                  </h2>
                </div>
                <span className={styles.fitnessBadge}>{data.employee.fitness_status}</span>
              </div>
              <div className={styles.summaryMetaGrid}>
                <div className={styles.metaBlock}>
                  <span className={styles.metaLabel}>Employee ID</span>
                  <strong>{data.employee.employee_code}</strong>
                </div>
                <div className={styles.metaBlock}>
                  <span className={styles.metaLabel}>Department</span>
                  <strong>{data.employee.department}</strong>
                </div>
                <div className={styles.metaBlock}>
                  <span className={styles.metaLabel}>Designation</span>
                  <strong>{data.employee.designation}</strong>
                </div>
                <div className={styles.metaBlock}>
                  <span className={styles.metaLabel}>Visits</span>
                  <strong>{data.visits.length}</strong>
                </div>
              </div>
            </Card>

            <Card className={styles.visitsCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3>Visit Timeline</h3>
                  <p className={styles.cardSubtext}>{data.visits.length} visits recorded</p>
                </div>
                <Button variant="outline-secondary" size="sm" onClick={handleExport}>
                  Export PDF Receipt
                </Button>
              </div>
              <div className={styles.visitsList}>
                {data.visits.map((visit) => (
                  <div key={visit.id} className={styles.visitItem}>
                    <div className={styles.visitHeader}>
                      <div>
                        <h4>{visit.chief_complaint || 'Visit Record'}</h4>
                        <p className={styles.visitMetaLine}>
                          {visit.visit_date} • {visit.visit_type} • {visit.visit_status}
                        </p>
                      </div>
                      <span className={styles.visitStatusBadge}>{visit.visit_status}</span>
                    </div>

                    <div className={styles.visitGrid}>
                      <div className={styles.metaBlock}>
                        <span className={styles.metaLabel}>Doctor</span>
                        <strong>{visit.doctor_name || '-'}</strong>
                      </div>
                      <div className={styles.metaBlock}>
                        <span className={styles.metaLabel}>Triage Level</span>
                        <strong>{visit.triage_level || '-'}</strong>
                      </div>
                      <div className={styles.metaBlock}>
                        <span className={styles.metaLabel}>Referral</span>
                        <strong>{visit.requires_referral ? 'Yes' : 'No'}</strong>
                      </div>
                      {visit.follow_up_date && (
                        <div className={styles.metaBlock}>
                          <span className={styles.metaLabel}>Follow-up</span>
                          <strong>{visit.follow_up_date}</strong>
                        </div>
                      )}
                    </div>

                    {visit.symptoms && (
                      <div className={styles.detailBlock}>
                        <p className={styles.blockTitle}>Symptoms</p>
                        <p className={styles.bodyText}>{visit.symptoms}</p>
                      </div>
                    )}
                    {visit.vitals && Object.keys(visit.vitals).length > 0 && (
                      <div className={styles.detailBlock}>
                        <p className={styles.blockTitle}>Vitals</p>
                        <div className={styles.vitalsChipGrid}>
                          {Object.entries(visit.vitals).map(([key, value]) => (
                            <span key={key} className={styles.vitalChip}>
                              <strong>{key}:</strong> {String(value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {visit.preliminary_notes && (
                      <div className={styles.detailBlock}>
                        <p className={styles.blockTitle}>Preliminary Notes</p>
                        <p className={styles.bodyText}>{visit.preliminary_notes}</p>
                      </div>
                    )}
                    {visit.next_action && (
                      <div className={styles.detailBlock}>
                        <p className={styles.blockTitle}>Next Action</p>
                        <p className={styles.bodyText}>{visit.next_action}</p>
                      </div>
                    )}
                    {visit.diagnoses && visit.diagnoses.length > 0 && (
                      <div className={styles.detailBlock}>
                        <p className={styles.blockTitle}>Diagnoses</p>
                        <div className={styles.detailList}>
                          {visit.diagnoses.map((diagnosis: any) => (
                            <div key={`${visit.id}-${diagnosis.diagnosis_name}-${diagnosis.diagnosed_at}`} className={styles.inlineRecord}>
                              <strong>{diagnosis.diagnosis_name}</strong>
                              <span>{diagnosis.fitness_decision}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {visit.prescriptions && visit.prescriptions.length > 0 && (
                      <div className={styles.detailBlock}>
                        <p className={styles.blockTitle}>Prescriptions</p>
                        <div className={styles.detailList}>
                          {visit.prescriptions.map((prescription: any) => (
                            <div key={`${visit.id}-${prescription.medicine_name}-${prescription.start_date}`} className={styles.inlineRecord}>
                              <strong>{prescription.medicine_name}</strong>
                              <span>{prescription.dosage}</span>
                              <span>Start {prescription.start_date}</span>
                            </div>
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
