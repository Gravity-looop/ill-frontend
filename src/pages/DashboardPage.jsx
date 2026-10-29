import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, ClipboardCheck, CreditCard, DollarSign, Users } from 'lucide-react'
import { api } from '../lib/api'
import ProtectedImage from '../components/ProtectedImage'
import { Card, EmptyState, ErrorState, formatAmount, formatDate, formatInr, LoadingState, StatCard, StatusBadge } from '../components/ui'

function isDebit(entry) {
  return entry.entry_type === 'DEBIT'
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [requests, pending, users, history] = await Promise.all([
        api.adminPaymentRequests({ page: 1 }),
        api.adminSubmissions({ status: 'PENDING', page: 1 }),
        api.adminUsers({ page: 1 }),
        api.adminBalanceHistory({ page: 1 }),
      ])
      setData({ requests, pending, users, history })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const recentCredited = useMemo(() => data?.history?.results?.filter((entry) => !isDebit(entry)).reduce((total, entry) => total + Number(entry.amount || 0), 0) || 0, [data])

  if (loading) return <LoadingState label="Loading your workspace" />
  if (error) return <ErrorState message={error} onRetry={loadDashboard} />

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total payment requests" value={data?.requests?.count ?? 0} detail="All published and closed requests" icon={CreditCard} tone="indigo" />
        <StatCard label="Pending reviews" value={data?.pending?.count ?? 0} detail="Submissions needing a decision" icon={ClipboardCheck} tone="amber" />
        <StatCard label="Registered users" value={data?.users?.count ?? 0} detail="Accounts in the platform" icon={Users} tone="sky" />
        <StatCard label="Recent credited" value={formatAmount(recentCredited)} detail="From the latest balance entries" icon={DollarSign} tone="emerald" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6"><div><h2 className="font-bold text-slate-950">Recent payment requests</h2><p className="mt-1 text-xs text-slate-400">Latest requests across your workspace</p></div><CreditCard className="text-indigo-500" size={20} /></div>
          {data?.requests?.results?.length ? <div className="divide-y divide-slate-100">{data.requests.results.slice(0, 5).map((request) => <div key={request.id} className="flex items-center gap-4 px-5 py-4 sm:px-6"><ProtectedImage url={request.qr_image_url} alt={`QR for ${request.transaction_id}`} className="h-11 w-11 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{request.transaction_id}</p><p className="mt-1 text-xs text-slate-400">Created {formatDate(request.created_at)}</p></div><div className="text-right"><p className="text-sm font-bold text-slate-900">{request.amount == null ? '' : formatAmount(request.amount)}</p><div className="mt-1"><StatusBadge status={request.status} /></div></div></div>)}</div> : <EmptyState title="No payment requests yet" description="Create the first request to start collecting payment proofs." />}
          <div className="border-t border-slate-100 px-5 py-3 sm:px-6"><a href="/admin/payment-requests" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">View all requests <ArrowUpRight size={14} /></a></div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6"><div><h2 className="font-bold text-slate-950">Waiting for review</h2><p className="mt-1 text-xs text-slate-400">Newest pending submissions</p></div><ClipboardCheck className="text-amber-500" size={20} /></div>
          {data?.pending?.results?.length ? <div className="divide-y divide-slate-100">{data.pending.results.slice(0, 5).map((submission) => <div key={submission.id} className="px-5 py-4 sm:px-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{submission.user?.email || 'Unknown user'}</p><p className="mt-1 text-xs text-slate-400">{submission.payment_request?.transaction_id} · Attempt {submission.attempt}</p></div><StatusBadge status={submission.status} /></div><p className="mt-2 line-clamp-1 text-xs text-slate-500">{submission.text}</p></div>)}</div> : <EmptyState title="Queue is clear" description="There are no pending submissions right now." />}
          <div className="border-t border-slate-100 px-5 py-3 sm:px-6"><a href="/admin/submissions" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">Open review queue <ArrowUpRight size={14} /></a></div>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6"><div><h2 className="font-bold text-slate-950">Recent balance activity</h2><p className="mt-1 text-xs text-slate-400">Latest credits and withdrawal payouts recorded by the system</p></div><a href="/admin/balance-history" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View history</a></div>
        {data?.history?.results?.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 font-semibold sm:px-6">User</th><th className="px-5 py-3 font-semibold">Amount</th><th className="px-5 py-3 font-semibold">Balance after</th><th className="px-5 py-3 font-semibold">Recorded</th></tr></thead><tbody className="divide-y divide-slate-100">{data.history.results.slice(0, 5).map((entry) => <tr key={entry.id}><td className="px-5 py-4 font-semibold text-slate-800 sm:px-6">{entry.user?.email}</td><td className={`px-5 py-4 font-bold ${isDebit(entry) ? 'text-amber-600' : 'text-emerald-600'}`}>{isDebit(entry) ? '-' : '+'}{isDebit(entry) ? formatInr(entry.amount) : formatAmount(entry.amount)}</td><td className="px-5 py-4 font-semibold text-slate-700">{formatAmount(entry.balance_after)}</td><td className="px-5 py-4 text-slate-500">{formatDate(entry.created_at)}</td></tr>)}</tbody></table></div> : <EmptyState title="No balance activity yet" description="Accepted submissions will appear here." />}
      </Card>
    </div>
  )
}
