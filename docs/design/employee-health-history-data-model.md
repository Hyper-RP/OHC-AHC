# Phase 3: Design — Data Model

**Project:** OHC-AHC Employee Health History - Graphical Dashboard
**Date:** 2026-05-12
**Status:** In Progress

---

## Progress Bar

```
[████████████████████████████████████████████████] Phase 1: Planning (Completed)
[████████████████████████████████████████████████████] Phase 2: Requirements (Completed)
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 3: Design (In Progress)
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 4: Development
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 5: Testing
[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] Phase 6: Deployment
```

---

## Frontend TypeScript Types

### Chart Data Types

#### Visit Frequency Data

```typescript
interface VisitFrequencyData {
  date: string;              // Formatted date for display: "May 01" or "May 2026"
  fullDate: string;          // ISO date: "2026-05-01"
  count: number;             // Number of visits
  visitTypes?: {
    routine: number;
    walkIn: number;
    followUp: number;
  };
}
```

#### Visit Type Data

```typescript
interface VisitTypeData {
  type: 'Routine' | 'Walk-in' | 'Follow-up';
  count: number;
  percentage: number;         // 0-100
}
```

#### Diagnosis Distribution Data

```typescript
interface DiagnosisDistributionData {
  name: string;              // Diagnosis name
  count: number;
  percentage: number;         // 0-100
  color: string;
}

// Color palette for diagnoses
const DIAGNOSIS_COLORS = [
  '#3b82f6',  // Blue
  '#10b981',  // Green
  '#f59e0b',  // Yellow
  '#8b5cf6',  // Purple
  '#06b6d4',  // Cyan
  '#ec4899',  // Pink
  '#f97316',  // Orange
];
```

#### Severity Breakdown Data

```typescript
interface SeverityBreakdownData {
  severity: 'MILD' | 'MODERATE' | 'SERIOUS' | 'CRITICAL';
  count: number;
  color: string;
}

// Severity colors
const SEVERITY_COLORS: Record<string, string> = {
  MILD: '#10b981',       // Green
  MODERATE: '#f59e0b',   // Yellow
  SERIOUS: '#f97316',    // Orange
  CRITICAL: '#ef4444'     // Red
};
```

#### Health Index Trend Data

```typescript
interface HealthIndexTrendData {
  date: string;              // Formatted date
  fullDate: string;          // ISO date
  healthIndex: number;       // 0-100
  status: 'good' | 'warning' | 'concern';
}
```

#### Quick Stats Data

```typescript
interface QuickStatsData {
  totalVisits: number;
  avgRecoveryTime: number;   // Average days between visits
  fitnessTrend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}
```

---

### Component Props Types

#### Employee Summary Section

```typescript
interface EmployeeSummaryProps {
  employee: {
    employee_code: string;
    user: { first_name: string; last_name: string };
    department: string;
    designation: string;
    fitness_status: 'FIT' | 'UNFIT' | 'TEMPORARY_UNFIT' | 'UNDER_OBSERVATION';
  };
  healthScore: number;
  quickStats: QuickStatsData;
}
```

#### Visit Trends Section

```typescript
interface VisitTrendsProps {
  visitFrequencyData: VisitFrequencyData[];
  visitTypeData: VisitTypeData[];
  dailyMonthly: 'daily' | 'monthly';
  onDailyMonthlyChange: (value: 'daily' | 'monthly') => void;
  loading?: boolean;
}
```

#### Diagnosis Distribution Section

```typescript
interface DiagnosisDistributionProps {
  diagnosisData: DiagnosisDistributionData[];
  severityData: SeverityBreakdownData[];
  loading?: boolean;
}
```

#### Health Index Trend Section

```typescript
interface HealthIndexTrendProps {
  trendData: HealthIndexTrendData[];
  loading?: boolean;
}
```

---

### Transformed Chart Data Structure

```typescript
interface TransformedChartData {
  // Summary
  summary: {
    employeeName: string;
    department: string;
    designation: string;
    fitnessStatus: string;
    healthScore: number;
    totalVisits: number;
    avgRecoveryTime: number;
    fitnessTrend: {
      direction: 'up' | 'down' | 'stable';
      percentage: number;
    };
  };

  // Visit Trends
  visitFrequency: VisitFrequencyData[];
  visitTypes: VisitTypeData[];

  // Diagnosis Distribution
  diagnosisDistribution: DiagnosisDistributionData[];
  severityBreakdown: SeverityBreakdownData[];

  // Health Index Trend
  healthIndexTrend: HealthIndexTrendData[];
}
```

---

## Data Transformation Logic

