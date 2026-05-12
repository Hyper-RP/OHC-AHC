# Graphical Dashboard — API Contract

**Project:** OHC-AHC Dashboard Redesign - Graphical Dashboard
**Date:** 2026-05-11
**Status:** In Progress

---

## API Overview

**Base URL:** `/api` (Django REST Framework)
**Authentication:** JWT Bearer Token (`Authorization: Bearer <access_token>`)
**Content-Type:** `application/json`

---

## Existing API Endpoints (To Be Used)

### GET `/api/reports/dashboard-home/`

**Purpose:** Fetch dashboard statistics for charts

**Request Parameters:**
```typescript
{
  period?: number;    // Days to look back (default: 30)
  daily_monthly?: 'daily' | 'monthly';  // Aggregation level (default: 'daily')
}
```

**Response (200):**
```typescript
{
  visit_trends: Array<{
    date: string;      // YYYY-MM-DD
    count: number;     // Number of visits
  }>,
  department_comparison: Array<{
    department: string;
    visits: number;
    employees: number;
    referrals: number;
  }>,
  severity_breakdown: {
    MILD: number;
    MODERATE: number;
    SEVERE: number;
    CRITICAL: number;
  },
  common_diagnoses: Array<{
    diagnosis_name: string;
    count: number;
    trend: Array<{
      date: string;
      count: number;
    }>;
  }>,
  recent_activity: Array<{
    type: 'visit' | 'diagnosis' | 'referral';
    employee_id: string;
    employee_name: string;
    details: string;
    timestamp: string;
  }>
}
```

**Usage In:**
- Dashboard.tsx → VisitTrendsChart
- Dashboard.tsx → DepartmentComparisonChart
- Dashboard.tsx → SeverityPieChart
- Dashboard.tsx → DiagnosisTrendLineChart

---

### GET `/api/reports/disease-trends/`

**Purpose:** Fetch disease trends and analytics for charts

**Request Parameters:**
```typescript
{
  period: number;           // Days to analyze (30, 90, 180, 365)
  severity?: string;        // Optional: MILD, MODERATE, SEVERE, CRITICAL
  date_from?: string;       // Optional: YYYY-MM-DD
  date_to?: string;         // Optional: YYYY-MM-DD
  daily_monthly?: 'daily' | 'monthly';  // Aggregation level (default: 'daily')
}
```

**Response (200):**
```typescript
{
  total_diagnoses: number;
  period_start: string;     // YYYY-MM-DD
  period_end: string;       // YYYY-MM-DD
  trends: Array<{
    diagnosis_name: string;
    count: number;
    severity: string;
    percentage: number;
    change_from_previous: number;  // Positive = increase, Negative = decrease
    trend_data: Array<{
      date: string;
      count: number;
    }>;
  }>,
  severity_breakdown: {
    MILD: number;
    MODERATE: number;
    SEVERE: number;
    CRITICAL: number;
  },
  severity_trends: {
    MILD: Array<{ date: string; count: number }>;
    MODERATE: Array<{ date: string; count: number }>;
    SEVERE: Array<{ date: string; count: number }>;
    CRITICAL: Array<{ date: string; count: number }>;
  }
}
```

**Usage In:**
- DiseaseTrends.tsx → DiagnosisAreaChart
- DiseaseTrends.tsx → SeverityTrendChart

---

### GET `/api/reports/department-health-stats/`

**Purpose:** Fetch department health statistics for charts

**Request Parameters:**
```typescript
{
  period: number;           // Days to analyze (30, 90, 180, 365)
  department?: string;      // Optional: Filter by department
  date_from?: string;       // Optional: YYYY-MM-DD
  date_to?: string;         // Optional: YYYY-MM-DD
  daily_monthly?: 'daily' | 'monthly';  // Aggregation level (default: 'daily')
}
```

**Response (200):**
```typescript
{
  summary: {
    total_departments: number;
    total_employees: number;
    total_visits: number;
    total_referrals: number;
  },
  departments: Array<{
    department: string;
    total_employees: number;
    total_visits: number;
    referred_cases: number;
    unfit_employees: number;
    health_index: number;    // 0-100
    visit_trend: Array<{
      date: string;
      visits: number;
      referrals: number;
    }>;
  }>
}
```

**Usage In:**
- DepartmentStats.tsx → HealthIndexGauge
- DepartmentStats.tsx → VisitsReferralsStackedBar

---

## Data Transformation Functions

### Transform Dashboard Data

