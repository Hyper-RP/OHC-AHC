// Authentication Types
export const Role = {
  ADMIN: "ADMIN",
  NURSE: "NURSE",
  EHS: "EHS",
  HR: "HR",
  KAM: "KAM",
  DOCTOR: "DOCTOR",
  EMPLOYEE: "EMPLOYEE",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: Role;
  phone_number?: string;
  is_verified: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
  is_admin_user: boolean;
  is_hr_user: boolean;
  is_nurse_user: boolean;
  is_doctor_user: boolean;
  is_ehs_user: boolean;
  is_kam_user: boolean;
  is_employee_user: boolean;
  employee_profile?: EmployeeProfile;
  doctor_profile?: DoctorProfile;
}

export interface EmployeeProfile {
  id: number;
  employee_code: string;
  department: string;
  designation: string;
  fitness_status: FitnessStatus;
}

export interface DoctorProfile {
  id: number;
  doctor_type: DoctorType;
  registration_number: string;
  specialization: string;
  hospital?: { id: number; name: string; code: string };
}

export const FitnessStatus = {
  FIT: "FIT",
  UNFIT: "UNFIT",
  TEMPORARY_UNFIT: "TEMPORARY_UNFIT",
  UNDER_OBSERVATION: "UNDER_OBSERVATION",
} as const;
export type FitnessStatus = (typeof FitnessStatus)[keyof typeof FitnessStatus];

export const DoctorType = {
  OHC: "OHC",
  AHC: "AHC",
} as const;
export type DoctorType = (typeof DoctorType)[keyof typeof DoctorType];

// OHC Types
export const VisitType = {
  WALK_IN: "WALK_IN",
  PERIODIC: "PERIODIC",
  PRE_EMPLOYMENT: "PRE_EMPLOYMENT",
  FOLLOW_UP: "FOLLOW_UP",
  EMERGENCY: "EMERGENCY",
} as const;
export type VisitType = (typeof VisitType)[keyof typeof VisitType];

export const VisitStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  REFERRED: "REFERRED",
  CLOSED: "CLOSED",
  CANCELLED: "CANCELLED",
} as const;
export type VisitStatus = (typeof VisitStatus)[keyof typeof VisitStatus];

export const TriageLevel = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;
export type TriageLevel = (typeof TriageLevel)[keyof typeof TriageLevel];

export interface Vitals {
  temperature?: string;
  blood_pressure?: string;
  pulse?: string;
  spo2?: string;
  weight?: string;
  height?: string;
}

export interface OHCVisit {
  uuid: string;
  employee: {
    id: number;
    employee_code: string;
    user: { first_name: string; last_name: string };
  };
  consulted_doctor: {
    id: number;
    user: { first_name: string; last_name: string };
    registration_number: string;
    specialization: string;
  };
  visit_type: VisitType;
  visit_status: VisitStatus;
  triage_level: TriageLevel;
  visit_date: string;
  chief_complaint: string;
  symptoms: string;
  vitals: Vitals;
  preliminary_notes?: string;
  requires_referral: boolean;
  follow_up_date?: string;
  next_action?: string;
  created_at: string;
}

export const Severity = {
  MILD: "MILD",
  MODERATE: "MODERATE",
  SERIOUS: "SERIOUS",
  CRITICAL: "CRITICAL",
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export const FitnessDecision = {
  FIT: "FIT",
  FIT_WITH_RESTRICTION: "FIT_WITH_RESTRICTION",
  TEMPORARY_UNFIT: "TEMPORARY_UNFIT",
  UNFIT: "UNFIT",
} as const;
export type FitnessDecision = (typeof FitnessDecision)[keyof typeof FitnessDecision];

export interface Diagnosis {
  uuid: string;
  visit: string;
  diagnosed_by: string;
  diagnosis_code?: string;
  diagnosis_name: string;
  diagnosis_notes?: string;
  severity: Severity;
  fitness_decision: FitnessDecision;
  work_restrictions?: string;
  advised_rest_days: number;
  follow_up_date?: string;
  created_at: string;
}

export interface Prescription {
  uuid: string;
  visit: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  route?: string;
  instructions?: string;
  start_date: string;
  status: PrescriptionStatus;
}

export const PrescriptionStatus = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  STOPPED: "STOPPED",
} as const;
export type PrescriptionStatus = (typeof PrescriptionStatus)[keyof typeof PrescriptionStatus];

// AHC Types
export const HospitalStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;
export type HospitalStatus = (typeof HospitalStatus)[keyof typeof HospitalStatus];

export interface Hospital {
  uuid: string;
  name: string;
  code: string;
  hospital_status: HospitalStatus;
  hospital_type?: string;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  address_line_1: string;
  city: string;
  state: string;
  specialties: string[];
  supports_cashless: boolean;
  is_available_for_video: boolean;
}

export const ReferralPriority = {
  NORMAL: "NORMAL",
  URGENT: "URGENT",
  EMERGENCY: "EMERGENCY",
} as const;
export type ReferralPriority = (typeof ReferralPriority)[keyof typeof ReferralPriority];

