import { useEffect, useState } from 'react'
import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Field, Input, Notice, Spinner } from '../components/ui'

export default function LoginPage() {
  const { isAdmin, isUser, loading, loginAdmin, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    if (isAdmin) navigate(location.state?.from || '/admin/dashboard', { replace: true })
    else if (isUser) navigate('/user/payment-requests', { replace: true })
  }, [isAdmin, isUser, location.state, navigate, user])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await loginAdmin(email.trim(), password)
      navigate(location.state?.from || '/admin/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-slate-950 p-10 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <ShieldCheck size={23} />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-[0.22em]">ILL</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-200">Secure administration</p>
            </div>
          </div>
        </div>
        <div className="relative max-w-xl">
          <p className="mb-5 flex items-center gap-2 text-sm font-semibold text-indigo-200"><Sparkles size={16} /> Operations workspace</p>
          <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-white xl:text-6xl">Keep every payment review moving forward.</h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-indigo-100/75">A focused workspace for creating payment requests, reviewing submitted proofs, and keeping user balances accurate.</p>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
            {['Requests', 'Reviews', 'Balances'].map((label) => <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"><p className="text-xs font-semibold text-indigo-100/70">{label}</p><p className="mt-2 h-1.5 w-10 rounded-full bg-white/60" /></div>)}
          </div>
        </div>
        <p className="relative text-xs text-indigo-200/60">Internal use only · Authorized staff access</p>
      </section>
      <section className="flex min-h-screen items-center justify-center bg-white px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white"><ShieldCheck size={20} /></div><div><p className="text-sm font-extrabold tracking-[0.2em] text-slate-950">ILL</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Admin console</p></div></div>
          </div>
          <div className="mb-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Welcome back</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">Sign in to continue</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Use your staff account to access the payment operations console.</p>
          </div>
          {error ? <Notice tone="error"><span className="flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</span></Notice> : null}
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <Field label="Work email" htmlFor="email">
              <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><Input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" className="pl-10" /></div>
            </Field>
            <Field label="Password" htmlFor="password">
              <div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><Input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="pl-10 pr-11" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            </Field>
            <Button type="submit" size="lg" className="w-full" disabled={submitting || loading}>{submitting || loading ? <Spinner /> : null}{submitting || loading ? 'Signing in…' : 'Sign in'}{!submitting && !loading ? <ArrowRight size={17} /> : null}</Button>
          </form>
           <p className="mt-8 text-center text-xs leading-5 text-slate-400">Access is limited to accounts with administrator permissions. Contact your system owner if you need an account.</p><p className="mt-4 text-center text-xs text-slate-400">Looking for your member account? <Link to="/user" className="font-bold text-indigo-600 hover:text-indigo-700">Open the user portal</Link></p>
        </div>
      </section>
    </div>
  )
}
