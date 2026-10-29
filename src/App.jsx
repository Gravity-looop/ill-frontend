import { Navigate, Route, Routes } from 'react-router-dom'
import AdminShell from './components/AdminShell'
import ProtectedRoute from './components/ProtectedRoute'
import UserProtectedRoute from './components/UserProtectedRoute'
import UserShell from './components/UserShell'
import AdminChatPage from './pages/AdminChatPage'
import BalanceHistoryPage from './pages/BalanceHistoryPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import PaymentRequestsPage from './pages/PaymentRequestsPage'
import SubmissionsPage from './pages/SubmissionsPage'
import UserBalanceHistoryPage from './pages/UserBalanceHistoryPage'
import UserChatPage from './pages/UserChatPage'
import UserLoginPage from './pages/UserLoginPage'
import UserPaymentRequestDetailPage from './pages/UserPaymentRequestDetailPage'
import UserPaymentRequestsPage from './pages/UserPaymentRequestsPage'
import UserProfilePage from './pages/UserProfilePage'
import UserSubmissionsPage from './pages/UserSubmissionsPage'
import UsersPage from './pages/UsersPage'
import WithdrawalsPage from './pages/WithdrawalsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/user-staff/" element={<UserLoginPage />} />
      <Route path="/login/user/" element={<UserLoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminShell />}>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/payment-requests" element={<PaymentRequestsPage />} />
          <Route path="/admin/submissions" element={<SubmissionsPage />} />
          <Route path="/admin/withdrawals" element={<WithdrawalsPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/balance-history" element={<BalanceHistoryPage />} />
          <Route path="/admin/chat" element={<AdminChatPage />} />
        </Route>
      </Route>
      <Route element={<UserProtectedRoute />}>
        <Route element={<UserShell />}>
          <Route path="/user" element={<Navigate to="/user/payment-requests" replace />} />
          <Route path="/user/dashboard" element={<Navigate to="/user/payment-requests" replace />} />
          <Route path="/user/payment-requests" element={<UserPaymentRequestsPage />} />
          <Route path="/user/payment-requests/:id" element={<UserPaymentRequestDetailPage />} />
          <Route path="/user/submissions" element={<UserSubmissionsPage />} />
          <Route path="/user/balance-history" element={<UserBalanceHistoryPage />} />
          <Route path="/user/chat" element={<UserChatPage />} />
          <Route path="/user/profile" element={<UserProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}