### 1. Transform API Response to Chart Data

```typescript
/**
 * Transforms raw API employee health history data into chart-ready format
 */
function transformEmployeeHealthHistory(
  apiData: EmployeeHealthHistory,
  dailyMonthly: 'daily' | 'monthly'
): TransformedChartData {
  return {
    // Summary data
    summary: transformSummary(apiData),

    // Visit trends data
    visitFrequency: transformVisitFrequency(apiData.visits, dailyMonthly),
    visitTypes: transformVisitTypes(apiData.visits),

    // Diagnosis distribution data
    diagnosisDistribution: transformDiagnosisDistribution(apiData.visits, 5),
    severityBreakdown: transformSeverityBreakdown(apiData.visits),

    // Health index trend data
    healthIndexTrend: transformHealthIndexTrend(apiData.visits, dailyMonthly),
  };
}
```

### 2. Summary Transformation

```typescript
function transformSummary(apiData: EmployeeHealthHistory) {
  const { employee, visits } = apiData;

  // Calculate health score
  const healthScore = calculateHealthScore(visits, employee.fitness_status);

  // Calculate quick stats
  const totalVisits = visits.length;
  const avgRecoveryTime = calculateAvgRecoveryTime(visits);
  const fitnessTrend = calculateFitnessTrend(visits);

  return {
    employeeName: `${employee.user.first_name} ${employee.user.last_name}`,
    department: employee.department,
    designation: employee.designation,
    fitnessStatus: employee.fitness_status,
    healthScore,
    totalVisits,
    avgRecoveryTime,
    fitnessTrend,
  };
}

function calculateAvgRecoveryTime(visits: any[]): number {
  if (visits.length < 2) return 0;

  // Sort visits by date
  const sorted = [...visits].sort((a, b) =>
    new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
  );

  // Calculate average days between consecutive visits
  let totalDays = 0;
  for (let i = 1; i < sorted.length; i++) {
    const days = daysBetween(sorted[i-1].visit_date, sorted[i].visit_date);
    totalDays += days;
  }

  return Math.round(totalDays / (sorted.length - 1));
}

function calculateFitnessTrend(visits: any[]) {
  // Compare recent 30 days vs previous 30 days
  const now = new Date();
  const recentStart = subDays(now, 30);
  const previousEnd = recentStart;
  const previousStart = subDays(previousEnd, 30);

  const recentVisits = visits.filter(v =>
    new Date(v.visit_date) >= recentStart && new Date(v.visit_date) <= now
  );
  const previousVisits = visits.filter(v =>
    new Date(v.visit_date) >= previousStart && new Date(v.visit_date) < recentStart
  );

  const recentAvg = calculateHealthScore(recentVisits, 'FIT');
  const previousAvg = calculateHealthScore(previousVisits, 'FIT');

  const diff = recentAvg - previousAvg;
  const percentage = previousAvg > 0 ? (diff / previousAvg) * 100 : 0;

  if (percentage > 5) return { direction: 'up' as const, percentage: Math.abs(percentage) };
  if (percentage < -5) return { direction: 'down' as const, percentage: Math.abs(percentage) };
  return { direction: 'stable' as const, percentage: Math.abs(percentage) };
}
```

### 3. Visit Frequency Transformation

```typescript
function transformVisitFrequency(
  visits: any[],
  dailyMonthly: 'daily' | 'monthly'
): VisitFrequencyData[] {
  const grouped: Record<string, number> = {};

  visits.forEach(visit => {
    const date = new Date(visit.visit_date);
    let key: string;

    if (dailyMonthly === 'daily') {
      // Group by date: "2026-05-01"
      key = date.toISOString().split('T')[0];
    } else {
      // Group by month: "2026-05"
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    grouped[key] = (grouped[key] || 0) + 1;
  });

  // Convert to array and sort
  return Object.entries(grouped).map(([date, count]) => ({
    date: dailyMonthly === 'daily'
      ? format(parseISO(date), 'MMM dd')
      : format(parseISO(date), 'MMM yyyy'),
    fullDate: date,
    count,
  })).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
}
```

### 4. Visit Type Transformation

```typescript
function transformVisitTypes(visits: any[]): VisitTypeData[] {
  const counts: Record<string, number> = {
    Routine: 0,
    'Walk-in': 0,
    'Follow-up': 0,
  };

  visits.forEach(visit => {
    const type = mapVisitType(visit.visit_type);
    counts[type] = (counts[type] || 0) + 1;
  });

  const total = visits.length;

  return Object.entries(counts).map(([type, count]) => ({
    type: type as 'Routine' | 'Walk-in' | 'Follow-up',
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

function mapVisitType(apiType: string): string {
  const mapping: Record<string, string> = {
    ROUTINE: 'Routine',
    WALK_IN: 'Walk-in',
    FOLLOW_UP: 'Follow-up',
    PERIODIC: 'Routine',
    PRE_EMPLOYMENT: 'Routine',
    EMERGENCY: 'Walk-in',
  };
  return mapping[apiType] || 'Routine';
}
```

