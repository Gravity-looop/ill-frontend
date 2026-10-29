import { useCallback, useEffect, useRef, useState } from 'react'

function fingerprint(value) {
  if (!value) return ''
  return JSON.stringify(value)
}

/**
 * Fetches a small summary endpoint once on mount, then again only when the tab
 * regains focus, becomes visible, or the network reconnects. There is no timer,
 * so an idle page issues no requests.
 *
 * `onChange` fires when the same params return different data. The first
 * response and any response after the params change are treated as a new
 * baseline and stay silent.
 *
 * The fetcher is held in a ref, so re-rendering the caller can never re-run the
 * subscribing effect. State is only written when the payload actually differs,
 * so an unchanged response cannot drive a render loop.
 */
export function useRefreshOnFocus(
  fetcher,
  { enabled = true, params, onChange } = {},
) {
  const [summary, setSummary] = useState(null)
  const fingerprintRef = useRef('')
  const paramsKeyRef = useRef('')
  const inFlightRef = useRef(false)
  const fetcherRef = useRef(fetcher)
  const onChangeRef = useRef(onChange)
  const paramsRef = useRef(params)

  useEffect(() => {
    fetcherRef.current = fetcher
    onChangeRef.current = onChange
    paramsRef.current = params
  })

  const check = useCallback(async () => {
    if (!enabled || inFlightRef.current) return
    if (typeof document !== 'undefined' && document.hidden) return
    const paramsKey = fingerprint(paramsRef.current)
    if (paramsKey !== paramsKeyRef.current) {
      paramsKeyRef.current = paramsKey
      fingerprintRef.current = ''
    }
    inFlightRef.current = true
    try {
      const data = await fetcherRef.current(paramsRef.current)
      const previous = fingerprintRef.current
      const next = fingerprint(data)
      fingerprintRef.current = next
      if (previous === next) return
      setSummary(data)
      if (previous !== '') onChangeRef.current?.(data)
    } catch {
      return
    } finally {
      inFlightRef.current = false
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      fingerprintRef.current = ''
      paramsKeyRef.current = ''
      setSummary(null)
      return undefined
    }
    check()
    const handleWake = () => check()
    document.addEventListener('visibilitychange', handleWake)
    window.addEventListener('focus', handleWake)
    window.addEventListener('online', handleWake)
    return () => {
      document.removeEventListener('visibilitychange', handleWake)
      window.removeEventListener('focus', handleWake)
      window.removeEventListener('online', handleWake)
    }
  }, [check, enabled])

  return { summary, refresh: check }
}
