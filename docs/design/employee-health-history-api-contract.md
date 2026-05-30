# Phase 3: Design — API Contract

**Project:** OHC-AHC Employee Health History - Graphical Dashboard
**Date:** 2026-05-12
**Status:** In Progress

---

## API Endpoints

### GET /api/reports/employee-health-history/

**Description:** Retrieve complete health history for a specific employee.

**Authentication:** Required (JWT Bearer Token)

**Method:** GET

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|--------|-----------|-------------|-----------|
| `employee_code` | string | Yes | Employee code/ID | "EMP-001" |
| `date_from` | string | No | Start date filter (ISO format) | "2026-01-01" |
| `date_to` | string | No | End date filter (ISO format) | "2026-12-31" |

**Request Example:**
```bash
GET /api/reports/employee-health-history/?employee_code=EMP-001&date_from=2026-01-01&date_to=2026-05-12
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**

```json
{
  "employee": {
    "employee_code": "EMP-001",
    "user": {
      "first_name": "John",
      "last_name": "Doe"
    },
    "department": "Engineering",
    "designation": "Senior Developer",
    "fitness_status": "FIT"
  },
  "visits": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "visit_date": "2026-03-15T09:00:00Z",
      "visit_type": "WALK_IN",
      "chief_complaint": "Persistent headache",
      "symptoms": "Headache, dizziness",
      "visit_status": "CLOSED",
      "triage_level": "MEDIUM",
      "vitals": {
        "temperature": "98.6°F",
        "blood_pressure": "120/80",
        "pulse": "72",
        "spo2": "98%"
      },
      "consulted_doctor": {
        "id": 1,
        "user": {
          "first_name": "Dr.",
          "last_name": "Smith"
        },
        "registration_number": "DOC-001",
        "specialization": "General Medicine"
      },
      "diagnoses": [
        {
          "uuid": "550e8400-e29b-41d4-a716-446655440001",
          "diagnosis_name": "Migraine",
          "severity": "MILD",
          "fitness_decision": "FIT",
          "work_restrictions": "None",
          "advised_rest_days": 1,
          "diagnosed_at": "2026-03-15T10:30:00Z"
        }
      ],
      "prescriptions": [
        {
          "medicine_name": "Paracetamol 500mg",
          "dosage": "1 tablet",
          "frequency": "Twice daily",
          "duration_days": 3,
          "route": "Oral",
          "instructions": "Take after meals",
          "start_date": "2026-03-15"
        }
      ],
      "follow_up_date": "2026-03-16",
      "requires_referral": false,
      "created_at": "2026-03-15T09:15:00Z"
    },
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440002",
      "visit_date": "2026-04-02T14:00:00Z",
      "visit_type": "ROUTINE",
      "chief_complaint": "Annual health checkup",
      "symptoms": "None - routine",
      "visit_status": "CLOSED",
      "triage_level": "LOW",
      "vitals": {
        "temperature": "98.4°F",
        "blood_pressure": "118/76",
        "pulse": "68",
        "spo2": "99%"
      },
      "consulted_doctor": {
        "id": 1,
        "user": {
          "first_name": "Dr.",
          "last_name": "Smith"
        },
        "registration_number": "DOC-001",
        "specialization": "General Medicine"
      },
      "diagnoses": [
        {
          "uuid": "550e8400-e29b-41d4-a716-4466554403",
          "diagnosis_name": "Hypertension",
          "severity": "MODERATE",
          "fitness_decision": "FIT_WITH_RESTRICTION",
          "work_restrictions": "No heavy lifting",
          "advised_rest_days": 0,
          "diagnosed_at": "2026-04-02T14:30:00Z"
        }
      ],
      "prescriptions": [
        {
          "medicine_name": "Amlodipine 5mg",
          "dosage": "1 tablet",
          "frequency": "Once daily",
          "duration_days": 30,
          "route": "Oral",
          "instructions": "Take in the morning",
          "start_date": "2026-04-03"
        }
      ],
      "requires_referral": false,
      "created_at": "2026-04-02T14:15:00Z"
    }
  ],
  "referrals": [
    {
      "uuid": "550e8400-e29b-41d4-a716-4466554404",
      "hospital_name": "City General Hospital",
      "referral_status": "COMPLETED",
      "created_at": "2026-02-10T11:00:00Z"
    }
  ]
}
```

**Error Responses:**

| Status Code | Description | Response Body |
|-----------|-------------|---------------|
| 400 | Bad Request | `{ "detail": "Invalid employee_code format" }` |
| 401 | Unauthorized | `{ "detail": "Authentication credentials were not provided" }` |
| 403 | Forbidden | `{ "detail": "You do not have permission to access this record" }` |
| 404 | Not Found | `{ "detail": "Employee not found" }` |
| 500 | Internal Server Error | `{ "detail": "An error occurred while fetching data" }` |

---

### GET /exports/employee-health-history.csv

**Description:** Export employee health history as CSV file.

**Authentication:** Required (JWT Bearer Token)

**Method:** GET

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|--------|-----------|-------------|-----------|
| `employee_code` | string | Yes | Employee code/ID | "EMP-001" |
| `date_from` | string | No | Start date filter | "2026-01-01" |
| `date_to` | string | No | End date filter | "2026-12-31" |

**Request Example:**
```bash
GET /exports/employee-health-history.csv?employee_code=EMP-001&date_from=2026-01-01
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="employee_health_history_EMP-001.csv"`

**CSV Format:**
```csv
Employee Code,Employee Name,Department,Designation,Fitness Status,Visit Date,Visit Type,Chief Complaint,Diagnosis,Severity,Fitness Decision,Rest Days
EMP-001,John Doe,Engineering,Senior Developer,FIT,2026-03-15,WALK_IN,Persistent headache,Migraine,MILD,FIT,1
EMP-001,John Doe,Engineering,Senior Developer,FIT,2026-04-02,ROUTINE,Annual checkup,Hypertension,MODERATE,FIT_WITH_RESTRICTION,0
```

**Error Responses:**

| Status Code | Description | Response Body |
|-----------|-------------|---------------|
| 400 | Bad Request | `{ "detail": "Invalid parameters" }` |
| 401 | Unauthorized | `{ "detail": "Authentication required" }` |
| 403 | Forbidden | `{ "detail": "Permission denied" }` |
| 404 | Not Found | `{ "detail": "Employee not found" }` |
| 500 | Internal Server Error | `{ "detail": "Export failed" }` |

---

## Client-Side Data Transformations

### Transform: Visit Frequency Data

**Function:** `transformVisitFrequencyData(visits, dailyMonthly)`

**Input:**
- `visits`: Array of visit objects from API
- `dailyMonthly`: 'daily' | 'monthly'

**Output:**
```typescript
{
  date: string;           // "May 01" or "May 2026"
  fullDate: string;       // "2026-05-01" (ISO)
  count: number;          // Number of visits
}
```

**Logic:**
1. Filter visits by date range (if specified)
2. Group visits by date (daily) or month (monthly)
3. Count visits per period
4. Sort by date ascending

---

### Transform: Visit Type Breakdown

**Function:** `transformVisitTypeData(visits)`

**Output:**
```typescript
{
  type: 'Routine' | 'Walk-in' | 'Follow-up';
  count: number;
  percentage: number;
}
```

**Logic:**
1. Map visit_type values: ROUTINE → 'Routine', WALK_IN → 'Walk-in', FOLLOW_UP → 'Follow-up'
2. Count occurrences per type
3. Calculate percentage: (count / total) × 100

---

### Transform: Diagnosis Distribution

**Function:** `transformDiagnosisDistributionData(visits, maxItems)`

**Output:**
```typescript
{
  name: string;
  count: number;
  percentage: number;
  color: string;
}
```

**Logic:**
1. Extract all diagnoses from all visits
2. Count occurrences by diagnosis_name
3. Sort by count (descending)
4. Take top N diagnoses
5. Group rest as "Other"
6. Assign colors from palette
7. Calculate percentages

---

### Transform: Severity Breakdown

**Function:** `transformSeverityBreakdownData(visits)`

**Output:**
```typescript
{
  severity: 'MILD' | 'MODERATE' | 'SERIOUS' | 'CRITICAL';
  count: number;
  color: string;
}
```

**Logic:**
1. Extract all diagnoses from all visits
2. Count occurrences by severity
3. Include all 4 levels even if count is 0
4. Assign colors: MILD (#10b981), MODERATE (#f59e0b), SERIOUS (#f97316), CRITICAL (#ef4444)

---

### Calculate: Health Score

**Function:** `calculateHealthScore(visits, fitnessStatus)`

**Output:** `number` (0-100)

**Algorithm:**
```typescript
function calculateHealthScore(visits, fitnessStatus) {
  let score = 100;

  // Base score from fitness status
  if (fitnessStatus === 'FIT') score = 90;
  else if (fitnessStatus === 'TEMPORARY_UNFIT') score = 70;
  else if (fitnessStatus === 'UNDER_OBSERVATION') score = 60;
  else if (fitnessStatus === 'UNFIT') score = 30;

  // Adjust based on recent visits (last 90 days)
  const recentVisits = visits.filter(v => isWithinLastDays(v.visit_date, 90));
  const severityDeductions = recentVisits.reduce((sum, visit) => {
    const maxSeverity = getMaxSeverityFromDiagnoses(visit.diagnoses);
    switch (maxSeverity) {
      case 'CRITICAL': return sum - 15;
      case 'SERIOUS': return sum - 10;
      case 'MODERATE': return sum - 5;
      case 'MILD': return sum - 2;
      default: return sum;
    }
  }, 0);

  score += severityDeductions;
  return Math.max(0, Math.min(100, score));
}
```

---

### Calculate: Health Index Trend

**Function:** `calculateHealthIndexTrend(visits, dailyMonthly)`

**Output:**
```typescript
{
  date: string;
  fullDate: string;
  healthIndex: number;
  status: 'good' | 'warning' | 'concern';
}
```

**Algorithm:**
```typescript
function calculateHealthIndexTrend(visits, dailyMonthly) {
  // Group visits by date/month
  const grouped = groupVisitsByPeriod(visits, dailyMonthly);

  // Calculate health index for each period using sliding window
  const trend = Object.entries(grouped).map(([date, periodVisits]) => {
    // Get visits from last 30 days (for context)
    const contextualVisits = getVisitsInWindow(visits, date, 30);
    const healthIndex = calculateHealthScore(contextualVisits, 'FIT');

    return {
      date: formatDate(date, dailyMonthly),
      fullDate: date,
      healthIndex,
      status: healthIndex >= 80 ? 'good' : healthIndex >= 60 ? 'warning' : 'concern'
    };
  });

  return trend.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
}
```

---

### Aggregate: Daily/Monthly

**Function:** `aggregateDailyMonthly(data, dailyMonthly, dateField)`

**Logic:**
```typescript
function aggregateDailyMonthly(data, dailyMonthly, dateField) {
  if (dailyMonthly === 'daily') {
    // Group by date (YYYY-MM-DD)
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item[dateField]).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  } else {
    // Group by month (YYYY-MM)
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item[dateField]);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }
}
```

---

## Rate Limiting

All endpoints are subject to standard rate limiting:
- 100 requests per minute per user
- 1000 requests per hour per user

**Rate Limit Response (429):**
```json
{
  "detail": "Rate limit exceeded. Please try again later."
}
```

---

## Pagination

The employee health history endpoint does not use pagination as it returns a single employee's complete history. If the dataset grows large, pagination may be added.

---

## Security Headers

All API responses include:
```
Access-Control-Allow-Origin: <configured_origin>
Access-Control-Allow-Credentials: true
Cache-Control: private, max-age=300
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

---

**Phase 3 Output:** `docs/design/employee-health-history-api-contract.md`
