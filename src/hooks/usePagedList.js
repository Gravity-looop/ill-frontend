import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function usePagedList(fetcher, { enabled = true } = {}) {
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(enabled)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const requestRef = useRef(0)
  const sentinelRef = useRef(null)

  const load = useCallback(
    async (targetPage, { append }) => {
      const ticket = ++requestRef.current
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError('')
      try {
        const data = await fetcher({ page: targetPage })
        if (ticket !== requestRef.current) return
        const results = data?.results || []
        setCount(data?.count ?? results.length)
        setItems((current) => (append ? [...current, ...results] : results))
        setPage(targetPage)
      } catch (requestError) {
        if (ticket !== requestRef.current) return
        setError(requestError.message || 'Unable to load this list.')
      } finally {
        if (ticket === requestRef.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [fetcher],
  )

  const reload = useCallback(() => {
    setItems([])
    return load(1, { append: false })
  }, [load])

  const loadMore = useCallback(() => {
    if (loading || loadingMore) return
    if (items.length >= count) return
    return load(page + 1, { append: true })
  }, [count, items.length, load, loading, loadingMore, page])

  useEffect(() => {
    if (enabled) load(1, { append: false })
  }, [enabled, load])

  const hasMore = items.length < count

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore || loading || loadingMore) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore()
      },
      { rootMargin: '240px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadMore, loading, loadingMore])

  return useMemo(
    () => ({ items, count, loading, loadingMore, error, hasMore, loadMore, reload, sentinelRef }),
    [count, error, hasMore, items, loadMore, loading, loadingMore, reload],
  )
}
