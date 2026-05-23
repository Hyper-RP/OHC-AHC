export interface MedicineStock {
  id: number;
  medicine_id: string;
  name: string;
  unit: MedicineUnit;
  stock_quantity: number;
  initial_stock: number;
  used_quantity: number;
  supplier?: string;
  batch_number?: string;
  expiry_date?: string;
  reorder_level: number;
  last_dispensed_at?: string;
  is_low_stock: boolean;
  is_expired: boolean;
  is_expiring_soon: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicineDispense {
  id: number;
  medicine: number;
  visit: number;
  prescription?: number;
  dispensed_by: UserInfo;
  quantity_dispensed: number;
  quantity_remaining: number;
  issue_date: string;
  remarks?: string;
  status: DispenseStatus;
  created_at: string;
  updated_at: string;
}

export interface UserInfo {
  id: number;
  username: string;
  role?: string;
}

export type MedicineUnit =
  | 'TABLETS'
  | 'CAPSULES'
  | 'SYRUP'
  | 'INJECTION'
  | 'DROPS'
  | 'OINTMENT'
  | 'CREAM'
  | 'PATCH'
  | 'INHALER';

export type DispenseStatus = 'PENDING' | 'DISPENSED' | 'CANCELLED';

export interface DispenseData {
  visit_id: number;
  prescription_id?: number;
  quantity_dispensed: number;
  issue_date: string;
  remarks?: string;
}

export interface CreateMedicineData {
  medicine_id: string;
  name: string;
  unit: MedicineUnit;
  stock_quantity: number;
  supplier?: string;
  batch_number?: string;
  expiry_date?: string;
  reorder_level?: number;
}

export interface MedicineListParams {
  search?: string;
  low_stock_only?: boolean;
  expiring_soon?: boolean;
  page?: number;
  page_size?: number;
}

export interface DispenseMedicineData {
  visit_id: number;
  prescription_id?: number;
  quantity_dispensed: number;
  issue_date: string;
  remarks?: string;
}

export interface MedicineHistory {
  medicine: MedicineStock;
  history: MedicineDispense[];
}
