import type { EmployeeProfile, DoctorProfile, VisitType, VisitStatus, TriageLevel, Vitals, Role, PrescriptionStatus, Severity, FitnessDecision } from './index';

export interface OHCVisit {
  id: number;
  employee: EmployeeInfo;
  consulted_doctor?: DoctorInfo;
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
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeInfo {
  id: number;
  employee_code: string;
  department: string;
  user: {
    first_name: string;
    last_name: string;
  };
}

export interface DoctorInfo {
  id: number;
  registration_number: string;
  specializations: string;
  user?: {
    first_name: string;
    last_name: string;
  };
  is_available: boolean;
}

export type VisitType = 'WALK_IN' | 'PERIODIC' | 'PRE_EMPLOYMENT' | 'FOLLOW_UP' | 'EMERGENCY';
export type VisitStatus = 'OPEN' | 'IN_PROGRESS' | 'REFERRED' | 'CLOSED' | 'CANCELLED' | 'COMPLETED';
export type TriageLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Vitals {
  temperature?: string;
  blood_pressure?: string;
  pulse?: string;
  spo2?: string;
  weight?: string;
  height?: string;
}

export interface NurseFormData {
  patientInfo: {
    name: string;
    employeeId: string;
    department: string;
    age: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    contactNumber: string;
    visitDateTime: string;
  };
  vitals: Vitals;
  doctorId: number;
}

export interface DoctorFormData {
  patientInfo: EmployeeInfo;
  nurseData: Vitals;
  diagnosis: {
    diagnosis_name: string;
    diagnosis_code?: string;
    diagnosis_notes?: string;
    severity: Severity;
    fitness_decision: FitnessDecision;
    work_restrictions?: string;
    advised_rest_days: number;
    follow_up_date?: string;
  };
  prescriptions: PrescriptionFormData[];
  remarks?: string;
}

export interface PrescriptionFormData {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  route?: string;
  instructions?: string;
  start_date: string;
}
