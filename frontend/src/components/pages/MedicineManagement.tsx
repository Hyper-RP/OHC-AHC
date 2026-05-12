import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '../layout';
import { Alert, Card, FormInput, StatCard } from '../ui';
import {
  loadMedicineActivity,
  loadMedicineRecords,
  type ActivityRecord,
  type MedicineRecord,
} from './medicineInventory';
import styles from './MedicineManagement.module.css';

/**
 * Medicine Management page
 * Main hub for viewing inventory and navigating to the add medicine flow
 */
export const MedicineManagement: React.FC = () => {
  const location = useLocation();
  const [medicines, setMedicines] = useState<MedicineRecord[]>([]);
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [banner, setBanner] = useState('');

  const selectedMedicine =
    medicines.find((medicine) => medicine.id === selectedMedicineId) ?? null;

  const filteredMedicines = medicines.filter((medicine) => {
    const term = search.toLowerCase();
    return (
      medicine.name.toLowerCase().includes(term) ||
      medicine.id.toLowerCase().includes(term) ||
      medicine.batch.toLowerCase().includes(term)
    );
  });

  const lowStockMedicines = medicines.filter((medicine) => medicine.stock <= medicine.reorderLevel);
  const totalUnits = medicines.reduce((sum, medicine) => sum + medicine.stock, 0);
  const nearExpiryCount = medicines.filter((medicine) => medicine.expiry <= '2026-12-31').length;

  useEffect(() => {
    const storedMedicines = loadMedicineRecords();
    const storedActivity = loadMedicineActivity();
    setMedicines(storedMedicines);
    setActivity(storedActivity);
    if (storedMedicines.length > 0) {
      setSelectedMedicineId((current) =>
        current && storedMedicines.some((medicine) => medicine.id === current)
          ? current
          : storedMedicines[0].id
      );
    }
  }, []);

  useEffect(() => {
    const state = location.state as { banner?: string } | null;
    if (state?.banner) {
      setBanner(state.banner);
    }
  }, [location.state]);

  return (
    <div className={styles.page}>
      <Header
        title="Medicine Management"
        subtitle="Manage stock, low inventory, and medicine records from one workspace"
      />

      <main className={styles.main}>
        {banner && (
          <Alert type="info" onDismiss={() => setBanner('')}>
            {banner}
          </Alert>
        )}

        <section className={styles.statsSection}>
          <StatCard label="Total Medicines" value={medicines.length} icon="Rx" />
          <StatCard label="Stock Units" value={totalUnits} icon="ST" />
          <StatCard label="Low Stock Items" value={lowStockMedicines.length} icon="LS" />
          <StatCard label="Near Expiry" value={nearExpiryCount} icon="EX" />
        </section>

        <section className={styles.workspace}>
          <div className={styles.leftColumn}>
            <Link to="/medicine-management/add" className={styles.sectionLink}>
              <Card className={styles.sectionCard}>
                <div className={styles.sectionIcon}>+</div>
                <div>
                  <h3>Add Medicine</h3>
                  <p>Open a dedicated page to create a new medicine record</p>
                </div>
              </Card>
            </Link>

            <Card className={styles.filterCard}>
              <div className={styles.filterGridSingle}>
                <FormInput
                  label="Search Medicine"
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by name, ID, or batch"
                />
              </div>
            </Card>

            <Card className={styles.catalogCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3>Medicine Catalog</h3>
                  <p>{filteredMedicines.length} medicine entries on this page</p>
                </div>
                <span className={styles.catalogBadge}>{medicines.length} items</span>
              </div>

              <div className={styles.catalogList}>
                {filteredMedicines.map((medicine) => {
                  const isLowStock = medicine.stock <= medicine.reorderLevel;
                  const isSelected = selectedMedicine?.id === medicine.id;
                  return (
                    <button
                      key={medicine.id}
                      type="button"
                      className={`${styles.catalogItem} ${isSelected ? styles.selected : ''}`}
                      onClick={() => setSelectedMedicineId(medicine.id)}
                    >
                      <div className={styles.catalogHead}>
                        <div>
                          <strong>{medicine.name}</strong>
                          <p>{medicine.id}</p>
                        </div>
                        <span className={`${styles.stockPill} ${isLowStock ? styles.low : styles.healthy}`}>
                          {medicine.stock} {medicine.unit}
                        </span>
                      </div>
                      <div className={styles.catalogMeta}>
                        <span>Batch {medicine.batch || '-'}</span>
                        <span>Expiry {medicine.expiry || '-'}</span>
                      </div>
                    </button>
                  );
                })}
                {filteredMedicines.length === 0 && (
                  <div className={styles.emptyState}>
                    <p>
                      {medicines.length === 0
                        ? 'No medicine inventory available yet.'
                        : 'No medicines matched your search.'}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className={styles.rightColumn}>
            {selectedMedicine && (
              <Card className={styles.detailCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h3>{selectedMedicine.name}</h3>
                    <p>{selectedMedicine.id}</p>
                  </div>
                  <span
                    className={`${styles.stockPill} ${
                      selectedMedicine.stock <= selectedMedicine.reorderLevel ? styles.low : styles.healthy
                    }`}
                  >
                    {selectedMedicine.stock} {selectedMedicine.unit} in stock
                  </span>
                </div>

                <div className={styles.detailGrid}>
                  <div>
                    <span className={styles.detailLabel}>Supplier</span>
                    <strong>{selectedMedicine.supplier || '-'}</strong>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>Batch No.</span>
                    <strong>{selectedMedicine.batch || '-'}</strong>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>Expiry Date</span>
                    <strong>{selectedMedicine.expiry || '-'}</strong>
                  </div>
                  <div>
                    <span className={styles.detailLabel}>Reorder Level</span>
                    <strong>{selectedMedicine.reorderLevel} {selectedMedicine.unit}</strong>
                  </div>
                </div>
              </Card>
            )}

            <Card className={styles.alertCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3>Low Stock Watch</h3>
                  <p>Medicines that need close attention</p>
                </div>
              </div>

              <div className={styles.warningList}>
                {lowStockMedicines.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No low stock medicines to show.</p>
                  </div>
                ) : (
                  lowStockMedicines.map((medicine) => (
                    <div key={medicine.id} className={styles.warningItem}>
                      <div>
                        <strong>{medicine.name}</strong>
                        <p>Reorder at {medicine.reorderLevel} {medicine.unit}</p>
                      </div>
                      <span className={styles.warningValue}>{medicine.stock} left</span>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className={styles.activityCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3>Recent Activity</h3>
                  <p>Latest medicine counter updates</p>
                </div>
              </div>

              <div className={styles.activityList}>
                {activity.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No medicine activity has been recorded yet.</p>
                  </div>
                ) : (
                  activity.map((entry) => (
                    <div key={entry.id} className={styles.activityItem}>
                      <div className={styles.activityTop}>
                        <strong>{entry.medicineName}</strong>
                        <span className={styles.activityType}>{entry.type}</span>
                      </div>
                      <p>{entry.note}</p>
                      <div className={styles.activityMeta}>
                        <span>{entry.quantity} units</span>
                        <span>{entry.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};
