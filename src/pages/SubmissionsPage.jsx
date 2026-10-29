import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Eye, Filter, RotateCcw, XCircle } from 'lucide-react'
import { api } from '../lib/api'
import ProtectedImage from '../components/ProtectedImage'
import { Avatar, Button, Card, EmptyState, ErrorState, Field, formatAmount, formatDate, Input, LoadingState, Modal, Notice, Pagination, Select, StatusBadge, Textarea } from '../components/ui'

const initialFilters = { status: '', user_id: '', payment_request_id: '' }

function requestAmountLabel(value) {
  return value ? formatAmount(value) : ''
}

function SubmissionReviewModal({ submission, loading, error, actionLoading, declineMode, declineReason, finalAmount, onFinalAmountChange, onClose, onAccept, onDecline, onReasonChange, onStartDecline, onCancelDecline }) {
  return (
    <Modal open={Boolean(loading || submission || error)} onClose={actionLoading ? undefined : onClose} title="Review submission" description="Inspect the proof and record a decision." size="xl">
      {loading ? <LoadingState label="Loading submission" /> : error ? <ErrorState message={error} /> : submission ? <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
          <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Payment proof</p><div className="rounded-2xl bg-slate-950 p-3"><ProtectedImage url={submission.screenshot_url} alt="Submitted payment proof" className="h-72 w-full rounded-xl object-contain sm:h-96" /></div></div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center gap-3"><Avatar name={`${submission.user?.first_name || ''} ${submission.user?.last_name || ''}`} email={submission.user?.email} /><div className="min-w-0"><p className="truncate font-bold text-slate-900">{submission.user?.email}</p><p className="mt-1 text-xs text-slate-400">User #{submission.user?.id} · Balance {formatAmount(submission.user?.balance)}</p></div></div></div>
            <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Payment request</p><StatusBadge status={submission.payment_request?.status} /></div><p className="mt-3 text-xl font-bold text-slate-950">{requestAmountLabel(submission.payment_request?.amount)}</p><p className="mt-1 text-sm font-semibold text-slate-600">{submission.payment_request?.transaction_id}</p><p className="mt-3 text-sm leading-6 text-slate-500">{submission.payment_request?.instructions || 'No instructions were provided.'}</p></div>
            <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Submitted amount</p><p className="mt-2 text-xl font-bold text-slate-950">{formatAmount(submission.proposed_amount)}</p>{submission.final_amount ? <p className="mt-1 text-sm font-semibold text-emerald-600">Final credited: {formatAmount(submission.final_amount)}</p> : null}</div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Attempt</p><p className="mt-1 font-bold text-slate-900">#{submission.attempt}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-400">Submitted</p><p className="mt-1 text-sm font-semibold text-slate-700">{formatDate(submission.created_at)}</p></div></div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">User note</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{submission.text}</p></div>
        {submission.status !== 'PENDING' ? <Notice tone={submission.status === 'ACCEPTED' ? 'success' : 'error'}><span><strong>{submission.status === 'ACCEPTED' ? 'Accepted.' : 'Declined.'}</strong> {submission.decline_reason || 'This submission has already been reviewed.'}</span></Notice> : declineMode ? <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4"><Field label="Reason for declining" htmlFor="decline-reason" hint="This message will be visible to the user."><Textarea id="decline-reason" maxLength={2000} autoFocus value={declineReason} onChange={(event) => onReasonChange(event.target.value)} placeholder="Explain what needs to be corrected…" /></Field><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={onCancelDecline} disabled={actionLoading}>Cancel</Button><Button variant="danger" onClick={() => onDecline(declineReason)} disabled={actionLoading || !declineReason.trim()}>{actionLoading ? 'Saving…' : 'Decline submission'}</Button></div></div> : <div className="space-y-4 border-t border-slate-100 pt-5"><Field label="Final amount to credit" htmlFor="final_amount" hint="Confirm the amount to add to the user's balance. This overrides the submitted amount when different."><Input id="final_amount" type="number" min="0.01" step="0.01" required value={finalAmount} onChange={(event) => onFinalAmountChange(event.target.value)} placeholder={submission.proposed_amount || '0.00'} /></Field><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="secondary" onClick={onStartDecline}><XCircle size={16} /> Decline</Button><Button onClick={onAccept} disabled={actionLoading || !finalAmount.trim()}><CheckCircle2 size={16} /> {actionLoading ? 'Processing…' : 'Accept and credit balance'}</Button></div></div>}
      </div> : null}
    </Modal>
  )
}

export default function SubmissionsPage() {
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
  const [declineMode, setDeclineMode] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [finalAmount, setFinalAmount] = useState('')
  const [notice, setNotice] = useState('')

  const loadSubmissions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api.adminSubmissions({ ...filters, page }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { loadSubmissions() }, [loadSubmissions])

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
    setDeclineMode(false)
    setDeclineReason('')
    setFinalAmount('')
    try {
      const submission = await api.adminSubmission(id)
      setSelected(submission)
      setFinalAmount(submission.final_amount || submission.proposed_amount || submission.payment_request?.amount || '')
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
    setFinalAmount('')
  }

  const accept = async () => {
    if (!selected) return
    if (!finalAmount.trim()) {
      setNotice('Enter the final amount before accepting this submission.')
      return
    }
    setActionLoading(true)
    try {
      const updated = await api.acceptSubmission(selected.id, finalAmount.trim())
      setSelected(updated)
      setNotice('Submission accepted and the user balance was credited.')
      await loadSubmissions()
    } catch (requestError) {
      setNotice(requestError.message)
    } finally {
      setActionLoading(false)
    }
  }

  const decline = async (reason) => {
    if (!selected || !reason.trim()) return
    setActionLoading(true)
    try {
      const updated = await api.declineSubmission(selected.id, reason.trim())
      setSelected(updated)
      setDeclineMode(false)
      setNotice('Submission declined. The user can submit a new attempt.')
      await loadSubmissions()
    } catch (requestError) {
      setNotice(requestError.message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      {notice ? <div className="mb-5"><Notice tone={notice.includes('accepted') || notice.includes('declined') ? 'success' : 'error'}>{notice}</Notice></div> : null}
      <Card className="mb-5 p-4"><form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)_auto]"><Select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="ACCEPTED">Accepted</option><option value="DECLINED">Declined</option></Select><Input type="number" min="1" value={draft.user_id} onChange={(event) => setDraft((current) => ({ ...current, user_id: event.target.value }))} placeholder="User ID" /><Input type="number" min="1" value={draft.payment_request_id} onChange={(event) => setDraft((current) => ({ ...current, payment_request_id: event.target.value }))} placeholder="Request ID" /><div className="flex gap-2"><Button type="submit"><Filter size={16} /> Filter</Button><Button type="button" variant="secondary" onClick={clearFilters}><RotateCcw size={15} /></Button></div></form></Card>
      <Card className="overflow-hidden">
        {loading ? <LoadingState label="Loading submissions" /> : error ? <ErrorState message={error} onRetry={loadSubmissions} /> : data.results.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 font-semibold sm:px-6">User</th><th className="px-5 py-3 font-semibold">Request</th><th className="px-5 py-3 font-semibold">Submitted amount</th><th className="px-5 py-3 font-semibold">Note</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Submitted</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{data.results.map((submission) => <tr key={submission.id} className="transition hover:bg-slate-50/70"><td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><Avatar name={`${submission.user?.first_name || ''} ${submission.user?.last_name || ''}`} email={submission.user?.email} size="sm" /><div><p className="font-semibold text-slate-800">{submission.user?.email}</p><p className="mt-1 text-xs text-slate-400">Attempt {submission.attempt}</p></div></div></td><td className="px-5 py-4 font-semibold text-slate-700">{submission.payment_request?.transaction_id}</td><td className="px-5 py-4 font-bold text-slate-900">{formatAmount(submission.proposed_amount || submission.payment_request?.amount)}</td><td className="max-w-xs px-5 py-4"><p className="truncate text-slate-500">{submission.text}</p></td><td className="px-5 py-4"><StatusBadge status={submission.status} /></td><td className="px-5 py-4 text-slate-500">{formatDate(submission.created_at)}</td><td className="px-5 py-4 text-right"><Button variant="secondary" size="sm" onClick={() => openDetail(submission.id)}><Eye size={15} /> Review</Button></td></tr>)}</tbody></table></div><Pagination count={data.count} page={page} onPageChange={setPage} /></> : <EmptyState title="No submissions found" description={filters.status || filters.user_id || filters.payment_request_id ? 'Try clearing the filters to see the full queue.' : 'Submitted payment proofs will appear here.'} action={filters.status || filters.user_id || filters.payment_request_id ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button> : null} />}
      </Card>
      <SubmissionReviewModal submission={selected} loading={detailLoading} error={detailError} actionLoading={actionLoading} declineMode={declineMode} declineReason={declineReason} finalAmount={finalAmount} onFinalAmountChange={setFinalAmount} onClose={closeDetail} onAccept={accept} onDecline={decline} onReasonChange={setDeclineReason} onStartDecline={() => setDeclineMode(true)} onCancelDecline={() => setDeclineMode(false)} />
    </div>
  )
}
