import React from 'react';
import type { MedicineStock } from '../../types/medicine';
import styles from './LowStockAlert.module.css';

interface LowStockAlertProps {
  items: MedicineStock[];
  onDismiss?: () => void;
}

/**
 * Alert component for low stock medicines
 * Dismissible with badge count
 */
export const LowStockAlert: React.FC<LowStockAlertProps> = ({ items, onDismiss }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={styles.lowStockAlert}>
      <div className={styles.alertHeader}>
        <div className={styles.alertTitle}>
          <span className={styles.alertIcon}>⚠️</span>
          <h3>Low Stock Alert</h3>
        </div>
        <button className={styles.dismissButton} onClick={onDismiss}>
          ×
        </button>
      </div>

      <div className={styles.alertBody}>
        <p className={styles.alertText}>
          <span className={styles.alertCount}>{items.length}</span>
          {items.length === 1 ? ' medicine is low on stock.' : ' medicines are low on stock.'}
        </p>

        <ul className={styles.medicineList}>
          {items.map((medicine) => (
            <li key={medicine.id} className={styles.medicineItem}>
              <strong>{medicine.name}</strong>
              <span className={styles.stockInfo}>
                Stock: {medicine.stock_quantity} {medicine.unit}
                {medicine.is_low_stock && <span className={styles.badge}>Low</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
