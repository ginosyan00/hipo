import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/Login';
import { RegisterPage } from './pages/auth/Register';
import { RegisterUserPage } from './pages/auth/RegisterUser';
import { PendingApprovalPage } from './pages/auth/PendingApproval';
import { DashboardPage } from './pages/dashboard/Dashboard';
import { PatientsPage } from './pages/dashboard/Patients';
import { AppointmentsPage } from './pages/dashboard/Appointments';
import { StaffPage } from './pages/dashboard/Staff';
import { SettingsPage } from './pages/dashboard/Settings';
import { PatientDashboard } from './pages/dashboard/PatientDashboard';
import { DoctorDashboard } from './pages/dashboard/DoctorDashboard';
import { PartnerDashboard } from './pages/dashboard/PartnerDashboard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { HomePage } from './pages/public/Home';
import { ClinicsPage } from './pages/public/Clinics';
import { ClinicPage } from './pages/public/ClinicPage';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { NewDashboardLayout } from './components/dashboard/NewDashboardLayout';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { UserRole } from './types/api.types';

/**
 * Main Application Component
 * Router + Routes setup with Multi-Role Support
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Website */}
        <Route path="/" element={<HomePage />} />
        <Route path="/clinics" element={<ClinicsPage />} />
        <Route path="/clinic/:slug" element={<ClinicPage />} />

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-user" element={<RegisterUserPage />} />
        <Route
          path="/pending-approval"
          element={
            <RoleProtectedRoute requireActive={false}>
              <PendingApprovalPage />
            </RoleProtectedRoute>
          }
        />

        {/* Protected Routes - Role-based Dashboards */}
        <Route
          path="/dashboard/patient"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.PATIENT]}>
              <PatientDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/dashboard/doctor"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.DOCTOR]}>
              <DoctorDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/dashboard/partner"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.PARTNER]}>
              <PartnerDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminDashboard />
            </RoleProtectedRoute>
          }
        />

        {/* Protected Routes - Main Dashboard (для клиник и ADMIN с clinicId) */}
        <Route
          path="/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ADMIN, 'CLINIC']}>
              <DashboardPage />
            </RoleProtectedRoute>
          }
        />
        
        {/* Protected Routes - Dashboard Pages (только для ADMIN и CLINIC) */}
        <Route
          path="/dashboard/patients"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ADMIN, 'CLINIC']}>
              <PatientsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/dashboard/appointments"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ADMIN, 'CLINIC']}>
              <AppointmentsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/dashboard/staff"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ADMIN, 'CLINIC']}>
              <StaffPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/dashboard/analytics"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ADMIN, 'CLINIC']}>
              <NewDashboardLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-text-100">Аналитика</h1>
                  <p className="text-text-10 text-sm mt-2">Функция находится в разработке</p>
                </div>
              </NewDashboardLayout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ADMIN, 'CLINIC']}>
              <SettingsPage />
            </RoleProtectedRoute>
          }
        />
        
        {/* Protected Routes - Nested Dashboard Routes (для старых страниц) */}
        <Route
          path="/dashboard/old"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ADMIN, 'CLINIC']}>
              <DashboardLayout />
            </RoleProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="analytics" element={<div className="p-6"><h1 className="text-2xl font-bold">Аналитика (в разработке)</h1></div>} />
          <Route path="settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Настройки (в разработке)</h1></div>} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

