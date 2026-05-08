# OHC-AHC Frontend Migration — API Contract

**Date:** 2026-05-06
**Phase:** 3 — Design & Prototyping
**Status:** In Progress

---

## API Overview

**Base URL:** `/api` (Django REST Framework)
**Authentication:** JWT Bearer Token (`Authorization: Bearer <access_token>`)
**Content-Type:** `application/json`

---

## Authentication Endpoints

### POST `/api/auth/token/`

**Purpose:** Obtain JWT access and refresh tokens

**Request:**
```typescript
// FormData (multipart/form-data)
{
  username: string;  // email or username
  password: string;
}
```

**Response (200):**
```typescript
{
  access: string;   // JWT access token (5 min expiry)
  refresh: string;  // JWT refresh token (30 days expiry)
}
```

**Response (401):**
```typescript
{
  detail: string;  // "No active account found with the given credentials"
}
```

---

### POST `/api/auth/token/refresh/`

**Purpose:** Refresh expired access token

**Request:**
```typescript
{
  refresh: string;  // Refresh token
}
```

**Response (200):**
```typescript
{
  access: string;  // New access token
}
```

---

## Accounts Endpoints

### GET `/api/accounts/me/`

**Purpose:** Get current authenticated user information

**Authentication:** Required

**Response (200):**
```typescript
{
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: "ADMIN" | "NURSE" | "EHS" | "HR" | "KAM" | "DOCTOR" | "EMPLOYEE";
  phone_number?: string;
  is_verified: boolean;
  must_change_password: boolean;
  created_at: string;  // ISO 8601
  updated_at: string;  // ISO 8601

  // Extended data if employee
  employee_profile?: {
    id: number;
    employee_code: string;
    department: string;
    designation: string;
    work_location?: string;
    date_of_birth?: string;  // YYYY-MM-DD
    gender?: "MALE" | "FEMALE" | "OTHER";
    blood_group?: string;
    date_of_joining?: string;  // YYYY-MM-DD
    fitness_status: "FIT" | "UNFIT" | "TEMPORARY_UNFIT" | "UNDER_OBSERVATION";
    is_active_employee: boolean;
  };

  // Extended data if doctor/nurse
  doctor_profile?: {
    id: number;
    doctor_type: "OHC" | "AHC";
    registration_number: string;
    specialization: string;
    qualification?: string;
    years_of_experience: number;
    hospital?: {
      id: number;
      name: string;
      code: string;
    };
    consultation_fee: number;
    is_available_for_video: boolean;
  };
}
```

---

## OHC Endpoints

### GET `/api/ohc/visits/`

**Purpose:** List OHC visits

**Authentication:** Required
**Query Parameters:**
```typescript
{
  page?: number;       // Default: 1
  page_size?: number;   // Default: 20
  employee?: string;    // Employee profile ID
  status?: string;      // Filter by visit status
  date_from?: string;   // YYYY-MM-DD
  date_to?: string;     // YYYY-MM-DD
}
```

**Response (200):**
```typescript
{
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{
    uuid: string;              // UUID
    employee: {
      id: number;
      employee_code: string;
      user: {
        first_name: string;
        last_name: string;
      };
    };
    consulted_doctor: {
      id: number;
      user: {
        first_name: string;
        last_name: string;
      };
      registration_number: string;
      specialization: string;
    };
    visit_type: "WALK_IN" | "PERIODIC" | "PRE_EMPLOYMENT" | "FOLLOW_UP" | "EMERGENCY";
    visit_status: "OPEN" | "IN_PROGRESS" | "REFERRED" | "CLOSED" | "CANCELLED";
    triage_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    visit_date: string;        // ISO 8601
    chief_complaint: string;
    symptoms: string;
    vitals: Record<string, string>;  // JSON object
    preliminary_notes: string;
    requires_referral: boolean;
    follow_up_date?: string;     // YYYY-MM-DD
    next_action?: string;
    closed_at?: string;         // ISO 8601
    created_at: string;         // ISO 8601
    updated_at: string;         // ISO 8601
  }>;
}
```

