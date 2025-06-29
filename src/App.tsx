import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SystemSettingsProvider } from './contexts/SystemSettingsContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleProtectedRoute } from './components/RoleProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { BoardPage } from './pages/BoardPage'
import { AdminPage } from './pages/AdminPage'
import { UserProfilesPage } from './pages/UserProfilesPage'
import { EmailSettingsPage } from './pages/EmailSettingsPage'
import { ArchivedProjectsPage } from './pages/ArchivedProjectsPage'
import { UsersPage } from './pages/UsersPage'
import { ImportExportSettingsPage } from './pages/ImportExportSettingsPage'
import { SystemSettingsPage } from './pages/SystemSettingsPage'
import ReportsChartsPage from './pages/ReportsChartsPage'

function App() {
  return (
    <AuthProvider>
      <SystemSettingsProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/board"
          element={
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute requiredRole="admin">
              <AdminPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/email"
          element={
            <RoleProtectedRoute requiredRole="admin">
              <EmailSettingsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/user-profiles"
          element={
            <RoleProtectedRoute requiredRole="admin">
              <UserProfilesPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleProtectedRoute requiredRole="admin">
              <UsersPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/archived"
          element={
            <ProtectedRoute>
              <ArchivedProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/charts"
          element={
            <RoleProtectedRoute requiredRole="admin">
              <ReportsChartsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/system"
          element={
            <RoleProtectedRoute requiredRole="admin">
              <SystemSettingsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/import-export"
          element={
            <RoleProtectedRoute requiredRole="admin">
              <ImportExportSettingsPage />
            </RoleProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/board" replace />} />
      </Routes>
      </SystemSettingsProvider>
    </AuthProvider>
  )
}

export default App