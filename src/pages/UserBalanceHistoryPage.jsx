import { useCallback, useMemo } from 'react'
import { Minus, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { usePagedList } from '../hooks/usePagedList'
import {
  EmptyState,
  EndOfList,
  ErrorState,
  ListGroup,
  ListRow,
  LoadMore,
  ScreenTitle,
  formatAmount,
  formatDate,
  formatInr,
} from '../components/ui'

function monthLabel(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Earlier'
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}

function isDebit(entry) {
  return entry.entry_type === 'DEBIT'
}

export default function UserBalanceHistoryPage() {
  const fetcher = useCallback((params) => api.userBalanceHistory(params), [])
  const { items, loading, loadingMore, error, hasMore, loadMore, reload, sentinelRef } = usePagedList(fetcher)

  const groups = useMemo(() => {
    const buckets = []
    items.forEach((entry) => {
      const label = monthLabel(entry.created_at)
      const last = buckets[buckets.length - 1]
      if (last && last.label === label) last.entries.push(entry)
      else buckets.push({ label, entries: [entry] })
    })
    return buckets
  }, [items])

  if (loading) {
    return (
      <div className="px-4 py-5">
        <ScreenTitle title="Balance history" subtitle="Loading your credits…" />
        <ListGroup>
          {[0, 1, 2, 3, 4].map((key) => (
            <div key={key} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
              <div className="h-4 w-24 rounded-full bg-slate-100" />
              <div className="mt-2.5 h-3 w-1/2 rounded-full bg-slate-100" />
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
      <ScreenTitle title="Balance history" subtitle="Every credit from an accepted proof and every withdrawal payout." />

      {items.length ? (
        <>
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.label}>
                <h2 className="mb-2.5 px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {group.label}
                </h2>
                <ListGroup>
                  {group.entries.map((entry) => (
                    <ListRow
                      key={entry.id}
                      leading={
                        <span className={`flex h-12 w-12 items-center justify-center rounded-full ${isDebit(entry) ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {isDebit(entry) ? <Minus size={20} strokeWidth={2.6} /> : <Plus size={20} strokeWidth={2.6} />}
                        </span>
                      }
                      title={isDebit(entry) ? `-${formatInr(entry.amount)}` : `+${formatAmount(entry.amount)}`}
                      subtitle={`Balance after ${isDebit(entry) ? formatInr(entry.balance_after) : formatAmount(entry.balance_after)}`}
                      meta={
                        isDebit(entry) ? (
                          <>
                            <span>Withdrawal #{entry.withdrawal_id}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formatDate(entry.created_at)}</span>
                          </>
                        ) : (
                          <>
                            <span>Request #{entry.payment_request_id}</span>
                            <span aria-hidden="true">·</span>
                            <span>Proof #{entry.submission_id}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formatDate(entry.created_at)}</span>
                          </>
                        )
                      }
                    />
                  ))}
                </ListGroup>
              </section>
            ))}
          </div>
          <div ref={sentinelRef} />
          {hasMore ? <LoadMore hasMore={hasMore} loading={loadingMore} onClick={loadMore} /> : <EndOfList>End of history</EndOfList>}
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState
            title="No balance activity yet"
            description="When the ILL team accepts one of your payment proofs, or pays out a withdrawal, it shows up here."
          />
        </div>
      )}
    </div>
  )
}
