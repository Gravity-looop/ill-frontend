import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ReceiptText, ShieldCheck, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Button, Field, Input, Notice, Spinner } from '../components/ui'

export default function UserLoginPage() {
  const { isUser, loading, loginUser, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user && isUser) navigate(location.state?.from || '/user/payment-requests', { replace: true })
  }, [isUser, location.state, navigate, user])

  useEffect(() => {
    document.title = mode === 'login' ? 'Sign in · ILL' : 'Create account · ILL'
  }, [mode])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'register') {
        await api.register({
          email: form.email.trim(),
          password: form.password,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
        })
      }
      await loginUser(form.email.trim(), form.password)
      navigate(location.state?.from || '/user/payment-requests', { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const switchMode = () => {
    setMode((current) => (current === 'login' ? 'register' : 'login'))
    setError('')
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-100 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex flex-col items-center pt-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-white shadow-lg shadow-cyan-200/60">
            <ReceiptText size={26} />
          </span>
          <p className="mt-4 text-xl font-extrabold tracking-[0.2em] text-slate-950">ILL</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Member portal</p>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50 sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-600">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {mode === 'login' ? 'Sign in to continue' : 'Join the member portal'}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            {mode === 'login'
              ? 'View payment requests and submit your payment proof.'
              : 'Create an account to submit screenshots and track your history.'}
          </p>

          {error ? (
            <div className="mt-5">
              <Notice tone="error">{error}</Notice>
            </div>
          ) : null}

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <>
                <Field label="First name" htmlFor="first_name">
                  <Input
                    id="first_name"
                    autoComplete="given-name"
                    required
                    value={form.first_name}
                    onChange={(event) => update('first_name', event.target.value)}
                    placeholder="John"
                  />
                </Field>
                <Field label="Last name" htmlFor="last_name">
                  <Input
                    id="last_name"
                    autoComplete="family-name"
                    required
                    value={form.last_name}
                    onChange={(event) => update('last_name', event.target.value)}
                    placeholder="Doe"
                  />
                </Field>
              </>
            ) : null}

            <Field label="Email address" htmlFor="email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  placeholder="you@example.com"
                  className="h-12 pl-11"
                />
              </div>
            </Field>

            <Field label="Password" htmlFor="password">
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  value={form.password}
                  onChange={(event) => update('password', event.target.value)}
                  placeholder="••••••••"
                  className="h-12 pl-11 pr-12"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition active:bg-slate-100"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>

            <Button
              type="submit"
              size="lg"
              disabled={submitting || loading}
              className="w-full bg-cyan-600 shadow-cyan-200 hover:bg-cyan-700 focus-visible:ring-cyan-500"
            >
              {submitting || loading ? <Spinner /> : null}
              {submitting || loading
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
              {submitting || loading ? null : <ArrowRight size={17} />}
            </Button>
          </form>

          <button
            type="button"
            onClick={switchMode}
            className="mt-5 w-full text-center text-sm font-semibold text-cyan-600 transition active:opacity-70"
          >
            {mode === 'login' ? 'New to ILL? Create an account' : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={14} /> Secure member access · your data stays private
        </div>

        <div className="mt-auto pt-8 text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition active:text-slate-600">
            <UserRound size={14} /> Are you staff? Open the admin console
          </Link>
        </div>
      </div>
    </div>
  )
}
