import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingState } from './ui'

export default function UserProtectedRoute() {
  const { isAdmin, isUser, loading, user } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingState label="Restoring your session" />
  if (!user) return <Navigate to="/login/user-staff/" replace state={{ from: location.pathname }} />
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />
  if (!isUser) return <Navigate to="/login/user-staff/" replace state={{ from: location.pathname }} />
  return <Outlet />
}
