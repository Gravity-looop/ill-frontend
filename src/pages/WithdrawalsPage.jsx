import { useCallback, useEffect, useRef, useState } from 'react'
import { Banknote, Check, CheckCircle2, Copy, Eye, Filter, RotateCcw, XCircle } from 'lucide-react'
import { api } from '../lib/api'
import { buildPayeeSummary, copyText } from '../lib/clipboard'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import { Avatar, Button, Card, EmptyState, ErrorState, Field, formatAmount, formatDate, formatInr, Input, LoadingState, Modal, Notice, Pagination, Select, StatusBadge, Textarea } from '../components/ui'

const initialFilters = { status: '', user_id: '', search: '' }

const INFO_NOTICES = ['updated by another admin', 'Enter the success transaction ID']

function noticeTone(message) {
  if (INFO_NOTICES.some((text) => message.includes(text))) return 'info'
  if (message.includes('confirmed') || message.includes('rejected')) return 'success'
  return 'error'
}

function PayeeList({ payees, onCopy, copied }) {
  return (
    <div className="rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Payees ({payees.length})</p>
        <Button variant="secondary" size="sm" onClick={() => onCopy(buildPayeeSummary(payees))}>
          {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
          {copied ? 'Copied' : 'Copy all details'}
        </Button>
      </div>
      <ul className="divide-y divide-slate-100">
        {payees.map((payee) => (
          <li key={payee.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{payee.payee_name}</p>
              <p className="mt-1 font-mono text-[13px] text-slate-500">A/C {payee.account_number}</p>
              <p className="font-mono text-[13px] text-slate-500">IFSC {payee.ifsc}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">{formatInr(payee.amount)}</p>
              <button
                type="button"
                aria-label={`Copy ${payee.payee_name} account details`}
                title="Copy details"
                onClick={() => onCopy(`${payee.payee_name}\nA/C ${payee.account_number}\nIFSC ${payee.ifsc}\n₹${payee.amount}`)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition active:bg-slate-200"
              >
                <Copy size={15} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function WithdrawalReviewModal({ withdrawal, loading, error, actionLoading, mode, transactionId, rejectReason, copied, onTransactionChange, onRejectReasonChange, onStartReject, onCancelReject, onClose, onConfirm, onReject, handleCopy }) {
  const payees = withdrawal?.payees || []
  return (
    <Modal open={Boolean(loading || withdrawal || error)} onClose={actionLoading ? undefined : onClose} title="Review withdrawal" description="Verify the payee bank details before releasing the payout." size="xl">
      {loading ? <LoadingState label="Loading withdrawal" /> : error ? <ErrorState message={error} /> : withdrawal ? <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center gap-3"><Avatar name={`${withdrawal.user?.first_name || ''} ${withdrawal.user?.last_name || ''}`} email={withdrawal.user?.email} /><div className="min-w-0"><p className="truncate font-bold text-slate-900">{withdrawal.user?.email}</p><p className="mt-1 text-xs text-slate-400">User #{withdrawal.user?.id}</p></div></div></div>
          <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Requested total</p><p className="mt-2 text-xl font-bold text-slate-950">{formatInr(withdrawal.total_amount)}</p><p className="mt-1 text-xs text-slate-400">Balance {formatAmount(withdrawal.user?.balance)}</p></div>
          <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Status</p><StatusBadge status={withdrawal.status} /></div><p className="mt-2 font-mono text-sm font-semibold text-slate-800">{withdrawal.reference}</p><p className="mt-1 text-xs text-slate-400">{formatDate(withdrawal.created_at)}</p></div>
        </div>

        <PayeeList payees={payees} onCopy={handleCopy} copied={copied} />

        {withdrawal.note ? <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">User note</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{withdrawal.note}</p></div> : null}

        {withdrawal.status === 'PAID' ? <Notice tone="success"><span><strong>Paid.</strong> {formatInr(withdrawal.paid_amount)} sent with transaction {withdrawal.paid_transaction_id} on {formatDate(withdrawal.processed_at)}{withdrawal.processed_by ? ` by ${withdrawal.processed_by.email}` : ''}.</span></Notice> : null}
        {withdrawal.status === 'REJECTED' ? <Notice tone="error"><span><strong>Rejected.</strong> {withdrawal.rejection_reason || 'No reason was recorded.'}</span></Notice> : null}

        {withdrawal.status !== 'PENDING' ? null : mode === 'reject' ? <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4"><Field label="Reason for rejecting" htmlFor="withdrawal-reason" hint="This message will be visible to the user."><Textarea id="withdrawal-reason" maxLength={2000} autoFocus value={rejectReason} onChange={(event) => onRejectReasonChange(event.target.value)} placeholder="Explain what needs to be corrected…" /></Field><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={onCancelReject} disabled={actionLoading}>Cancel</Button><Button variant="danger" onClick={() => onReject(rejectReason)} disabled={actionLoading || !rejectReason.trim()}>{actionLoading ? 'Saving…' : 'Reject withdrawal'}</Button></div></div> : <div className="space-y-4 border-t border-slate-100 pt-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Success transaction ID" htmlFor="withdrawal-transaction" hint="Required. Store it with your bank transfer."><Input id="withdrawal-transaction" value={transactionId} onChange={(event) => onTransactionChange(event.target.value)} placeholder="NEFT9001234" /></Field><Field label="Confirmed amount (INR)" htmlFor="withdrawal-amount" hint="Must match the requested total."><Input id="withdrawal-amount" type="number" min="0.01" step="0.01" value={withdrawal.paid_amount || ''} placeholder={withdrawal.total_amount} onChange={() => {}} disabled /></Field></div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={onStartReject}><XCircle size={16} /> Reject</Button><Button onClick={onConfirm} disabled={actionLoading || !transactionId.trim()}><CheckCircle2 size={16} /> {actionLoading ? 'Processing…' : `Confirm ${formatInr(withdrawal.total_amount)} payout`}</Button></div></div>}
      </div> : null}
    </Modal>
  )
}

export default function WithdrawalsPage() {
  const [data, setData] = useState({ count: 0, results: [] })
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState(initialFilters)
  const [draft, setDraft] = useState(initialFilters)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [mode, setMode] = useState('confirm')
  const [transactionId, setTransactionId] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState('')
  const actionRef = useRef(false)
  const inFlightRef = useRef(false)
  const selectedRef = useRef(null)

  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  const loadWithdrawals = useCallback(
    async ({ silent = false } = {}) => {
      if (silent && (actionRef.current || inFlightRef.current)) return
      inFlightRef.current = true
      if (!silent) {
        setLoading(true)
        setError('')
      }
      try {
        const next = await api.adminWithdrawals({ ...filters, page })
        setData(next)
        const open = selectedRef.current
        if (silent && open) {
          const refreshed = next.results.find((item) => item.id === open.id)
          if (refreshed && refreshed.status !== open.status) {
            setSelected(refreshed)
            setNotice('This request was updated by another admin.')
          }
        }
      } catch (requestError) {
        if (!silent) setError(requestError.message)
      } finally {
        inFlightRef.current = false
        if (!silent) setLoading(false)
      }
    },
    [filters, page],
  )

  const fetchSummary = useCallback((params) => api.adminWithdrawalSummary(params), [])

  const handleSummaryChange = useCallback(() => {
    loadWithdrawals({ silent: true })
  }, [loadWithdrawals])

  const { refresh: refreshSummary } = useRefreshOnFocus(fetchSummary, {
    params: filters,
    onChange: handleSummaryChange,
  })

  useEffect(() => { loadWithdrawals() }, [loadWithdrawals])

  useEffect(() => {
    if (!copied) return undefined
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const handleCopy = useCallback(async (text) => {
    const ok = await copyText(text)
    if (ok) setCopied(true)
  }, [])

  const applyFilters = (event) => {
    event.preventDefault()
    setPage(1)
    setFilters(draft)
  }

  const clearFilters = () => {
    setDraft(initialFilters)
    setFilters(initialFilters)
    setPage(1)
  }

  const openDetail = async (id) => {
    setSelected(null)
    setDetailError('')
    setDetailLoading(true)
    setMode('confirm')
    setTransactionId('')
    setRejectReason('')
    try {
      setSelected(await api.adminWithdrawal(id))
    } catch (requestError) {
      setDetailError(requestError.message)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    if (actionLoading) return
    setSelected(null)
    setDetailError('')
  }

  const confirm = async () => {
    if (!selected) return
    if (!transactionId.trim()) {
      setNotice('Enter the success transaction ID before confirming.')
      return
    }
    actionRef.current = true
    setActionLoading(true)
    try {
      const updated = await api.confirmWithdrawal(selected.id, {
        transaction_id: transactionId.trim(),
        amount: selected.total_amount,
      })
      setSelected(updated)
      setNotice('Withdrawal confirmed and the user balance was debited.')
      await loadWithdrawals()
      refreshSummary()
    } catch (requestError) {
      setNotice(requestError.message)
    } finally {
      setActionLoading(false)
      actionRef.current = false
    }
  }

  const reject = async (reason) => {
    if (!selected || !reason.trim()) return
    actionRef.current = true
    setActionLoading(true)
    try {
      const updated = await api.rejectWithdrawal(selected.id, reason.trim())
      setSelected(updated)
      setMode('confirm')
      setNotice('Withdrawal rejected. The reserved amount is available again.')
      await loadWithdrawals()
      refreshSummary()
    } catch (requestError) {
      setNotice(requestError.message)
    } finally {
      setActionLoading(false)
      actionRef.current = false
    }
  }

  return (
    <div>
      {notice ? <div className="mb-5"><Notice tone={noticeTone(notice)}>{notice}</Notice></div> : null}
      <Card className="mb-5 p-4"><form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_150px_auto]"><Select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="PAID">Paid</option><option value="REJECTED">Rejected</option></Select><Input value={draft.search} onChange={(event) => setDraft((current) => ({ ...current, search: event.target.value }))} placeholder="Search reference, user, payee, A/C or IFSC" /><Input type="number" min="1" value={draft.user_id} onChange={(event) => setDraft((current) => ({ ...current, user_id: event.target.value }))} placeholder="User ID" /><div className="flex gap-2"><Button type="submit"><Filter size={16} /> Filter</Button><Button type="button" variant="secondary" onClick={clearFilters}><RotateCcw size={15} /></Button></div></form></Card>
      <Card className="overflow-hidden">
        {loading ? <LoadingState label="Loading withdrawals" /> : error ? <ErrorState message={error} onRetry={loadWithdrawals} /> : data.results.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 font-semibold sm:px-6">User</th><th className="px-5 py-3 font-semibold">Reference</th><th className="px-5 py-3 font-semibold">Payees</th><th className="px-5 py-3 font-semibold">Total</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Requested</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{data.results.map((withdrawal) => <tr key={withdrawal.id} className="transition hover:bg-slate-50/70"><td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><Avatar name={`${withdrawal.user?.first_name || ''} ${withdrawal.user?.last_name || ''}`} email={withdrawal.user?.email} size="sm" /><div className="min-w-0"><p className="truncate font-semibold text-slate-800">{withdrawal.user?.email}</p><p className="mt-1 text-xs text-slate-400">Balance {formatAmount(withdrawal.user?.balance)}</p></div></div></td><td className="px-5 py-4 font-mono text-[13px] font-semibold text-slate-700">{withdrawal.reference}</td><td className="max-w-xs px-5 py-4"><p className="truncate text-slate-700">{withdrawal.payees?.map((payee) => payee.payee_name).join(', ')}</p><p className="mt-1 text-xs text-slate-400">{withdrawal.payee_count} account{withdrawal.payee_count === 1 ? '' : 's'}</p></td><td className="px-5 py-4 font-bold text-slate-900">{formatInr(withdrawal.total_amount)}</td><td className="px-5 py-4"><StatusBadge status={withdrawal.status} /></td><td className="px-5 py-4 text-slate-500">{formatDate(withdrawal.created_at)}</td><td className="px-5 py-4 text-right"><Button variant="secondary" size="sm" onClick={() => openDetail(withdrawal.id)}><Eye size={15} /> Review</Button></td></tr>)}</tbody></table></div><Pagination count={data.count} page={page} onPageChange={setPage} /></> : <EmptyState title="No withdrawals" description="Withdrawal requests from users will appear here for review." action={<Banknote className="text-slate-300" size={22} />} />}
      </Card>
      <WithdrawalReviewModal withdrawal={selected} loading={detailLoading} error={detailError} actionLoading={actionLoading} mode={mode} transactionId={transactionId} rejectReason={rejectReason} copied={copied} onTransactionChange={setTransactionId} onRejectReasonChange={setRejectReason} onStartReject={() => setMode('reject')} onCancelReject={() => setMode('confirm')} onClose={closeDetail} onConfirm={confirm} onReject={reject} handleCopy={handleCopy} />
    </div>
  )
}
