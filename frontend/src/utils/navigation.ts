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
    icon: 'DB',
    roles: [Role.ADMIN, Role.NURSE, Role.EHS, Role.HR, Role.KAM, Role.DOCTOR],
  },
  {
    label: 'OHC',
    url: '/ohc',
    urlName: 'ohc_visit_form',
    icon: 'OHC',
    roles: [Role.ADMIN, Role.NURSE, Role.DOCTOR, Role.PHARMACIST, Role.EHS, Role.MANAGEMENT],
    children: [
      { label: 'Nurse Module', url: '/nurse/visit-form', urlName: 'nurse', icon: 'N', roles: [Role.NURSE, Role.ADMIN] },
      { label: 'Doctor Module', url: '/doctor/dashboard', urlName: 'doctor', icon: 'D', roles: [Role.DOCTOR, Role.ADMIN] },
      { label: 'Pharmacist Module', url: '/pharmacist/dashboard', urlName: 'pharmacist', icon: 'Rx', roles: [Role.PHARMACIST, Role.ADMIN] },
      { label: 'EHS Dashboard', url: '/ehs/dashboard', urlName: 'ehs', icon: 'EHS', roles: [Role.EHS, Role.ADMIN, Role.MANAGEMENT] },
      { label: 'Management Dashboard', url: '/management/dashboard', urlName: 'management', icon: 'MGMT', roles: [Role.MANAGEMENT, Role.ADMIN] },
    ],
  },
  {
    label: 'Payments',
    url: '/payments',
    urlName: 'payments',
    icon: 'PAY',
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
    label: 'Pre-Employment Checkup',
    url: '/pre-employment-checkup',
    urlName: 'pre_employment_checkup',
    icon: 'PEC',
    roles: [Role.ADMIN, Role.NURSE],
  },
  {
    label: 'Annual Health Checkup',
    url: '/annual-health-checkup',
    urlName: 'annual_health_checkup',
    icon: 'AHC',
    roles: [Role.ADMIN, Role.NURSE],
  },
  {
    label: 'Pre-Employment Doctor',
    url: '/pre-employment-doctor',
    urlName: 'pre_employment_doctor',
    icon: 'DOC',
    roles: [Role.DOCTOR],
  },
  {
    label: 'Annual Health Checkup Doctor',
    url: '/annual-health-doctor',
    urlName: 'annual_health_doctor',
    icon: 'AHC',
    roles: [Role.DOCTOR],
  },
  {
    label: 'Pre-Employment Pharmacist',
    url: '/pre-employment-pharmacist',
    urlName: 'pre_employment_pharmacist',
    icon: 'Rx',
    roles: [Role.PHARMACIST],
  },
  {
    label: 'Annual Health Checkup Pharmacist',
    url: '/annual-health-pharmacist',
    urlName: 'annual_health_pharmacist',
    icon: 'Rx',
    roles: [Role.PHARMACIST],
  },
  {
    label: 'Employee History',
    url: '/reports/employee-history',
    urlName: 'employee_history',
    icon: 'HIS',
    roles: [Role.ADMIN, Role.HR, Role.EHS, Role.NURSE],
  },

  // {
  //   label: 'Diagnosis Entry',
  //   url: '/ohc/diagnosis-entry',
  //   urlName: 'diagnosis_entry',
  //   icon: '🔬',
  //   roles: [Role.ADMIN, Role.DOCTOR],
  // },
  // {
  //   label: 'Complete Intake',
  //   url: '/ohc/complete-intake',
  //   urlName: 'complete_intake',
  //   icon: '✅',
  //   roles: [Role.ADMIN, Role.NURSE, Role.DOCTOR],
  // },
  // {
  //   label: 'Referrals',
  //   url: '/ahc/referrals',
  //   urlName: 'referrals',
  //   icon: '🏢',
  //   roles: [Role.ADMIN, Role.NURSE, Role.EHS, Role.HR, Role.DOCTOR],
  // },
  // {
  //   label: 'Hospital Selection',
  //   url: '/ahc/hospital-selection',
  //   urlName: 'hospital_selection',
  //   icon: '🏨',
  //   roles: [Role.ADMIN, Role.NURSE, Role.EHS, Role.HR, Role.KAM, Role.DOCTOR],
  // },

  // {
  //   label: 'Medical Reports',
  //   url: '/reports/medical',
  //   urlName: 'medical_reports',
  //   icon: '📋',
  //   roles: [Role.ADMIN, Role.NURSE, Role.EHS, Role.HR, Role.KAM, Role.DOCTOR],
  // },
/** 
  {
    label: 'Pre-Employment Pharmacist',
    url: '/pre-employment-pharmacist',
    urlName: 'pre_employment_pharmacist',
    icon: 'Rx',
    roles: [Role.PHARMACIST],
  },
  {
    label: 'Annual Health Pharmacist',
    url: '/annual-health-pharmacist',
    urlName: 'annual_health_pharmacist',
    icon: 'Rx',
    roles: [Role.PHARMACIST],
  },

  {
    label: 'Annual Health Doctor',
    url: '/annual-health-doctor',
    urlName: 'annual_health_doctor',
    icon: 'AHC',
    roles: [Role.DOCTOR],
  },

  {
    label: 'Annual Health Check Up',
    url: '/annual-health-checkup',
    urlName: 'annual_health_checkup',
    icon: 'AHC',
    roles: [Role.ADMIN, Role.NURSE],
  },


*/

// {
  //   label: 'Disease Trends',
  //   url: '/reports/disease-trends',
  //   urlName: 'disease_trends',
  //   icon: '📈',
  //   roles: [Role.ADMIN, Role.HR, Role.EHS],
  // },
  // {
  //   label: 'Department Stats',
  //   url: '/reports/department-stats',
  //   urlName: 'department_stats',
  //   icon: '🏢',
  //   roles: [Role.ADMIN, Role.HR, Role.EHS],
  // },

];

/**
 * Filter navigation items based on user role
 * @param userRole - User's role
 * @returns Array of navigation items accessible to the user
 */
export const getNavItemsForRole = (userRole: Role): NavItem[] => {
  const items: NavItem[] = [];

  for (const item of NAV_ITEMS) {
    if (item.roles.includes(userRole)) {
      if (item.urlName === 'ohc_visit_form' && item.children) {
        const roleSpecificChild = item.children.find((child) => child.roles.includes(userRole));
        if (roleSpecificChild) {
          items.push({
            ...item,
            label: userRole === Role.EHS ? 'Analysis' : item.label,
            url: roleSpecificChild.url,
            children: undefined,
          });
        }
      } else {
        items.push(item);
      }
    }
  }

  return items;
};

/**
 * Check if a user has access to a specific navigation item
 * @param url - URL of the navigation item
 * @param userRole - User's role
 * @returns Boolean indicating if user has access
 */
export const hasAccessToRoute = (url: string, userRole: Role): boolean => {
  const navItem = NAV_ITEMS.find((item) => {
    if (item.url === url) return true;
    if (item.children) {
      return item.children.some((child) => child.url === url);
    }
    return false;
  });
  if (!navItem) return false;

  if (navItem.children) {
    const matchingChild = navItem.children.find((child) => child.url === url);
    return matchingChild ? matchingChild.roles.includes(userRole) : false;
  }

  return navItem.roles.includes(userRole);
};
