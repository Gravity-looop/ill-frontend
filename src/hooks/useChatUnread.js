import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const MAX_INBOX_PAGES = 5
const READ_EVENT = 'ill:chat-read'

export function notifyChatRead() {
  window.dispatchEvent(new Event(READ_EVENT))
}

async function readUnreadCount(isUser) {
  if (isUser) {
    const summary = await api.chatSummary()
    return summary.unread_count || 0
  }
  let page = 1
  let total = 0
  while (page <= MAX_INBOX_PAGES) {
    const data = await api.adminChatConversations({ page })
    const results = data.results || []
    total += results.reduce((sum, item) => sum + (item.unread_count || 0), 0)
    if (total > 0 || !data.next || !results.length) break
    page += 1
  }
  return total
}

export function useChatUnread({ enabled = true } = {}) {
  const { isUser } = useAuth()
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(async () => {
    if (!enabled) return
    try {
      setUnread(await readUnreadCount(isUser))
    } catch {
      return
    }
  }, [enabled, isUser])

  useEffect(() => {
    if (!enabled) {
      setUnread(0)
      return undefined
    }
    refresh()
    const handleRefresh = () => {
      if (document.hidden) return
      refresh()
    }
    window.addEventListener('focus', handleRefresh)
    window.addEventListener(READ_EVENT, handleRefresh)
    document.addEventListener('visibilitychange', handleRefresh)
    return () => {
      window.removeEventListener('focus', handleRefresh)
      window.removeEventListener(READ_EVENT, handleRefresh)
      document.removeEventListener('visibilitychange', handleRefresh)
    }
  }, [enabled, refresh])

  return { unread, refresh }
}
