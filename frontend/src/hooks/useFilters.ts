import { useState, useCallback, useEffect } from 'react';
import type { Severity } from '../types';

export interface DashboardFilters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  departments: string[];
  severities: Severity[];
  diagnoses: string[];
  employeeCodes: string[];
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: DashboardFilters;
  createdAt: Date;
}

const DEFAULT_FILTERS: DashboardFilters = {
  dateRange: {
    start: null,
    end: null,
  },
  departments: [],
  severities: [],
  diagnoses: [],
  employeeCodes: [],
};

export function useFilters() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('saved-dashboard-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedFilters(parsed.map((f: SavedFilter) => ({
          ...f,
          createdAt: new Date(f.createdAt),
        })));
      } catch {}
    }
  }, []);

  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters((prev) => {
      const updated = {
        ...prev,
        ...newFilters,
        dateRange: newFilters.dateRange ? { ...prev.dateRange, ...newFilters.dateRange } : prev.dateRange,
      };
      setIsDirty(JSON.stringify(prev) !== JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setDateRange = useCallback((start: Date | null, end: Date | null) => {
    updateFilters({ dateRange: { start, end } });
  }, [updateFilters]);

  const toggleDepartment = useCallback((department: string) => {
    setFilters((prev) => {
      const departments = prev.departments.includes(department)
        ? prev.departments.filter((d) => d !== department)
        : [...prev.departments, department];
      const updated = { ...prev, departments };
      setIsDirty(JSON.stringify(prev) !== JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setDepartments = useCallback((departments: string[]) => {
    updateFilters({ departments });
  }, [updateFilters]);

  const toggleSeverity = useCallback((severity: Severity) => {
    setFilters((prev) => {
      const severities = prev.severities.includes(severity)
        ? prev.severities.filter((s) => s !== severity)
        : [...prev.severities, severity];
      const updated = { ...prev, severities };
      setIsDirty(JSON.stringify(prev) !== JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setSeverities = useCallback((severities: Severity[]) => {
    updateFilters({ severities });
  }, [updateFilters]);

  const toggleDiagnosis = useCallback((diagnosis: string) => {
    setFilters((prev) => {
      const diagnoses = prev.diagnoses.includes(diagnosis)
        ? prev.diagnoses.filter((d) => d !== diagnosis)
        : [...prev.diagnoses, diagnosis];
      const updated = { ...prev, diagnoses };
      setIsDirty(JSON.stringify(prev) !== JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setDiagnoses = useCallback((diagnoses: string[]) => {
    updateFilters({ diagnoses });
  }, [updateFilters]);

  const addEmployeeCode = useCallback((employeeCode: string) => {
    setFilters((prev) => {
      if (prev.employeeCodes.includes(employeeCode)) return prev;
      const updated = { ...prev, employeeCodes: [...prev.employeeCodes, employeeCode] };
      setIsDirty(true);
      return updated;
    });
  }, []);

  const removeEmployeeCode = useCallback((employeeCode: string) => {
    setFilters((prev) => {
      const updated = { ...prev, employeeCodes: prev.employeeCodes.filter((c) => c !== employeeCode) };
      setIsDirty(JSON.stringify(prev) !== JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setIsDirty(false);
  }, []);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.dateRange.start !== null ||
      filters.dateRange.end !== null ||
      filters.departments.length > 0 ||
      filters.severities.length > 0 ||
      filters.diagnoses.length > 0 ||
      filters.employeeCodes.length > 0
    );
  }, [filters]);

  const getFilterCount = useCallback(() => {
    let count = 0;
    if (filters.dateRange.start || filters.dateRange.end) count += 1;
    count += filters.departments.length;
    count += filters.severities.length;
    count += filters.diagnoses.length;
    count += filters.employeeCodes.length;
    return count;
  }, [filters]);

  const saveFilters = useCallback((name: string) => {
    const newSavedFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name,
      filters: JSON.parse(JSON.stringify(filters)),
      createdAt: new Date(),
    };

    const updated = [...savedFilters, newSavedFilter];
    setSavedFilters(updated);
    localStorage.setItem('saved-dashboard-filters', JSON.stringify(updated));
    setIsDirty(false);
  }, [filters, savedFilters]);

  const loadSavedFilter = useCallback((savedFilter: SavedFilter) => {
    setFilters(savedFilter.filters);
    setIsDirty(false);
  }, []);

  const deleteSavedFilter = useCallback((id: string) => {
    const updated = savedFilters.filter((f) => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('saved-dashboard-filters', JSON.stringify(updated));
  }, [savedFilters]);

  const exportFilters = useCallback(() => {
    return JSON.stringify(filters, null, 2);
  }, [filters]);

  const importFilters = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.dateRange && Array.isArray(parsed.departments)) {
        setFilters(parsed);
        setIsDirty(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return {
    filters,
    savedFilters,
    isDirty,
    updateFilters,
    setDateRange,
    toggleDepartment,
    setDepartments,
    toggleSeverity,
    setSeverities,
    toggleDiagnosis,
    setDiagnoses,
    addEmployeeCode,
    removeEmployeeCode,
    resetFilters,
    hasActiveFilters,
    getFilterCount,
    saveFilters,
    loadSavedFilter,
    deleteSavedFilter,
    exportFilters,
    importFilters,
  };
}