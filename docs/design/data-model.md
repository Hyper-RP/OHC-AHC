# OHC-AHC Frontend Migration — Data Model

**Date:** 2026-05-06
**Phase:** 3 — Design & Prototyping
**Status:** In Progress

---

## TypeScript Type Definitions

### Core Types

```typescript
// Primitive types
type UUID = string;
type ISO8601Date = string;
type YYYYMMDDDate = string;
```

---

### Authentication Types

```typescript
enum Role {
  ADMIN = "ADMIN",
  NURSE = "NURSE",
  EHS = "EHS",
  HR = "HR",
  KAM = "KAM",
  DOCTOR = "DOCTOR",
  EMPLOYEE = "EMPLOYEE",
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  access: string;
  refresh: string;
}

interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: Role;
  phone_number?: string;
  alternate_phone_number?: string;
  is_verified: boolean;
  must_change_password: boolean;
  last_password_changed_at?: ISO8601Date;
  created_at: ISO8601Date;
  updated_at: ISO8601Date;

  // Computed properties
  is_admin_user: boolean;
  is_hr_user: boolean;
  is_nurse_user: boolean;
  is_doctor_user: boolean;
  is_ehs_user: boolean;
  is_kam_user: boolean;
  is_employee_user: boolean;
  is_clinical_user: boolean;
  is_compliance_user: boolean;
}

interface EmployeeProfile {
  id: number;
  user: User;
  employee_code: string;
  department: string;
  designation: string;
  work_location?: string;
  date_of_birth?: YYYYMMDDDate;
  gender?: Gender;
  blood_group?: string;
  date_of_joining?: YYYYMMDDDate;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  insurance_policy_number?: string;
  fitness_status: FitnessStatus;
  medical_certificate_expiry?: YYYYMMDDDate;
  entry_restricted_until?: YYYYMMDDDate;
  is_active_employee: boolean;
  notes?: string;
  created_at: ISO8601Date;
  updated_at: ISO8601Date;
}

interface DoctorProfile {
  id: number;
  user: User;
  doctor_type: DoctorType;
  registration_number: string;
  specialization: string;
  qualification?: string;
  years_of_experience: number;
  hospital?: Hospital;
  consultation_fee: number;
  license_expiry?: YYYYMMDDDate;
  is_available_for_video: boolean;
  is_active_doctor: boolean;
  created_at: ISO8601Date;
  updated_at: ISO8601Date;
}

enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

enum FitnessStatus {
  FIT = "FIT",
  UNFIT = "UNFIT",
  TEMPORARY_UNFIT = "TEMPORARY_UNFIT",
  UNDER_OBSERVATION = "UNDER_OBSERVATION",
}

enum DoctorType {
  OHC = "OHC",
  AHC = "AHC",
}
```

---

### OHC Types

