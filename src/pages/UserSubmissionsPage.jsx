import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { api } from '../lib/api'
import { usePagedList } from '../hooks/usePagedList'
import ProtectedImage from '../components/ProtectedImage'
import Sheet from '../components/Sheet'
import {
  EmptyState,
  EndOfList,
  ErrorState,
  FilterChips,
  ListGroup,
  ListRow,
  LoadMore,
  Notice,
  ScreenTitle,
  StatusBadge,
  formatAmount,
  formatDate,
} from '../components/ui'

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
]

export default function UserSubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const fetcher = useCallback((params) => api.mySubmissions(params), [])
  const { items, loading, loadingMore, error, hasMore, loadMore, reload, sentinelRef } = usePagedList(fetcher)

  const visibleSubmissions = useMemo(
    () => items.filter((submission) => !statusFilter || submission.status === statusFilter),
    [items, statusFilter],
  )

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      setDetailError('')
      return undefined
    }
    let active = true
    setDetailLoading(true)
    setDetailError('')
    api
      .mySubmission(selectedId)
      .then((data) => {
        if (active) setDetail(data)
      })
      .catch((requestError) => {
        if (active) setDetailError(requestError.message)
      })
      .finally(() => {
        if (active) setDetailLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedId])

  if (loading) {
    return (
      <div className="px-4 py-5">
        <ScreenTitle title="My proofs" subtitle="Loading your submissions…" />
        <ListGroup>
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="flex animate-pulse items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-3.5">
              <div className="h-14 w-14 shrink-0 rounded-xl bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/5 rounded-full bg-slate-100" />
                <div className="h-3 w-3/5 rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </ListGroup>
      </div>
    )
  }

  if (error && !items.length) {
    return (
      <div className="px-4 py-5">
        <ErrorState message={error} onRetry={reload} />
      </div>
    )
  }

  return (
    <div className="px-4 py-5">
      <ScreenTitle title="My proofs" subtitle="Every payment screenshot you uploaded and where it stands." />

      <div className="pb-4">
        <FilterChips value={statusFilter} onChange={setStatusFilter} options={FILTERS} />
      </div>

      {visibleSubmissions.length ? (
        <>
          <ListGroup>
            {visibleSubmissions.map((submission) => (
              <ListRow
                key={submission.id}
                onClick={() => setSelectedId(submission.id)}
                leading={
                  <ProtectedImage
                    url={submission.screenshot_url}
                    alt="Submitted payment proof"
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                }
                title={submission.payment_request?.transaction_id || 'Payment proof'}
                subtitle={submission.text}
                meta={
                  <>
                    <span>Attempt #{submission.attempt}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDate(submission.created_at)}</span>
                  </>
                }
                trailing={
                  <>
                    <span className="text-[15px] font-bold text-slate-950">
                      {formatAmount(submission.proposed_amount || submission.payment_request?.amount)}
                    </span>
                    <ChevronRight className="text-slate-300" size={18} />
                  </>
                }
              />
            ))}
          </ListGroup>
          <div ref={sentinelRef} />
          {statusFilter ? null : hasMore ? <LoadMore hasMore={hasMore} loading={loadingMore} onClick={loadMore} /> : <EndOfList />}
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState
            title="No proofs here"
            description={
              statusFilter
                ? `You have no ${statusFilter.toLowerCase()} submissions.`
                : 'Your payment proofs will appear here once you submit them.'
            }
          />
        </div>
      )}

      <SubmissionSheet
        open={Boolean(selectedId)}
        submission={detail}
        loading={detailLoading}
        error={detailError}
        onClose={() => setSelectedId(null)}
      />
    </div>
  )
}

function SubmissionSheet({ open, submission, loading, error, onClose }) {
  return (
    <Sheet open={open} onClose={onClose} title="Payment proof" description="Your screenshot and review status.">
      {loading ? (
        <div className="py-10 text-center text-sm font-medium text-slate-500">Loading…</div>
      ) : error ? (
        <ErrorState message={error} />
      ) : submission ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl bg-slate-950 p-2.5">
            <ProtectedImage
              url={submission.screenshot_url}
              alt="Submitted payment proof"
              className="max-h-[46dvh] w-full rounded-xl object-contain"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
            <div className="min-w-0">
              <p className="text-xl font-bold tracking-tight text-slate-950">
                {formatAmount(
                  submission.final_amount || submission.proposed_amount || submission.payment_request?.amount,
                )}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {submission.status === 'ACCEPTED' ? 'Final credited amount' : 'Amount submitted'}
              </p>
            </div>
            <StatusBadge status={submission.status} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 p-3.5">
              <p className="text-xs text-slate-400">Request</p>
              <p className="mt-1 truncate text-sm font-bold text-slate-900">
                {submission.payment_request?.transaction_id || '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3.5">
              <p className="text-xs text-slate-400">Attempt</p>
              <p className="mt-1 text-sm font-bold text-slate-900">#{submission.attempt}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3.5">
              <p className="text-xs text-slate-400">Submitted</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{formatDate(submission.created_at)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3.5">
              <p className="text-xs text-slate-400">Reviewed</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {submission.reviewed_at ? formatDate(submission.reviewed_at) : '—'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Your note</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{submission.text}</p>
          </div>

          {submission.status === 'PENDING' ? (
            <Notice tone="info">
              <strong>Waiting for review.</strong> The ILL team usually responds within a few days. You will see the
              status change here.
            </Notice>
          ) : null}
          {submission.status === 'DECLINED' && submission.decline_reason ? (
            <Notice tone="error">
              <strong>Declined.</strong> {submission.decline_reason}
            </Notice>
          ) : null}
          {submission.status === 'ACCEPTED' ? (
            <Notice tone="success">
              <strong>Credited.</strong> This amount was added to your balance on {formatDate(submission.reviewed_at)}.
            </Notice>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  )
}
