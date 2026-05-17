import { format, parseISO, differenceInDays, subDays } from 'date-fns';

/**
 * Chart data types for Employee Health History
 */

export interface VisitFrequencyData {
  date: string;
  fullDate: string;
  count: number;
}

export interface VisitTypeData {
  type: 'Routine' | 'Walk-in' | 'Follow-up';
  count: number;
  percentage: number;
}

export interface DiagnosisDistributionData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface SeverityBreakdownData {
  severity: 'MILD' | 'MODERATE' | 'SERIOUS' | 'CRITICAL';
  count: number;
  color: string;
}

export interface HealthIndexTrendData {
  date: string;
  fullDate: string;
  healthIndex: number;
  status: 'good' | 'warning' | 'concern';
}

export interface QuickStatsData {
  totalVisits: number;
  avgRecoveryTime: number;
  fitnessTrend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

export interface TransformedChartData {
  summary: {
    employeeName: string;
    department: string;
    designation: string;
    fitnessStatus: string;
    healthScore: number;
    totalVisits: number;
    avgRecoveryTime: number;
    fitnessTrend: QuickStatsData['fitnessTrend'];
  };
  visitFrequency: VisitFrequencyData[];
  visitTypes: VisitTypeData[];
  diagnosisDistribution: DiagnosisDistributionData[];
  severityBreakdown: SeverityBreakdownData[];
  healthIndexTrend: HealthIndexTrendData[];
}

// Color palettes
export const DIAGNOSIS_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#f97316',
] as const;

export const SEVERITY_COLORS: Record<string, string> = {
  MILD: '#10b981',
  MODERATE: '#f59e0b',
  SERIOUS: '#f97316',
  CRITICAL: '#ef4444',
} as const;

export const CHART_COLORS = DIAGNOSIS_COLORS;

/**
 * Transform raw API data into chart-ready format
 */
export function transformEmployeeHealthHistory(
  apiData: any,
  dailyMonthly: 'daily' | 'monthly'
): TransformedChartData {
  const { visits } = apiData;

  return {
    summary: transformSummary(apiData),
    visitFrequency: transformVisitFrequency(visits, dailyMonthly),
    visitTypes: transformVisitTypes(visits),
    diagnosisDistribution: transformDiagnosisDistribution(visits, 5),
    severityBreakdown: transformSeverityBreakdown(visits),
    healthIndexTrend: transformHealthIndexTrend(visits, dailyMonthly),
  };
}

/**
 * Transform summary data
 */