```typescript
enum VisitType {
  WALK_IN = "WALK_IN",
  PERIODIC = "PERIODIC",
  PRE_EMPLOYMENT = "PRE_EMPLOYMENT",
  FOLLOW_UP = "FOLLOW_UP",
  EMERGENCY = "EMERGENCY",
}

enum VisitStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  REFERRED = "REFERRED",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED",
}

enum TriageLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

interface OHCVisit {
  uuid: UUID;
  employee: EmployeeProfile;
  consulted_doctor: DoctorProfile;
  visit_type: VisitType;
  visit_status: VisitStatus;
  triage_level: TriageLevel;
  visit_date: ISO8601Date;
  chief_complaint: string;
  symptoms: string;
  vitals: Vitals;
  preliminary_notes?: string;
  requires_referral: boolean;
  follow_up_date?: YYYYMMDDDate;
  next_action?: string;
  closed_at?: ISO8601Date;
  created_at: ISO8601Date;
  updated_at: ISO8601Date;
}

interface Vitals {
  temperature?: string;   // e.g., "98.6 F"
  blood_pressure?: string; // e.g., "120/80 mmHg"
  pulse?: string;        // e.g., "76 bpm"
  spo2?: string;         // e.g., "98 %"
  weight?: string;       // e.g., "68 kg"
  height?: string;       // e.g., "172 cm"
}

enum Severity {
  MILD = "MILD",
  MODERATE = "MODERATE",
  SERIOUS = "SERIOUS",
  CRITICAL = "CRITICAL",
}

enum ConditionStatus {
  ACTIVE = "ACTIVE",
  STABLE = "STABLE",
  RESOLVED = "RESOLVED",
  CHRONIC = "CHRONIC",
}

enum FitnessDecision {
  FIT = "FIT",
  FIT_WITH_RESTRICTION = "FIT_WITH_RESTRICTION",
  TEMPORARY_UNFIT = "TEMPORARY_UNFIT",
  UNFIT = "UNFIT",
}

interface Diagnosis {
  uuid: UUID;
  visit: OHCVisit;
  diagnosed_by: DoctorProfile;
  diagnosis_code?: string;
  diagnosis_name: string;
  diagnosis_notes?: string;
  severity: Severity;
  condition_status: ConditionStatus;
  is_primary: boolean;
  is_referral_required: boolean;
  fitness_decision: FitnessDecision;
  work_restrictions?: string;
  advised_rest_days: number;
  follow_up_date?: YYYYMMDDDate;
  created_at: ISO8601Date;
  updated_at: ISO8601Date;
}

enum PrescriptionStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  STOPPED = "STOPPED",
}

interface Prescription {
  uuid: UUID;
  visit: OHCVisit;
  diagnosis?: Diagnosis;
  prescribed_by: DoctorProfile;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  route?: string;
  instructions?: string;
  start_date: YYYYMMDDDate;
  end_date?: YYYYMMDDDate;
  status: PrescriptionStatus;
  created_at: ISO8601Date;
  updated_at: ISO8601Date;
}

enum TestPriority {
  ROUTINE = "ROUTINE",
  URGENT = "URGENT",
  STAT = "STAT",
}

enum TestStatus {
  ORDERED = "ORDERED",
  SAMPLE_COLLECTED = "SAMPLE_COLLECTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

interface MedicalTest {
  uuid: UUID;
  visit: OHCVisit;
  diagnosis?: Diagnosis;
  requested_by: DoctorProfile;
  test_name: string;
  test_type: string;
  laboratory_name?: string;
  priority: TestPriority;
  status: TestStatus;
  instructions?: string;
  result_summary?: string;
  result_value?: string;
  result_unit?: string;
  completed_at?: ISO8601Date;
  created_at: ISO8601Date;
  updated_at: ISO8601Date;
}
```

---

### AHC Types

```typescript
enum HospitalStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

interface Hospital {
  uuid: UUID;
  name: string;
  code: string;
  hospital_status: HospitalStatus;
  hospital_type?: string;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code?: string;
  country: string;
  accreditation_number?: string;
  specialties: string[];
  supports_cashless: boolean;
  is_available_for_video: boolean;
  created_at: ISO8601Date;
  updated_at: ISO8601Date;
}

enum ReferralPriority {
  NORMAL = "NORMAL",
  URGENT = "URGENT",
  EMERGENCY = "EMERGENCY",
}

enum ReferralStatus {
  DRAFT = "DRAFT",
  PENDING_HOSPITAL_SELECTION = "PENDING_HOSPITAL_SELECTION",
  SENT = "SENT",
  ACCEPTED = "ACCEPTED",
  IN_TREATMENT = "IN_TREATMENT",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

interface Referral {
  uuid: UUID;
  visit: OHCVisit;
  diagnosis?: Diagnosis;
  employee: EmployeeProfile;
  referred_by: DoctorProfile;
  hospital?: Hospital;
  referral_reason: string;
  specialist_department?: string;
  priority: ReferralPriority;
  referral_status: ReferralStatus;
  appointment_date?: ISO8601Date;
  external_case_id?: string;
  treatment_summary?: string;
  closure_notes?: string;
  created_at: ISO8601Date;
  updated_at: ISO8601Date;
}

enum ReportType {
  LAB = "LAB",
  IMAGING = "IMAGING",
  DISCHARGE = "DISCHARGE",
  FITNESS = "FITNESS",
  PRESCRIPTION = "PRESCRIPTION",
  OTHER = "OTHER",
}

enum VerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

interface MedicalReport {
  uuid: UUID;
  referral?: Referral;
  visit?: OHCVisit;
  employee: EmployeeProfile;
  hospital?: Hospital;
  uploaded_by: User;
  report_type: ReportType;
  title: string;
  summary?: string;
  report_file: string;
  report_date: YYYYMMDDDate;
  is_confidential: boolean;
  verification_status: VerificationStatus;
  created_at: ISO8601Date;
  updated_at: ISO8601Date;
}
```

