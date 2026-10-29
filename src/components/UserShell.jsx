import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChatUnread } from '../hooks/useChatUnread'
import BottomNav from './BottomNav'
import { cn, formatAmount } from './ui'

const TITLES = {
  '/user/payment-requests': 'Payment requests',
  '/user/submissions': 'My proofs',
  '/user/balance-history': 'Balance history',
  '/user/chat': 'Support chat',
  '/user/profile': 'Profile',
}

const PORTAL_THEME_COLOR = '#0891b2'

export default function UserShell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { unread } = useChatUnread()
  const isRoot = Object.prototype.hasOwnProperty.call(TITLES, location.pathname)
  const title = isRoot ? TITLES[location.pathname] : 'Payment request'

  useEffect(() => {
    document.title = `${title} · ILL`
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', PORTAL_THEME_COLOR)
  }, [title])

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-100 text-slate-900">
      <header className="z-30 shrink-0 border-b border-slate-200/80 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-3">
          {isRoot ? null : (
            <button
              type="button"
              aria-label="Go back"
              onClick={() => navigate(-1)}
              className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="min-w-0 flex-1 truncate text-[17px] font-bold tracking-tight text-slate-950">{title}</h1>
          {location.pathname === '/user/profile' ? null : (
            <span className="shrink-0 rounded-full bg-cyan-50 px-3 py-1.5 text-[13px] font-bold text-cyan-700">
              {formatAmount(user?.balance)}
            </span>
          )}
        </div>
      </header>

      <main className={cn('app-scroll mx-auto w-full max-w-2xl min-h-0 flex-1 overflow-y-auto overscroll-contain pb-app-nav')}>
        <Outlet />
      </main>

      <BottomNav unread={unread} />
    </div>
  )
}
