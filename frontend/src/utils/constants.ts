import { VisitType, TriageLevel, ReferralPriority, InvoiceStatus, PaymentMethod } from '../types';

/**
 * Visit type options for dropdowns
 */
export const VISIT_TYPE_OPTIONS = [
  { value: VisitType.WALK_IN, label: 'Walk-In' },
  { value: VisitType.PERIODIC, label: 'Periodic' },
  { value: VisitType.PRE_EMPLOYMENT, label: 'Pre-Employment' },
  { value: VisitType.FOLLOW_UP, label: 'Follow-Up' },
  { value: VisitType.EMERGENCY, label: 'Emergency' },
];

/**
 * Triage level options with colors
 */
export const TRIAGE_LEVEL_OPTIONS = [
  { value: TriageLevel.LOW, label: 'Low', color: '#2c875f' },
  { value: TriageLevel.MEDIUM, label: 'Medium', color: '#e6a700' },
  { value: TriageLevel.HIGH, label: 'High', color: '#e67e00' },
  { value: TriageLevel.CRITICAL, label: 'Critical', color: '#c45d5d' },
];

/**
 * Referral priority options
 */
export const REFERRAL_PRIORITY_OPTIONS = [
  { value: ReferralPriority.NORMAL, label: 'Normal' },
  { value: ReferralPriority.URGENT, label: 'Urgent' },
  { value: ReferralPriority.EMERGENCY, label: 'Emergency' },
];

/**
 * Invoice status options
 */
export const INVOICE_STATUS_OPTIONS = [
  { value: InvoiceStatus.DRAFT, label: 'Draft' },
  { value: InvoiceStatus.ISSUED, label: 'Issued' },
  { value: InvoiceStatus.PARTIALLY_PAID, label: 'Partially Paid' },
  { value: InvoiceStatus.PAID, label: 'Paid' },
  { value: InvoiceStatus.OVERDUE, label: 'Overdue' },
  { value: InvoiceStatus.CANCELLED, label: 'Cancelled' },
];

/**
 * Payment method options
 */
export const PAYMENT_METHOD_OPTIONS = [
  { value: PaymentMethod.CASH, label: 'Cash' },
  { value: PaymentMethod.CARD, label: 'Card' },
  { value: PaymentMethod.UPI, label: 'UPI' },
  { value: PaymentMethod.NETBANKING, label: 'Net Banking' },
  { value: PaymentMethod.RAZORPAY, label: 'Razorpay' },
];

/**
 * Report period options
 */
export const REPORT_PERIOD_OPTIONS = [
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: '180', label: 'Last 6 Months' },
  { value: '365', label: 'Last 1 Year' },
];

/**
 * Severity options
 */
export const SEVERITY_OPTIONS = [
  { value: 'MILD', label: 'Mild' },
  { value: 'MODERATE', label: 'Moderate' },
  { value: 'SERIOUS', label: 'Serious' },
  { value: 'CRITICAL', label: 'Critical' },
];

/**
 * Fitness decision options
 */
export const FITNESS_DECISION_OPTIONS = [
  { value: 'FIT', label: 'Fit' },
  { value: 'FIT_WITH_RESTRICTION', label: 'Fit with Restriction' },
  { value: 'TEMPORARY_UNFIT', label: 'Temporarily Unfit' },
  { value: 'UNFIT', label: 'Unfit' },
];

/**
 * Dosage frequency options
 */
export const DOSAGE_FREQUENCY_OPTIONS = [
  { value: 'Once daily', label: 'Once Daily' },
  { value: 'Twice daily', label: 'Twice Daily' },
  { value: 'Three times daily', label: 'Three Times Daily' },
  { value: 'Four times daily', label: 'Four Times Daily' },
  { value: 'Every 8 hours', label: 'Every 8 Hours' },
  { value: 'Every 12 hours', label: 'Every 12 Hours' },
  { value: 'Every 24 hours', label: 'Every 24 Hours' },
  { value: 'As needed', label: 'As Needed' },
];

/**
 * Prescription route options
 */
export const PRESCRIPTION_ROUTE_OPTIONS = [
  { value: 'Oral', label: 'Oral' },
  { value: 'Intravenous', label: 'Intravenous' },
  { value: 'Intramuscular', label: 'Intramuscular' },
  { value: 'Subcutaneous', label: 'Subcutaneous' },
  { value: 'Topical', label: 'Topical' },
  { value: 'Inhalation', label: 'Inhalation' },
  { value: 'Rectal', label: 'Rectal' },
];

/**
 * Hospital status options
 */
export const HOSPITAL_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

/**
 * Pagination default settings
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

/**
 * Form validation patterns
 */
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\d{10}$/,
  employeeCode: /^EMP-\d+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

/**
 * Date format for display
 */
export const DATE_FORMAT = {
  DISPLAY: 'MMM DD, YYYY',
  INPUT: 'YYYY-MM-DD',
  DATETIME: 'MMM DD, YYYY HH:mm',
};

/**
 * File upload limits
 */
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 5,
  ALLOWED_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
};
