import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Edit3, FileImage, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import ProtectedImage from '../components/ProtectedImage'
import { Button, Card, EmptyState, ErrorState, Field, formatAmount, formatDate, Input, LoadingState, Modal, Notice, Pagination, Select, StatusBadge, Textarea } from '../components/ui'

const emptyForm = { amount: '', transaction_id: '', instructions: '', status: 'PUBLISHED' }

function requestAmountLabel(value) {
  return value ? formatAmount(value) : ''
}

function PaymentRequestForm({ request, error, saving, onCancel, onSave }) {
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState(null)

  useEffect(() => {
    setForm(request ? { amount: request.amount || '', transaction_id: request.transaction_id || '', instructions: request.instructions || '', status: request.status || 'PUBLISHED' } : emptyForm)
    setFile(null)
  }, [request])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <form onSubmit={(event) => { event.preventDefault(); onSave(form, file) }} className="space-y-5">
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        {request ? <Field label="Amount" htmlFor="amount" hint="Leave blank to let users enter their payment amount."><Input id="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => update('amount', event.target.value)} placeholder="125.50" /></Field> : null}
        <Field label="Wallet ID" htmlFor="transaction_id" hint="Must be unique across requests." className={request ? undefined : 'sm:col-span-2'}><Input id="transaction_id" required maxLength={100} value={form.transaction_id} onChange={(event) => update('transaction_id', event.target.value)} placeholder="TXN-100" /></Field>
      </div>
      <Field label="Payment instructions" htmlFor="instructions" hint="Optional · maximum 2,000 characters."><Textarea id="instructions" maxLength={2000} value={form.instructions} onChange={(event) => update('instructions', event.target.value)} placeholder="Tell users how to complete this payment." /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Status" htmlFor="status"><Select id="status" value={form.status} onChange={(event) => update('status', event.target.value)}><option value="PUBLISHED">Published</option><option value="CLOSED">Closed</option></Select></Field>
        <Field label="QR image" htmlFor="qr_image" hint={request ? 'Leave empty to keep the current image.' : 'PNG, JPG, or WebP · max 5 MB.'}><label htmlFor="qr_image" className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-400 hover:bg-indigo-50"><FileImage size={17} className="text-slate-400" /><span className="truncate">{file?.name || (request ? 'Replace image' : 'Choose image')}</span><input id="qr_image" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" required={!request} onChange={(event) => setFile(event.target.files?.[0] || null)} /></label></Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-5"><Button variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : request ? 'Save changes' : 'Create request'}</Button></div>
    </form>
  )
}

