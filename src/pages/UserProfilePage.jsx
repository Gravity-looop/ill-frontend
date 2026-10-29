import { useEffect, useState } from 'react'
import { ChevronRight, Download, LogOut, ReceiptText, ShieldCheck, WalletCards } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sheet from '../components/Sheet'
import { Button, Notice, ScreenTitle, formatAmount } from '../components/ui'

function ProfileRow({ icon: Icon, label, value, onClick, tone = 'default' }) {
  const content = (
    <>
      <span
        className={
          tone === 'danger'
            ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600'
            : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500'
        }
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-slate-900">{label}</span>
        {value ? (
          <span className={tone === 'danger' ? 'block truncate text-[13px] text-rose-500' : 'block truncate text-[13px] text-slate-400'}>
            {value}
          </span>
        ) : null}
      </span>
      {onClick ? <ChevronRight className="shrink-0 text-slate-300" size={18} /> : null}
    </>
  )
  const classes = 'flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition active:bg-slate-50'
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    )
  }
  return <div className={classes}>{content}</div>
}

export default function UserProfilePage() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const displayName = user?.first_name || user?.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Member'
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase() || 'M'

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await logout()
      navigate('/login/user-staff/', { replace: true })
    } finally {
      setSigningOut(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div className="px-4 py-5">
      <ScreenTitle title="Profile" subtitle="Your ILL member account." />

      <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-5 py-6 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 text-2xl font-bold text-white shadow-lg shadow-cyan-200/60">
          {initials}
        </span>
        <p className="mt-3.5 text-lg font-bold tracking-tight text-slate-950">{displayName}</p>
        <p className="mt-0.5 truncate text-sm text-slate-400">{user?.email}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700">
          <ShieldCheck size={14} /> Member account
        </span>
      </div>

      <div className="mt-3 rounded-2xl bg-slate-950 p-5 text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">Available balance</p>
        <p className="mt-1.5 text-3xl font-bold tracking-tight">{formatAmount(user?.balance)}</p>
      </div>

      <button
        type="button"
        onClick={() => navigate('/user/balance-history')}
        className="mt-3 flex w-full items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 text-left transition active:scale-[0.99] active:bg-slate-50"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <WalletCards size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-slate-900">Balance history</span>
          <span className="block text-[13px] text-slate-400">See every credit on your account</span>
        </span>
        <ChevronRight className="shrink-0 text-slate-300" size={18} />
      </button>

      <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <ProfileRow icon={ReceiptText} label="Email address" value={user?.email} />
        <ProfileRow
          icon={ShieldCheck}
          label="Full name"
          value={[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Not provided'}
        />
        {installPrompt ? (
          <ProfileRow icon={Download} label="Install ILL app" value="Add to your home screen" onClick={handleInstall} />
        ) : null}
      </div>

      <div className="mt-3">
        <Button
          variant="secondary"
          size="lg"
          className="w-full border-rose-200 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50"
          onClick={() => setConfirmOpen(true)}
        >
          <LogOut size={18} /> Sign out
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">ILL member portal</p>

      <Sheet
        open={confirmOpen}
        onClose={() => (signingOut ? undefined : setConfirmOpen(false))}
        title="Sign out?"
        description="You will need your email and password to sign back in."
        footer={
          <div className="flex gap-2.5">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              disabled={signingOut}
              onClick={() => setConfirmOpen(false)}
            >
              Stay signed in
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-rose-600 shadow-rose-200 hover:bg-rose-700 focus-visible:ring-rose-500"
              disabled={signingOut}
              onClick={handleSignOut}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </Button>
          </div>
        }
      >
        <Notice tone="info">Your balance and submission history stay saved to your account.</Notice>
      </Sheet>
    </div>
  )
}
