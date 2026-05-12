# Graphical Dashboard — Data Model

**Project:** OHC-AHC Dashboard Redesign - Graphical Dashboard
**Date:** 2026-05-11
**Status:** In Progress

---

## TypeScript Type Definitions

### Chart Data Types

```typescript
// ============================================================================
// Core Chart Types
// ============================================================================

/**
 * Data point for time-series charts
 */
interface TimeSeriesDataPoint {
  date: Date;
  count: number;
}

/**
 * Data point for bar/line charts
 */
interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;  // Additional metadata
}

/**
 * Data point for pie/donut charts
 */
interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

/**
 * Data point for multi-series charts
 */
interface SeriesDataPoint {
  date: Date;
  value: number;
  [key: string]: any;  // Additional series-specific data
}

// ============================================================================
// Dashboard Chart Types
// ============================================================================

/**
 * Visit trends data for line chart
 */
interface VisitTrendData {
  date: Date;
  count: number;
}

/**
 * Department comparison data for bar chart
 */
interface DepartmentComparisonData {
  department: string;
  visits: number;
  employees: number;
  referrals: number;
}

/**
 * Severity breakdown data for pie/donut chart
 */
interface SeverityData {
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  count: number;
  color: string;
  percentage?: number;
}

/**
 * Diagnosis trend data for multi-line chart
 */
interface DiagnosisTrendData {
  diagnosis: string;
  data: TimeSeriesDataPoint[];
  color: string;
}

/**
 * Complete dashboard chart data
 */
interface DashboardChartData {
  visitTrends: VisitTrendData[];
  departmentComparison: DepartmentComparisonData[];
  severityBreakdown: SeverityData[];
  diagnosisTrends: DiagnosisTrendData[];
}

// ============================================================================
// Department Stats Chart Types
// ============================================================================

/**
 * Health index data for gauge chart
 */
interface HealthIndexData {
  department: string;
  healthIndex: number;  // 0-100
  visits: number;
  referrals: number;
  unfit: number;
  employees: number;
}

/**
 * Visits vs referrals data for stacked bar chart
 */
interface VisitsReferralsData {
  department: string;
  visits: number;
  referrals: number;
}

/**
 * Complete department stats chart data
 */
interface DepartmentStatsChartData {
  healthIndex: HealthIndexData[];
  visitsReferrals: VisitsReferralsData[];
}

// ============================================================================
// Disease Trends Chart Types
// ============================================================================

/**
 * Diagnosis area chart data
 */
interface DiagnosisAreaData {
  diagnosis: string;
  data: TimeSeriesDataPoint[];
  color: string;
  severity?: string;
}

/**
 * Severity trend data for line chart
 */
interface SeverityTrendData {
  severity: string;
  data: TimeSeriesDataPoint[];
  color: string;
}

/**
 * Complete disease trends chart data
 */
interface DiseaseTrendsChartData {
  diagnosisArea: DiagnosisAreaData[];
  severityTrends: SeverityTrendData[];
}

// ============================================================================
// Control Types
// ============================================================================

/**
 * Period options for charts
 */
type PeriodOption = 7 | 30 | 90 | 180 | 365;

/**
 * Daily/Monthly toggle option
 */
type AggregationLevel = 'daily' | 'monthly';

/**
 * Date range for custom filtering
 */
interface DateRange {
  start: string;  // YYYY-MM-DD
  end: string;    // YYYY-MM-DD
}

/**
 * Export format options
 */
type ExportFormat = 'png' | 'svg' | 'csv' | 'pdf';

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for ChartContainer component
 */
interface ChartContainerProps {
  title: string;
  description?: string;
  loading: boolean;
  error: string | null;
  empty: boolean;
  onExport?: (format: ExportFormat) => void;
  exportFormats?: ExportFormat[];
  children: React.ReactNode;
  className?: string;
}

/**
 * Props for ChartControls component
 */
interface ChartControlsProps {
  period: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
  dailyMonthly: AggregationLevel;
  onDailyMonthlyChange: (level: AggregationLevel) => void;
  dateRange?: DateRange | null;
  onDateRangeChange?: (range: DateRange) => void;
  onApplyDateRange?: () => void;
  onExport?: (format: ExportFormat) => void;
  showDateRangePicker?: boolean;
  showExport?: boolean;
}

/**
 * Props for VisitTrendsChart component
 */
interface VisitTrendsChartProps {
  data: VisitTrendData[];
  loading: boolean;
  height?: number;
}

/**
 * Props for DepartmentComparisonChart component
 */
interface DepartmentComparisonChartProps {
  data: DepartmentComparisonData[];
  sortBy?: 'department' | 'visits' | 'referrals';
  sortOrder?: 'asc' | 'desc';
  loading: boolean;
  height?: number;
}

/**
 * Props for SeverityPieChart component
 */
interface SeverityPieChartProps {
  data: SeverityData[];
  loading: boolean;
  showTotal?: boolean;
  height?: number;
}

/**
 * Props for DiagnosisTrendLineChart component
 */
interface DiagnosisTrendLineChartProps {
  data: DiagnosisTrendData[];
  loading: boolean;
  showLegend?: boolean;
  height?: number;
}

/**
 * Props for HealthIndexGauge component
 */
interface HealthIndexGaugeProps {
  data: HealthIndexData;
  size?: number;
  showLabel?: boolean;
  animate?: boolean;
}

/**
 * Props for VisitsReferralsStackedBar component
 */
interface VisitsReferralsStackedBarProps {
  data: VisitsReferralsData[];
  loading: boolean;
  height?: number;
}

/**
 * Props for DiagnosisAreaChart component
 */
interface DiagnosisAreaChartProps {
  data: DiagnosisAreaData[];
  loading: boolean;
  showLegend?: boolean;
  height?: number;
}

/**
 * Props for SeverityTrendChart component
 */
interface SeverityTrendChartProps {
  data: SeverityTrendData[];
  loading: boolean;
  showLegend?: boolean;
  height?: number;
}

// ============================================================================
// State Types
// ============================================================================

/**
 * Global chart state for a page
 */
interface ChartState {
  period: PeriodOption;
  dailyMonthly: AggregationLevel;
  dateRange: DateRange | null;
  data: any;  // Specific chart data type
  loading: boolean;
  error: string | null;
}

/**
 * API response types (from backend)
 */

/**
 * Dashboard API response
 */
interface DashboardApiResponse {
  visit_trends: Array<{ date: string; count: number }>;
  department_comparison: Array<{
    department: string;
    visits: number;
    employees: number;
    referrals: number;
  }>;
  severity_breakdown: {
    MILD: number;
    MODERATE: number;
    SEVERE: number;
    CRITICAL: number;
  };
  common_diagnoses: Array<{
    diagnosis_name: string;
    count: number;
    trend: Array<{ date: string; count: number }>;
  }>;
  recent_activity: Array<{
    type: string;
    employee_id: string;
    employee_name: string;
    details: string;
    timestamp: string;
  }>;
}

/**
 * Disease trends API response
 */
interface DiseaseTrendsApiResponse {
  total_diagnoses: number;
  period_start: string;
  period_end: string;
  trends: Array<{
    diagnosis_name: string;
    count: number;
    severity: string;
    percentage: number;
    change_from_previous: number;
    trend_data: Array<{ date: string; count: number }>;
  }>;
  severity_breakdown: {
    MILD: number;
    MODERATE: number;
    SEVERE: number;
    CRITICAL: number;
  };
  severity_trends: {
    MILD: Array<{ date: string; count: number }>;
    MODERATE: Array<{ date: string; count: number }>;
    SEVERE: Array<{ date: string; count: number }>;
    CRITICAL: Array<{ date: string; count: number }>;
  };
}

/**
 * Department stats API response
 */
interface DepartmentStatsApiResponse {
  summary: {
    total_departments: number;
    total_employees: number;
    total_visits: number;
    total_referrals: number;
  };
  departments: Array<{
    department: string;
    total_employees: number;
    total_visits: number;
    referred_cases: number;
    unfit_employees: number;
    health_index: number;
    visit_trend: Array<{
      date: string;
      visits: number;
      referrals: number;
    }>;
  }>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Chart export options
 */
interface ChartExportOptions {
  format: ExportFormat;
  filename?: string;
  backgroundColor?: string;
  scale?: number;  // For PNG resolution
}

/**
 * Chart color palette
 */
interface ChartColors {
  primary: string;
  secondary: string;
  tertiary: string;
  danger: string;
  success: string;
  warning: string;
  purple: string;
  cyan: string;
}

/**
 * Chart configuration
 */
interface ChartConfig {
  animation: boolean;
  animationDuration: number;
  responsive: boolean;
  maintainAspectRatio: boolean;
  showTooltips: boolean;
  showLegend: boolean;
}
```