---

### Payments Types

```typescript
enum InvoiceStatus {
  DRAFT = "DRAFT",
  ISSUED = "ISSUED",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

interface Invoice {
  uuid: UUID;
  invoice_number: string;
  employee: EmployeeProfile;
  visit?: OHCVisit;
  referral?: Referral;
  status: InvoiceStatus;
  currency: string;
  subtotal_amount: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  due_date?: YYYYMMDDDate;
  issued_at?: ISO8601Date;
  paid_at?: ISO8601Date;
  generated_by?: User;
  notes?: string;
  created_at: ISO8601Date;
  updated_at: ISO8601Date;
}

enum PaymentMethod {
  CASH = "CASH",
  CARD = "CARD",
  UPI = "UPI",
  NETBANKING = "NETBANKING",
  RAZORPAY = "RAZORPAY",
}

enum PaymentStatus {
  INITIATED = "INITIATED",
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

interface Payment {
  uuid: UUID;
  invoice: Invoice;
  employee: EmployeeProfile;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  provider: string;
  provider_order_id?: string;
  provider_payment_id?: string;
  provider_signature?: string;
  transaction_reference?: string;
  initiated_at?: ISO8601Date;
  paid_at?: ISO8601Date;
  failure_reason?: string;
  metadata: Record<string, any>;
  created_at: ISO8601Date;
  updated_at: ISO8601Date;
}
```

---

### Reports Types

```typescript
enum NotificationType {
  APPOINTMENT = "APPOINTMENT",
  REFERRAL = "REFERRAL",
  PAYMENT = "PAYMENT",
  REPORT = "REPORT",
  FITNESS_ALERT = "FITNESS_ALERT",
  GENERAL = "GENERAL",
}

enum Channel {
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
  SMS = "SMS",
  WHATSAPP = "WHATSAPP",
}

enum DeliveryStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
  READ = "READ",
}

interface Notification {
  uuid: UUID;
  recipient: User;
  title: string;
  message: string;
  notification_type: NotificationType;
  channel: Channel;
  delivery_status: DeliveryStatus;
  scheduled_for?: ISO8601Date;
  sent_at?: ISO8601Date;
  read_at?: ISO8601Date;
  related_model?: string;
  related_object_uuid?: UUID;
  created_at: ISO8601Date;
}

interface AuditLog {
  uuid: UUID;
  actor?: User;
  module: string;
  action: string;
  target_model: string;
  target_object_uuid: UUID;
  object_snapshot: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  remarks?: string;
  created_at: ISO8601Date;
}
```

---

### Form Types

```typescript
// OHC Visit Form Data
interface OHCVisitFormData {
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

// Diagnosis Form Data
interface DiagnosisFormData {
  visit: string;
  diagnosed_by: string;
  diagnosis: {
    diagnosis_code?: string;
    diagnosis_name: string;
    diagnosis_notes?: string;
    severity: Severity;
    condition_status?: ConditionStatus;
    is_primary?: boolean;
    is_referral_required?: boolean;
    fitness_decision: FitnessDecision;
    work_restrictions?: string;
    advised_rest_days: number;
    follow_up_date?: string;
  };
  prescriptions?: PrescriptionFormData[];
}

interface PrescriptionFormData {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  route?: string;
  instructions?: string;
  start_date: string;
  status?: PrescriptionStatus;
}

// Referral Form Data
interface ReferralFormData {
  visit: string;
  diagnosis?: string;
  employee: string;
  referred_by: string;
  hospital?: string;
  referral_reason: string;
  specialist_department?: string;
  priority: ReferralPriority;
  referral_status?: ReferralStatus;
}

// Payment Form Data
interface PaymentFormData {
  invoice: string;
  employee: string;
  amount: number;
  payment_method: PaymentMethod;
  provider?: string;
  provider_order_id?: string;
  provider_payment_id?: string;
  provider_signature?: string;
  transaction_reference?: string;
}
```

