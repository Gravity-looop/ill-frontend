import { ClipboardCheck, CreditCard, MessagesSquare, UserRound, WalletCards } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from './ui'

const items = [
  { label: 'Requests', path: '/user/payment-requests', icon: CreditCard },
  { label: 'Proofs', path: '/user/submissions', icon: ClipboardCheck },
  { label: 'Balance', path: '/user/balance-history', icon: WalletCards },
  { label: 'Chat', path: '/user/chat', icon: MessagesSquare, badge: true },
  { label: 'Profile', path: '/user/profile', icon: UserRound },
]

export default function BottomNav({ unread = 0 }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ label, path, icon: Icon, badge }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-1 pb-2 pt-2.5 text-[10px] font-bold transition active:scale-95',
                isActive ? 'text-cyan-600' : 'text-slate-400',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icon size={21} strokeWidth={isActive ? 2.3 : 1.9} />
                  {badge && unread > 0 ? (
                    <span className="absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold leading-none text-white ring-2 ring-white">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  ) : null}
                </span>
                {label}
                <span
                  className={cn(
                    'absolute inset-x-5 top-0 h-0.5 rounded-full transition',
                    isActive ? 'bg-cyan-600' : 'bg-transparent',
                  )}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
