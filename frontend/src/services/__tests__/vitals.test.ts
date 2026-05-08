import { describe, it, expect } from 'vitest';
import {
  aggregateVitals,
  formatVitalsForDisplay,
  validateVitals,
  calculateBMI,
  getBMICategory,
} from '../vitals';

describe('Vitals Service', () => {
  describe('aggregateVitals', () => {
    it('aggregates all vitals from form inputs', () => {
      const inputs = {
        temperature: '98.6',
        blood_pressure: '120/80',
        pulse: '72',
        spo2: '98',
        weight: '165',
        height: '180',
      };

      const result = aggregateVitals(inputs);

      expect(result).toEqual({
        temperature: '98.6',
        blood_pressure: '120/80',
        pulse: '72',
        spo2: '98',
        weight: '165',
        height: '180',
      });
    });

    it('filters empty values', () => {
      const inputs = {
        temperature: '98.6',
        blood_pressure: '',
        pulse: '72',
        spo2: '',
      };

      const result = aggregateVitals(inputs);

      expect(result.temperature).toBe('98.6');
      expect(result.blood_pressure).toBeUndefined();
      expect(result.pulse).toBe('72');
      expect(result.spo2).toBeUndefined();
    });

    it('handles whitespace-only values', () => {
      const inputs = {
        temperature: '98.6',
        blood_pressure: '  ',
        pulse: '72',
      };

      const result = aggregateVitals(inputs);

      expect(result.blood_pressure).toBeUndefined();
    });

    it('handles empty input', () => {
      const result = aggregateVitals({});
      expect(result).toEqual({});
    });
  });

  describe('formatVitalsForDisplay', () => {
    it('formats vitals object to JSON string', () => {
      const vitals = {
        temperature: '98.6',
        blood_pressure: '120/80',
        pulse: '72',
      };

      const result = formatVitalsForDisplay(vitals);

      expect(result).toBe('{\n  "temperature": "98.6",\n  "blood_pressure": "120/80",\n  "pulse": "72"\n}');
    });

    it('formats empty object', () => {
      const result = formatVitalsForDisplay({});
      expect(result).toBe('{}');
    });

    it('formats object with all fields', () => {
      const vitals = {
        temperature: '99.5',
        blood_pressure: '125/85',
        pulse: '75',
        spo2: '97',
        weight: '170',
        height: '175',
      };

      const result = formatVitalsForDisplay(vitals);

      expect(result).toContain('"temperature": "99.5"');
      expect(result).toContain('"blood_pressure": "125/85"');
      expect(result).toContain('"pulse": "75"');
      expect(result).toContain('"spo2": "97"');
      expect(result).toContain('"weight": "170"');
      expect(result).toContain('"height": "175"');
    });
  });

  describe('validateVitals', () => {
    it('returns empty object for valid vitals', () => {
      const vitals = {
        temperature: '98.6',
        blood_pressure: '120/80',
        pulse: '72',
        spo2: '98',
        weight: '70',
        height: '175',
      };

      const result = validateVitals(vitals);
      expect(result).toEqual({});
    });

    it('validates temperature range', () => {
      const result1 = validateVitals({ temperature: '79' });
      expect(result1.temperature).toBe('Temperature must be between 80 and 120 F');

      const result2 = validateVitals({ temperature: '121' });
      expect(result2.temperature).toBe('Temperature must be between 80 and 120 F');

      const result3 = validateVitals({ temperature: 'invalid' });
      expect(result3.temperature).toBe('Temperature must be between 80 and 120 F');
    });

    it('validates blood pressure format', () => {
      const result1 = validateVitals({ blood_pressure: '120' });
      expect(result1.blood_pressure).toContain('must be in format: 120/80');

      const result2 = validateVitals({ blood_pressure: '120/80/60' });
      expect(result2.blood_pressure).toContain('must be in format: 120/80');

      const result3 = validateVitals({ blood_pressure: 'invalid' });
      expect(result3.blood_pressure).toContain('must be in format: 120/80');
    });

    it('validates blood pressure with mmHg unit', () => {
      const result1 = validateVitals({ blood_pressure: '120/80 mmHg' });
      expect(result1.blood_pressure).toBeUndefined();
    });

    it('validates pulse range', () => {
      const result1 = validateVitals({ pulse: '39' });
      expect(result1.pulse).toBe('Pulse must be between 40 and 200 bpm');

      const result2 = validateVitals({ pulse: '201' });
      expect(result2.pulse).toBe('Pulse must be between 40 and 200 bpm');
    });

    it('validates SpO2 range', () => {
      const result1 = validateVitals({ spo2: '69' });
      expect(result1.spo2).toBe('SpO2 must be between 70 and 100%');

      const result2 = validateVitals({ spo2: '101' });
      expect(result2.spo2).toBe('SpO2 must be between 70 and 100%');
    });

    it('validates weight range', () => {
      const result1 = validateVitals({ weight: '0.5' });
      expect(result1.weight).toBe('Weight must be between 1 and 300 kg');

      const result2 = validateVitals({ weight: '301' });
      expect(result2.weight).toBe('Weight must be between 1 and 300 kg');
    });

    it('validates height range', () => {
      const result1 = validateVitals({ height: '49' });
      expect(result1.height).toBe('Height must be between 50 and 250 cm');

      const result2 = validateVitals({ height: '251' });
      expect(result2.height).toBe('Height must be between 50 and 250 cm');
    });
  });

  describe('calculateBMI', () => {
    it('calculates BMI correctly', () => {
      const result = calculateBMI('70', '175');
      expect(result).toBeCloseTo(22.9, 1);
    });

    it('returns null for invalid weight', () => {
      const result = calculateBMI('invalid', '175');
      expect(result).toBeNull();
    });

    it('returns null for invalid height', () => {
      const result = calculateBMI('70', 'invalid');
      expect(result).toBeNull();
    });

    it('returns null for zero height', () => {
      const result = calculateBMI('70', '0');
      expect(result).toBeNull();
    });

    it('rounds to 1 decimal place', () => {
      const result = calculateBMI('75', '180');
      expect(result).toBe(23.1);
    });
  });

  describe('getBMICategory', () => {
    it('returns Underweight for BMI < 18.5', () => {
      expect(getBMICategory(17.5)).toBe('Underweight');
      expect(getBMICategory(18.4)).toBe('Underweight');
    });

    it('returns Normal weight for 18.5 <= BMI < 25', () => {
      expect(getBMICategory(18.5)).toBe('Normal weight');
      expect(getBMICategory(22)).toBe('Normal weight');
      expect(getBMICategory(24.9)).toBe('Normal weight');
    });

    it('returns Overweight for 25 <= BMI < 30', () => {
      expect(getBMICategory(25)).toBe('Overweight');
      expect(getBMICategory(27)).toBe('Overweight');
      expect(getBMICategory(29.9)).toBe('Overweight');
    });

    it('returns Obese for BMI >= 30', () => {
      expect(getBMICategory(30)).toBe('Obese');
      expect(getBMICategory(35)).toBe('Obese');
      expect(getBMICategory(40)).toBe('Obese');
    });
  });
});