```typescript
// Transform API response to chart data format
function transformDashboardData(apiResponse: DashboardApiResponse): DashboardChartData {
  return {
    visitTrends: apiResponse.visit_trends.map(item => ({
      date: new Date(item.date),
      count: item.count
    })),
    departmentComparison: apiResponse.department_comparison.map(item => ({
      name: item.department,
      visits: item.visits,
      employees: item.employees,
      referrals: item.referrals
    })),
    severityBreakdown: Object.entries(apiResponse.severity_breakdown).map(([key, value]) => ({
      severity: key,
      count: value,
      color: getSeverityColor(key)
    })),
    diagnosisTrends: apiResponse.common_diagnoses.slice(0, 5).map(item => ({
      diagnosis: item.diagnosis_name,
      data: item.trend.map(t => ({
        date: new Date(t.date),
        count: t.count
      })),
      color: getDiagnosisColor(item.diagnosis_name)
    }))
  };
}
```

### Transform Disease Trends Data

```typescript
function transformDiseaseTrendsData(apiResponse: DiseaseTrendsApiResponse): DiseaseTrendsChartData {
  return {
    diagnosisArea: apiResponse.trends.slice(0, 5).map(item => ({
      diagnosis: item.diagnosis_name,
      data: item.trend_data.map(t => ({
        date: new Date(t.date),
        count: t.count
      })),
      color: getDiagnosisColor(item.diagnosis_name)
    })),
    severityTrends: Object.entries(apiResponse.severity_trends).map(([severity, data]) => ({
      severity,
      data: data.map(t => ({
        date: new Date(t.date),
        count: t.count
      })),
      color: getSeverityColor(severity)
    }))
  };
}
```

### Transform Department Stats Data

```typescript
function transformDepartmentStatsData(apiResponse: DepartmentStatsApiResponse): DepartmentStatsChartData {
  return {
    healthIndex: apiResponse.departments.map(dept => ({
      department: dept.department,
      healthIndex: dept.health_index,
      visits: dept.total_visits,
      referrals: dept.referred_cases,
      unfit: dept.unfit_employees
    })),
    visitsReferrals: apiResponse.departments.map(dept => ({
      department: dept.department,
      visits: dept.total_visits,
      referrals: dept.referred_cases
    }))
  };
}
```

### Daily/Monthly Aggregation

```typescript
function aggregateByPeriod(
  data: Array<{ date: string; count: number }>,
  period: 'daily' | 'monthly'
): Array<{ date: string; count: number }> {
  if (period === 'daily') {
    return data;
  }

  // Monthly aggregation
  const monthlyData: Record<string, number> = {};

  data.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + item.count;
  });

  return Object.entries(monthlyData).map(([month, count]) => ({
    date: month,
    count
  }));
}
```

---

## Color Helper Functions

```typescript
function getSeverityColor(severity: string): string {
  const colors = {
    MILD: '#10b981',      // Green
    MODERATE: '#f59e0b',  // Yellow
    SEVERE: '#f97316',   // Orange
    CRITICAL: '#ef4444'   // Red
  };
  return colors[severity as keyof typeof colors] || '#6b7280';
}

function getDiagnosisColor(diagnosis: string): string {
  // Hash-based color generation for consistent colors
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const hash = diagnosis.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function getHealthIndexColor(index: number): string {
  if (index >= 80) return '#10b981';    // Green
  if (index >= 60) return '#f59e0b';    // Yellow
  return '#ef4444';                     // Red
}
```

---

## Error Handling

### API Error Response Format

```typescript
interface ApiError {
  detail: string;          // Human-readable error message
  code?: string;          // Error code for client handling
  errors?: Record<string, string[]>;  // Validation errors
}
```

### Error Handling Strategy

```typescript
async function fetchChartData<T>(
  endpoint: string,
  params: Record<string, any>
): Promise<T> {
  try {
    const response = await api.get<T>(endpoint, { params });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as ApiError;
      throw new Error(apiError?.detail || 'Failed to load chart data');
    }
    throw new Error('An unexpected error occurred');
  }
}
```

---

## Performance Considerations

### Request Optimization

1. **Caching:** Use React Query or SWR for data caching
2. **Debouncing:** Debounce date range picker changes
3. **Parallel Requests:** Fetch multiple endpoints in parallel when possible
4. **Request Cancellation:** Cancel pending requests on unmount

### Caching Strategy

```typescript
// Using React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['dashboard', period, dailyMonthly],
  queryFn: () => fetchDashboardData({ period, daily_monthly: dailyMonthly }),
  staleTime: 5 * 60 * 1000,  // 5 minutes
  cacheTime: 10 * 60 * 1000  // 10 minutes
});
```

---

**Phase 3 Output:** `docs/design/api-contract.md`

**✅ Phase 3 complete. Shall I continue to Phase 4 — Development? (yes/no)**
