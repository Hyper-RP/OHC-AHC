import React, { useState, useEffect } from 'react';
import { Header } from '../layout';
import { Card, Loading, Alert } from '../ui';
import { listHospitals } from '../../services/ahc';
import type { Hospital } from '../../types';
import styles from './HospitalSelection.module.css';

/**
 * Hospital Selection page component
 * Display and select from partner hospitals
 */
export const HospitalSelection: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const loadHospitals = async () => {
    try {
      setLoading(true);
      const response = await listHospitals({ status: 'ACTIVE' });
      setHospitals(response.results);
    } catch {
      setError('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      loadHospitals();
    });
  }, []);

  const filteredHospitals = hospitals.filter(
    (hospital) =>
      hospital.name.toLowerCase().includes(filter.toLowerCase()) ||
      hospital.city.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return <Loading fullScreen text="Loading hospitals..." />;
  }

  return (
    <div className={styles.hospitalSelection}>
      <Header
        title="Partner Hospitals"
        subtitle="Select a hospital for referral"
      />
      <main className={styles.hospitalMain}>
        {error && <Alert type="danger" onDismiss={() => setError('')}>{error}</Alert>}

        <div className={styles.searchSection}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search hospitals by name or city..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className={styles.hospitalGrid}>
          {filteredHospitals.map((hospital) => (
            <Card key={hospital.id} className={styles.hospitalCard}>
              <div className={styles.hospitalHeader}>
                <h3>{hospital.name}</h3>
                <span className={`${styles.hospitalStatus} ${styles[hospital.hospital_status.toLowerCase()]}`}>
                  {hospital.hospital_status}
                </span>
              </div>
              <div className={styles.hospitalDetails}>
                <p><strong>Code:</strong> {hospital.code}</p>
                <p><strong>City:</strong> {hospital.city}</p>
                <p><strong>State:</strong> {hospital.state}</p>
                {hospital.contact_person && <p><strong>Contact:</strong> {hospital.contact_person}</p>}
                {hospital.phone_number && <p><strong>Phone:</strong> {hospital.phone_number}</p>}
              </div>
              {hospital.specialties.length > 0 && (
                <div className={styles.hospitalSpecialties}>
                  <strong>Specialties:</strong>
                  <div className={styles.specialtiesList}>
                    {hospital.specialties.slice(0, 3).map((specialty, index) => (
                      <span key={index} className={styles.specialtyTag}>{specialty}</span>
                    ))}
                    {hospital.specialties.length > 3 && (
                      <span className={styles.specialtyTag}>+{hospital.specialties.length - 3}</span>
                    )}
                  </div>
                </div>
              )}
              <div className={styles.hospitalFeatures}>
                {hospital.supports_cashless && (
                  <span className={styles.feature}>Cashless</span>
                )}
                {hospital.is_available_for_video && (
                  <span className={styles.feature}>Video Consult</span>
                )}
              </div>
            </Card>
          ))}
        </div>

        {filteredHospitals.length === 0 && (
          <div className={styles.emptyState}>
            <p>No hospitals found matching your search.</p>
          </div>
        )}
      </main>
    </div>
  );
};
