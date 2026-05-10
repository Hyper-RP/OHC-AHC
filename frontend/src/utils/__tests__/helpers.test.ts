import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatDate, getRelativeTime, formatNumber, formatCurrency,
  capitalize, toTitleCase, snakeToCamel, camelToSnake,
  truncate, debounce, deepClone, deepEqual,
  downloadFile, getInitials, isValidEmail, isValidPhone,
} from '../helpers';

describe('helpers', () => {
  describe('formatDate', () => {
    it('formats with short format', () => {
      const result = formatDate('2026-05-01T10:00:00Z', 'short');
      expect(result).toContain('2026');
      expect(result).toContain('May');
    });

    it('formats with long format', () => {
      const result = formatDate('2026-05-01T10:00:00Z', 'long');
      expect(result).toContain('2026');
    });

    it('formats with time format', () => {
      const result = formatDate('2026-05-01T10:00:00Z', 'time');
      expect(result).toContain('2026');
    });

    it('returns Invalid Date for bad input', () => {
      expect(formatDate('not-a-date')).toBe('Invalid Date');
    });
  });

  describe('getRelativeTime', () => {
    it('returns Just now for recent times', () => {
      expect(getRelativeTime(new Date())).toBe('Just now');
    });

    it('returns minutes ago', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(getRelativeTime(fiveMinAgo)).toBe('5 minutes ago');
    });

    it('returns hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(getRelativeTime(twoHoursAgo)).toBe('2 hours ago');
    });

    it('returns days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(getRelativeTime(threeDaysAgo)).toBe('3 days ago');
    });
  });

  describe('formatNumber', () => {
    it('formats with commas', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('formats with decimals', () => {
      expect(formatNumber(1234.5, 2)).toBe('1,234.50');
    });
  });

  describe('formatCurrency', () => {
    it('formats in INR', () => {
      const result = formatCurrency(5000);
      expect(result).toContain('5,000');
    });
  });

  describe('string utilities', () => {
    it('capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('toTitleCase converts full string', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('snakeToCamel converts correctly', () => {
      expect(snakeToCamel('hello_world')).toBe('helloWorld');
    });

    it('camelToSnake converts correctly', () => {
      expect(camelToSnake('helloWorld')).toBe('hello_world');
    });
  });

  describe('truncate', () => {
    it('returns original when within limit', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('truncates with suffix when over limit', () => {
      expect(truncate('hello world foo', 10)).toBe('hello w...');
    });
  });

  describe('debounce', () => {
    beforeEach(() => vi.useFakeTimers());

    it('only fires after delay', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 300);
      debounced();
      debounced();
      debounced();
      expect(fn).not.toHaveBeenCalled();
      vi.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });

  describe('deepClone', () => {
    it('creates independent copy', () => {
      const original = { a: 1, b: { c: 2 } };
      const clone = deepClone(original);
      clone.b.c = 99;
      expect(original.b.c).toBe(2);
    });
  });

  describe('deepEqual', () => {
    it('returns true for equal objects', () => {
      expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
    });

    it('returns false for different objects', () => {
      expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    });
  });

  describe('downloadFile', () => {
    it('creates link and clicks it', () => {
      const mockUrl = 'blob:http://localhost/test';
      const mockLink = { href: '', download: '', click: vi.fn() };
      vi.spyOn(window.URL, 'createObjectURL').mockReturnValue(mockUrl);
      vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as unknown as Node);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as unknown as Node);

      downloadFile(new Blob(['test']), 'test.csv');
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toBe('test.csv');
    });
  });

  describe('getInitials', () => {
    it('returns single initial for single name', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('returns two initials for full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });
  });

  describe('validation', () => {
    it('isValidEmail validates correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('isValidEmail rejects invalid email', () => {
      expect(isValidEmail('not-email')).toBe(false);
    });

    it('isValidPhone validates 10-digit number', () => {
      expect(isValidPhone('9876543210')).toBe(true);
    });

    it('isValidPhone rejects invalid phone', () => {
      expect(isValidPhone('123')).toBe(false);
    });
  });
});