### 5. Diagnosis Distribution Transformation

```typescript
function transformDiagnosisDistribution(
  visits: any[],
  maxItems: number = 5
): DiagnosisDistributionData[] {
  const counts: Record<string, number> = {};

  // Extract and count all diagnoses
  visits.forEach(visit => {
    visit.diagnoses?.forEach((diagnosis: any) => {
      const name = diagnosis.diagnosis_name;
      counts[name] = (counts[name] || 0) + 1;
    });
  });

  // Sort by count (descending)
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  // Take top N and group rest as "Other"
  const topItems = sorted.slice(0, maxItems);
  const otherCount = sorted.slice(maxItems).reduce((sum, [, count]) => sum + count, 0);

  const result: DiagnosisDistributionData[] = topItems.map(([name, count], index) => ({
    name,
    count,
    percentage: Math.round((count / visits.length) * 100),
    color: DIAGNOSIS_COLORS[index % DIAGNOSIS_COLORS.length],
  }));

  if (otherCount > 0) {
    result.push({
      name: 'Other',
      count: otherCount,
      percentage: Math.round((otherCount / visits.length) * 100),
      color: '#9ca3af', // Gray
    });
  }

  return result;
}
```

### 6. Severity Breakdown Transformation

```typescript
function transformSeverityBreakdown(visits: any[]): SeverityBreakdownData[] {
  const counts: Record<string, number> = {
    MILD: 0,
    MODERATE: 0,
    SERIOUS: 0,
    CRITICAL: 0,
  };

  // Count occurrences by severity
  visits.forEach(visit => {
    visit.diagnoses?.forEach((diagnosis: any) => {
      const severity = diagnosis.severity as keyof typeof counts;
      if (severity) {
        counts[severity] = (counts[severity] || 0) + 1;
      }
    });
  });

  // Convert to array, maintaining severity order
  const severityOrder: Array<keyof typeof counts> = ['MILD', 'MODERATE', 'SERIOUS', 'CRITICAL'];
  return severityOrder.map(severity => ({
    severity,
    count: counts[severity],
    color: SEVERITY_COLORS[severity],
  }));
}
```

### 7. Health Index Trend Transformation

```typescript
function transformHealthIndexTrend(
  visits: any[],
  dailyMonthly: 'daily' | 'monthly'
): HealthIndexTrendData[] {
  // Group visits by date/month
  const groupedVisits: Record<string, any[]> = {};

  visits.forEach(visit => {
    const date = new Date(visit.visit_date);
    let key: string;

    if (dailyMonthly === 'daily') {
      key = date.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    groupedVisits[key] = groupedVisits[key] || [];
    groupedVisits[key].push(visit);
  });

  // Calculate health index for each period using sliding window
  const result: HealthIndexTrendData[] = [];
  const sortedKeys = Object.keys(groupedVisits).sort();

  sortedKeys.forEach(dateKey => {
    const periodVisits = groupedVisits[dateKey];
    const periodDate = parseISO(dateKey);

    // Get visits from last 30 days as context
    const contextVisits = visits.filter(visit => {
      const visitDate = new Date(visit.visit_date);
      const daysDiff = differenceInDays(periodDate, visitDate);
      return daysDiff >= 0 && daysDiff <= 30;
    });

    // Calculate health index for this period
    const healthIndex = calculateHealthScore(contextVisits, 'FIT');
    const status = healthIndex >= 80 ? 'good' : healthIndex >= 60 ? 'warning' : 'concern';

    result.push({
      date: dailyMonthly === 'daily'
        ? format(periodDate, 'MMM dd')
        : format(periodDate, 'MMM yyyy'),
      fullDate: dateKey,
      healthIndex: Math.round(healthIndex),
      status,
    });
  });

  return result;
}
```

---

## Database Schema (Reference)

### Employee Table

