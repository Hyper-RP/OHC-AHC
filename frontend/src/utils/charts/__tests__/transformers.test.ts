import { describe, it, expect } from 'vitest';
import {
  getSeverityColor,
  getDiagnosisColor,
  getHealthIndexColor,
  transformDashboardData,
  transformDepartmentStatsData,
  transformDiseaseTrendsData,
  aggregateByPeriod,
  calculatePercentage,
  validateDateRange,
  isDataEmpty,
  getMaxValue,
  getMinValue,
} from '../transformers';

describe('Chart Transformers - Color Helpers', () => {
  describe('getSeverityColor', () => {
    it('returns correct color for MILD', () => {
      expect(getSeverityColor('MILD')).toBe('#10b981');
    });

    it('returns correct color for MODERATE', () => {
      expect(getSeverityColor('MODERATE')).toBe('#f59e0b');
    });

    it('returns correct color for SEVERE', () => {
      expect(getSeverityColor('SEVERE')).toBe('#f97316');
    });

    it('returns correct color for CRITICAL', () => {
      expect(getSeverityColor('CRITICAL')).toBe('#ef4444');
    });

    it('returns default color for unknown severity', () => {
      expect(getSeverityColor('UNKNOWN')).toBe('#6b7280');
    });
  });

  describe('getDiagnosisColor', () => {
    it('returns consistent colors for same diagnosis', () => {
      const color1 = getDiagnosisColor('Fever');
      const color2 = getDiagnosisColor('Fever');
      expect(color1).toBe(color2);
    });

    it('returns different colors for different diagnoses', () => {
      const color1 = getDiagnosisColor('Fever');
      const color2 = getDiagnosisColor('Cough');
      expect(color1).not.toBe(color2);
    });

    it('returns valid hex color', () => {
      const color = getDiagnosisColor('Diagnosis');
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('getHealthIndexColor', () => {
    it('returns green for health index >= 80', () => {
      expect(getHealthIndexColor(80)).toBe('#10b981');
      expect(getHealthIndexColor(90)).toBe('#10b981');
    });

    it('returns yellow for health index 60-79', () => {
      expect(getHealthIndexColor(60)).toBe('#f59e0b');
      expect(getHealthIndexColor(79)).toBe('#f59e0b');
    });

    it('returns red for health index < 60', () => {
      expect(getHealthIndexColor(59)).toBe('#ef4444');
      expect(getHealthIndexColor(0)).toBe('#ef4444');
    });
  });
});

describe('Chart Transformers - Dashboard Data', () => {
  describe('transformDashboardData', () => {
    it('transforms dashboard API response correctly', () => {
      const apiResponse = {
        visit_trends: [
          { date: '2026-05-01', count: 10 },
          { date: '2026-05-02', count: 15 },
        ],
        department_comparison: [
          { department: 'Engineering', visits: 20, employees: 50, referrals: 5 },
        ],
        severity_breakdown: {
          MILD: 10,
          MODERATE: 5,
          SEVERE: 2,
          CRITICAL: 1,
        },
        common_diagnoses: [
          {
            diagnosis_name: 'Fever',
            count: 10,
            trend: [
              { date: '2026-05-01', count: 5 },
              { date: '2026-05-02', count: 5 },
            ],
          },
        ],
        recent_activity: [],
      };

      const result = transformDashboardData(apiResponse);

      expect(result.visitTrends).toHaveLength(2);
      expect(result.visitTrends[0].date).toBeInstanceOf(Date);
      expect(result.visitTrends[0].count).toBe(10);

      expect(result.departmentComparison).toHaveLength(1);
      expect(result.departmentComparison[0].department).toBe('Engineering');

      expect(result.severityBreakdown).toHaveLength(4);
      expect(result.severityBreakdown[0].severity).toBe('MILD');
      expect(result.severityBreakdown[0].color).toBe('#10b981');

      expect(result.diagnosisTrends).toHaveLength(1);
      expect(result.diagnosisTrends[0].diagnosis).toBe('Fever');
    });

    it('handles empty API response', () => {
      const apiResponse = {
        visit_trends: [],
        department_comparison: [],
        severity_breakdown: {},
        common_diagnoses: [],
        recent_activity: [],
      };

      const result = transformDashboardData(apiResponse);

      expect(result.visitTrends).toEqual([]);
      expect(result.departmentComparison).toEqual([]);
      expect(result.severityBreakdown).toEqual([]);
      expect(result.diagnosisTrends).toEqual([]);
    });
  });
});

describe('Chart Transformers - Department Stats Data', () => {
  describe('transformDepartmentStatsData', () => {
    it('transforms department stats API response correctly', () => {
      const apiResponse = {
        summary: {
          total_departments: 2,
          total_employees: 100,
          total_visits: 50,
          total_referrals: 10,
        },
        departments: [
          {
            department: 'Engineering',
            total_employees: 50,
            total_visits: 25,
            referred_cases: 5,
            unfit_employees: 2,
            health_index: 85,
          },
          {
            department: 'Sales',
            total_employees: 50,
            total_visits: 25,
            referred_cases: 5,
            unfit_employees: 3,
            health_index: 75,
          },
        ],
      };

      const result = transformDepartmentStatsData(apiResponse);

      expect(result.healthIndex).toHaveLength(2);
      expect(result.healthIndex[0].department).toBe('Engineering');
      expect(result.healthIndex[0].healthIndex).toBe(85);

      expect(result.visitsReferrals).toHaveLength(2);
      expect(result.visitsReferrals[0].department).toBe('Engineering');
      expect(result.visitsReferrals[0].visits).toBe(25);
    });

    it('handles empty departments array', () => {
      const apiResponse = {
        summary: {
          total_departments: 0,
          total_employees: 0,
          total_visits: 0,
          total_referrals: 0,
        },
        departments: [],
      };

      const result = transformDepartmentStatsData(apiResponse);

      expect(result.healthIndex).toEqual([]);
      expect(result.visitsReferrals).toEqual([]);
    });
  });
});

describe('Chart Transformers - Disease Trends Data', () => {
  describe('transformDiseaseTrendsData', () => {
    it('transforms disease trends API response correctly', () => {
      const apiResponse = {
        total_diagnoses: 20,
        period_start: '2026-04-01',
        period_end: '2026-05-01',
        trends: [
          {
            diagnosis_name: 'Fever',
            count: 10,
            severity: 'MILD',
            percentage: 50,
            change_from_previous: 5,
            trend_data: [
              { date: '2026-04-01', count: 5 },
              { date: '2026-05-01', count: 5 },
            ],
          },
        ],
        severity_breakdown: {
          MILD: 10,
          MODERATE: 5,
          SEVERE: 3,
          CRITICAL: 2,
        },
        severity_trends: {
          MILD: [
            { date: '2026-04-01', count: 5 },
            { date: '2026-05-01', count: 5 },
          ],
          MODERATE: [],
          SEVERE: [],
          CRITICAL: [],
        },
      };

      const result = transformDiseaseTrendsData(apiResponse);

      expect(result.diagnosisArea).toHaveLength(1);
      expect(result.diagnosisArea[0].diagnosis).toBe('Fever');
      expect(result.diagnosisArea[0].data[0].date).toBeInstanceOf(Date);

      expect(result.severityTrends).toHaveLength(4);
      expect(result.severityTrends[0].severity).toBe('MILD');
      expect(result.severityTrends[0].color).toBe('#10b981');
    });

    it('handles empty trends array', () => {
      const apiResponse = {
        total_diagnoses: 0,
        period_start: '2026-04-01',
        period_end: '2026-05-01',
        trends: [],
        severity_breakdown: {
          MILD: 0,
          MODERATE: 0,
          SEVERE: 0,
          CRITICAL: 0,
        },
        severity_trends: {
          MILD: [],
          MODERATE: [],
          SEVERE: [],
          CRITICAL: [],
        },
      };

      const result = transformDiseaseTrendsData(apiResponse);

      expect(result.diagnosisArea).toEqual([]);
      expect(result.severityTrends).toHaveLength(4);
    });
  });
});

describe('Chart Transformers - Aggregation Helpers', () => {
  describe('aggregateByPeriod', () => {
    it('returns same data for daily aggregation', () => {
      const data = [
        { date: new Date('2026-05-01'), count: 10 },
        { date: new Date('2026-05-02'), count: 15 },
      ];

      const result = aggregateByPeriod(data, 'daily');

      expect(result).toEqual(data);
    });

    it('aggregates data by month for monthly period', () => {
      const data = [
        { date: new Date('2026-05-01'), count: 10 },
        { date: new Date('2026-05-15'), count: 15 },
        { date: new Date('2026-06-01'), count: 20 },
      ];

      const result = aggregateByPeriod(data, 'monthly');

      expect(result).toHaveLength(2);
      expect(result[0].date).toEqual(new Date('2026-05-01'));
      expect(result[0].count).toBe(25); // 10 + 15
      expect(result[1].date).toEqual(new Date('2026-06-01'));
      expect(result[1].count).toBe(20);
    });
  });

  describe('calculatePercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(1, 3)).toBe(33.3);
      expect(calculatePercentage(50, 200)).toBe(25);
    });

    it('returns 0 for zero total', () => {
      expect(calculatePercentage(10, 0)).toBe(0);
    });

    it('returns 0 for zero value', () => {
      expect(calculatePercentage(0, 100)).toBe(0);
    });
  });
});

describe('Chart Transformers - Validation Helpers', () => {
  describe('validateDateRange', () => {
    it('returns true for valid date range', () => {
      expect(validateDateRange('2026-05-01', '2026-05-10')).toBe(true);
      expect(validateDateRange('2026-05-01', '2026-05-01')).toBe(true);
    });

    it('returns false for invalid date range (end before start)', () => {
      expect(validateDateRange('2026-05-10', '2026-05-01')).toBe(false);
    });

    it('returns false for invalid dates', () => {
      expect(validateDateRange('invalid', '2026-05-10')).toBe(false);
      expect(validateDateRange('2026-05-01', 'invalid')).toBe(false);
    });
  });

  describe('isDataEmpty', () => {
    it('returns true for empty array', () => {
      expect(isDataEmpty([])).toBe(true);
    });

    it('returns true for null or undefined', () => {
      expect(isDataEmpty(null as any)).toBe(true);
      expect(isDataEmpty(undefined as any)).toBe(true);
    });

    it('returns false for non-empty array', () => {
      expect(isDataEmpty([{ count: 1 }])).toBe(false);
    });
  });

  describe('getMaxValue', () => {
    it('returns maximum count from data', () => {
      const data = [
        { count: 10 },
        { count: 25 },
        { count: 15 },
      ];
      expect(getMaxValue(data)).toBe(25);
    });

    it('returns 0 for empty data', () => {
      expect(getMaxValue([])).toBe(0);
    });
  });

  describe('getMinValue', () => {
    it('returns minimum count from data', () => {
      const data = [
        { count: 10 },
        { count: 25 },
        { count: 5 },
      ];
      expect(getMinValue(data)).toBe(5);
    });

    it('returns 0 for empty data', () => {
      expect(getMinValue([])).toBe(0);
    });
  });
});
