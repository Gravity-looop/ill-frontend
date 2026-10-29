import { useCallback, useEffect, useState } from 'react'
import { Search, UserRound, X } from 'lucide-react'
import { api } from '../lib/api'
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, formatAmount, formatDate, formatInr, Input, LoadingState, Modal, Notice, Pagination, StatusBadge } from '../components/ui'

function UserDetailModal({ user, withdrawals, loading, onClose }) {
  return (
    <Modal open={Boolean(user)} onClose={onClose} title="User details" description="Account, submission and withdrawal activity." size="md">
      {user ? <div className="space-y-5">
        <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4"><Avatar name={`${user.first_name || ''} ${user.last_name || ''}`} email={user.email} size="lg" /><div className="min-w-0"><p className="truncate text-lg font-bold text-slate-950">{user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.email}</p><p className="mt-1 truncate text-sm text-slate-500">{user.email}</p><div className="mt-2 flex flex-wrap gap-2"><Badge tone={user.is_active ? 'emerald' : 'rose'}>{user.is_active ? 'Active' : 'Inactive'}</Badge>{user.is_staff ? <Badge tone="indigo">Staff</Badge> : null}</div></div></div>
        <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs text-slate-400">Current balance</p><p className="mt-2 text-xl font-bold text-slate-950">{formatAmount(user.balance)}</p></div><div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs text-slate-400">Submissions</p><p className="mt-2 text-xl font-bold text-slate-950">{user.submission_count}</p></div><div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs text-slate-400">Withdrawal requests</p><p className="mt-2 text-xl font-bold text-slate-950">{user.withdrawal_count ?? 0}</p></div><div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs text-slate-400">Pending withdrawal</p><p className="mt-2 text-xl font-bold text-amber-600">{formatInr(user.pending_withdrawal_amount || 0)}</p></div></div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Withdrawals</p>
          {loading ? <LoadingState label="Loading withdrawals" /> : withdrawals.length ? <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">{withdrawals.map((withdrawal) => <li key={withdrawal.id} className="px-4 py-3"><div className="flex items-center justify-between gap-3"><p className="font-mono text-[13px] font-semibold text-slate-800">{withdrawal.reference}</p><div className="flex items-center gap-2"><StatusBadge status={withdrawal.status} /><p className="text-sm font-bold text-slate-900">{formatInr(withdrawal.total_amount)}</p></div></div><ul className="mt-2 space-y-1">{withdrawal.payees.map((payee) => <li key={payee.id} className="text-[13px] text-slate-500"><span className="font-semibold text-slate-700">{payee.payee_name}</span> · <span className="font-mono">A/C {payee.account_number}</span> · <span className="font-mono">IFSC {payee.ifsc}</span> · {formatInr(payee.amount)}</li>)}</ul></li>)}</ul> : <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-400">This user has no withdrawal requests yet.</p>}
        </div>
        <div className="space-y-3 border-t border-slate-100 pt-4"><div className="flex justify-between gap-4 text-sm"><span className="text-slate-400">Joined</span><span className="font-semibold text-slate-700">{formatDate(user.date_joined)}</span></div><div className="flex justify-between gap-4 text-sm"><span className="text-slate-400">Last login</span><span className="font-semibold text-slate-700">{formatDate(user.last_login)}</span></div><div className="flex justify-between gap-4 text-sm"><span className="text-slate-400">User ID</span><span className="font-semibold text-slate-700">#{user.id}</span></div></div>
      </div> : null}
    </Modal>
  )
}

export default function UsersPage() {
  const [data, setData] = useState({ count: 0, results: [] })
  const [page, setPage] = useState(1)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [withdrawals, setWithdrawals] = useState([])
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false)
  const [notice, setNotice] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api.adminUsers({ search, page }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { loadUsers() }, [loadUsers])

  const openUser = async (user) => {
    setSelected(user)
    setWithdrawals([])
    setWithdrawalsLoading(true)
    try {
      const data = await api.adminWithdrawals({ user_id: user.id, page_size: 10 })
      setWithdrawals(data.results || [])
    } catch {
      setWithdrawals([])
    } finally {
      setWithdrawalsLoading(false)
    }
  }

  const submitSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchDraft.trim())
  }

  return (
    <div>
      {notice ? <div className="mb-5"><Notice tone="info">{notice}</Notice></div> : null}
      <Card className="mb-5 p-4"><form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><Input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search by email or name" className="pl-10" /></div><Button type="submit">Search</Button>{search ? <Button type="button" variant="secondary" onClick={() => { setSearchDraft(''); setSearch(''); setPage(1); setNotice('') }}><X size={16} /> Clear</Button> : null}</form></Card>
      <Card className="overflow-hidden">
        {loading ? <LoadingState label="Loading users" /> : error ? <ErrorState message={error} onRetry={loadUsers} /> : data.results.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 font-semibold sm:px-6">User</th><th className="px-5 py-3 font-semibold">Balance</th><th className="px-5 py-3 font-semibold">Submissions</th><th className="px-5 py-3 font-semibold">Withdrawals</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Joined</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{data.results.map((user) => <tr key={user.id} className="transition hover:bg-slate-50/70"><td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><Avatar name={`${user.first_name || ''} ${user.last_name || ''}`} email={user.email} size="sm" /><div><p className="font-semibold text-slate-800">{user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.email}</p><p className="mt-1 text-xs text-slate-400">{user.email}</p></div></div></td><td className="px-5 py-4 font-bold text-slate-900">{formatAmount(user.balance)}</td><td className="px-5 py-4 font-semibold text-slate-700">{user.submission_count}</td><td className="px-5 py-4"><p className="font-semibold text-slate-700">{user.withdrawal_count ?? 0}</p>{Number(user.pending_withdrawal_amount) > 0 ? <p className="mt-1 text-xs font-semibold text-amber-600">{formatInr(user.pending_withdrawal_amount)} pending</p> : null}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><Badge tone={user.is_active ? 'emerald' : 'rose'}>{user.is_active ? 'Active' : 'Inactive'}</Badge>{user.is_staff ? <Badge tone="indigo">Staff</Badge> : null}</div></td><td className="px-5 py-4 text-slate-500">{formatDate(user.date_joined)}</td><td className="px-5 py-4 text-right"><Button variant="secondary" size="sm" onClick={() => openUser(user)}><UserRound size={15} /> View</Button></td></tr>)}</tbody></table></div><Pagination count={data.count} page={page} onPageChange={setPage} /></> : <EmptyState title="No users found" description={search ? 'Try a different email or name.' : 'Registered users will appear here.'} action={search ? <Button variant="secondary" onClick={() => { setSearchDraft(''); setSearch('') }}>Clear search</Button> : null} />}
      </Card>
      <UserDetailModal user={selected} withdrawals={withdrawals} loading={withdrawalsLoading} onClose={() => setSelected(null)} />
    </div>
  )
}