```sql
CREATE TABLE employee (
  id SERIAL PRIMARY KEY,
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES user(id),
  department VARCHAR(100),
  designation VARCHAR(100),
  fitness_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### OHC Visit Table

```sql
CREATE TABLE ohc_visit (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id INTEGER REFERENCES employee(id),
  consulted_doctor_id INTEGER REFERENCES doctor(id),
  visit_type VARCHAR(50) NOT NULL,
  visit_status VARCHAR(50) DEFAULT 'OPEN',
  triage_level VARCHAR(50),
  visit_date TIMESTAMP NOT NULL,
  chief_complaint TEXT,
  symptoms TEXT,
  vitals JSONB,
  preliminary_notes TEXT,
  requires_referral BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  next_action TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Diagnosis Table

```sql
CREATE TABLE diagnosis (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_uuid UUID REFERENCES ohc_visit(uuid),
  diagnosed_by VARCHAR(50),
  diagnosis_code VARCHAR(50),
  diagnosis_name VARCHAR(255) NOT NULL,
  diagnosis_notes TEXT,
  severity VARCHAR(50) NOT NULL,
  fitness_decision VARCHAR(50),
  work_restrictions TEXT,
  advised_rest_days INTEGER DEFAULT 0,
  follow_up_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## State Management

### Component State

```typescript
interface EmployeeHealthHistoryState {
  // User Input
  employeeId: string;
  period: number;          // 30, 90, 180, 365
  dailyMonthly: 'daily' | 'monthly';

  // Data
  apiData: EmployeeHealthHistory | null;
  chartData: TransformedChartData | null;

  // UI State
  loading: boolean;
  error: string | null;
  showCharts: boolean;      // Toggle between list and charts view
}

// Initial state
const INITIAL_STATE: EmployeeHealthHistoryState = {
  employeeId: '',
  period: 90,
  dailyMonthly: 'daily',
  apiData: null,
  chartData: null,
  loading: false,
  error: null,
  showCharts: true,
};
```

---

## Data Validation

### Input Validation

```typescript
/**
 * Validates employee ID input
 */
function validateEmployeeId(employeeId: string): { valid: boolean; error?: string } {
  if (!employeeId || employeeId.trim() === '') {
    return { valid: false, error: 'Employee ID is required' };
  }

  if (!/^[A-Z]{2,4}-\d{3,6}$/.test(employeeId)) {
    return { valid: false, error: 'Invalid employee ID format. Expected: XX-000' };
  }

  return { valid: true };
}

/**
 * Validates date range
 */
function validateDateRange(start: string, end: string): { valid: boolean; error?: string } {
  const startDate = parseISO(start);
  const endDate = parseISO(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  if (startDate > endDate) {
    return { valid: false, error: 'End date must be after start date' };
  }

  const maxRange = 365; // 1 year max
  const daysDiff = differenceInDays(endDate, startDate);
  if (daysDiff > maxRange) {
    return { valid: false, error: `Date range cannot exceed ${maxRange} days` };
  }

  return { valid: true };
}
```

---

## Export Data Format

### CSV Export Schema

```typescript
interface EmployeeHealthHistoryCSV {
  'Employee Code': string;
  'Employee Name': string;
  'Department': string;
  'Designation': string;
  'Fitness Status': string;
  'Visit Date': string;
  'Visit Type': string;
  'Chief Complaint': string;
  'Diagnosis': string;
  'Severity': string;
  'Fitness Decision': string;
  'Rest Days': number;
  'Doctor': string;
  'Prescriptions': string;
}

/**
 * Converts API data to CSV row
 */
function toCSVRow(visit: any, employee: any): EmployeeHealthHistoryCSV {
  const primaryDiagnosis = visit.diagnoses?.[0];
  const prescriptions = visit.prescriptions?.map((p: any) =>
    `${p.medicine_name} (${p.dosage}, ${p.frequency})`
  ).join('; ') || '';

  return {
    'Employee Code': employee.employee_code,
    'Employee Name': `${employee.user.first_name} ${employee.user.last_name}`,
    'Department': employee.department,
    'Designation': employee.designation,
    'Fitness Status': employee.fitness_status,
    'Visit Date': format(parseISO(visit.visit_date), 'yyyy-MM-dd'),
    'Visit Type': visit.visit_type,
    'Chief Complaint': visit.chief_complaint,
    'Diagnosis': primaryDiagnosis?.diagnosis_name || '',
    'Severity': primaryDiagnosis?.severity || '',
    'Fitness Decision': primaryDiagnosis?.fitness_decision || '',
    'Rest Days': primaryDiagnosis?.advised_rest_days || 0,
    'Doctor': visit.consulted_doctor?.user ?
      `Dr. ${visit.consulted_doctor.user.first_name} ${visit.consulted_doctor.user.last_name}` : '',
    'Prescriptions': prescriptions,
  };
}
```

---

**Phase 3 Output:** `docs/design/employee-health-history-data-model.md`
