import { describe, it, expect } from 'vitest';
import {
  validateDiagnosisForm,
  validatePrescription,
  validatePrescriptions,
  getFieldError,
  getAllErrors,
} from '../errorHandling';

describe('Error Handling Utilities', () => {
  describe('validateDiagnosisForm', () => {
    it('returns valid when all required fields are present', () => {
      const result = validateDiagnosisForm({
        diagnosisName: 'Headache',
        diagnosisCode: 'R51',
        diagnosisNotes: 'Patient reports mild headache',
        severity: 'MILD',
        fitnessDecision: 'FIT',
        advisedRestDays: 2,
        workRestrictions: 'Avoid heavy lifting',
        followUpDate: '2026-06-01',
        requiresReferral: false,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns error when diagnosis name is empty', () => {
      const result = validateDiagnosisForm({
        diagnosisName: '  ',
        diagnosisCode: 'R51',
        diagnosisNotes: 'Notes',
        severity: 'MILD',
        fitnessDecision: 'FIT',
        advisedRestDays: 2,
        workRestrictions: '',
        followUpDate: '',
        requiresReferral: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'diagnosisName', message: expect.any(String) })
      );
    });

    it('returns error when diagnosis name exceeds max length', () => {
      const result = validateDiagnosisForm({
        diagnosisName: 'A'.repeat(256),
        diagnosisCode: 'R51',
        diagnosisNotes: 'Notes',
        severity: 'MILD',
        fitnessDecision: 'FIT',
        advisedRestDays: 2,
        workRestrictions: '',
        followUpDate: '',
        requiresReferral: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'diagnosisName', message: 'Diagnosis name cannot exceed 255 characters' })
      );
    });

    it('returns error when diagnosis code exceeds max length', () => {
      const result = validateDiagnosisForm({
        diagnosisName: 'Headache',
        diagnosisCode: 'A'.repeat(51),
        diagnosisNotes: 'Notes',
        severity: 'MILD',
        fitnessDecision: 'FIT',
        advisedRestDays: 2,
        workRestrictions: '',
        followUpDate: '',
        requiresReferral: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'diagnosisCode', message: 'Diagnosis code cannot exceed 50 characters' })
      );
    });

    it('returns error when diagnosis notes exceed max length', () => {
      const result = validateDiagnosisForm({
        diagnosisName: 'Headache',
        diagnosisCode: 'R51',
        diagnosisNotes: 'A'.repeat(1001),
        severity: 'MILD',
        fitnessDecision: 'FIT',
        advisedRestDays: 2,
        workRestrictions: '',
        followUpDate: '',
        requiresReferral: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'diagnosisNotes', message: 'Diagnosis notes cannot exceed 1000 characters' })
      );
    });

    it('returns error when severity is invalid', () => {
      const result = validateDiagnosisForm({
        diagnosisName: 'Headache',
        diagnosisCode: 'R51',
        diagnosisNotes: 'Notes',
        severity: 'INVALID' as any,
        fitnessDecision: 'FIT',
        advisedRestDays: 2,
        workRestrictions: '',
        followUpDate: '',
        requiresReferral: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'severity', message: 'Invalid severity level' })
      );
    });

    it('returns error when fitness decision is invalid', () => {
      const result = validateDiagnosisForm({
        diagnosisName: 'Headache',
        diagnosisCode: 'R51',
        diagnosisNotes: 'Notes',
        severity: 'MILD',
        fitnessDecision: 'INVALID' as any,
        advisedRestDays: 2,
        workRestrictions: '',
        followUpDate: '',
        requiresReferral: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'fitnessDecision', message: 'Invalid fitness decision' })
      );
    });

    it('returns error when advised rest days is negative', () => {
      const result = validateDiagnosisForm({
        diagnosisName: 'Headache',
        diagnosisCode: 'R51',
        diagnosisNotes: 'Notes',
        severity: 'MILD',
        fitnessDecision: 'FIT',
        advisedRestDays: -1,
        workRestrictions: '',
        followUpDate: '',
        requiresReferral: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'advisedRestDays', message: 'Advised rest days cannot be negative' })
      );
    });

    it('returns error when advised rest days exceeds max', () => {
      const result = validateDiagnosisForm({
        diagnosisName: 'Headache',
        diagnosisCode: 'R51',
        diagnosisNotes: 'Notes',
        severity: 'MILD',
        fitnessDecision: 'FIT',
        advisedRestDays: 366,
        workRestrictions: '',
        followUpDate: '',
        requiresReferral: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'advisedRestDays', message: 'Advised rest days cannot exceed 365' })
      );
    });

    it('returns error when follow-up date is in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDate = yesterday.toISOString().split('T')[0];

      const result = validateDiagnosisForm({
        diagnosisName: 'Headache',
        diagnosisCode: 'R51',
        diagnosisNotes: 'Notes',
        severity: 'MILD',
        fitnessDecision: 'FIT',
        advisedRestDays: 2,
        workRestrictions: '',
        followUpDate: pastDate,
        requiresReferral: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'followUpDate', message: 'Follow-up date cannot be in the past' })
      );
    });

    it('validates today as follow-up date', () => {
      const today = new Date().toISOString().split('T')[0];

      const result = validateDiagnosisForm({
        diagnosisName: 'Headache',
        diagnosisCode: 'R51',
        diagnosisNotes: 'Notes',
        severity: 'MILD',
        fitnessDecision: 'FIT',
        advisedRestDays: 2,
        workRestrictions: '',
        followUpDate: today,
        requiresReferral: false,
      });

      expect(result.isValid).toBe(true);
    });
  });

  describe('validatePrescription', () => {
    it('returns valid when all fields are present', () => {
      const result = validatePrescription({
        medicine_name: 'Paracetamol',
        dosage: '500mg',
        frequency: '3 times daily',
        duration_days: 7,
        route: 'Oral',
        instructions: 'Take after meals',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns valid with optional fields omitted', () => {
      const result = validatePrescription({
        medicine_name: 'Paracetamol',
        dosage: '500mg',
        frequency: '3 times daily',
        duration_days: 7,
      });

      expect(result.isValid).toBe(true);
    });

    it('returns error when medicine name is empty', () => {
      const result = validatePrescription({
        medicine_name: '  ',
        dosage: '500mg',
        frequency: '3 times daily',
        duration_days: 7,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'medicine_name', message: expect.any(String) })
      );
    });

    it('returns error when medicine name exceeds max length', () => {
      const result = validatePrescription({
        medicine_name: 'A'.repeat(256),
        dosage: '500mg',
        frequency: '3 times daily',
        duration_days: 7,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'medicine_name', message: 'Medicine name cannot exceed 255 characters' })
      );
    });

    it('returns error when dosage is empty', () => {
      const result = validatePrescription({
        medicine_name: 'Paracetamol',
        dosage: '  ',
        frequency: '3 times daily',
        duration_days: 7,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'dosage', message: expect.any(String) })
      );
    });

    it('returns error when dosage exceeds max length', () => {
      const result = validatePrescription({
        medicine_name: 'Paracetamol',
        dosage: 'A'.repeat(101),
        frequency: '3 times daily',
        duration_days: 7,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'dosage', message: 'Dosage cannot exceed 100 characters' })
      );
    });

    it('returns error when frequency is empty', () => {
      const result = validatePrescription({
        medicine_name: 'Paracetamol',
        dosage: '500mg',
        frequency: '  ',
        duration_days: 7,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'frequency', message: expect.any(String) })
      );
    });

    it('returns error when frequency exceeds max length', () => {
      const result = validatePrescription({
        medicine_name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'A'.repeat(101),
        duration_days: 7,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'frequency', message: 'Frequency cannot exceed 100 characters' })
      );
    });

    it('returns error when duration is zero', () => {
      const result = validatePrescription({
        medicine_name: 'Paracetamol',
        dosage: '500mg',
        frequency: '3 times daily',
        duration_days: 0,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'duration_days', message: 'Duration must be at least 1 day' })
      );
    });

    it('returns error when duration exceeds max', () => {
      const result = validatePrescription({
        medicine_name: 'Paracetamol',
        dosage: '500mg',
        frequency: '3 times daily',
        duration_days: 366,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'duration_days', message: 'Duration cannot exceed 365 days' })
      );
    });

    it('returns error when route exceeds max length', () => {
      const result = validatePrescription({
        medicine_name: 'Paracetamol',
        dosage: '500mg',
        frequency: '3 times daily',
        duration_days: 7,
        route: 'A'.repeat(51),
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'route', message: 'Route cannot exceed 50 characters' })
      );
    });

    it('returns error when instructions exceed max length', () => {
      const result = validatePrescription({
        medicine_name: 'Paracetamol',
        dosage: '500mg',
        frequency: '3 times daily',
        duration_days: 7,
        instructions: 'A'.repeat(501),
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'instructions', message: 'Instructions cannot exceed 500 characters' })
      );
    });
  });

  describe('validatePrescriptions', () => {
    it('returns error when no prescriptions are filled', () => {
      const result = validatePrescriptions([
        {
          medicine_name: '',
          dosage: '',
          frequency: '',
          duration_days: 0,
        },
      ]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'prescriptions', message: 'At least one prescription is required' })
      );
    });

    it('returns valid when at least one prescription is filled', () => {
      const result = validatePrescriptions([
        {
          medicine_name: 'Paracetamol',
          dosage: '500mg',
          frequency: '3 times daily',
          duration_days: 7,
        },
        {
          medicine_name: '',
          dosage: '',
          frequency: '',
          duration_days: 0,
        },
      ]);

      expect(result.isValid).toBe(true);
    });

    it('returns errors for all invalid prescriptions', () => {
      const result = validatePrescriptions([
        {
          medicine_name: 'Paracetamol',
          dosage: 'A'.repeat(101),
          frequency: '3 times daily',
          duration_days: 7,
        },
        {
          medicine_name: 'Ibuprofen',
          dosage: '  ',
          frequency: '3 times daily',
          duration_days: 7,
        },
      ]);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getFieldError', () => {
    it('returns error message for existing field', () => {
      const errors = [
        { field: 'diagnosisName', message: 'Diagnosis name is required' },
        { field: 'dosage', message: 'Dosage is required' },
      ];

      const error = getFieldError(errors, 'diagnosisName');
      expect(error).toBe('Diagnosis name is required');
    });

    it('returns undefined for non-existent field', () => {
      const errors = [
        { field: 'diagnosisName', message: 'Diagnosis name is required' },
      ];

      const error = getFieldError(errors, 'nonExistentField');
      expect(error).toBeUndefined();
    });

    it('returns first error if multiple errors for same field', () => {
      const errors = [
        { field: 'diagnosisName', message: 'First error' },
        { field: 'diagnosisName', message: 'Second error' },
      ];

      const error = getFieldError(errors, 'diagnosisName');
      expect(error).toBe('First error');
    });
  });

  describe('getAllErrors', () => {
    it('converts error array to object map', () => {
      const errors = [
        { field: 'diagnosisName', message: 'Error 1' },
        { field: 'dosage', message: 'Error 2' },
        { field: 'frequency', message: 'Error 3' },
      ];

      const errorMap = getAllErrors(errors);

      expect(errorMap).toEqual({
        diagnosisName: 'Error 1',
        dosage: 'Error 2',
        frequency: 'Error 3',
      });
    });

    it('returns empty object for empty errors', () => {
      const errorMap = getAllErrors([]);

      expect(errorMap).toEqual({});
    });

    it('handles duplicate fields with last error', () => {
      const errors = [
        { field: 'diagnosisName', message: 'First error' },
        { field: 'diagnosisName', message: 'Last error' },
      ];

      const errorMap = getAllErrors(errors);

      expect(errorMap).toEqual({
        diagnosisName: 'Last error',
      });
    });
  });
});
