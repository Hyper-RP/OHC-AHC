export interface MedicineRecord {
  id: string;
  name: string;
  stock: number;
  reorderLevel: number;
  unit: string;
  batch: string;
  expiry: string;
  supplier: string;
}

export interface ActivityRecord {
  id: string;
  type: 'ISSUED' | 'RESTOCKED' | 'CREATED';
  medicineName: string;
  quantity: number;
  note: string;
  timestamp: string;
}

const MEDICINES_STORAGE_KEY = 'medicine_inventory_records';
const ACTIVITY_STORAGE_KEY = 'medicine_inventory_activity';

const formatLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayDateString = () => formatLocalDateString(new Date());

export const getTomorrowDateString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatLocalDateString(tomorrow);
};

export const isFutureDate = (value: string) => Boolean(value) && value > getTodayDateString();

export const loadMedicineRecords = (): MedicineRecord[] => {
  try {
    const saved = window.localStorage.getItem(MEDICINES_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as MedicineRecord[]) : [];
  } catch {
    return [];
  }
};

export const saveMedicineRecords = (records: MedicineRecord[]) => {
  window.localStorage.setItem(MEDICINES_STORAGE_KEY, JSON.stringify(records));
};

export const loadMedicineActivity = (): ActivityRecord[] => {
  try {
    const saved = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as ActivityRecord[]) : [];
  } catch {
    return [];
  }
};

export const saveMedicineActivity = (records: ActivityRecord[]) => {
  window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(records));
};
