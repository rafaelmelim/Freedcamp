import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleProtectedRoute } from './components/RoleProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { BoardPage } from './pages/BoardPage'
import { AdminPage } from './pages/AdminPage'
import { UserProfilesPage } from './pages/UserProfilesPage'
import { EmailSettingsPage } from './pages/EmailSettingsPage'
import { ArchivedTasksPage } from './pages/ArchivedTasksPage'

function App() {
  return (
    <AuthProvider>
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
          path="/archived"
          element={
            <ProtectedRoute>
              <ArchivedTasksPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/board" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App