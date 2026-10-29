import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, MessageCircle, RefreshCw, Search, X } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { notifyChatRead } from '../hooks/useChatUnread'
import { ChatComposer, ChatMessageList, fetchLatestThread, mergeMessages, senderName } from '../components/ChatThread'
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, formatAmount, IconButton, Input, LoadingState, Notice, Pagination, cn } from '../components/ui'

const THREAD_POLL_MS = 20000
const INBOX_POLL_MS = 30000

function formatListTime(value) {
  if (!value) return 'No messages'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const sameDay = date.toDateString() === new Date().toDateString()
  return new Intl.DateTimeFormat('en-US', sameDay ? { hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric' }).format(date)
}

export default function AdminChatPage() {
  const { user: admin } = useAuth()
  const [data, setData] = useState({ count: 0, results: [] })
  const [page, setPage] = useState(1)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [notice, setNotice] = useState('')

  const [messages, setMessages] = useState([])
  const [threadWindow, setThreadWindow] = useState({ page: 1, hasEarlier: false })
  const [threadLoading, setThreadLoading] = useState(false)
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const [threadError, setThreadError] = useState('')
  const [sendError, setSendError] = useState('')
  const newestMessageIdRef = useRef(null)

  const loadConversations = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const result = await api.adminChatConversations({ page, search })
      setData(result)
      setSelectedUser((current) => {
        if (!current) return current
        const match = (result.results || []).find((item) => item.user.id === current.id)
        return match ? match.user : current
      })
    } catch (requestError) {
      if (!silent) setError(requestError.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, search])

  useEffect(() => { loadConversations() }, [loadConversations])

  useEffect(() => {
    const timer = setInterval(() => loadConversations({ silent: true }), INBOX_POLL_MS)
    return () => clearInterval(timer)
  }, [loadConversations])

  const userId = selectedUser?.id

  const loadThread = useCallback(async ({ silent = false } = {}) => {
    if (!userId) return
    if (!silent) setThreadLoading(true)
    setThreadError('')
    try {
      const thread = await fetchLatestThread((params) => api.adminChatMessages(userId, params))
      setMessages((current) => (silent ? mergeMessages(current, thread.messages) : thread.messages))
      setThreadWindow((current) => {
        const earliest = silent ? Math.min(current.page, thread.page) : thread.page
        return { page: earliest, hasEarlier: earliest > 1 }
      })
      const newestId = thread.messages[thread.messages.length - 1]?.id ?? null
      if (newestId && newestId !== newestMessageIdRef.current) notifyChatRead()
      newestMessageIdRef.current = newestId
    } catch (requestError) {
      if (!silent) setThreadError(requestError.message)
    } finally {
      setThreadLoading(false)
    }
  }, [userId])

  useEffect(() => {
    setMessages([])
    setThreadWindow({ page: 1, hasEarlier: false })
    setSendError('')
    newestMessageIdRef.current = null
    if (userId) loadThread()
  }, [loadThread, userId])

  useEffect(() => {
    if (!userId) return undefined
    const timer = setInterval(() => loadThread({ silent: true }), THREAD_POLL_MS)
    return () => clearInterval(timer)
  }, [loadThread, userId])

  const submitSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchDraft.trim())
  }

  const selectConversation = (conversation) => {
    setNotice('')
    setSelectedUser(conversation.user)
    if (conversation.unread_count) loadConversations({ silent: true })
  }

  const loadEarlier = async () => {
    if (!userId || threadWindow.page <= 1) return
    setLoadingEarlier(true)
    try {
      const result = await api.adminChatMessages(userId, { page: threadWindow.page - 1 })
      setMessages((current) => mergeMessages(result.results, current))
      setThreadWindow({ page: threadWindow.page - 1, hasEarlier: threadWindow.page - 1 > 1 })
    } catch (requestError) {
      setNotice(requestError.message)
    } finally {
      setLoadingEarlier(false)
    }
  }

  const sendMessage = async (body) => {
    if (!userId) return false
    setSendError('')
    try {
      const message = await api.adminSendChatMessage(userId, body)
      setMessages((current) => mergeMessages(current, [message]))
      loadConversations({ silent: true })
      return true
    } catch (requestError) {
      setSendError(requestError.message)
      return false
    }
  }

  const conversationSummary = useMemo(() => {
    const current = data.results.find((item) => item.user.id === userId)
    return current || null
  }, [data.results, userId])

  const displayName = selectedUser ? senderName(selectedUser) : ''

  return (
    <div>
      {notice ? <div className="mb-5"><Notice tone="error">{notice}</Notice></div> : null}
      <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card className={cn('h-[calc(100vh-13rem)] min-h-[520px] flex-col overflow-hidden', selectedUser ? 'hidden lg:flex' : 'flex')}>
          <div className="border-b border-slate-100 p-4">
            <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <Input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search email or name" className="pl-10" />
              </div>
              <Button type="submit">Search</Button>
              {search ? <Button type="button" variant="secondary" onClick={() => { setSearchDraft(''); setSearch(''); setPage(1) }}><X size={16} /> Clear</Button> : null}
            </form>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">{data.count} {data.count === 1 ? 'account' : 'accounts'} · {data.results.reduce((sum, item) => sum + (item.unread_count || 0), 0)} unread on this page</p>
              <IconButton label="Refresh inbox" disabled={refreshing} onClick={() => loadConversations({ silent: true })}><RefreshCw className={refreshing ? 'animate-spin' : undefined} size={16} /></IconButton>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? <LoadingState label="Loading conversations" /> : error ? <ErrorState message={error} onRetry={loadConversations} /> : data.results.length ? data.results.map((conversation) => {
              const name = senderName(conversation.user)
              const preview = conversation.last_message_body
                ? `${conversation.last_message_sender_id === admin?.id ? 'You: ' : ''}${conversation.last_message_body}`
                : 'No messages yet'
              return (
                <button
                  key={conversation.user.id}
                  type="button"
                  onClick={() => selectConversation(conversation)}
                  className={cn('flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition hover:bg-slate-50', userId === conversation.user.id && 'bg-indigo-50/70 hover:bg-indigo-50/70')}
                >
                  <Avatar name={name} email={conversation.user.email} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-slate-900">{name}</span>
                      <span className="shrink-0 text-[11px] text-slate-400">{formatListTime(conversation.last_message_at)}</span>
                    </span>
                    <span className="block truncate text-xs text-slate-400">{conversation.user.email}</span>
                    <span className="mt-1.5 block truncate text-xs text-slate-500">{preview}</span>
                  </span>
                  {conversation.unread_count ? <span className="mt-1 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">{conversation.unread_count > 99 ? '99+' : conversation.unread_count}</span> : null}
                </button>
              )
            }) : <EmptyState title="No accounts found" description={search ? 'Try a different search term.' : 'No non-staff accounts are available yet.'} />}
          </div>
          <Pagination count={data.count} page={page} onPageChange={setPage} />
        </Card>

        <Card className={cn('h-[calc(100vh-13rem)] min-h-[520px] flex-col overflow-hidden', selectedUser ? 'flex' : 'hidden lg:flex')}>
          {selectedUser ? (
            <>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSelectedUser(null)}><ArrowLeft size={16} /> Inbox</Button>
                  <Avatar name={displayName} email={selectedUser.email} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
                    <p className="truncate text-xs text-slate-400">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="hidden shrink-0 items-center gap-3 sm:flex">
                  <Badge tone="slate">Balance {formatAmount(selectedUser.balance)}</Badge>
                  {conversationSummary ? <span className="text-xs text-slate-400">{conversationSummary.message_count} messages</span> : null}
                </div>
                <IconButton label="Refresh conversation" onClick={() => loadThread({ silent: true })}><RefreshCw size={16} /></IconButton>
              </div>
              {threadLoading ? <LoadingState label="Loading conversation" /> : threadError ? <ErrorState message={threadError} onRetry={loadThread} /> : <ChatMessageList messages={messages} viewerId={admin?.id} hasEarlier={threadWindow.hasEarlier} loadingEarlier={loadingEarlier} onLoadEarlier={loadEarlier} emptyTitle="No messages yet" emptyDescription="Send the first message to start this conversation." />}
              <ChatComposer onSend={sendMessage} error={sendError} placeholder={`Reply to ${displayName}…`} />
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><MessageCircle size={22} /></span>
              <h3 className="font-semibold text-slate-900">Select a conversation</h3>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Pick a user from the inbox to read the thread and reply. Accounts you have never messaged are listed too.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
