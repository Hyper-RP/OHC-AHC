import api from './api';

/**
 * Medicine Stock API Service
 * Handles all medicine inventory operations
 */

interface MedicineStockListParams {
  search?: string;
  low_stock_only?: boolean;
  expiring_soon?: boolean;
  page?: number;
  page_size?: number;
}

interface DispenseMedicineData {
  visit_id?: number;
  prescription_id?: number;
  quantity_dispensed: number;
  issue_date: string;
  remarks?: string;
}

interface DispenseResponse {
  medicine_id: number;
  medicine_name: string;
  quantity_before: number;
  quantity_dispensed: number;
  quantity_remaining: number;
  issue_date: string;
  remarks: string;
  message: string;
}

interface LowStockMedicine {
  id: number;
  medicine_id: string;
  name: string;
  stock_quantity: number;
  unit: string;
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

interface MedicineHistory {
  medicine: MedicineStock;
  history: Dispense[];
}

/**
 * Medicine Stock Service
 * Provides methods to interact with medicine inventory
 */
export const listMedicines = async (
  params?: MedicineStockListParams
): Promise<{ results: any[] }> => {
  const queryParams: any = {};

  if (params?.search) queryParams.search = params.search;
  if (params?.low_stock_only) queryParams.low_stock_only = params.low_stock_only;
  if (params?.expiring_soon) queryParams.expiring_soon = params.expiring_soon;
  if (params?.page) queryParams.page = params.page;
  if (params?.page_size) queryParams.page_size = params.page_size;

  const response = await api.get('/medicines/', { params: queryParams });
  return response.data;
};

export const dispenseMedicine = async (medicineId: number, data: DispenseMedicineData): Promise<DispenseResponse> => {
  const response = await api.post(`/medicines/${medicineId}/dispense/`, data);
  return response.data;
};

/**
 * Get all medicines with optional filtering
 */
export const medicineService = {
  listMedicines,

  /**
   * Get medicine by ID
   */
  getMedicine: async (id: number): Promise<LowStockMedicine> => {
    const response = await api.get(`/medicines/${id}/`);
    return response.data;
  },

  /**
   * Create new medicine entry
   */
  createMedicine: async (data: any): Promise<LowStockMedicine> => {
    const response = await api.post('/medicines/', data);
    return response.data;
  },

  /**
   * Dispense medicine to patient
   * Updates stock and creates dispensing record
   */
  dispenseMedicine: async (medicineId: number, data: DispenseMedicineData): Promise<DispenseResponse> => {
    const response = await api.post(`/medicines/${medicineId}/dispense/`, data);
    return response.data;
  },

  /**
   * Get medicine dispensing history
   */
  getMedicineHistory: async (id: number): Promise<MedicineHistory> => {
    const response = await api.get(`/medicines/${id}/history/`);
    return response.data;
  },

  /**
   * Get low stock medicines
   */
  getLowStockMedicines: async (): Promise<LowStockMedicine[]> => {
    const response = await api.get('/medicines/', { params: { low_stock_only: true } });
    return response.data.results?.filter((medicine: any) => medicine.is_low_stock) || [];
  },

  /**
   * Get expiring soon medicines
   */
  getExpiringSoonMedicines: async (): Promise<LowStockMedicine[]> => {
    const response = await api.get('/medicines/', { params: { expiring_soon: true } });
    return response.data.results?.filter((medicine: any) => medicine.is_expiring_soon) || [];
  },

  /**
   * Get medicine statistics summary
   */
  getMedicineStatistics: async (): Promise<{
    total_medicines: number;
    total_stock_quantity: number;
    total_medicine_used: number;
    total_medicine_value: number;
    stock_summary: {
      total_items: number;
      low_stock_items: number;
      expiring_items: number;
      expiring_items: number;
      total_stock_value: number;
    };
  }> => {
    const response = await api.get('/ohc/analytics/medicine-summary/');
    return response.data;
  },

  /**
   * Get department health trends for management
   */
  getDepartmentHealthTrends: async (): Promise<any> => {
    const response = await api.get('/ohc/analytics/medicine-summary/');
    return response.data.department_health_trends;
  },
};

export default medicineService;
