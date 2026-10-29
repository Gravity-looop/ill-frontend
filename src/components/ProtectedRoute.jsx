import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingState } from './ui'

export default function ProtectedRoute() {
  const { isAdmin, isUser, loading, user } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingState label="Restoring your session" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (isUser) return <Navigate to="/user/payment-requests" replace />
  if (!isAdmin) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
