import type { NavItem } from '../types';
import { Role } from '../types';

/**
 * Navigation configuration for sidebar menu
 * Items are filtered based on user roles
 */
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    url: '/dashboard',
    urlName: 'dashboard',
    icon: '📊',
    roles: [Role.ADMIN, Role.NURSE, Role.EHS, Role.HR, Role.KAM, Role.DOCTOR],
  },
  {
    label: 'OHC Visit Form',
    url: '/ohc/visit-form',
    urlName: 'ohc_visit_form',
    icon: '🏥',
    roles: [Role.ADMIN, Role.NURSE, Role.DOCTOR],
  },
  {
    label: 'Diagnosis Entry',
    url: '/ohc/diagnosis-entry',
    urlName: 'diagnosis_entry',
    icon: '🔬',
    roles: [Role.ADMIN, Role.DOCTOR],
  },
  {
    label: 'Complete Intake',
    url: '/ohc/complete-intake',
    urlName: 'complete_intake',
    icon: '✅',
    roles: [Role.ADMIN, Role.NURSE, Role.DOCTOR],
  },
  {
    label: 'Referrals',
    url: '/ahc/referrals',
    urlName: 'referrals',
    icon: '🏢',
    roles: [Role.ADMIN, Role.NURSE, Role.EHS, Role.HR, Role.DOCTOR],
  },
  {
    label: 'Hospital Selection',
    url: '/ahc/hospital-selection',
    urlName: 'hospital_selection',
    icon: '🏨',
    roles: [Role.ADMIN, Role.NURSE, Role.EHS, Role.HR, Role.KAM, Role.DOCTOR],
  },
  {
    label: 'Payments',
    url: '/payments',
    urlName: 'payments',
    icon: '💳',
    roles: [Role.ADMIN, Role.HR, Role.KAM],
  },
  {
    label: 'Medical Reports',
    url: '/reports/medical',
    urlName: 'medical_reports',
    icon: '📋',
    roles: [Role.ADMIN, Role.NURSE, Role.EHS, Role.HR, Role.KAM, Role.DOCTOR],
  },
  {
    label: 'Employee History',
    url: '/reports/employee-history',
    urlName: 'employee_history',
    icon: '📜',
    roles: [Role.ADMIN, Role.HR, Role.EHS],
  },
  {
    label: 'Disease Trends',
    url: '/reports/disease-trends',
    urlName: 'disease_trends',
    icon: '📈',
    roles: [Role.ADMIN, Role.HR, Role.EHS],
  },
  {
    label: 'Department Stats',
    url: '/reports/department-stats',
    urlName: 'department_stats',
    icon: '🏢',
    roles: [Role.ADMIN, Role.HR, Role.EHS],
  },
];

/**
 * Filter navigation items based on user role
 * @param userRole - User's role
 * @returns Array of navigation items accessible to the user
 */
export const getNavItemsForRole = (userRole: Role): NavItem[] => {
  return NAV_ITEMS.filter((item) => item.roles.includes(userRole));
};

/**
 * Check if a user has access to a specific navigation item
 * @param url - URL of the navigation item
 * @param userRole - User's role
 * @returns Boolean indicating if user has access
 */
export const hasAccessToRoute = (url: string, userRole: Role): boolean => {
  const navItem = NAV_ITEMS.find((item) => item.url === url);
  return navItem ? navItem.roles.includes(userRole) : false;
};