function transformSummary(apiData: any) {
  const { employee, visits } = apiData;

  const healthScore = calculateHealthScore(visits, employee.fitness_status);
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

/**
 * Calculate health score (0-100)
 */
export function calculateHealthScore(visits: any[], fitnessStatus: string): number {
  let score = 100;

  // Base score from fitness status
  switch (fitnessStatus) {
    case 'FIT':
      score = 90;
      break;
    case 'TEMPORARY_UNFIT':
      score = 70;
      break;
    case 'UNDER_OBSERVATION':
      score = 60;
      break;
    case 'UNFIT':
      score = 30;
      break;
  }

  // Adjust based on recent visits (last 90 days)
  const now = new Date();
  const recentVisits = visits.filter((v) => {
    const visitDate = parseISO(v.visit_date);
    return differenceInDays(now, visitDate) <= 90;
  });

  const severityDeductions = recentVisits.reduce((sum, visit) => {
    const maxSeverity = getMaxSeverityFromDiagnoses(visit.diagnoses);
    switch (maxSeverity) {
      case 'CRITICAL':
        return sum - 15;
      case 'SERIOUS':
        return sum - 10;
      case 'MODERATE':
        return sum - 5;
      case 'MILD':
        return sum - 2;
      default:
        return sum;
    }
  }, 0);

  score += severityDeductions;
  return Math.max(0, Math.min(100, score));
}

/**
 * Get maximum severity from diagnoses array
 */
function getMaxSeverityFromDiagnoses(diagnoses: any[]): string {
  if (!diagnoses || diagnoses.length === 0) return 'MILD';

  const severityOrder = ['CRITICAL', 'SERIOUS', 'MODERATE', 'MILD'];
  const severities = diagnoses.map((d) => d.severity).filter(Boolean);

  for (const level of severityOrder) {
    if (severities.includes(level)) return level;
  }

  return 'MILD';
}

/**
 * Calculate average recovery time in days
 */
function calculateAvgRecoveryTime(visits: any[]): number {
  if (visits.length < 2) return 0;

  const sorted = [...visits].sort(
    (a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
  );

  let totalDays = 0;
  for (let i = 1; i < sorted.length; i++) {
    const days = differenceInDays(
      parseISO(sorted[i].visit_date),
      parseISO(sorted[i - 1].visit_date)
    );
    totalDays += days;
  }

  return Math.round(totalDays / (sorted.length - 1));
}

/**
 * Calculate fitness trend
 */
function calculateFitnessTrend(visits: any[]): QuickStatsData['fitnessTrend'] {
  const now = new Date();
  const recentStart = subDays(now, 30);
  const previousEnd = recentStart;
  const previousStart = subDays(previousEnd, 30);

  const recentVisits = visits.filter((v) => {
    const visitDate = parseISO(v.visit_date);
    return visitDate >= recentStart && visitDate <= now;
  });
  const previousVisits = visits.filter((v) => {
    const visitDate = parseISO(v.visit_date);
    return visitDate >= previousStart && visitDate < recentStart;
  });

  const recentAvg = calculateHealthScore(recentVisits, 'FIT');
  const previousAvg = calculateHealthScore(previousVisits, 'FIT');

  const diff = recentAvg - previousAvg;
  const percentage = previousAvg > 0 ? (diff / previousAvg) * 100 : 0;

  if (percentage > 5) return { direction: 'up' as const, percentage: Math.abs(percentage) };
  if (percentage < -5) return { direction: 'down' as const, percentage: Math.abs(percentage) };
  return { direction: 'stable' as const, percentage: Math.abs(percentage) };
}

/**
 * Transform visit frequency data
 */
export function transformVisitFrequency(
  visits: any[],
  dailyMonthly: 'daily' | 'monthly'
): VisitFrequencyData[] {
  const grouped: Record<string, number> = {};

  visits.forEach((visit) => {
    const date = parseISO(visit.visit_date);
    let key: string;

    if (dailyMonthly === 'daily') {
      key = date.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    grouped[key] = (grouped[key] || 0) + 1;
  });

  return Object.entries(grouped)
    .map(([date, count]) => ({
      date: dailyMonthly === 'daily' ? format(parseISO(date), 'MMM dd') : format(parseISO(date), 'MMM yyyy'),
      fullDate: date,
      count,
    }))
    .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
}

/**
 * Transform visit types data
 */
export function transformVisitTypes(visits: any[]): VisitTypeData[] {
  const counts: Record<string, number> = {
    Routine: 0,
    'Walk-in': 0,
    'Follow-up': 0,
  };

  visits.forEach((visit) => {
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

/**
 * Map API visit type to display type
 */
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

/**
 * Transform diagnosis distribution data
 */
export function transformDiagnosisDistribution(
  visits: any[],
  maxItems: number = 5
): DiagnosisDistributionData[] {
  const counts: Record<string, number> = {};

  visits.forEach((visit) => {
    visit.diagnoses?.forEach((diagnosis: any) => {
      const name = diagnosis.diagnosis_name;
      counts[name] = (counts[name] || 0) + 1;
    });
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const totalVisits = visits.reduce((sum, v) => sum + (v.diagnoses?.length || 0), 0);

  const topItems = sorted.slice(0, maxItems);
  const otherCount = sorted.slice(maxItems).reduce((sum, [, count]) => sum + count, 0);

  const result: DiagnosisDistributionData[] = topItems.map(([name, count], index) => ({
    name,
    count,
    percentage: totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0,
    color: DIAGNOSIS_COLORS[index % DIAGNOSIS_COLORS.length],
  }));

  if (otherCount > 0) {
    result.push({
      name: 'Other',
      count: otherCount,
      percentage: totalVisits > 0 ? Math.round((otherCount / totalVisits) * 100) : 0,
      color: '#9ca3af',
    });
  }

  return result;
}

/**
 * Transform severity breakdown data
 */
export function transformSeverityBreakdown(visits: any[]): SeverityBreakdownData[] {
  const counts: Record<string, number> = {
    MILD: 0,
    MODERATE: 0,
    SERIOUS: 0,
    CRITICAL: 0,
  };

  visits.forEach((visit) => {
    visit.diagnoses?.forEach((diagnosis: any) => {
      const severity = diagnosis.severity;
      if (severity) {
        counts[severity] = (counts[severity] || 0) + 1;
      }
    });
  });

  const severityOrder: Array<keyof typeof counts> = ['MILD', 'MODERATE', 'SERIOUS', 'CRITICAL'];
  return severityOrder.map((severity) => ({
    severity,
    count: counts[severity],
    color: SEVERITY_COLORS[severity],
  })) as SeverityBreakdownData[];
}

/**
 * Transform health index trend data
 */
function transformHealthIndexTrend(
  visits: any[],
  dailyMonthly: 'daily' | 'monthly'
): HealthIndexTrendData[] {
  const groupedVisits: Record<string, any[]> = {};

  visits.forEach((visit) => {
    const date = parseISO(visit.visit_date);
    let key: string;

    if (dailyMonthly === 'daily') {
      key = date.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    groupedVisits[key] = groupedVisits[key] || [];
    groupedVisits[key].push(visit);
  });

  const result: HealthIndexTrendData[] = [];
  const sortedKeys = Object.keys(groupedVisits).sort();

  sortedKeys.forEach((dateKey) => {
    const periodDate = parseISO(dateKey);

    const contextVisits = visits.filter((visit) => {
      const visitDate = parseISO(visit.visit_date);
      const daysDiff = differenceInDays(periodDate, visitDate);
      return daysDiff >= 0 && daysDiff <= 30;
    });

    const healthIndex = calculateHealthScore(contextVisits, 'FIT');
    const status = healthIndex >= 80 ? 'good' : healthIndex >= 60 ? 'warning' : 'concern';

    result.push({
      date: dailyMonthly === 'daily' ? format(periodDate, 'MMM dd') : format(periodDate, 'MMM yyyy'),
      fullDate: dateKey,
      healthIndex: Math.round(healthIndex),
      status,
    });
  });

  return result;
}