---

## Type Exports

```typescript
// Export all types for use in components
export type {
  TimeSeriesDataPoint,
  ChartDataPoint,
  PieDataPoint,
  SeriesDataPoint,
  VisitTrendData,
  DepartmentComparisonData,
  SeverityData,
  DiagnosisTrendData,
  DashboardChartData,
  HealthIndexData,
  VisitsReferralsData,
  DepartmentStatsChartData,
  DiagnosisAreaData,
  SeverityTrendData,
  DiseaseTrendsChartData,
  PeriodOption,
  AggregationLevel,
  DateRange,
  ExportFormat,
  ChartContainerProps,
  ChartControlsProps,
  VisitTrendsChartProps,
  DepartmentComparisonChartProps,
  SeverityPieChartProps,
  DiagnosisTrendLineChartProps,
  HealthIndexGaugeProps,
  VisitsReferralsStackedBarProps,
  DiagnosisAreaChartProps,
  SeverityTrendChartProps,
  ChartState,
  DashboardApiResponse,
  DiseaseTrendsApiResponse,
  DepartmentStatsApiResponse,
  ChartExportOptions,
  ChartColors,
  ChartConfig
};
```

---

**Phase 3 Output:** `docs/design/data-model.md`

**✅ Phase 3 complete. Shall I continue to Phase 4 — Development? (yes/no)**
