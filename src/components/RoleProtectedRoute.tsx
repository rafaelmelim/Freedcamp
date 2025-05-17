import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface RoleProtectedRouteProps {
  children: React.ReactNode
  requiredRole: string
}

export function RoleProtectedRoute({ children, requiredRole }: RoleProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user || !hasRole(requiredRole)) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}