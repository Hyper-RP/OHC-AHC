import { describe, it, expect } from 'vitest';
import { Role } from '../../types';
import { getNavItemsForRole, hasAccessToRoute, NAV_ITEMS } from '../navigation';

describe('navigation', () => {
  describe('getNavItemsForRole', () => {
    it('returns all 11 items for ADMIN', () => {
      const items = getNavItemsForRole(Role.ADMIN);
      expect(items).toHaveLength(11);
    });

    it('returns correct items for NURSE', () => {
      const items = getNavItemsForRole(Role.NURSE);
      const urls = items.map((i) => i.url);
      expect(urls).toContain('/dashboard');
      expect(urls).toContain('/ohc/visit-form');
      expect(urls).not.toContain('/payments');
    });

    it('returns correct items for HR', () => {
      const items = getNavItemsForRole(Role.HR);
      const urls = items.map((i) => i.url);
      expect(urls).toContain('/dashboard');
      expect(urls).toContain('/payments');
      expect(urls).toContain('/reports/employee-history');
      expect(urls).not.toContain('/ohc/visit-form');
    });

    it('returns correct items for DOCTOR', () => {
      const items = getNavItemsForRole(Role.DOCTOR);
      const urls = items.map((i) => i.url);
      expect(urls).toContain('/ohc/visit-form');
      expect(urls).toContain('/ohc/diagnosis-entry');
      expect(urls).not.toContain('/payments');
    });

    it('returns correct items for EHS', () => {
      const items = getNavItemsForRole(Role.EHS);
      const urls = items.map((i) => i.url);
      expect(urls).toContain('/dashboard');
      expect(urls).toContain('/reports/disease-trends');
    });

    it('returns correct items for KAM', () => {
      const items = getNavItemsForRole(Role.KAM);
      const urls = items.map((i) => i.url);
      expect(urls).toContain('/dashboard');
      expect(urls).toContain('/payments');
      expect(urls).not.toContain('/ohc/visit-form');
    });

    it('returns no items for EMPLOYEE role', () => {
      const items = getNavItemsForRole(Role.EMPLOYEE);
      expect(items).toHaveLength(0);
    });
  });

  describe('hasAccessToRoute', () => {
    it('returns true for valid role/url combo', () => {
      expect(hasAccessToRoute('/dashboard', Role.ADMIN)).toBe(true);
    });

    it('returns false for invalid role/url combo', () => {
      expect(hasAccessToRoute('/payments', Role.NURSE)).toBe(false);
    });

    it('returns false for unknown URL', () => {
      expect(hasAccessToRoute('/unknown-page', Role.ADMIN)).toBe(false);
    });
  });

  describe('NAV_ITEMS', () => {
    it('exports nav items array', () => {
      expect(Array.isArray(NAV_ITEMS)).toBe(true);
      expect(NAV_ITEMS.length).toBeGreaterThan(0);
    });
  });
});
