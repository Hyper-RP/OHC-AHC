export interface DashboardAnalytics {
  summary: {
    total_visits: number;
    open_cases: number;
    completed_cases: number;
    follow_up_pending: number;
  };
  department_wise: DepartmentVisitData[];
  severity_wise: SeverityDistribution;
  monthly_trends: MonthlyTrend[];
  common_diagnoses: DiagnosisTrend[];
  critical_cases: CriticalCase[];
  pending_follow_ups: PendingFollowUp[];
}

export interface DepartmentVisitData {
  department: string;
  visit_count: number;
  percentage: number;
}

export interface SeverityDistribution {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
}

export interface MonthlyTrend {
  month: string;
  visit_count: number;
}

export interface DiagnosisTrend {
  diagnosis_name: string;
  count: number;
  percentage: number;
}

export interface CriticalCase {
  id: number;
  patient_name: string;
  employee_code: string;
  visit_date: string;
  triage_level: string;
  chief_complaint: string;
}

export interface PendingFollowUp {
  id: number;
  patient_name: string;
  employee_code: string;
  follow_up_date: string;
  days_overdue: number;
}

export interface FollowUpDetail {
  id: number;
  patient_name: string;
  employee_code: string;
  department: string;
  employee_contact: string;
  employee_phone: string;
  original_visit_date: string;
  follow_up_date: string;
  days_overdue: number;
  chief_complaint: string;
  diagnosis: string;
  doctor_notes: string;
  follow_up_instructions: string;
  visit_status: string;
  triage_level: string;
  consulted_doctor: string;
}

export interface MedicineSummary {
  summary: {
    total_ohc_visits: number;
    total_medicine_used: number;
    total_medicine_value: number;
    stock_summary: StockSummary;
  };
  department_health_trends: DepartmentHealthTrend[];
  monthly_reports: MonthlyReport[];
}

export interface StockSummary {
  total_items: number;
  low_stock_items: number;
  expiring_items: number;
  total_stock_value: number;
}

export interface DepartmentHealthTrend {
  department: string;
  visit_count: number;
  top_diagnosis: string;
  fitness_status: string;
}

export interface MonthlyReport {
  month: string;
  visits: number;
  medicine_cost: number;
  top_diagnoses: string[];
}

export interface AnalyticsFilters {
  date_from?: string;
  date_to?: string;
  department?: string;
  severity?: string;
  status?: string;
}

export interface DateRangeParams {
  date_from?: string;
  date_to?: string;
}

// EHS Statistics Types
export interface EHSStatistics {
  opd: OPDStatistics;
  preEmployment: PreEmploymentStatistics;
  ahc: AHCStatistics;
  incident: IncidentStatistics;
  emergency: EmergencyStatistics;
  referred: ReferredStatistics;
}

export interface OPDStatistics {
  today_count: number;
  till_date_count: number;
  visits: OPDVisitDetail[];
}

export interface OPDVisitDetail {
  id: string;
  employee_code: string;
  employee_name: string;
  department: string;
  visit_time: string;
  chief_complaint: string;
  status: string;
}

export interface PreEmploymentStatistics {
  total_checks: number;
  fit_count: number;
  unfit_count: number;
  fit_rate: number;
  today_count: number;
}

export interface AHCStatistics {
  today_count: number;
  till_date_count: number;
  total_employees: number;
  completion_percentage: number;
}

export interface IncidentStatistics {
  today_count: number;
  till_date_count: number;
  severity: SeverityDistribution;
  attention_required: boolean;
}

export interface EmergencyStatistics {
  today_count: number;
  till_date_count: number;
  severity: SeverityDistribution;
  critical_alert: boolean;
}

export interface ReferredStatistics {
  today_count: number;
  till_date_count: number;
  hospitals: HospitalReferral[];
}

export interface HospitalReferral {
  hospital_name: string;
  referral_count: number;
}