---

### POST `/api/ohc/visits/`

**Purpose:** Create a new OHC visit

**Authentication:** Required (NURSE, DOCTOR roles)

**Request:**
```typescript
{
  employee: string;            // Employee profile ID
  consulted_doctor: string;   // Doctor profile ID (auto-filled)
  visit_type: "WALK_IN" | "PERIODIC" | "PRE_EMPLOYMENT" | "FOLLOW_UP" | "EMERGENCY";
  visit_status: "OPEN";       // Default
  triage_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  visit_date: string;          // ISO 8601
  chief_complaint: string;
  symptoms: string;
  vitals: Record<string, string>;  // JSON object: { temperature: "98.6", blood_pressure: "120/80", ... }
  preliminary_notes?: string;
  requires_referral?: boolean;  // Default: false
  follow_up_date?: string;    // YYYY-MM-DD
  next_action?: string;
}
```

**Response (201):**
```typescript
{
  uuid: string;
  // ... (same as GET response)
}
```

**Response (400):**
```typescript
{
  employee: ["This field is required."];
  visit_type: ["This field is required."];
  // ... validation errors
}
```

---

### POST `/api/ohc/diagnosis-prescriptions/`

**Purpose:** Create diagnosis with associated prescriptions

**Authentication:** Required (DOCTOR, NURSE roles)

**Request:**
```typescript
{
  visit: string;              // Visit UUID
  diagnosed_by: string;       // Doctor profile ID (auto-filled)
  diagnosis: {
    diagnosis_code?: string;
    diagnosis_name: string;
    diagnosis_notes: string;
    severity: "MILD" | "MODERATE" | "SERIOUS" | "CRITICAL";
    condition_status: "ACTIVE" | "STABLE" | "RESOLVED" | "CHRONIC";  // Default: ACTIVE
    is_primary: boolean;       // Default: true
    is_referral_required: boolean;  // Default: false
    fitness_decision: "FIT" | "FIT_WITH_RESTRICTION" | "TEMPORARY_UNFIT" | "UNFIT";
    work_restrictions?: string;
    advised_rest_days: number;  // Default: 0
    follow_up_date?: string;    // YYYY-MM-DD
  };
  prescriptions?: Array<{
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration_days: number;
    route?: string;
    instructions?: string;
    start_date: string;        // YYYY-MM-DD
    status: "ACTIVE" | "COMPLETED" | "STOPPED";  // Default: ACTIVE
  }>;
}
```

**Response (201):**
```typescript
{
  diagnosis: {
    id: number;
    uuid: string;
    // ... diagnosis fields
  };
  prescriptions: Array<{
    id: number;
    uuid: string;
    // ... prescription fields
  }>;
}
```

---

### GET `/api/ohc/medical-tests/`

**Purpose:** List medical tests

**Authentication:** Required
**Query Parameters:**
```typescript
{
  visit?: string;     // Visit UUID
  status?: string;     // Filter by status
  page?: number;       // Default: 1
  page_size?: number;   // Default: 20
}
```

**Response (200):**
```typescript
{
  count: number;
  results: Array<{
    uuid: string;
    visit: string;       // Visit UUID
    diagnosis?: {
      id: number;
      diagnosis_name: string;
    };
    requested_by: {
      id: number;
      user: {
        first_name: string;
        last_name: string;
      };
    };
    test_name: string;
    test_type: string;
    laboratory_name?: string;
    priority: "ROUTINE" | "URGENT" | "STAT";
    status: "ORDERED" | "SAMPLE_COLLECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    instructions?: string;
    result_summary?: string;
    result_value?: string;
    result_unit?: string;
    completed_at?: string;
    created_at: string;
  }>;
}
```

---

## AHC Endpoints

### GET `/api/ahc/hospitals/`

**Purpose:** List partner hospitals

