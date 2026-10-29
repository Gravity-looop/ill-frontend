import { useCallback, useEffect, useState } from 'react'
import { Filter, RotateCcw, WalletCards } from 'lucide-react'
import { api } from '../lib/api'
import { Avatar, Button, Card, EmptyState, ErrorState, formatAmount, formatDate, formatInr, Input, LoadingState, Pagination } from '../components/ui'

function isDebit(entry) {
  return entry.entry_type === 'DEBIT'
}

function entryAmount(entry) {
  return isDebit(entry) ? formatInr(entry.amount) : formatAmount(entry.amount)
}

function entryBalance(entry) {
  return isDebit(entry) ? formatInr(entry.balance_after) : formatAmount(entry.balance_after)
}

export default function BalanceHistoryPage() {
  const [data, setData] = useState({ count: 0, results: [] })
  const [page, setPage] = useState(1)
  const [userIdDraft, setUserIdDraft] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api.adminBalanceHistory({ user_id: userId, page }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [page, userId])

  useEffect(() => { loadHistory() }, [loadHistory])

  const applyFilter = (event) => {
    event.preventDefault()
    setPage(1)
    setUserId(userIdDraft.trim())
  }

  const clearFilter = () => {
    setUserIdDraft('')
    setUserId('')
    setPage(1)
  }

  return (
    <div>
      <Card className="mb-5 p-4"><form onSubmit={applyFilter} className="flex flex-col gap-3 sm:flex-row sm:items-center"><Input type="number" min="1" value={userIdDraft} onChange={(event) => setUserIdDraft(event.target.value)} placeholder="Filter by user ID" className="flex-1" /><Button type="submit"><Filter size={16} /> Apply filter</Button>{userId ? <Button type="button" variant="secondary" onClick={clearFilter}><RotateCcw size={15} /> Clear</Button> : null}</form></Card>
      <Card className="overflow-hidden">
        {loading ? <LoadingState label="Loading balance history" /> : error ? <ErrorState message={error} onRetry={loadHistory} /> : data.results.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 font-semibold sm:px-6">User</th><th className="px-5 py-3 font-semibold">Entry</th><th className="px-5 py-3 font-semibold">Balance after</th><th className="px-5 py-3 font-semibold">Request</th><th className="px-5 py-3 font-semibold">Submission</th><th className="px-5 py-3 font-semibold">Withdrawal</th><th className="px-5 py-3 font-semibold">Recorded</th></tr></thead><tbody className="divide-y divide-slate-100">{data.results.map((entry) => <tr key={entry.id} className="transition hover:bg-slate-50/70"><td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><Avatar name={`${entry.user?.first_name || ''} ${entry.user?.last_name || ''}`} email={entry.user?.email} size="sm" /><div><p className="font-semibold text-slate-800">{entry.user?.email}</p><p className="mt-1 text-xs text-slate-400">User #{entry.user?.id}</p></div></div></td><td className={`px-5 py-4 font-bold ${isDebit(entry) ? 'text-amber-600' : 'text-emerald-600'}`}>{isDebit(entry) ? '-' : '+'}{entryAmount(entry)}</td><td className="px-5 py-4 font-bold text-slate-900">{entryBalance(entry)}</td><td className="px-5 py-4 font-semibold text-slate-700">{entry.payment_request_id ? `#${entry.payment_request_id}` : '—'}</td><td className="px-5 py-4 font-semibold text-slate-700">{entry.submission_id ? `#${entry.submission_id}` : '—'}</td><td className="px-5 py-4 font-semibold text-slate-700">{entry.withdrawal_id ? `#${entry.withdrawal_id}` : '—'}</td><td className="px-5 py-4 text-slate-500">{formatDate(entry.created_at)}</td></tr>)}</tbody></table></div><Pagination count={data.count} page={page} onPageChange={setPage} /></> : <EmptyState title="No balance entries found" description={userId ? 'No credits or withdrawals were recorded for that user.' : 'Accepted submissions create credits and confirmed withdrawals create debits here.'} action={userId ? <Button variant="secondary" onClick={clearFilter}>Clear filter</Button> : null} />}
      </Card>
      <div className="mt-5 flex items-center gap-2 text-xs text-slate-400"><WalletCards size={15} /> Credits are created when an administrator accepts a submission; debits when a withdrawal payout is confirmed.</div>
    </div>
  )
}
