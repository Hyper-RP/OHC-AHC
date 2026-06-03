import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { ProtectedRoute, PortalLayout } from './components/layout';
import { Snackbar } from './components/ui';
import {
  Login,
  PublicHome,
  HowItWorks,
  Dashboard,
  OHCVisitForm,
  DiagnosisEntry,
  ReferralPage,
  HospitalSelection,
  PaymentPage,
  ReportsPage,
  EmployeeHealthHistory,
  EmployeeHealthHistoryDetail,
  DiseaseTrends,
  DepartmentStats,
  CompleteIntake,
  MedicineManagement,
  AddMedicine,
  NurseVisitForm,
  PreEmploymentCheckupForm,
  PreEmploymentDoctorDashboard,
  PreEmploymentDoctorRequestPage,
  PreEmploymentPharmacistDashboard,
  PreEmploymentPharmacistRequestPage,
  DoctorDashboard,
  DoctorRequestPage,
  PharmacistDashboard,
  PharmacistRequestPage,
  EHSDashboard,
  ManagementDashboard,
  OPDDetailsPage,
  PreEmploymentDetailsPage,
  AHCDetailsPage,
  IncidentDetailsPage,
  EmergencyDetailsPage,
  ReferredDetailsPage,
  MetricDetailsPage,
  DepartmentDetailsPage,
} from './components/pages';

/**
 * Main App component
 * Configures routing and providers for the application
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SnackbarProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicHome />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="ohc/visit-form" element={<OHCVisitForm />} />
              <Route path="ohc/diagnosis-entry" element={<DiagnosisEntry />} />
              <Route path="ohc/complete-intake" element={<CompleteIntake />} />
              <Route path="ahc/referrals" element={<ReferralPage />} />
              <Route path="ahc/hospital-selection" element={<HospitalSelection />} />
              <Route path="payments" element={<PaymentPage />} />
              <Route path="medicine-management" element={<MedicineManagement />} />
              <Route path="medicine-management/add" element={<AddMedicine />} />
              <Route path="reports/medical" element={<ReportsPage />} />
              <Route path="reports/employee-history" element={<EmployeeHealthHistory />} />
              <Route path="reports/employee-history/:employeeId" element={<EmployeeHealthHistoryDetail />} />
              <Route path="reports/disease-trends" element={<DiseaseTrends />} />
              <Route path="reports/department-stats" element={<DepartmentStats />} />
              {/* Pre-Employment Checkup */}
              <Route path="pre-employment-checkup" element={<PreEmploymentCheckupForm />} />
              <Route path="pre-employment-doctor" element={<PreEmploymentDoctorDashboard />} />
              <Route path="pre-employment-doctor/request/:visitId" element={<PreEmploymentDoctorRequestPage />} />
              <Route path="pre-employment-pharmacist" element={<PreEmploymentPharmacistDashboard />} />
              <Route path="pre-employment-pharmacist/request/:prescriptionId" element={<PreEmploymentPharmacistRequestPage />} />
              {/* Role-specific dashboards */}
              <Route path="nurse/visit-form" element={<NurseVisitForm />} />
              <Route path="doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="doctor/request/:visitId" element={<DoctorRequestPage />} />
              <Route path="pharmacist/dashboard" element={<PharmacistDashboard />} />
              <Route path="pharmacist/request/:prescriptionId" element={<PharmacistRequestPage />} />
              <Route path="ehs/dashboard" element={<EHSDashboard />} />
              <Route path="ehs/opd-details" element={<OPDDetailsPage />} />
              <Route path="ehs/pre-employment-details" element={<PreEmploymentDetailsPage />} />
              <Route path="ehs/ahc-details" element={<AHCDetailsPage />} />
              <Route path="ehs/incident-details" element={<IncidentDetailsPage />} />
              <Route path="ehs/emergency-details" element={<EmergencyDetailsPage />} />
              <Route path="ehs/referred-details" element={<ReferredDetailsPage />} />
              <Route path="dashboard/metric-details/:metricSlug" element={<MetricDetailsPage />} />
              <Route path="dashboard/department-details/:departmentMetricSlug" element={<DepartmentDetailsPage />} />
              <Route path="management/dashboard" element={<ManagementDashboard />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Snackbar />
        </SnackbarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
