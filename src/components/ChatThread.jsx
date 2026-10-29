import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, Send } from 'lucide-react'
import { Button, EmptyState, Notice, Spinner, cn } from './ui'

export const CHAT_PAGE_SIZE = 20
export const CHAT_MAX_LENGTH = 2000

export function senderName(sender) {
  if (!sender) return 'Deleted account'
  const name = `${sender.first_name || ''} ${sender.last_name || ''}`.trim()
  return name || sender.email || 'Unknown sender'
}

export function mergeMessages(current = [], incoming = []) {
  const merged = new Map()
  current.forEach((message) => merged.set(message.id, message))
  incoming.forEach((message) => merged.set(message.id, message))
  return [...merged.values()].sort((left, right) => {
    const difference = new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    return difference || (left.id || 0) - (right.id || 0)
  })
}

export async function fetchLatestThread(fetcher) {
  const first = await fetcher({ page: 1 })
  const totalPages = Math.max(1, Math.ceil((first.count || 0) / CHAT_PAGE_SIZE))
  if (totalPages <= 1) return { messages: first.results || [], page: 1, hasEarlier: false }
  const last = await fetcher({ page: totalPages })
  return { messages: last.results || [], page: totalPages, hasEarlier: true }
}

function formatClock(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date)
}

function formatDay(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export function ChatMessageList({
  messages,
  viewerId,
  emptyTitle = 'No messages yet',
  emptyDescription = 'Start the conversation below.',
  hasEarlier = false,
  onLoadEarlier,
  loadingEarlier = false,
  className,
  accent = 'own',
}) {
  const scrollRef = useRef(null)
  const pinnedRef = useRef(true)
  const ownBubble =
    accent === 'cyan'
      ? 'rounded-br-md bg-cyan-600 text-white'
      : 'rounded-br-md bg-indigo-600 text-white'
  const ownMeta = accent === 'cyan' ? 'text-cyan-100' : 'text-indigo-100'

  useEffect(() => {
    const node = scrollRef.current
    if (!node || !pinnedRef.current) return
    node.scrollTop = node.scrollHeight
  }, [messages])

  const handleScroll = () => {
    const node = scrollRef.current
    if (!node) return
    pinnedRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 90
  }

  return (
    <div ref={scrollRef} onScroll={handleScroll} className={cn('min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6', className)}>
      {messages.length ? (
        <div className="space-y-4">
          {hasEarlier ? (
            <div className="flex justify-center">
              <Button variant="secondary" size="sm" disabled={loadingEarlier} onClick={onLoadEarlier}>
                {loadingEarlier ? <Spinner size={15} /> : null}
                {loadingEarlier ? 'Loading…' : 'Load earlier messages'}
              </Button>
            </div>
          ) : null}
          {messages.map((message, index) => {
            const own = Boolean(viewerId) && message.sender?.id === viewerId
            const previous = messages[index - 1]
            const newDay = !previous || formatDay(previous.created_at) !== formatDay(message.created_at)
            return (
              <div key={message.id}>
                {newDay ? (
                  <div className="my-5 flex items-center gap-3">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{formatDay(message.created_at)}</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                ) : null}
                <div className={cn('flex', own ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[88%] rounded-2xl px-4 py-2.5 sm:max-w-[70%]', own ? ownBubble : 'rounded-bl-md bg-slate-100 text-slate-800')}>
                    {!own ? <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{senderName(message.sender)}</p> : null}
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
                    <p className={cn('mt-1 text-[11px]', own ? ownMeta : 'text-slate-400')}>{formatClock(message.created_at)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      )}
    </div>
  )
}

export function ChatComposer({
  onSend,
  disabled = false,
  error = '',
  placeholder = 'Write a message…',
  hint = 'Enter sends · Shift + Enter adds a new line',
}) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const remaining = CHAT_MAX_LENGTH - body.length

  const submit = async () => {
    const trimmed = body.trim()
    if (!trimmed || sending || disabled) return
    setSending(true)
    let delivered = false
    try {
      delivered = await onSend(trimmed)
    } catch {
      delivered = false
    } finally {
      setSending(false)
    }
    if (delivered) setBody('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="shrink-0 space-y-3 border-t border-slate-100 bg-white px-4 py-4 sm:px-6">
      {error ? <Notice tone="error">{error}</Notice> : null}
      <div className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value.slice(0, CHAT_MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          rows={2}
          maxLength={CHAT_MAX_LENGTH}
          placeholder={placeholder}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
        <Button type="submit" disabled={disabled || sending || !body.trim()} className="shrink-0">
          {sending ? <LoaderCircle className="animate-spin" size={17} /> : <Send size={17} />}
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
        <span className="truncate">{hint}</span>
        <span className={cn('shrink-0', remaining <= 100 && 'font-bold text-amber-600')}>{remaining} left</span>
      </div>
    </form>
  )
}
