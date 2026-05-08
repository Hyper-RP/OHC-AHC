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
  DiseaseTrends,
  DepartmentStats,
  CompleteIntake,
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
              <Route path="reports/medical" element={<ReportsPage />} />
              <Route path="reports/employee-history" element={<EmployeeHealthHistory />} />
              <Route path="reports/disease-trends" element={<DiseaseTrends />} />
              <Route path="reports/department-stats" element={<DepartmentStats />} />
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
