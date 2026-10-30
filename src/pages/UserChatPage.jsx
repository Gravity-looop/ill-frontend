import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, ShieldCheck } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { notifyChatRead } from '../hooks/useChatUnread'
import { ChatComposer, ChatMessageList, fetchLatestThread, mergeMessages } from '../components/ChatThread'
import { ErrorState, IconButton, LoadingState, Notice } from '../components/ui'

export default function UserChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [threadWindow, setThreadWindow] = useState({ page: 1, hasEarlier: false })
  const [loading, setLoading] = useState(true)
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [sendError, setSendError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const newestMessageIdRef = useRef(null)

  const loadThread = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const thread = await fetchLatestThread((params) => api.chatMessages(params))
      setMessages((current) => (silent ? mergeMessages(current, thread.messages) : thread.messages))
      setThreadWindow((current) => {
        const earliest = silent ? Math.min(current.page, thread.page) : thread.page
        return { page: earliest, hasEarlier: earliest > 1 }
      })
      const newestId = thread.messages[thread.messages.length - 1]?.id ?? null
      if (newestId && newestId !== newestMessageIdRef.current) notifyChatRead()
      newestMessageIdRef.current = newestId
    } catch (requestError) {
      if (!silent) setError(requestError.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadThread()
  }, [loadThread])

  useEffect(() => {
    const refreshOnWake = () => {
      if (document.hidden) return
      loadThread({ silent: true })
    }
    document.addEventListener('visibilitychange', refreshOnWake)
    window.addEventListener('focus', refreshOnWake)
    return () => {
      document.removeEventListener('visibilitychange', refreshOnWake)
      window.removeEventListener('focus', refreshOnWake)
    }
  }, [loadThread])

  const loadEarlier = async () => {
    if (threadWindow.page <= 1) return
    setLoadingEarlier(true)
    setHistoryError('')
    try {
      const data = await api.chatMessages({ page: threadWindow.page - 1 })
      setMessages((current) => mergeMessages(data.results, current))
      setThreadWindow({ page: threadWindow.page - 1, hasEarlier: threadWindow.page - 1 > 1 })
    } catch (requestError) {
      setHistoryError(requestError.message)
    } finally {
      setLoadingEarlier(false)
    }
  }

  const sendMessage = async (body) => {
    setSendError('')
    try {
      const message = await api.sendChatMessage(body)
      setMessages((current) => mergeMessages(current, [message]))
      return true
    } catch (requestError) {
      setSendError(requestError.message)
      return false
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
            <ShieldCheck size={18} />
          </span>
          <p className="min-w-0 truncate text-[13px] font-semibold text-slate-600">
            Only ILL admins can read this conversation
          </p>
        </div>
        <IconButton
          label="Refresh conversation"
          disabled={refreshing}
          onClick={() => loadThread({ silent: true })}
          className="shrink-0"
        >
          <RefreshCw className={refreshing ? 'animate-spin' : undefined} size={17} />
        </IconButton>
      </div>

      {loading ? (
        <LoadingState label="Loading your conversation" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadThread} />
      ) : (
        <ChatMessageList
          messages={messages}
          viewerId={user?.id}
          hasEarlier={threadWindow.hasEarlier}
          loadingEarlier={loadingEarlier}
          onLoadEarlier={loadEarlier}
          emptyTitle="No messages yet"
          emptyDescription="Send the first message and the admin team will reply here."
          accent="cyan"
        />
      )}

      {historyError ? (
        <div className="shrink-0 px-4 pt-3">
          <Notice tone="error">{historyError}</Notice>
        </div>
      ) : null}

      <ChatComposer
        onSend={sendMessage}
        error={sendError}
        placeholder="Describe your question or issue…"
        hint="Messages are text only"
      />
    </div>
  )
}