---

### UI State Types

```typescript
// Navigation Items
interface NavItem {
  label: string;
  url: string;
  urlName: string;
  icon: string;
  roles: Role[];
}

// Stats
interface UIStats {
  visit_count: number;
  open_referrals: number;
  pending_invoices: number;
}

interface PublicMetrics {
  visits: number;
  referrals: number;
  reports: number;
  hospitals: number;
}

interface TrendCard {
  hospital_count: number;
  payment_total: number;
  diagnosis_summary: Array<{
    severity: string;
    total: number;
  }>;
}

// Filters
interface ReportFilters {
  period: number;       // 30, 90, 180, 365
  report_type: string;  // summary, detailed, trends
  date_from?: YYYYMMDDDate;
  date_to?: YYYYMMDDDate;
  status?: string;
}
```

---

### API Response Types

```typescript
// Paginated Response
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API Error
interface ApiError {
  detail: string;
  [key: string]: string[];
}

// Success Response
interface SuccessResponse<T> {
  data: T;
  message?: string;
}

// File Download Response
interface FileResponse {
  file: Blob;
  filename: string;
  content_type: string;
}
```

---

### Context Types

```typescript
// Auth Context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// Snackbar Context
interface SnackbarContextType {
  show: (message: string, severity?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
  close: () => void;
}
```

---

## State Management Patterns

### Form State Pattern

```typescript
interface FormState<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  dirty: boolean;
  isSubmitting: boolean;
}

// Example usage
interface OHCVisitFormState extends FormState<OHCVisitFormData> {
  vitalsPreview: string;  // JSON preview for UI
}

// Initial state
const initialOHCVisitFormState: OHCVisitFormState = {
  values: {
    employee: '',
    consulted_doctor: '',
    visit_type: VisitType.WALK_IN,
    triage_level: TriageLevel.LOW,
    visit_date: '',
    chief_complaint: '',
    symptoms: '',
    vitals: {},
    preliminary_notes: '',
  },
  errors: {},
  touched: {},
  dirty: false,
  isSubmitting: false,
  vitalsPreview: '{}',
};
```

### List State Pattern

```typescript
interface ListState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

// Example usage
interface HospitalListState extends ListState<Hospital> {
  filters: {
    status?: HospitalStatus;
    specialty?: string;
  };
}
```

---

## Component Props Types

### Base Props

```typescript
interface BaseProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

// All UI components extend from BaseProps
interface ButtonProps extends BaseProps {
  variant?: 'brand' | 'outline-brand' | 'outline-light' | 'outline-secondary' | 'outline-danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

interface CardProps extends BaseProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}

interface FormInputProps extends BaseProps {
  label?: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  helperText?: string;
}

interface StatCardProps extends BaseProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
}
```

---

## Utility Types

```typescript
// Make some properties optional
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Make some properties required
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Pick specific properties
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit specific properties
type Omit<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]: T[P];
};

// Record type
type Record<K extends string, T> = {
  [P in K]: T;
};
```

---

## Validation Schema Types

```typescript
interface ValidationRule {
  required?: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  custom?: (value: any) => string | undefined;
}

interface ValidationSchema {
  [field: string]: ValidationRule[];
}

// Example schema
const ohcVisitSchema: ValidationSchema = {
  employee: [{ required: true }],
  visit_type: [{ required: true }],
  triage_level: [{ required: true }],
  visit_date: [{ required: true }],
  chief_complaint: [
    { required: true },
    { minLength: 3, maxLength: 255 },
  ],
  symptoms: [
    { required: true },
    { minLength: 10, maxLength: 1000 },
  ],
};
```

---

**Phase 3 Output:** `docs/design/data-model.md`

**Complete:** Phase 3 — Design & Prototyping (Architecture, API Contract, Data Model)
