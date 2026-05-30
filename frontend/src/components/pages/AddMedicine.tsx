import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../layout';
import { Alert, Button, Card, FormInput } from '../ui';
import { parseMedicineCsv } from './medicineImport';
import {
  loadMedicineActivity,
  loadMedicineRecords,
  saveMedicineActivity,
  saveMedicineRecords,
  type ActivityRecord,
  type MedicineRecord,
} from './medicineInventory';
import styles from './MedicineManagement.module.css';

const createEmptyMedicine = (): MedicineRecord => ({
  id: '',
  name: '',
  stock: 0,
  reorderLevel: 0,
  unit: 'tablets',
  batch: '',
  expiry: '',
  supplier: '',
});

/**
 * Add Medicine page
 * Creates a new medicine record and stores it in browser inventory state
 */
export const AddMedicine: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [banner, setBanner] = useState('');
  const [importing, setImporting] = useState(false);
  const [newMedicine, setNewMedicine] = useState<MedicineRecord>(createEmptyMedicine());

  const handleChange = (field: keyof MedicineRecord, value: string) => {
    setNewMedicine((current) => ({
      ...current,
      [field]:
        field === 'stock' || field === 'reorderLevel'
          ? Number.parseInt(value || '0', 10) || 0
          : value,
    }));
  };

  const handleAddMedicine = () => {
    if (
      !newMedicine.id.trim() ||
      !newMedicine.name.trim() ||
      !newMedicine.unit.trim()
    ) {
      setBanner('Please fill in the medicine ID, name, and unit before adding.');
      return;
    }

    const currentMedicines = loadMedicineRecords();
    if (currentMedicines.some((medicine) => medicine.id.toLowerCase() === newMedicine.id.trim().toLowerCase())) {
      setBanner('This medicine ID already exists. Please use a unique ID.');
      return;
    }

    const medicineToAdd: MedicineRecord = {
      ...newMedicine,
      id: newMedicine.id.trim(),
      name: newMedicine.name.trim(),
      batch: newMedicine.batch.trim(),
      expiry: newMedicine.expiry.trim(),
      supplier: newMedicine.supplier.trim(),
    };

    saveMedicineRecords([...currentMedicines, medicineToAdd]);

    const currentActivity = loadMedicineActivity();
    const activityEntry: ActivityRecord = {
      id: `ACT-${currentActivity.length + 1}`.padStart(7, '0'),
      type: 'CREATED',
      medicineName: medicineToAdd.name,
      quantity: medicineToAdd.stock,
      note: 'Medicine added to inventory',
      timestamp: 'Just now',
    };
    saveMedicineActivity([activityEntry, ...currentActivity]);

    navigate('/medicine-management', {
      state: { banner: `${medicineToAdd.name} added successfully.` },
      replace: false,
    });
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImporting(true);
    setBanner('');

    try {
      const csvText = await file.text();
      const importedMedicines = parseMedicineCsv(csvText);

      if (importedMedicines.length === 0) {
        setBanner('No valid medicine rows were found in the import file.');
        return;
      }

      const currentMedicines = loadMedicineRecords();
      const existingIds = new Set(currentMedicines.map((medicine) => medicine.id.toLowerCase()));
      const uniqueImportedMedicines = importedMedicines.filter(
        (medicine) => !existingIds.has(medicine.id.toLowerCase())
      );

      if (uniqueImportedMedicines.length === 0) {
        setBanner('All medicines in the import file already exist.');
        return;
      }

      saveMedicineRecords([...currentMedicines, ...uniqueImportedMedicines]);

      const currentActivity = loadMedicineActivity();
      const importedActivity: ActivityRecord[] = uniqueImportedMedicines.map((medicine, index) => ({
        id: `ACT-${currentActivity.length + index + 1}`.padStart(7, '0'),
        type: 'CREATED',
        medicineName: medicine.name,
        quantity: medicine.stock,
        note: 'Medicine imported from Excel CSV',
        timestamp: 'Just now',
      }));
      saveMedicineActivity([...importedActivity, ...currentActivity]);

      navigate('/medicine-management', {
        state: {
          banner: `${uniqueImportedMedicines.length} medicine${uniqueImportedMedicines.length > 1 ? 's' : ''} imported successfully.`,
        },
        replace: false,
      });
    } catch {
      setBanner('Import failed. Please upload a valid Excel CSV file.');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const templateRows = [
      [
        'Medicine ID',
        'Medicine Name',
        'Opening Stock',
        'Reorder Level',
        'Unit',
        'Batch',
        'Expiry Date',
        'Supplier',
      ],
      ['MED-001', 'Paracetamol 650', '120', '25', 'tablets', 'PCM-24-A', '2027-01-30', 'MediSupply Pharma'],
    ];

    const csvContent = templateRows
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'medicine_import_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>
      <Header title="Add Medicine" subtitle="Create a new medicine record for inventory" />
      <main className={styles.main}>
        {banner && (
          <Alert type="info" onDismiss={() => setBanner('')}>
            {banner}
          </Alert>
        )}

        <Card className={styles.filterCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3>Import from Excel</h3>
              <p>Upload a CSV file exported from Excel to add multiple medicines at once</p>
            </div>
          </div>

          <div className={styles.importBlock}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportFile}
              className={styles.fileInput}
              aria-label="Import medicine file"
              disabled={importing}
            />
            <div className={styles.actionButtons}>
              <Button
                variant="brand"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? 'Importing...' : 'Import Excel'}
              </Button>
              <Button variant="outline-secondary" onClick={handleDownloadTemplate}>
                Download Template
              </Button>
            </div>
          </div>
        </Card>

        <Card className={styles.filterCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3>Medicine Details</h3>
              <p>Fill in the information below to add a new medicine entry</p>
            </div>
          </div>

          <div className={styles.actionGrid}>
            <FormInput
              label="Medicine ID"
              name="medicine-id"
              value={newMedicine.id}
              onChange={(value) => handleChange('id', value)}
              placeholder="MED-001"
            />
            <FormInput
              label="Medicine Name"
              name="medicine-name"
              value={newMedicine.name}
              onChange={(value) => handleChange('name', value)}
              placeholder="Paracetamol 650"
            />
            <FormInput
              label="Unit"
              name="unit"
              value={newMedicine.unit}
              onChange={(value) => handleChange('unit', value)}
              placeholder="tablets"
            />
            <FormInput
              label="Opening Stock"
              name="stock"
              type="number"
              value={newMedicine.stock}
              onChange={(value) => handleChange('stock', value)}
              min="0"
            />
            <FormInput
              label="Reorder Level"
              name="reorder-level"
              type="number"
              value={newMedicine.reorderLevel}
              onChange={(value) => handleChange('reorderLevel', value)}
              min="0"
            />
            <FormInput
              label="Batch"
              name="batch"
              value={newMedicine.batch}
              onChange={(value) => handleChange('batch', value)}
              placeholder="PCM-24-A"
            />
            <FormInput
              label="Expiry Date"
              name="expiry"
              type="date"
              value={newMedicine.expiry}
              onChange={(value) => handleChange('expiry', value)}
            />
            <FormInput
              label="Supplier"
              name="supplier"
              value={newMedicine.supplier}
              onChange={(value) => handleChange('supplier', value)}
              placeholder="Supplier name"
            />
          </div>

          <div className={styles.actionButtons}>
            <Button variant="outline-secondary" onClick={() => navigate('/medicine-management')}>
              Back
            </Button>
            <Button variant="brand" onClick={handleAddMedicine}>
              Add Medicine
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};
