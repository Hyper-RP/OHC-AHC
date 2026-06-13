/**
 * Error handling utilities for DoctorDashboard
 */

export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FieldError[];
}

/**
 * Validates diagnosis form fields
 */
export const validateDiagnosisForm = (data: {
  diagnosisName: string;
  diagnosisCode?: string;
  diagnosisNotes?: string;
  severity: string;
  fitnessDecision: string;
  advisedRestDays: number;
  workRestrictions?: string;
  followUpDate?: string;
  requiresReferral: boolean;
}): ValidationResult => {
  const errors: FieldError[] = [];

  // Diagnosis name validation
  if (!data.diagnosisName.trim()) {
    errors.push({ field: 'diagnosisName', message: 'Diagnosis name is required' });
  } else if (data.diagnosisName.length > 255) {
    errors.push({ field: 'diagnosisName', message: 'Diagnosis name cannot exceed 255 characters' });
  }

  // Diagnosis code validation (if provided)
  if (data.diagnosisCode && data.diagnosisCode.length > 50) {
    errors.push({ field: 'diagnosisCode', message: 'Diagnosis code cannot exceed 50 characters' });
  }

  // Diagnosis notes validation (if provided)
  if (data.diagnosisNotes && data.diagnosisNotes.length > 1000) {
    errors.push({ field: 'diagnosisNotes', message: 'Diagnosis notes cannot exceed 1000 characters' });
  }

  // Severity validation
  const validSeverities = ['MILD', 'MODERATE', 'SERIOUS', 'CRITICAL'];
  if (!validSeverities.includes(data.severity)) {
    errors.push({ field: 'severity', message: 'Invalid severity level' });
  }

  // Fitness decision validation
  const validDecisions = ['FIT', 'FIT_WITH_RESTRICTION', 'TEMPORARY_UNFIT', 'UNFIT'];
  if (!validDecisions.includes(data.fitnessDecision)) {
    errors.push({ field: 'fitnessDecision', message: 'Invalid fitness decision' });
  }

  // Advised rest days validation
  if (data.advisedRestDays < 0) {
    errors.push({ field: 'advisedRestDays', message: 'Advised rest days cannot be negative' });
  }
  if (data.advisedRestDays > 365) {
    errors.push({ field: 'advisedRestDays', message: 'Advised rest days cannot exceed 365' });
  }

  // Work restrictions validation (if provided)
  if (data.workRestrictions && data.workRestrictions.length > 500) {
    errors.push({ field: 'workRestrictions', message: 'Work restrictions cannot exceed 500 characters' });
  }

  // Follow-up date validation (if provided)
  if (data.followUpDate) {
    const followUpDate = new Date(data.followUpDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (followUpDate < today) {
      errors.push({ field: 'followUpDate', message: 'Follow-up date cannot be in the past' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates prescription fields
 */
export const validatePrescription = (prescription: {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  route?: string;
  instructions?: string;
}): ValidationResult => {
  const errors: FieldError[] = [];

  // Medicine name validation
  if (!prescription.medicine_name.trim()) {
    errors.push({ field: 'medicine_name', message: 'Medicine name is required' });
  } else if (prescription.medicine_name.length > 255) {
    errors.push({ field: 'medicine_name', message: 'Medicine name cannot exceed 255 characters' });
  }

  // Dosage validation
  if (!prescription.dosage.trim()) {
    errors.push({ field: 'dosage', message: 'Dosage is required' });
  } else if (prescription.dosage.length > 100) {
    errors.push({ field: 'dosage', message: 'Dosage cannot exceed 100 characters' });
  }

  // Frequency validation
  if (!prescription.frequency.trim()) {
    errors.push({ field: 'frequency', message: 'Frequency is required' });
  } else if (prescription.frequency.length > 100) {
    errors.push({ field: 'frequency', message: 'Frequency cannot exceed 100 characters' });
  }

  // Duration days validation
  if (prescription.duration_days <= 0) {
    errors.push({ field: 'duration_days', message: 'Duration must be at least 1 day' });
  }
  if (prescription.duration_days > 365) {
    errors.push({ field: 'duration_days', message: 'Duration cannot exceed 365 days' });
  }

  // Route validation (if provided)
  if (prescription.route && prescription.route.length > 50) {
    errors.push({ field: 'route', message: 'Route cannot exceed 50 characters' });
  }

  // Instructions validation (if provided)
  if (prescription.instructions && prescription.instructions.length > 500) {
    errors.push({ field: 'instructions', message: 'Instructions cannot exceed 500 characters' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates all prescriptions in an array
 */
export const validatePrescriptions = (
  prescriptions: Array<{
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration_days: number;
    route?: string;
    instructions?: string;
  }>
): ValidationResult => {
  const errors: FieldError[] = [];

  // Check if at least one prescription is filled
  const filledPrescriptions = prescriptions.filter(p => p.medicine_name.trim() !== '');

  if (filledPrescriptions.length === 0) {
    errors.push({ field: 'prescriptions', message: 'At least one prescription is required' });
    return {
      isValid: false,
      errors,
    };
  }

  // Validate each prescription
  prescriptions.forEach((prescription, index) => {
    if (prescription.medicine_name.trim()) {
      const result = validatePrescription(prescription);
      result.errors.forEach(err => {
        errors.push({
          field: err.field,
          message: `Prescription ${index + 1}: ${err.message}`,
        });
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Formats API error for display
 */
export const formatSubmitError = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'detail' in error) {
    const detail = (error as Record<string, unknown>).detail;
    if (Array.isArray(detail)) {
      return detail.join(', ');
    }
    return String(detail);
  }

  return 'Failed to submit diagnosis. Please try again.';
};

/**
 * Gets the first error message for a specific field
 */
export const getFieldError = (
  errors: FieldError[],
  fieldName: string
): string | undefined => {
  return errors.find(e => e.field === fieldName)?.message;
};

/**
 * Gets all errors (useful for form display)
 */
export const getAllErrors = (errors: FieldError[]): Record<string, string> => {
  return errors.reduce((acc, err) => {
    acc[err.field] = err.message;
    return acc;
  }, {} as Record<string, string>);
};
