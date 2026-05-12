import { describe, it, expect } from 'vitest';
import {
  transformEmployeeHealthHistory,
  transformVisitFrequency,
  transformVisitTypes,
  transformDiagnosisDistribution,
  transformSeverityBreakdown,
  calculateHealthScore,
  SEVERITY_COLORS,
  DIAGNOSIS_COLORS,
} from '../employee-health-transformers';

describe('Employee Health Transformers', () => {
  describe('transformVisitFrequency', () => {
    it('should group visits by date in daily mode', () => {
      const visits = [
        { visit_date: '2026-05-01T10:00:00Z' },
        { visit_date: '2026-05-01T14:00:00Z' },
        { visit_date: '2026-05-02T09:00:00Z' },
      ];

      const result = transformVisitFrequency(visits, 'daily');

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('May 01');
      expect(result[0].count).toBe(2);
      expect(result[1].date).toBe('May 02');
      expect(result[1].count).toBe(1);
    });

    it('should group visits by month in monthly mode', () => {
      const visits = [
        { visit_date: '2026-04-15T10:00:00Z' },
        { visit_date: '2026-04-20T10:00:00Z' },
        { visit_date: '2026-05-01T09:00:00Z' },
      ];

      const result = transformVisitFrequency(visits, 'monthly');

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('Apr 2026');
      expect(result[0].count).toBe(2);
      expect(result[1].date).toBe('May 2026');
      expect(result[1].count).toBe(1);
    });

    it('should return empty array for no visits', () => {
      const result = transformVisitFrequency([], 'daily');
      expect(result).toEqual([]);
    });
  });

  describe('transformVisitTypes', () => {
    it('should count visits by type', () => {
      const visits = [
        { visit_type: 'ROUTINE' },
        { visit_type: 'WALK_IN' },
        { visit_type: 'FOLLOW_UP' },
        { visit_type: 'ROUTINE' },
        { visit_type: 'WALK_IN' },
      ];

      const result = transformVisitTypes(visits);

      expect(result).toHaveLength(3);
      expect(result.find((r) => r.type === 'Routine')?.count).toBe(2);
      expect(result.find((r) => r.type === 'Walk-in')?.count).toBe(2);
      expect(result.find((r) => r.type === 'Follow-up')?.count).toBe(1);
    });

    it('should calculate percentages correctly', () => {
      const visits = [
        { visit_type: 'ROUTINE' },
        { visit_type: 'ROUTINE' },
        { visit_type: 'WALK_IN' },
      ];

      const result = transformVisitTypes(visits);

      expect(result.find((r) => r.type === 'Routine')?.percentage).toBe(67);
      expect(result.find((r) => r.type === 'Walk-in')?.percentage).toBe(33);
    });
  });

  describe('transformDiagnosisDistribution', () => {
    it('should extract top diagnoses', () => {
      const visits = [
        {
          diagnoses: [
            { diagnosis_name: 'Fever' },
            { diagnosis_name: 'Cold' },
            { diagnosis_name: 'Fever' },
          ],
        },
        {
          diagnoses: [
            { diagnosis_name: 'Headache' },
            { diagnosis_name: 'Fever' },
          ],
        },
      ];

      const result = transformDiagnosisDistribution(visits, 2);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Fever');
      expect(result[0].count).toBe(3);
      expect(result[1].name).toBe('Headache');
      expect(result[1].count).toBe(1);
      expect(result[2].name).toBe('Other');
      expect(result[2].count).toBe(1);
    });

    it('should assign colors from palette', () => {
      const visits = [
        { diagnoses: [{ diagnosis_name: 'Test A' }] },
        { diagnoses: [{ diagnosis_name: 'Test B' }] },
      ];

      const result = transformDiagnosisDistribution(visits, 5);

      expect(result[0].color).toBe(DIAGNOSIS_COLORS[0]);
      expect(result[1].color).toBe(DIAGNOSIS_COLORS[1]);
    });
  });

  describe('transformSeverityBreakdown', () => {
    it('should count diagnoses by severity', () => {
      const visits = [
        { diagnoses: [{ severity: 'MILD' }] },
        { diagnoses: [{ severity: 'MILD' }, { severity: 'MILD' }] },
        { diagnoses: [{ severity: 'MODERATE' }] },
        { diagnoses: [{ severity: 'SERIOUS' }] },
        { diagnoses: [] },
      ];

      const result = transformSeverityBreakdown(visits);

      expect(result).toHaveLength(4);
      expect(result.find((r) => r.severity === 'MILD')?.count).toBe(3);
      expect(result.find((r) => r.severity === 'MODERATE')?.count).toBe(1);
      expect(result.find((r) => r.severity === 'SERIOUS')?.count).toBe(1);
      expect(result.find((r) => r.severity === 'CRITICAL')?.count).toBe(0);
    });

    it('should assign correct severity colors', () => {
      const visits = [
        { diagnoses: [{ severity: 'MILD' }] },
        { diagnoses: [{ severity: 'MODERATE' }] },
        { diagnoses: [{ severity: 'SERIOUS' }] },
        { diagnoses: [{ severity: 'CRITICAL' }] },
      ];

      const result = transformSeverityBreakdown(visits);

      expect(result.find((r) => r.severity === 'MILD')?.color).toBe(SEVERITY_COLORS.MILD);
      expect(result.find((r) => r.severity === 'MODERATE')?.color).toBe(SEVERITY_COLORS.MODERATE);
      expect(result.find((r) => r.severity === 'SERIOUS')?.color).toBe(SEVERITY_COLORS.SERIOUS);
      expect(result.find((r) => r.severity === 'CRITICAL')?.color).toBe(SEVERITY_COLORS.CRITICAL);
    });
  });

  describe('calculateHealthScore', () => {
    it('should return high score for FIT status', () => {
      const score = calculateHealthScore([], 'FIT');
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('should return lower score for UNFIT status', () => {
      const score = calculateHealthScore([], 'UNFIT');
      expect(score).toBeLessThan(50);
    });

    it('should deduct points for severity', () => {
      const visits = [
        {
          visit_date: new Date().toISOString(),
          diagnoses: [{ severity: 'CRITICAL' }],
        },
      ];

      const score = calculateHealthScore(visits, 'FIT');
      const baseScore = calculateHealthScore([], 'FIT');

      expect(score).toBeLessThan(baseScore);
    });

    it('should clamp score between 0 and 100', () => {
      const score = calculateHealthScore(
        Array(50).fill({ diagnoses: [{ severity: 'CRITICAL' }] }),
        'FIT'
      );
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('transformEmployeeHealthHistory', () => {
    it('should transform all data sections', () => {
      const apiData = {
        employee: {
          employee_code: 'EMP-001',
          user: { first_name: 'John', last_name: 'Doe' },
          department: 'Engineering',
          designation: 'Developer',
          fitness_status: 'FIT',
        },
        visits: [
          {
            visit_date: '2026-05-01T10:00:00Z',
            visit_type: 'ROUTINE',
            diagnoses: [{ diagnosis_name: 'Fever', severity: 'MILD' }],
          },
        ],
      };

      const result = transformEmployeeHealthHistory(apiData, 'daily');

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('visitFrequency');
      expect(result).toHaveProperty('visitTypes');
      expect(result).toHaveProperty('diagnosisDistribution');
      expect(result).toHaveProperty('severityBreakdown');
      expect(result).toHaveProperty('healthIndexTrend');
    });

    it('should transform summary correctly', () => {
      const apiData = {
        employee: {
          employee_code: 'EMP-001',
          user: { first_name: 'John', last_name: 'Doe' },
          department: 'Engineering',
          designation: 'Developer',
          fitness_status: 'FIT',
        },
        visits: [
          { visit_date: '2026-05-01T10:00:00Z' },
          { visit_date: '2026-04-01T10:00:00Z' },
        ],
      };

      const result = transformEmployeeHealthHistory(apiData, 'daily');

      expect(result.summary.employeeName).toBe('John Doe');
      expect(result.summary.department).toBe('Engineering');
      expect(result.summary.designation).toBe('Developer');
      expect(result.summary.fitnessStatus).toBe('FIT');
      expect(result.summary.totalVisits).toBe(2);
    });
  });
});
