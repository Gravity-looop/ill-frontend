import { useEffect, useId } from 'react'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, LoaderCircle, X } from 'lucide-react'

export function cn(...values) {
  return values.filter(Boolean).join(' ')
}

export function formatAmount(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatInr(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'A'
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

const buttonVariants = {
  primary: 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 focus-visible:ring-indigo-500',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-indigo-500',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-indigo-500',
  danger: 'bg-rose-600 text-white shadow-sm shadow-rose-200 hover:bg-rose-700 focus-visible:ring-rose-500',
  subtle: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus-visible:ring-indigo-500',
}

const buttonSizes = {
  sm: 'h-9 rounded-lg px-3 text-xs',
  md: 'h-10 rounded-xl px-4 text-sm',
  lg: 'h-12 rounded-xl px-5 text-sm',
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        buttonVariants[variant] || buttonVariants.primary,
        buttonSizes[size] || buttonSizes.md,
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export function IconButton({ label, children, className, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Card({ children, className, ...props }) {
  return (
    <section
      className={cn('rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40', className)}
      {...props}
    >
      {children}
    </section>
  )
}

export function PageHeader({ eyebrow, title, description, actions }) {
  const hasHeading = Boolean(eyebrow || title || description)
  return (
    <div className={cn('mb-7 flex flex-col gap-4', hasHeading ? 'sm:flex-row sm:items-end sm:justify-between' : 'sm:justify-end')}>
      {hasHeading ? (
        <div>
          {eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{eyebrow}</p> : null}
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
      ) : null}
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function StatCard({ label, value, detail, icon: Icon, tone = 'indigo' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
  }
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
          {detail ? <p className="mt-1 text-xs text-slate-400">{detail}</p> : null}
        </div>
        {Icon ? (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone] || tones.indigo)}>
            <Icon size={19} strokeWidth={2.2} />
          </span>
        ) : null}
      </div>
    </Card>
  )
}

export function Badge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    sky: 'bg-sky-50 text-sky-700',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide', tones[tone] || tones.slate)}>
      {children}
    </span>
  )
}

export function statusTone(status = '') {
  const value = status.toUpperCase()
  if (value === 'ACCEPTED' || value === 'PUBLISHED' || value === 'ACTIVE' || value === 'PAID') return 'emerald'
  if (value === 'PENDING') return 'amber'
  if (value === 'DECLINED' || value === 'CLOSED' || value === 'INACTIVE' || value === 'REJECTED') return 'rose'
  return 'slate'
}

export function StatusBadge({ status }) {
  return <Badge tone={statusTone(status)}>{status || 'Unknown'}</Badge>
}

export function Avatar({ name, email, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-[10px]', md: 'h-10 w-10 text-xs', lg: 'h-14 w-14 text-base' }
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 font-bold text-white', sizes[size] || sizes.md)}>
      {getInitials(name || email)}
    </span>
  )
}

export function Field({ label, htmlFor, hint, error, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
    </div>
  )
}

const inputClass = 'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50'

export function Input({ className, ...props }) {
  return <input className={cn(inputClass, className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(inputClass, 'appearance-none pr-8', className)} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(inputClass, 'h-auto min-h-28 resize-y py-3 leading-6', className)} {...props} />
}

export function Spinner({ className }) {
  return <LoaderCircle className={cn('animate-spin', className)} size={18} />
}

export function LoadingState({ label = 'Loading' }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-sm font-medium text-slate-500">
      <Spinner className="text-indigo-600" />
      {label}
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <AlertCircle size={22} />
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
        <AlertCircle size={22} />
      </div>
      <h3 className="font-semibold text-slate-900">Unable to load this view</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      {onRetry ? <Button className="mt-4" variant="secondary" size="sm" onClick={onRetry}>Try again</Button> : null}
    </div>
  )
}

export function Notice({ children, tone = 'info' }) {
  const tones = {
    info: 'border-indigo-100 bg-indigo-50 text-indigo-800',
    success: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    error: 'border-rose-100 bg-rose-50 text-rose-800',
  }
  return (
    <div className={cn('flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm', tones[tone] || tones.info)}>
      {tone === 'success' ? <CheckCircle2 className="mt-0.5 shrink-0" size={16} /> : <AlertCircle className="mt-0.5 shrink-0" size={16} />}
      <div>{children}</div>
    </div>
  )
}

export function Modal({ open, title, description, onClose, children, size = 'md' }) {
  const titleId = useId()
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, open])
  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <div className={cn('max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl', widths[size] || widths.md)} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-950">{title}</h2>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <IconButton label="Close" onClick={onClose}><X size={18} /></IconButton>
        </div>
        <div className="px-5 py-6 sm:px-7">{children}</div>
      </div>
    </div>
  )
}

export function ScreenTitle({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-slate-950">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-sm leading-5 text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function ListRow({ leading, title, subtitle, meta, trailing, onClick, className }) {
  const content = (
    <>
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-5 text-slate-900">{title}</p>
        {subtitle ? <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-slate-500">{subtitle}</p> : null}
        {meta ? <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">{meta}</div> : null}
      </div>
      {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : null}
    </>
  )
  const classes = cn(
    'flex w-full items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm shadow-slate-200/40 transition active:scale-[0.99] active:bg-slate-50',
    onClick && 'hover:border-slate-300',
    className,
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    )
  }
  return <div className={classes}>{content}</div>
}

export function ListGroup({ children, className }) {
  return <div className={cn('space-y-2.5', className)}>{children}</div>
}

export function FilterChips({ options, value, onChange, className }) {
  return (
    <div className={cn('-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value || 'all'}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition active:scale-95',
              active
                ? 'border-cyan-600 bg-cyan-600 text-white shadow-sm shadow-cyan-200'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span className={cn('ml-1.5 text-xs font-bold', active ? 'text-cyan-100' : 'text-slate-400')}>{option.count}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function LoadMore({ hasMore, loading, onClick, label = 'Load more' }) {
  if (!hasMore) return null
  return (
    <div className="py-4 text-center">
      <Button variant="secondary" size="md" disabled={loading} onClick={onClick} className="w-full">
        {loading ? <Spinner /> : null}
        {loading ? 'Loading…' : label}
      </Button>
    </div>
  )
}

export function EndOfList({ children = 'You have reached the end' }) {
  return <p className="py-6 text-center text-xs text-slate-400">{children}</p>
}

export function Pagination({ count, page, onPageChange, pageSize = 20 }) {
  if (count <= pageSize) return null
  const totalPages = Math.ceil(count / pageSize)
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, count)
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <span>Showing {from}–{to} of {count}</span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={15} /> Previous
        </Button>
        <span className="px-1 text-xs font-semibold text-slate-600">Page {page} of {totalPages}</span>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight size={15} />
        </Button>
      </div>
    </div>
  )
}