**Authentication:** Required

**Query Parameters:**
```typescript
{
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  speciality?: string;
  page?: number;
  page_size?: number;
}
```

**Response (200):**
```typescript
{
  count: number;
  results: Array<{
    uuid: string;
    name: string;
    code: string;
    hospital_status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    hospital_type?: string;
    contact_person?: string;
    phone_number?: string;
    email?: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    postal_code?: string;
    country: string;          // Default: "India"
    accreditation_number?: string;
    specialties: Array<string>;  // JSON array
    supports_cashless: boolean;
    is_available_for_video: boolean;
    created_at: string;
  }>;
}
```

---

### GET `/api/ahc/referrals/`

**Purpose:** List referrals

**Authentication:** Required

**Query Parameters:**
```typescript
{
  employee?: string;        // Employee profile ID
  status?: string;          // Filter by status
  priority?: string;        // Filter by priority
  page?: number;
  page_size?: number;
}
```

**Response (200):**
```typescript
{
  count: number;
  results: Array<{
    uuid: string;
    visit: string;           // Visit UUID
    diagnosis?: {
      id: number;
      diagnosis_name: string;
    };
    employee: {
      id: number;
      employee_code: string;
      user: {
        first_name: string;
        last_name: string;
      };
    };
    referred_by: {
      id: number;
      user: {
        first_name: string;
        last_name: string;
      };
    };
    hospital?: {
      id: number;
      name: string;
      code: string;
    };
    referral_reason: string;
    specialist_department?: string;
    priority: "NORMAL" | "URGENT" | "EMERGENCY";
    referral_status: "DRAFT" | "PENDING_HOSPITAL_SELECTION" | "SENT" | "ACCEPTED" | "IN_TREATMENT" | "COMPLETED" | "REJECTED" | "CANCELLED";
    appointment_date?: string;  // ISO 8601
    external_case_id?: string;
    treatment_summary?: string;
    closure_notes?: string;
    created_at: string;
  }>;
}
```

---

### POST `/api/ahc/referrals/`

**Purpose:** Create a new referral

**Authentication:** Required (DOCTOR, NURSE, ADMIN roles)

**Request:**
```typescript
{
  visit: string;                // Visit UUID
  diagnosis?: string;           // Diagnosis ID
  employee: string;             // Employee profile ID
  referred_by: string;          // Doctor profile ID (auto-filled)
  hospital?: string;            // Hospital UUID
  referral_reason: string;
  specialist_department?: string;
  priority: "NORMAL" | "URGENT" | "EMERGENCY";  // Default: NORMAL
  referral_status: "PENDING_HOSPITAL_SELECTION";  // Default
}
```

**Response (201):**
```typescript
{
  uuid: string;
  // ... (same as GET response)
}
```

---

### GET `/api/ahc/medical-reports/`

**Purpose:** List medical reports

**Authentication:** Required

**Query Parameters:**
```typescript
{
  employee?: string;
  hospital?: string;
  report_type?: "LAB" | "IMAGING" | "DISCHARGE" | "FITNESS" | "PRESCRIPTION" | "OTHER";
  page?: number;
  page_size?: number;
}
```

**Response (200):**
```typescript
{
  count: number;
  results: Array<{
    uuid: string;
    referral?: {
      id: number;
      uuid: string;
    };
    visit?: {
      id: number;
      uuid: string;
    };
    employee: {
      id: number;
      employee_code: string;
      user: {
        first_name: string;
        last_name: string;
      };
    };
    hospital?: {
      id: number;
      name: string;
    };
    uploaded_by: {
      id: number;
      username: string;
      first_name?: string;
      last_name?: string;
    };
    report_type: "LAB" | "IMAGING" | "DISCHARGE" | "FITNESS" | "PRESCRIPTION" | "OTHER";
    title: string;
    summary?: string;
    report_file: string;         // File URL
    report_date: string;         // YYYY-MM-DD
    is_confidential: boolean;
    verification_status: "PENDING" | "VERIFIED" | "REJECTED";  // Default: PENDING
    created_at: string;
  }>;
}
```