export default function PaymentRequestsPage() {
  const [data, setData] = useState({ count: 0, results: [] })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [forceDeleteAvailable, setForceDeleteAvailable] = useState(false)
  const [notice, setNotice] = useState('')

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api.adminPaymentRequests({ page }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { loadRequests() }, [loadRequests])

  const visibleRequests = useMemo(() => {
    const query = search.trim().toLowerCase()
    return data.results.filter((request) => {
      const matchesStatus = !statusFilter || request.status === statusFilter
      const matchesSearch = !query || [request.transaction_id, request.created_by?.email, request.instructions].some((value) => value?.toLowerCase().includes(query))
      return matchesStatus && matchesSearch
    })
  }, [data.results, search, statusFilter])

  const openCreate = () => { setFormError(''); setModal({ type: 'create', request: null }) }
  const openEdit = (request) => { setFormError(''); setModal({ type: 'edit', request }) }
  const openDelete = (request) => { setFormError(''); setForceDeleteAvailable(Boolean(request.submission_count)); setModal({ type: 'delete', request }) }

  const saveRequest = async (form, file) => {
    setSaving(true)
    setFormError('')
    const payload = new FormData()
    if (form.amount.trim()) payload.append('amount', form.amount.trim())
    else if (modal.type === 'edit') payload.append('amount', '')
    payload.append('transaction_id', form.transaction_id)
    payload.append('instructions', form.instructions)
    payload.append('status', form.status)
    if (file) payload.append('qr_image', file)
    try {
      if (modal.type === 'edit') await api.updatePaymentRequest(modal.request.id, payload)
      else await api.createPaymentRequest(payload)
      setModal(null)
      setNotice(modal.type === 'edit' ? 'Payment request updated.' : 'Payment request created.')
      await loadRequests()
    } catch (requestError) {
      setFormError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteRequest = async (force = false) => {
    if (modal?.type !== 'delete') return
    setSavingId(modal.request.id)
    setFormError('')
    setNotice('')
    try {
      if (force) {
        await api.forceDeletePaymentRequest(
          modal.request.id,
          modal.request.transaction_id,
        )
      } else {
        await api.deletePaymentRequest(modal.request.id)
      }
      const transactionId = modal.request.transaction_id
      setModal(null)
      setNotice(`Payment request ${transactionId} permanently deleted.`)
      if (data.results.length === 1 && page > 1) setPage(page - 1)
      else await loadRequests()
    } catch (requestError) {
      if (requestError.status === 409) setForceDeleteAvailable(true)
      setFormError(requestError.message)
    } finally {
      setSavingId(null)
    }
  }

  const toggleStatus = async (request) => {
    setSavingId(request.id)
    setNotice('')
    try {
      const status = request.status === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED'
      await api.updatePaymentRequest(request.id, { status })
      setNotice(`Request ${status === 'CLOSED' ? 'closed' : 'published'}.`)
      await loadRequests()
    } catch (requestError) {
      setNotice(requestError.message)
    } finally {
      setSavingId(null)
    }
  }

  const deletingRequest = modal?.type === 'delete' ? modal.request : null
  const hasDependentRecords = Boolean(
    deletingRequest?.submission_count || forceDeleteAvailable,
  )

  return (
    <div>
      {notice ? <div className="mb-5"><Notice tone={notice.includes('updated') || notice.includes('created') || notice.includes('closed') || notice.includes('published') || notice.includes('deleted') ? 'success' : 'error'}>{notice}</Notice></div> : null}
      <Card className="mb-5 p-4"><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_auto_auto]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search transaction ID, creator, or instructions" className="pl-10" /></div><Select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}><option value="">All statuses</option><option value="PUBLISHED">Published</option><option value="CLOSED">Closed</option></Select><Button variant="secondary" onClick={() => { setSearch(''); setStatusFilter('') }}><SlidersHorizontal size={16} /> Reset</Button><Button onClick={openCreate}><Plus size={17} /> New request</Button></div></Card>
      <Card className="overflow-hidden">
        {loading ? <LoadingState label="Loading payment requests" /> : error ? <ErrorState message={error} onRetry={loadRequests} /> : visibleRequests.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 font-semibold sm:px-6">Request</th><th className="px-5 py-3 font-semibold">Amount</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Created by</th><th className="px-5 py-3 font-semibold">Created</th><th className="px-5 py-3 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleRequests.map((request) => <tr key={request.id} className="transition hover:bg-slate-50/70"><td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><ProtectedImage url={request.qr_image_url} alt={`QR for ${request.transaction_id}`} className="h-11 w-11 rounded-xl object-cover" /><div className="min-w-0"><p className="font-bold text-slate-900">{request.transaction_id}</p><p className="mt-1 max-w-xs truncate text-xs text-slate-400">{request.instructions || 'No instructions added'}</p></div></div></td><td className="px-5 py-4 font-bold text-slate-900">{requestAmountLabel(request.amount)}</td><td className="px-5 py-4"><StatusBadge status={request.status} /></td><td className="px-5 py-4 text-slate-600">{request.created_by?.email || '—'}</td><td className="px-5 py-4 text-slate-500">{formatDate(request.created_at)}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => openEdit(request)}><Edit3 size={15} /> Edit</Button><Button variant="ghost" size="sm" disabled={savingId === request.id} onClick={() => toggleStatus(request)}><Check size={15} /> {request.status === 'PUBLISHED' ? 'Close' : 'Publish'}</Button><Button variant="ghost" size="sm" disabled={savingId === request.id} onClick={() => openDelete(request)}><Trash2 size={15} /> Delete</Button></div></td></tr>)}</tbody></table></div><Pagination count={data.count} page={page} onPageChange={setPage} /></> : <EmptyState title="No requests found" description={search || statusFilter ? 'Try clearing the filters to see all payment requests.' : 'Create your first payment request to get started.'} action={!search && !statusFilter ? <Button onClick={openCreate}><Plus size={16} /> New request</Button> : null} />}
      </Card>
      <Modal open={modal?.type === 'create' || modal?.type === 'edit'} onClose={() => !saving && setModal(null)} title={modal?.type === 'edit' ? 'Edit payment request' : 'Create payment request'} description={modal?.type === 'edit' ? 'Update the request details or change its publication status.' : 'Add a new request that users can view and submit proof against.'} size="lg"><PaymentRequestForm key={modal?.type === 'edit' ? modal.request.id : 'create'} request={modal?.type === 'edit' ? modal.request : null} error={formError} saving={saving} onCancel={() => setModal(null)} onSave={saveRequest} /></Modal>
      <Modal open={modal?.type === 'delete'} onClose={() => !savingId && setModal(null)} title={hasDependentRecords ? 'Force delete payment request?' : 'Delete payment request?'} description="This action cannot be undone." size="sm">
        <div className="space-y-5">
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-900">{hasDependentRecords ? 'Force delete' : 'Delete'} {deletingRequest?.transaction_id}?</p>
            <p className="mt-1 text-sm leading-6 text-rose-700">The payment request and its QR image will be permanently removed.</p>
          </div>
          {hasDependentRecords ? <Notice tone="error"><span><strong>Warning:</strong> Every submission, screenshot, balance entry, and credit from this request will be deleted. User balances will be recalculated.</span></Notice> : null}
          {formError ? <Notice tone="error">{formError}</Notice> : null}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
            <Button variant="secondary" disabled={Boolean(savingId)} onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="danger" disabled={Boolean(savingId)} onClick={() => deleteRequest(hasDependentRecords)}><Trash2 size={16} /> {savingId ? 'Deleting…' : hasDependentRecords ? 'Force delete' : 'Delete request'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
