import React from 'react';
import type { MedicineStock } from '../../types';
import styles from './MedicineCard.module.css';

interface MedicineCardProps {
  medicine: MedicineStock;
  onClick?: () => void;
  onDispense?: (medicine: MedicineStock) => void;
  isSelected?: boolean;
}

/**
 * Card component for displaying medicine information
 * Shows stock level indicators and expiry warnings
 */
export const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  onClick,
  onDispense,
  isSelected = false,
}) => {
  const getStockLevelColor = (): string => {
    if (medicine.is_low_stock) return styles.lowStock;
    if (medicine.is_expired) return styles.expired;
    if (medicine.is_expiring_soon) return styles.expiringSoon;
    return styles.healthy;
  };

  const getStockLevelText = (): string => {
    if (medicine.is_expired) return 'Expired';
    if (medicine.stock_quantity === 0) return 'Out of Stock';
    if (medicine.is_low_stock) return 'Low Stock';
    return 'In Stock';
  };

  const getStockLevelIcon = (): string => {
    if (medicine.is_low_stock || medicine.is_expired) return '⚠️';
    if (medicine.is_expiring_soon) return '📅';
    return '';
  };

  return (
    <div
      className={`${styles.medicineCard} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <div className={styles.medicineHeader}>
        <h3 className={styles.medicineName}>{medicine.name}</h3>
        <span className={styles.medicineId}>{medicine.medicine_id}</span>
      </div>

      <div className={styles.medicineBody}>
        <div className={styles.medicineGrid}>
          <div className={styles.medicineInfo}>
            <span className={styles.infoLabel}>Stock:</span>
            <span className={`${styles.stockValue} ${getStockLevelColor()}`}>
              {medicine.stock_quantity} {medicine.unit}
            </span>
            <span className={styles.stockLevel}>{getStockLevelText()}</span>
          </div>

          <div className={styles.medicineInfo}>
            <span className={styles.infoLabel}>Initial:</span>
            <span className={styles.stockValue}>{medicine.initial_stock} {medicine.unit}</span>
          </div>

          <div className={styles.medicineInfo}>
            <span className={styles.infoLabel}>Used:</span>
            <span className={styles.stockValue}>{medicine.used_quantity} {medicine.unit}</span>
          </div>
        </div>

        <div className={styles.medicineDetails}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Unit:</span>
            <span className={styles.detailValue}>{medicine.unit}</span>
          </div>

          {medicine.supplier && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Supplier:</span>
              <span className={styles.detailValue}>{medicine.supplier}</span>
            </div>
          )}

          {medicine.batch_number && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Batch:</span>
              <span className={styles.detailValue}>{medicine.batch_number}</span>
            </div>
          )}

          {medicine.expiry_date && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Expiry:</span>
              <span className={`${styles.detailValue} ${medicine.is_expired ? styles.expired : ''}`}>
                {medicine.expiry_date}
              </span>
            </div>
          )}

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Reorder:</span>
            <span className={styles.detailValue}>{medicine.reorder_level} {medicine.unit}</span>
          </div>
        </div>
      </div>

      <div className={styles.medicineFooter}>
        {getStockLevelIcon() && (
          <span className={styles.stockIndicator}>{getStockLevelIcon()}</span>
        )}

        {onDispense && (
          <button className={styles.dispenseButton}>Dispense</button>
        )}
      </div>
    </div>
  );
};