export const ReferralStatus = {
  DRAFT: "DRAFT",
  PENDING_HOSPITAL_SELECTION: "PENDING_HOSPITAL_SELECTION",
  SENT: "SENT",
  ACCEPTED: "ACCEPTED",
  IN_TREATMENT: "IN_TREATMENT",
  COMPLETED: "COMPLETED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;
export type ReferralStatus = (typeof ReferralStatus)[keyof typeof ReferralStatus];

export interface Referral {
  uuid: string;
  visit: string;
  employee: {
    id: number;
    employee_code: string;
    user: { first_name: string; last_name: string };
  };
  referred_by: {
    id: number;
    user: { first_name: string; last_name: string };
  };
  hospital?: {
    id: number;
    name: string;
    code: string;
  };
  referral_reason: string;
  specialist_department?: string;
  priority: ReferralPriority;
  referral_status: ReferralStatus;
  appointment_date?: string;
  created_at: string;
}

// Payments Types
export const InvoiceStatus = {
  DRAFT: "DRAFT",
  ISSUED: "ISSUED",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export interface Invoice {
  uuid: string;
  invoice_number: string;
  employee: {
    id: number;
    employee_code: string;
    user: { first_name: string; last_name: string };
  };
  status: InvoiceStatus;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  due_date?: string;
  issued_at?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
}

export const PaymentMethod = {
  CASH: "CASH",
  CARD: "CARD",
  UPI: "UPI",
  NETBANKING: "NETBANKING",
  RAZORPAY: "RAZORPAY",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export interface Payment {
  uuid: string;
  invoice: string;
  employee: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: string;
  provider: string;
  transaction_reference?: string;
  paid_at?: string;
}

// Reports Types
export interface EmployeeHealthHistory {
  mode?: 'detail';
  employee: {
    employee_code: string;
    user: { first_name: string; last_name: string };
    department: string;
    designation: string;
    fitness_status: string;
  };
  visits: Array<{
    uuid: string;
    visit_date: string;
    visit_type: string;
    triage_level: string;
    visit_status: string;
    chief_complaint: string;
    symptoms: string;
    vitals: Record<string, string>;
    preliminary_notes: string;
    requires_referral: boolean;
    doctor_name: string;
    follow_up_date: string;
    next_action?: string;
    diagnoses: Array<{
      diagnosis_name: string;
      severity: string;
      fitness_decision: string;
      diagnosed_at: string;
    }>;
    prescriptions: Array<{
      medicine_name: string;
      dosage: string;
      start_date: string;
    }>;
  }>;
  referrals: Array<{
    uuid: string;
    hospital_name: string;
    referral_status: string;
    created_at: string;
  }>;
}

export interface EmployeeHealthHistoryList {
  mode: 'list';
  records: Array<{
    employee_code: string;
    employee_name: string;
    visit_uuid: string;
    visit_date: string;
    visit_status: string;
    doctor_name: string;
    chief_complaint: string;
    diagnosis_name: string;
    severity: string;
    fitness_decision: string;
    medicine_given: string;
    follow_up_date: string;
    referral_status: string;
    report_count: number;
  }>;
}

export interface DiseaseTrends {
  period_start: string;
  period_end: string;
  total_diagnoses: number;
  trends: Array<{
    diagnosis_name: string;
    count: number;
    severity: string;
    percentage: number;
    change_from_previous: number;
  }>;
  severity_breakdown: {
    MILD: number;
    MODERATE: number;
    SERIOUS: number;
    CRITICAL: number;
  };
}

export interface DepartmentStats {
  period_start: string;
  period_end: string;
  summary: {
    total_departments: number;
    total_employees: number;
    total_visits: number;
    total_referrals: number;
    avg_health_index: number;
  };
  departments: Array<{
    department: string;
    total_employees: number;
    total_visits: number;
    referred_cases: number;
    unfit_employees: number;
    health_index: number;
    top_diagnosis: {
      diagnosis_name: string;
      count: number;
    };
  }>;
}

// API Response Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [key: string]: string[] | string | undefined;
}

// UI Types
export interface NavItem {
  label: string;
  url: string;
  urlName: string;
  icon: string;
  roles: Role[];
}

export interface SnackbarMessage {
  id: string;
  message: string;
  severity: "success" | "error" | "info" | "warning";
  duration?: number;
}

// Form Types
export interface OHCVisitFormData {
  employee: string;
  consulted_doctor: string;
  visit_type: VisitType;
  triage_level: TriageLevel;
  visit_date: string;
  chief_complaint: string;
  symptoms: string;
  vitals: Vitals;
  preliminary_notes?: string;
  requires_referral?: boolean;
  follow_up_date?: string;
  next_action?: string;
}

export interface DiagnosisFormData {
  visit: string;
  diagnosed_by: string;
  diagnosis: {
    diagnosis_code?: string;
    diagnosis_name: string;
    diagnosis_notes?: string;
    severity: Severity;
    is_primary?: boolean;
    is_referral_required?: boolean;
    fitness_decision: FitnessDecision;
    work_restrictions?: string;
    advised_rest_days: number;
    follow_up_date?: string;
  };
  prescriptions?: PrescriptionFormData[];
}

export interface PrescriptionFormData {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  route?: string;
  instructions?: string;
  start_date: string;
  status?: PrescriptionStatus;
}

export interface ReferralFormData {
  visit: string;
  diagnosis?: string;
  employee: string;
  referred_by: string;
  hospital?: string;
  referral_reason: string;
  specialist_department?: string;
  priority: ReferralPriority;
}

export interface PaymentFormData {
  invoice: string;
  employee: string;
  amount: number;
  payment_method: PaymentMethod;
  provider?: string;
  transaction_reference?: string;
}
