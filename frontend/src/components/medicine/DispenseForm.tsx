import React, { useState } from 'react';
import type { MedicineStock, DispenseData } from '../../types/medicine';
import styles from './DispenseForm.module.css';

interface DispenseFormProps {
  medicine: MedicineStock;
  visitId?: number;
  prescriptionId?: number;
  onDispense: (data: DispenseData) => void;
  onCancel: () => void;
}

/**
 * Form component for pharmacist to dispense medicine
 * Includes validation and stock checking
 */
export const DispenseForm: React.FC<DispenseFormProps> = ({
  medicine,
  visitId,
  prescriptionId,
  onDispense,
  onCancel,
}) => {
  const [quantity, setQuantity] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value, 10);
    setQuantityError('');

    if (numValue > medicine.stock_quantity) {
      setQuantityError(`Cannot dispense more than available stock (${medicine.stock_quantity} ${medicine.unit})`);
    } else if (numValue <= 0) {
      setQuantityError('Quantity must be at least 1');
    } else if (visitId && numValue > medicine.stock_quantity) {
      setQuantityError(`Cannot dispense ${numValue} for visit. Available: ${medicine.stock_quantity} ${medicine.unit}`);
    } else {
      setQuantity(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuantityError('');

    const numQuantity = parseInt(quantity, 10);
    if (!numQuantity || numQuantity <= 0) {
      setQuantityError('Please enter a valid quantity');
      return;
    }

    if (numQuantity > medicine.stock_quantity) {
      setQuantityError(`Insufficient stock. Available: ${medicine.stock_quantity} ${medicine.unit}`);
      return;
    }

    if (!visitId) {
      setQuantityError('Please provide visit ID');
      return;
    }

    setLoading(true);
    const dispenseData: DispenseData = {
      visit_id: visitId!,
      prescription_id: prescriptionId || undefined,
      quantity_dispensed: numQuantity,
      issue_date: issueDate,
      remarks: remarks || '',
    };

    onDispense(dispenseData);
  };

  const remainingStock = medicine.stock_quantity - parseInt(quantity, 10);

  const handleCancel = () => {
    setQuantity('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setRemarks('');
    onCancel();
  };

  return (
    <div className={styles.dispenseForm}>
      <h3 className={styles.formTitle}>Dispense Medicine</h3>
      <div className={styles.medicineInfo}>
        <p><strong>Medicine:</strong> {medicine.name}</p>
        <p><strong>Available Stock:</strong> {medicine.stock_quantity} {medicine.unit}</p>
        <p><strong>Unit:</strong> {medicine.unit}</p>
        {prescriptionId && <p><strong>Prescription ID:</strong> {prescriptionId}</p>}
        {visitId && <p><strong>Visit ID:</strong> {visitId}</p>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Quantity to Dispense*</label>
        <input
          type="number"
          min="1"
          max={medicine.stock_quantity}
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className={`${styles.input} ${quantityError ? styles.error : ''}`}
          placeholder={`Max: ${medicine.stock_quantity} ${medicine.unit}`}
        />
        {quantityError && <span className={styles.errorMessage}>{quantityError}</span>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Issue Date*</label>
        <input
          type="date"
          value={issueDate}
          onChange={(e) => setIssueDate(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Remarks</label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className={styles.textarea}
          rows={3}
          placeholder="Optional notes about this dispensing"
        />
      </div>

      <div className={styles.formActions}>
        <p className={styles.remainingInfo}>
          Remaining Stock: <span className={styles.remainingValue}>{remainingStock} {medicine.unit}</span>
        </p>
        <button
          type="button"
          onClick={handleCancel}
          className={styles.cancelButton}
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          className={styles.submitButton}
          disabled={loading || !!quantityError}
        >
          {loading ? 'Dispensing...' : 'Dispense'}
        </button>
      </div>
    </div>
  );
};
