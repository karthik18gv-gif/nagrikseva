import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import ChatBot from './components/common/ChatBot'

import HomePage from './pages/public/HomePage'
import AboutPage from './pages/public/AboutPage'
import ServicesPage from './pages/public/ServicesPage'
import ContactPage from './pages/public/ContactPage'
import FAQPage from './pages/public/FAQPage'
import NotFoundPage from './pages/public/NotFoundPage'
import CitizenLogin from './pages/public/CitizenLogin'
import CitizenRegister from './pages/public/CitizenRegister'
import VerifyCertificatePage from './pages/public/VerifyCertificatePage'
import EmployeeLogin from './pages/public/EmployeeLogin'
import OfficerLogin from './pages/public/OfficerLogin'
import AdminLogin from './pages/public/AdminLogin'

import CitizenLayout from './layouts/CitizenLayout'
import CitizenDashboard from './pages/citizen/CitizenDashboard'
import CitizenProfile from './pages/citizen/CitizenProfile'
import CitizenApplications from './pages/citizen/CitizenApplications'
import CitizenApply from './pages/citizen/CitizenApply'
import CitizenTrack from './pages/citizen/CitizenTrack'
import CitizenNotifications from './pages/citizen/CitizenNotifications'
import CitizenSupport from './pages/citizen/CitizenSupport'
import CitizenReports from './pages/citizen/CitizenReports'

import EmployeeLayout from './layouts/EmployeeLayout'
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import EmployeeApplications from './pages/employee/EmployeeApplications'
import EmployeeApplicationDetail from './pages/employee/EmployeeApplicationDetail'
import EmployeePension from './pages/employee/EmployeePension'
import EmployeeProfile from './pages/employee/EmployeeProfile'
import EmployeeReports from './pages/employee/EmployeeReports'

import OfficerLayout from './layouts/OfficerLayout'
import OfficerDashboard from './pages/officer/OfficerDashboard'
import OfficerApplications from './pages/officer/OfficerApplications'
import OfficerApplicationDetail from './pages/officer/OfficerApplicationDetail'
import OfficerPension from './pages/officer/OfficerPension'
import OfficerReports from './pages/officer/OfficerReports'
import OfficerProfile from './pages/officer/OfficerProfile'

import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCitizens from './pages/admin/AdminCitizens'
import AdminEmployees from './pages/admin/AdminEmployees'
import AdminOfficers from './pages/admin/AdminOfficers'
import AdminDepartments from './pages/admin/AdminDepartments'
import AdminCertificateTypes from './pages/admin/AdminCertificateTypes'
import AdminApplications from './pages/admin/AdminApplications'
import AdminPension from './pages/admin/AdminPension'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminFAQs from './pages/admin/AdminFAQs'
import AdminSupport from './pages/admin/AdminSupport'
import AdminAuditLogs from './pages/admin/AdminAuditLogs'
import AdminProfile from './pages/admin/AdminProfile'
import AdminReports from './pages/admin/AdminReports'

const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, role, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#1a3a6b] border-t-transparent rounded-full animate-spin"></div></div>
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (allowedRole && role !== allowedRole) return <Navigate to="/" replace />
  return children
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/services" element={<ServicesPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/faq" element={<FAQPage />} />
    <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
    <Route path="/citizen/login" element={<CitizenLogin />} />
    <Route path="/citizen/register" element={<CitizenRegister />} />
    <Route path="/employee/login" element={<EmployeeLogin />} />
    <Route path="/officer/login" element={<OfficerLogin />} />
    <Route path="/admin/login" element={<AdminLogin />} />

    <Route path="/citizen" element={<ProtectedRoute allowedRole="citizen"><CitizenLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/citizen/dashboard" replace />} />
      <Route path="dashboard" element={<CitizenDashboard />} />
      <Route path="profile" element={<CitizenProfile />} />
      <Route path="apply" element={<CitizenApply />} />
      <Route path="applications" element={<CitizenApplications />} />
      <Route path="track" element={<CitizenTrack />} />
      <Route path="notifications" element={<CitizenNotifications />} />
      <Route path="reports" element={<CitizenReports />} />
      <Route path="support" element={<CitizenSupport />} />
    </Route>

    <Route path="/employee" element={<ProtectedRoute allowedRole="employee"><EmployeeLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/employee/dashboard" replace />} />
      <Route path="dashboard" element={<EmployeeDashboard />} />
      <Route path="applications" element={<EmployeeApplications />} />
      <Route path="applications/:id" element={<EmployeeApplicationDetail />} />
      <Route path="pension" element={<EmployeePension />} />
      <Route path="reports" element={<EmployeeReports />} />
      <Route path="profile" element={<EmployeeProfile />} />
    </Route>

    <Route path="/officer" element={<ProtectedRoute allowedRole="officer"><OfficerLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/officer/dashboard" replace />} />
      <Route path="dashboard" element={<OfficerDashboard />} />
      <Route path="applications" element={<OfficerApplications />} />
      <Route path="applications/:id" element={<OfficerApplicationDetail />} />
      <Route path="pension" element={<OfficerPension />} />
      <Route path="reports" element={<OfficerReports />} />
      <Route path="profile" element={<OfficerProfile />} />
    </Route>

    <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="citizens" element={<AdminCitizens />} />
      <Route path="employees" element={<AdminEmployees />} />
      <Route path="officers" element={<AdminOfficers />} />
      <Route path="departments" element={<AdminDepartments />} />
      <Route path="certificate-types" element={<AdminCertificateTypes />} />
      <Route path="applications" element={<AdminApplications />} />
      <Route path="pension" element={<AdminPension />} />
      <Route path="announcements" element={<AdminAnnouncements />} />
      <Route path="faqs" element={<AdminFAQs />} />
      <Route path="support" element={<AdminSupport />} />
      <Route path="audit-logs" element={<AdminAuditLogs />} />
      <Route path="reports" element={<AdminReports />} />
      <Route path="profile" element={<AdminProfile />} />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
)

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider><AppRoutes /><ChatBot /></AuthProvider>
    </ErrorBoundary>
  )
}