---

## Payments Endpoints

### GET `/api/payments/invoices/`

**Purpose:** List invoices

**Authentication:** Required

**Query Parameters:**
```typescript
{
  employee?: string;
  status?: "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  page?: number;
  page_size?: number;
}
```

**Response (200):**
```typescript
{
  count: number;
  results: Array<{
    uuid: string;
    invoice_number: string;
    employee: {
      id: number;
      employee_code: string;
      user: {
        first_name: string;
        last_name: string;
      };
    };
    visit?: {
      id: number;
      uuid: string;
    };
    referral?: {
      id: number;
      uuid: string;
    };
    status: "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
    currency: string;           // Default: "INR"
    subtotal_amount: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    due_date?: string;        // YYYY-MM-DD
    issued_at?: string;        // ISO 8601
    paid_at?: string;          // ISO 8601
    notes?: string;
    created_at: string;
  }>;
}
```

---

### POST `/api/payments/payments/`

**Purpose:** Create a payment

**Authentication:** Required

**Request:**
```typescript
{
  invoice: string;            // Invoice UUID
  employee: string;           // Employee profile ID
  amount: number;
  payment_method: "CASH" | "CARD" | "UPI" | "NETBANKING" | "RAZORPAY";  // Default: RAZORPAY
  payment_status: "INITIATED";  // Default
  provider: string;           // Default: "RAZORPAY"
  provider_order_id?: string;   // From payment gateway
  provider_payment_id?: string;  // From payment gateway
  provider_signature?: string;  // From payment gateway
  transaction_reference?: string;
}
```

**Response (201):**
```typescript
{
  uuid: string;
  // ... (same as GET response)
}
```

---

## Reports Endpoints

### GET `/api/reports/employee-health-history/`

**Purpose:** Get complete health history for an employee

**Authentication:** Required (ADMIN, HR, EHS roles)

**Query Parameters:**
```typescript
{
  employee: string;     // Required: Employee profile ID
  date_from?: string;   // YYYY-MM-DD
  date_to?: string;     // YYYY-MM-DD
}
```

**Response (200):**
```typescript
{
  employee: {
    employee_code: string;
    user: {
      first_name: string;
      last_name: string;
    };
    department: string;
    designation: string;
    date_of_joining?: string;
    fitness_status: string;
  };
  visits: Array<{
    uuid: string;
    visit_date: string;
    visit_type: string;
    chief_complaint: string;
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
      end_date?: string;
    }>;
  }>;
  referrals: Array<{
    uuid: string;
    hospital_name: string;
    referral_status: string;
    created_at: string;
  }>;
}
```

---

### GET `/api/reports/disease-trends/`

**Purpose:** Get disease trends and analytics

**Authentication:** Required (ADMIN, HR, EHS roles)

**Query Parameters:**
```typescript
{
  period: number;        // Required: days to analyze (30, 90, 180, 365)
  severity?: string;     // Filter by severity
}
```

**Response (200):**
```typescript
{
  period_start: string;   // YYYY-MM-DD
  period_end: string;     // YYYY-MM-DD
  total_diagnoses: number;
  trends: Array<{
    diagnosis_name: string;
    count: number;
    severity: "MILD" | "MODERATE" | "SERIOUS" | "CRITICAL";
    percentage: number;    // % of total diagnoses
    change_from_previous: number;  // Percentage change
  }>;
  severity_breakdown: {
    MILD: number;
    MODERATE: number;
    SERIOUS: number;
    CRITICAL: number;
  };
}
```

---

### GET `/api/reports/department-health-stats/`

**Purpose:** Get health statistics by department

**Authentication:** Required (ADMIN, HR, EHS roles)

**Query Parameters:**
```typescript
{
  period: number;        // Required: days to analyze (30, 90, 180, 365)
  department?: string;   // Filter by department name
}
```

