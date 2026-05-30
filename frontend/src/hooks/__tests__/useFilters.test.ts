import { renderHook, act } from '@testing-library/react';
import { useFilters, type DashboardFilters } from '../useFilters';

describe('useFilters', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default empty filters', () => {
    const { result } = renderHook(() => useFilters());

    expect(result.current.filters.dateRange.start).toBeNull();
    expect(result.current.filters.dateRange.end).toBeNull();
    expect(result.current.filters.departments).toEqual([]);
    expect(result.current.filters.severities).toEqual([]);
    expect(result.current.filters.diagnoses).toEqual([]);
    expect(result.current.filters.employeeCodes).toEqual([]);
  });

  it('updates date range', () => {
    const { result } = renderHook(() => useFilters());
    const start = new Date('2026-01-01');
    const end = new Date('2026-01-31');

    act(() => {
      result.current.setDateRange(start, end);
    });

    expect(result.current.filters.dateRange.start).toEqual(start);
    expect(result.current.filters.dateRange.end).toEqual(end);
    expect(result.current.isDirty).toBe(true);
  });

  it('toggles department selection', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.toggleDepartment('IT');
    });

    expect(result.current.filters.departments).toContain('IT');
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.toggleDepartment('IT');
    });

    expect(result.current.filters.departments).not.toContain('IT');
  });

  it('toggles severity selection', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.toggleSeverity('MILD');
    });

    expect(result.current.filters.severities).toContain('MILD');

    act(() => {
      result.current.toggleSeverity('MILD');
    });

    expect(result.current.filters.severities).not.toContain('MILD');
  });

  it('toggles diagnosis selection', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.toggleDiagnosis('Flu');
    });

    expect(result.current.filters.diagnoses).toContain('Flu');
  });

  it('adds and removes employee codes', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.addEmployeeCode('EMP001');
    });

    expect(result.current.filters.employeeCodes).toContain('EMP001');

    act(() => {
      result.current.removeEmployeeCode('EMP001');
    });

    expect(result.current.filters.employeeCodes).not.toContain('EMP001');
  });

  it('does not add duplicate employee codes', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.addEmployeeCode('EMP001');
    });
    act(() => {
      result.current.addEmployeeCode('EMP001');
    });

    expect(result.current.filters.employeeCodes).toEqual(['EMP001']);
  });

  it('resets filters to defaults', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.toggleDepartment('IT');
      result.current.toggleSeverity('MILD');
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filters.departments).toEqual([]);
    expect(result.current.filters.severities).toEqual([]);
    expect(result.current.isDirty).toBe(false);
  });

  it('hasActiveFilters returns correct state', () => {
    const { result } = renderHook(() => useFilters());

    expect(result.current.hasActiveFilters()).toBe(false);

    act(() => {
      result.current.toggleDepartment('IT');
    });

    expect(result.current.hasActiveFilters()).toBe(true);
  });

  it('getFilterCount returns correct count', () => {
    const { result } = renderHook(() => useFilters());

    expect(result.current.getFilterCount()).toBe(0);

    act(() => {
      result.current.toggleDepartment('IT');
      result.current.toggleDepartment('HR');
      result.current.toggleSeverity('MILD');
    });

    expect(result.current.getFilterCount()).toBe(3);
  });

  it('saves filters to localStorage', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.saveFilters('My Filter');
    });

    const saved = localStorage.getItem('saved-dashboard-filters');
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('My Filter');
    expect(result.current.savedFilters).toHaveLength(1);
  });

  it('loads saved filters', () => {
    const savedFilter = {
      id: 'test-id',
      name: 'Test Filter',
      filters: {
        dateRange: { start: new Date(), end: new Date() },
        departments: ['IT'],
        severities: [],
        diagnoses: [],
        employeeCodes: [],
      },
      createdAt: new Date(),
    };

    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.saveFilters('Test Filter');
    });

    act(() => {
      result.current.loadSavedFilter(savedFilter);
    });

    expect(result.current.filters.departments).toEqual(['IT']);
    expect(result.current.isDirty).toBe(false);
  });

  it('deletes saved filters', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.saveFilters('Test Filter');
    });

    const id = result.current.savedFilters[0].id;

    act(() => {
      result.current.deleteSavedFilter(id);
    });

    expect(result.current.savedFilters).toHaveLength(0);
    const saved = localStorage.getItem('saved-dashboard-filters');
    expect(saved).toBeNull();
  });

  it('exports filters as JSON', () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
      result.current.toggleDepartment('IT');
    });

    const exported = result.current.exportFilters();
    expect(() => JSON.parse(exported)).not.toThrow();
    const parsed = JSON.parse(exported);
    expect(parsed.departments).toContain('IT');
  });

  it('imports filters from JSON', () => {
    const { result } = renderHook(() => useFilters());

    const json = JSON.stringify({
      dateRange: { start: null, end: null },
      departments: ['IT', 'HR'],
      severities: [],
      diagnoses: [],
      employeeCodes: [],
    });

    const success = result.current.importFilters(json);

    expect(success).toBe(true);
    expect(result.current.filters.departments).toEqual(['IT', 'HR']);
  });
});