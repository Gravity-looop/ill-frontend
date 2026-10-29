import { useCallback, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Banknote, ClipboardCheck, CreditCard, LayoutDashboard, LogOut, Menu, MessagesSquare, ReceiptText, Users, WalletCards, X } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useChatUnread } from '../hooks/useChatUnread'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import { Avatar, Button, IconButton, cn } from './ui'

const navigation = [
  { key: 'overview', label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
  { key: 'requests', label: 'Payment Master', path: '/admin/payment-requests', icon: CreditCard },
  { key: 'submissions', label: 'Submissions', path: '/admin/submissions', icon: ClipboardCheck },
  { key: 'withdrawals', label: 'Withdrawals', path: '/admin/withdrawals', icon: Banknote },
  { key: 'users', label: 'Users', path: '/admin/users', icon: Users },
  { key: 'balance', label: 'Balance history', path: '/admin/balance-history', icon: WalletCards },
  { key: 'chat', label: 'Chat', path: '/admin/chat', icon: MessagesSquare },
]

const pageNames = {
  '/admin/dashboard': 'Overview',
  '/admin/payment-requests': 'Payment Master',
  '/admin/submissions': 'Submissions',
  '/admin/withdrawals': 'Withdrawals',
  '/admin/users': 'Users',
  '/admin/balance-history': 'Balance history',
  '/admin/chat': 'Chat',
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-950/20">
        <ReceiptText size={20} />
      </div>
      <div>
        <p className="text-sm font-extrabold tracking-[0.18em] text-white">ILL</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Admin console</p>
      </div>
    </div>
  )
}

export default function AdminShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { unread } = useChatUnread()
  const fetchWithdrawalSummary = useCallback(() => api.adminWithdrawalSummary(), [])
  const { summary: withdrawalSummary } = useRefreshOnFocus(fetchWithdrawalSummary)
  const counts = {
    chat: unread,
    withdrawals: withdrawalSummary?.pending_count ?? 0,
  }
  const pageName = pageNames[location.pathname] || 'Admin console'

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 py-6">
        <Brand />
        <IconButton label="Close menu" className="text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setMobileOpen(false)}>
          <X size={19} />
        </IconButton>
      </div>
      <div className="px-4 pt-5">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
        <nav className="mt-3 space-y-1">
          {navigation.map(({ key, label, path, icon: Icon }) => {
            const count = counts[key] ?? 0
            return (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition',
                  isActive ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
                )}
              >
                <Icon size={18} strokeWidth={1.9} />
                {label}
                {count > 0 ? (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1.5 text-[10px] font-bold text-white">
                    {count > 99 ? '99+' : count}
                  </span>
                ) : null}
              </NavLink>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <Avatar name={`${user?.first_name || ''} ${user?.last_name || ''}`} email={user?.email} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user?.first_name || user?.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Administrator'}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-slate-400 hover:bg-white/10 hover:text-white" onClick={handleLogout}>
          <LogOut size={17} /> Sign out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 bg-slate-950 lg:block">{sidebar}</aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-slate-950/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-72 bg-slate-950 shadow-2xl">{sidebar}</aside>
        </div>
      ) : null}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3">
              <IconButton label="Open menu" className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={20} /></IconButton>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Administrator</p>
                <p className="mt-0.5 text-sm font-bold text-slate-900 sm:text-base">{pageName}</p>
              </div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <div className="h-8 w-px bg-slate-200" />
              <Avatar name={`${user?.first_name || ''} ${user?.last_name || ''}`} email={user?.email} size="sm" />
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800">{user?.first_name || 'Admin'} {user?.last_name || ''}</p>
                <p className="text-[11px] text-slate-400">Staff account</p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-72px)] max-w-[1600px] px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