**Response (200):**
```typescript
{
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
    health_index: number;     // (visits / employees) * 100
    top_diagnosis: {
      diagnosis_name: string;
      count: number;
    };
  }>;
}
```

---

### GET `/api/reports/notifications/`

**Purpose:** Get user notifications

**Authentication:** Required

**Query Parameters:**
```typescript
{
  type?: "APPOINTMENT" | "REFERRAL" | "PAYMENT" | "REPORT" | "FITNESS_ALERT" | "GENERAL";
  unread_only?: boolean;
  page?: number;
  page_size?: number;
}
```

**Response (200):**
```typescript
{
  count: number;
  unread_count: number;
  results: Array<{
    uuid: string;
    title: string;
    message: string;
    notification_type: string;
    channel: "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP";
    delivery_status: "PENDING" | "SENT" | "FAILED" | "READ";
    scheduled_for?: string;
    sent_at?: string;
    read_at?: string;
    related_model?: string;
    related_object_uuid?: string;
    created_at: string;
  }>;
}
```

---

### GET `/api/reports/audit-logs/`

**Purpose:** Get system audit logs

**Authentication:** Required (ADMIN role only)

**Query Parameters:**
```typescript
{
  module?: string;       // Filter by module name
  action?: string;       // Filter by action
  actor?: number;        // Filter by user ID
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}
```

**Response (200):**
```typescript
{
  count: number;
  results: Array<{
    uuid: string;
    actor?: {
      id: number;
      username: string;
    };
    module: string;
    action: string;
    target_model: string;
    target_object_uuid: string;
    object_snapshot: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    remarks?: string;
    created_at: string;
  }>;
}
```

---

## Export Endpoints

### GET `/exports/employee-health-history.csv`

**Purpose:** Export employee health history to Excel/CSV

**Authentication:** Required

**Query Parameters:**
```typescript
{
  employee: string;     // Required
  date_from?: string;
  date_to?: string;
}
```

**Response (200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="employee_history.csv"

Employee Code,Employee Name,Department,Visit Date,Visit Type,Diagnosis,Severity,Fitness Decision
EMP-001,John Doe,Engineering,2026-05-01,WALK_IN,Headache,MILD,FIT
...
```

---

### GET `/exports/department-health-stats.csv`

**Purpose:** Export department health statistics to Excel/CSV

**Authentication:** Required

**Query Parameters:**
```typescript
{
  period: number;        // Required
  department?: string;
}
```

**Response (200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="department_stats.csv"

Department,Employees,Visits,Referrals,Unfit Employees,Health Index (%)
Engineering,150,45,12,3,30
...
```

---

### GET `/exports/analytics-summary.pdf`

**Purpose:** Export analytics summary to PDF

**Authentication:** Required

**Query Parameters:**
```typescript
{
  period: number;        // Required
  report_type?: "summary" | "detailed" | "trends";
}
```

**Response (200):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="analytics_summary.pdf"

[PDF binary content]
```

---

## Error Response Format

All error responses follow this format:

```typescript
{
  detail: string;  // Human-readable error message
  // OR for validation errors
  field_name: Array<string>;  // ["This field is required."]
}
```

**Status Codes:**
- `200 OK` — Success
- `201 Created` — Resource created
- `400 Bad Request` — Validation error
- `401 Unauthorized` — Invalid/missing token
- `403 Forbidden` — Insufficient permissions
- `404 Not Found` — Resource not found
- `422 Unprocessable Entity` — Business logic error
- `500 Internal Server Error` — Server error

---

## Pagination

All list endpoints support pagination via `page` and `page_size` query parameters.

**Default values:**
- `page`: 1
- `page_size`: 20

**Response includes:**
- `count`: Total number of items
- `next`: URL of next page (or `null`)
- `previous`: URL of previous page (or `null`)
- `results`: Array of items

---

**Phase 3 Output:** `docs/design/api-contract.md`

**Next:** Data Model document
