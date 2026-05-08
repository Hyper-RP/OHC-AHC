import type { Vitals } from '../types';

/**
 * Aggregate vital signs inputs from form data
 * @param inputs - Record of vital sign inputs
 * @returns Vitals object with only non-empty values
 */
export const aggregateVitals = (inputs: Record<string, string>): Vitals => {
  const vitals: Vitals = {};
  const vitalKeys = ['temperature', 'blood_pressure', 'pulse', 'spo2', 'weight', 'height'];

  vitalKeys.forEach((key) => {
    const value = inputs[key]?.trim();
    if (value) {
      vitals[key as keyof Vitals] = value;
    }
  });

  return vitals;
};

/**
 * Format vitals for display in JSON
 * @param vitals - Vitals object
 * @returns Formatted JSON string
 */
export const formatVitalsForDisplay = (vitals: Vitals): string => {
  return JSON.stringify(vitals, null, 2);
};

/**
 * Validate vitals input
 * @param vitals - Vitals object to validate
 * @returns Object with validation errors (empty if valid)
 */
export const validateVitals = (vitals: Vitals): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (vitals.temperature) {
    const temp = parseFloat(vitals.temperature);
    if (isNaN(temp) || temp < 80 || temp > 120) {
      errors.temperature = 'Temperature must be between 80 and 120 F';
    }
  }

  if (vitals.blood_pressure) {
    const bpPattern = /^\d{2,3}\/\d{2,3}\s*(mmHg)?$/i;
    if (!bpPattern.test(vitals.blood_pressure)) {
      errors.blood_pressure = 'Blood pressure must be in format: 120/80 or 120/80 mmHg';
    }
  }

  if (vitals.pulse) {
    const pulse = parseInt(vitals.pulse);
    if (isNaN(pulse) || pulse < 40 || pulse > 200) {
      errors.pulse = 'Pulse must be between 40 and 200 bpm';
    }
  }

  if (vitals.spo2) {
    const spo2 = parseInt(vitals.spo2);
    if (isNaN(spo2) || spo2 < 70 || spo2 > 100) {
      errors.spo2 = 'SpO2 must be between 70 and 100%';
    }
  }

  if (vitals.weight) {
    const weight = parseFloat(vitals.weight);
    if (isNaN(weight) || weight < 1 || weight > 300) {
      errors.weight = 'Weight must be between 1 and 300 kg';
    }
  }

  if (vitals.height) {
    const height = parseFloat(vitals.height);
    if (isNaN(height) || height < 50 || height > 250) {
      errors.height = 'Height must be between 50 and 250 cm';
    }
  }

  return errors;
};

/**
 * Calculate BMI from weight (kg) and height (cm)
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @returns BMI value or null if calculation fails
 */
export const calculateBMI = (weight: string, height: string): number | null => {
  const weightKg = parseFloat(weight);
  const heightCm = parseFloat(height);

  if (isNaN(weightKg) || isNaN(heightCm) || heightCm === 0) {
    return null;
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10; // Round to 1 decimal place
};

/**
 * Get BMI category
 * @param bmi - BMI value
 * @returns BMI category string
 */
export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};
