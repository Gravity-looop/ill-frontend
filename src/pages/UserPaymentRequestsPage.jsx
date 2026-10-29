import { useCallback, useEffect, useRef, useState } from 'react'
import { Banknote, Check, Copy, Maximize2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { usePagedList } from '../hooks/usePagedList'
import ProtectedImage from '../components/ProtectedImage'
import Sheet from '../components/Sheet'
import WithdrawalSheet from '../components/WithdrawalSheet'
import { Button, EmptyState, ErrorState, LoadMore, Notice } from '../components/ui'

export default function UserPaymentRequestsPage() {
  const navigate = useNavigate()
  const [preview, setPreview] = useState(null)
  const [withdrawalOpen, setWithdrawalOpen] = useState(false)
  const [withdrawalNotice, setWithdrawalNotice] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const copyTimerRef = useRef(null)

  const fetcher = useCallback((params) => api.userPaymentRequests(params), [])
  const { items, loading, loadingMore, error, hasMore, loadMore, reload, sentinelRef } = usePagedList(fetcher)

  useEffect(() => () => window.clearTimeout(copyTimerRef.current), [])

  const handleCopy = async (request) => {
    try {
      await navigator.clipboard.writeText(request.transaction_id)
    } catch {
      return
    }
    setCopiedId(request.id)
    window.clearTimeout(copyTimerRef.current)
    copyTimerRef.current = window.setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-[320px] animate-pulse rounded-2xl bg-slate-200/70" style={{ aspectRatio: '1 / 1' }} />
        <div className="mt-5 flex items-center gap-2">
          <span className="w-8 shrink-0" aria-hidden="true" />
          <div className="h-4 w-44 animate-pulse rounded-full bg-slate-200/70" />
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-slate-200/70" />
        </div>
        <div className="mt-6 h-11 w-28 animate-pulse rounded-xl bg-slate-200/70" />
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

  if (!items.length) {
    return (
      <div className="px-4 py-5">
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState
            title="No payment requests"
            description="There are no payment requests available right now. Check back soon."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 px-4 py-6">
      {withdrawalNotice ? <Notice tone="success">{withdrawalNotice}</Notice> : null}
      {items.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
          copied={copiedId === request.id}
          onCopy={() => handleCopy(request)}
          onPreview={() => setPreview(request)}
          onSend={() => navigate(`/user/payment-requests/${request.id}`)}
          onWithdraw={() => setWithdrawalOpen(true)}
        />
      ))}
      <div ref={sentinelRef} />
      {hasMore ? <LoadMore hasMore={hasMore} loading={loadingMore} onClick={loadMore} /> : null}

      <Sheet
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.transaction_id}
        description="Hold your phone over the code to pay, or screenshot it to keep a copy."
      >
        {preview ? (
          <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
            <ProtectedImage
              url={preview.qr_image_url}
              alt={`Payment QR for ${preview.transaction_id}`}
              className="aspect-square w-full object-contain"
            />
          </div>
        ) : null}
      </Sheet>

      <WithdrawalSheet
        open={withdrawalOpen}
        onClose={() => setWithdrawalOpen(false)}
        onCreated={(withdrawal) => setWithdrawalNotice(`Withdrawal ${withdrawal.reference} submitted for review.`)}
      />
    </div>
  )
}

function RequestCard({ request, copied, onCopy, onPreview, onSend, onWithdraw }) {
  return (
    <div className="flex flex-col items-center">
      <button type="button" onClick={onPreview} className="group relative w-full max-w-[320px]">
        <ProtectedImage
          url={request.qr_image_url}
          alt={`Payment QR for ${request.transaction_id}`}
          className="aspect-square w-full rounded-2xl bg-white object-contain p-2 ring-1 ring-slate-200"
        />
        <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/75 text-white transition group-hover:bg-slate-900">
          <Maximize2 size={15} />
        </span>
      </button>

      <div className="mt-5 flex max-w-full items-center justify-center gap-2">
        <span className="w-8 shrink-0" aria-hidden="true" />
        <p className="min-w-0 select-all break-all text-center font-mono text-[15px] font-semibold leading-6 text-slate-900">
          {request.transaction_id}
        </p>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? 'Wallet ID copied' : 'Copy wallet ID'}
          title={copied ? 'Copied' : 'Copy wallet ID'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition active:scale-90 active:bg-slate-200"
        >
          {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
        </button>
        <span className="sr-only" role="status">
          {copied ? 'Wallet ID copied to clipboard' : ''}
        </span>
      </div>

      <Button
        size="md"
        onClick={onSend}
        className="mt-5 h-11 rounded-full px-9 bg-cyan-600 shadow-cyan-200 hover:bg-cyan-700 focus-visible:ring-cyan-500"
      >
        Send
      </Button>

      <Button
        size="sm"
        variant="secondary"
        onClick={onWithdraw}
        className="mt-2.5 h-9 rounded-full px-4 text-[13px] font-bold"
      >
        <Banknote size={15} /> INR Withdrawal
      </Button>
    </div>
  )
}
