import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { Button, Field, Notice, Spinner, cn } from '../components/ui'

export default function UserLoginPage() {
  const { isAdmin, isUser, loading, loginUser, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    if (isAdmin) navigate('/admin/dashboard', { replace: true })
    else if (isUser) navigate(location.state?.from || '/user/payment-requests', { replace: true })
  }, [isAdmin, isUser, location.state, navigate, user])

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
    <div className="flex min-h-[100dvh] flex-col bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {mode === 'login' ? 'Member access' : 'New account'}
        </p>
        <h1 className="mt-3 text-[28px] font-semibold leading-tight tracking-tight text-slate-900">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {mode === 'login'
            ? 'View your payment requests and submit proof.'
            : 'Track your balance and submit proofs in one place.'}
        </p>

        {error ? (
          <div className="mt-6">
            <Notice tone="error">{error}</Notice>
          </div>
        ) : null}

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" htmlFor="first_name">
                <MinimalInput
                  id="first_name"
                  autoComplete="given-name"
                  required
                  value={form.first_name}
                  onChange={(event) => update('first_name', event.target.value)}
                  placeholder="John"
                />
              </Field>
              <Field label="Last name" htmlFor="last_name">
                <MinimalInput
                  id="last_name"
                  autoComplete="family-name"
                  required
                  value={form.last_name}
                  onChange={(event) => update('last_name', event.target.value)}
                  placeholder="Doe"
                />
              </Field>
            </div>
          ) : null}

          <Field label="Email" htmlFor="email">
            <MinimalInput
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Password" htmlFor="password">
            <div className="relative">
              <MinimalInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                placeholder="••••••••"
                className="pr-12"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition active:bg-slate-100"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>

          <Button
            type="submit"
            size="lg"
            disabled={submitting || loading}
            className="mt-2 w-full bg-cyan-600 shadow-none hover:bg-cyan-700 focus-visible:ring-cyan-500"
          >
            {submitting || loading ? <Spinner /> : null}
            {submitting || loading
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
            {submitting || loading ? null : <ArrowRight size={16} />}
          </Button>
        </form>

        <button
          type="button"
          onClick={switchMode}
          className="mt-5 self-center text-[13px] font-medium text-slate-500 transition active:opacity-70"
        >
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </button>
      </div>

      <div className="mx-auto w-full max-w-sm border-t border-slate-100 pt-4 text-center">
        <Link to="/login" className="text-[13px] font-medium text-slate-400 transition active:text-slate-600">
          Staff member? Open the admin console
        </Link>
      </div>
    </div>
  )
}

function MinimalInput({ className, ...props }) {
  return (
    <input
      className={cn(
        'h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-50',
        className,
      )}
      {...props}
    />
  )
}
