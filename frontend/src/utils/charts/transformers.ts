/**
 * Chart data transformation utilities
 * Converts API responses to chart-compatible data formats
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface VisitTrendData {
  date: Date;
  count: number;
}

export interface DepartmentComparisonData {
  department: string;
  visits: number;
  employees: number;
  referrals: number;
}

export interface SeverityData {
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  count: number;
  color: string;
  percentage?: number;
}

export interface DiagnosisTrendData {
  diagnosis: string;
  data: VisitTrendData[];
  color: string;
}

export interface HealthIndexData {
  department: string;
  healthIndex: number;
  visits: number;
  referrals: number;
  unfit: number;
  employees: number;
}

export interface VisitsReferralsData {
  department: string;
  visits: number;
  referrals: number;
}

export interface DiagnosisAreaData {
  diagnosis: string;
  data: VisitTrendData[];
  color: string;
  severity?: string;
}

export interface SeverityTrendData {
  severity: string;
  data: VisitTrendData[];
  color: string;
}

// ============================================================================
// Color Helpers
// ============================================================================

const SEVERITY_COLORS: Record<string, string> = {
  MILD: '#10b981',
  MODERATE: '#f59e0b',
  SEVERE: '#f97316',
  CRITICAL: '#ef4444',
};

const DIAGNOSIS_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

/**
 * Get color for severity level
 */
export function getSeverityColor(severity: string): string {
  return SEVERITY_COLORS[severity] || '#6b7280';
}

/**
 * Get color for diagnosis (consistent based on name)
 */
export function getDiagnosisColor(diagnosis: string): string {
  // Hash-based color generation for consistency
  const hash = diagnosis.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DIAGNOSIS_COLORS[hash % DIAGNOSIS_COLORS.length];
}

/**
 * Get color for health index
 */
export function getHealthIndexColor(index: number): string {
  if (index >= 80) return '#10b981'; // Green
  if (index >= 60) return '#f59e0b'; // Yellow
  return '#ef4444'; // Red
}

// ============================================================================
// Dashboard Data Transformers
// ============================================================================

/**
 * Transform dashboard API response to chart data
 */
export function transformDashboardData(apiResponse: any): {
  visitTrends: VisitTrendData[];
  departmentComparison: DepartmentComparisonData[];
  severityBreakdown: SeverityData[];
  diagnosisTrends: DiagnosisTrendData[];
} {
  const visitTrends: VisitTrendData[] = (apiResponse.visit_trends || []).map(
    (item: any) => ({
      date: new Date(item.date),
      count: item.count,
    })
  );

  const departmentComparison: DepartmentComparisonData[] = (
    apiResponse.department_comparison || []
  ).map((item: any) => ({
    department: item.department,
    visits: item.visits,
    employees: item.employees,
    referrals: item.referrals,
  }));

  const severityBreakdown: SeverityData[] = Object.entries(
    apiResponse.severity_breakdown || {}
  ).map(([severity, count]: [string, any]) => ({
    severity: severity as any,
    count: count as number,
    color: getSeverityColor(severity),
  }));

  const diagnosisTrends: DiagnosisTrendData[] = (
    apiResponse.common_diagnoses || []
  )
    .slice(0, 5)
    .map((item: any) => ({
      diagnosis: item.diagnosis_name,
      data: (item.trend || []).map((t: any) => ({
        date: new Date(t.date),
        count: t.count,
      })),
      color: getDiagnosisColor(item.diagnosis_name),
    }));

  return {
    visitTrends,
    departmentComparison,
    severityBreakdown,
    diagnosisTrends,
  };
}

// ============================================================================
// Department Stats Data Transformers
// ============================================================================

/**
 * Transform department stats API response to chart data
 */
export function transformDepartmentStatsData(apiResponse: any): {
  healthIndex: HealthIndexData[];
  visitsReferrals: VisitsReferralsData[];
} {
  const healthIndex: HealthIndexData[] = (apiResponse.departments || []).map(
    (dept: any) => ({
      department: dept.department,
      healthIndex: dept.health_index,
      visits: dept.total_visits,
      referrals: dept.referred_cases,
      unfit: dept.unfit_employees,
      employees: dept.total_employees,
    })
  );

  const visitsReferrals: VisitsReferralsData[] = (apiResponse.departments || []).map(
    (dept: any) => ({
      department: dept.department,
      visits: dept.total_visits,
      referrals: dept.referred_cases,
    })
  );

  return {
    healthIndex,
    visitsReferrals,
  };
}

// ============================================================================
// Disease Trends Data Transformers
// ============================================================================

/**
 * Transform disease trends API response to chart data
 */
export function transformDiseaseTrendsData(apiResponse: any): {
  diagnosisArea: DiagnosisAreaData[];
  severityTrends: SeverityTrendData[];
} {
  const diagnosisArea: DiagnosisAreaData[] = (apiResponse.trends || [])
    .slice(0, 5)
    .map((item: any) => ({
      diagnosis: item.diagnosis_name,
      data: (item.trend_data || []).map((t: any) => ({
        date: new Date(t.date),
        count: t.count,
      })),
      color: getDiagnosisColor(item.diagnosis_name),
      severity: item.severity,
    }));

  const severityTrends: SeverityTrendData[] = Object.entries(
    apiResponse.severity_trends || {}
  ).map(([severity, data]: [string, any]) => ({
    severity,
    data: (data || []).map((t: any) => ({
      date: new Date(t.date),
      count: t.count,
    })),
    color: getSeverityColor(severity),
  }));

  return {
    diagnosisArea,
    severityTrends,
  };
}

// ============================================================================
// Data Aggregation Helpers
// ============================================================================

/**
 * Aggregate data by period (daily/monthly)
 */
export function aggregateByPeriod(
  data: Array<{ date: Date; count: number }>,
  period: 'daily' | 'monthly'
): Array<{ date: Date; count: number }> {
  if (period === 'daily') {
    return data;
  }

  // Monthly aggregation
  const monthlyData: Record<string, number> = {};

  data.forEach((item) => {
    const date = item.date;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + item.count;
  });

  return Object.entries(monthlyData).map(([month, count]) => ({
    date: new Date(`${month}-01`),
    count,
  }));
}

/**
 * Calculate percentage from total
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 10) / 10; // Round to 1 decimal
}

// ============================================================================
// Data Validation Helpers
// ============================================================================

/**
 * Validate date range
 */
export function validateDateRange(start: string, end: string): boolean {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return false;
  }

  return startDate <= endDate;
}

/**
 * Check if data is empty
 */
export function isDataEmpty<T>(data: T[]): boolean {
  return !data || data.length === 0;
}

/**
 * Get max value from data
 */
export function getMaxValue<T extends { count: number }>(data: T[]): number {
  if (isDataEmpty(data)) return 0;
  return Math.max(...data.map((item) => item.count));
}

/**
 * Get min value from data
 */
export function getMinValue<T extends { count: number }>(data: T[]): number {
  if (isDataEmpty(data)) return 0;
  return Math.min(...data.map((item) => item.count));
}
