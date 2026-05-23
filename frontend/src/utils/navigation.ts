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
    url: '/ohc',
    urlName: 'ohc_visit_form',
    icon: '🏥',
    roles: [Role.ADMIN, Role.NURSE, Role.DOCTOR, Role.PHARMACIST, Role.EHS, Role.MANAGEMENT],
    children: [
      {
        label: 'Nurse Module',
        url: '/nurse/visit-form',
        urlName: 'nurse',
        icon: '👩',
        roles: [Role.NURSE, Role.ADMIN],
      },
      {
        label: 'Doctor Module',
        url: '/doctor/dashboard',
        urlName: 'doctor',
        icon: '👨',
        roles: [Role.DOCTOR, Role.ADMIN],
      },
      {
        label: 'Pharmacist Module',
        url: '/pharmacist/dashboard',
        urlName: 'pharmacist',
        icon: '💊',
        roles: [Role.PHARMACIST, Role.ADMIN],
      },
      {
        label: 'EHS Dashboard',
        url: '/ehs/dashboard',
        urlName: 'ehs',
        icon: '📈',
        roles: [Role.EHS, Role.ADMIN, Role.MANAGEMENT],
      },
      {
        label: 'Management Dashboard',
        url: '/management/dashboard',
        urlName: 'management',
        icon: '📊',
        roles: [Role.MANAGEMENT, Role.ADMIN],
      },
    ],
  },
  {
    label: 'Diagnosis Entry',
    url: '/ohc/diagnosis-entry',
    urlName: 'diagnosis_entry',
    icon: '🔬',
    roles: [Role.ADMIN, Role.DOCTOR],
  },
  // {
  //   label: 'Complete Intake',
  //   url: '/ohc/complete-intake',
  //   urlName: 'complete_intake',
  //   icon: '✅',
  //   roles: [Role.ADMIN, Role.NURSE, Role.DOCTOR],
  // },
  {
    label: 'Referrals',
    url: '/ahc/referrals',
    urlName: 'referrals',
    icon: '🏢',
    roles: [Role.ADMIN, Role.NURSE, Role.EHS, Role.HR, Role.DOCTOR],
  },
  // {
  //   label: 'Hospital Selection',
  //   url: '/ahc/hospital-selection',
  //   urlName: 'hospital_selection',
  //   icon: '🏨',
  //   roles: [Role.ADMIN, Role.NURSE, Role.EHS, Role.HR, Role.KAM, Role.DOCTOR],
  // },
  {
    label: 'Payments',
    url: '/payments',
    urlName: 'payments',
    icon: '💳',
    roles: [Role.ADMIN, Role.HR, Role.KAM],
  },
  {
    label: 'Medicine Management',
    url: '/medicine-management',
    urlName: 'medicine_management',
    icon: 'Rx',
    roles: [Role.ADMIN, Role.NURSE, Role.DOCTOR],
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
  if (!navItem) return false;

  // Check if item has children
  if (navItem.children) {
    const hasAccessibleChild = navItem.children.some((child) => child.roles.includes(userRole));
    return hasAccessibleChild;
  }

  return navItem.roles.includes(userRole);
};
