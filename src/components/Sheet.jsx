import { useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from './ui'

export default function Sheet({ open, title, description, onClose, children, footer }) {
  const titleId = useId()
  const panelRef = useRef(null)
  const dragCleanupRef = useRef(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => () => dragCleanupRef.current?.(), [])

  useEffect(() => {
    if (!open) {
      setOffset(0)
      return undefined
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, open])

  useEffect(() => {
    if (!open || !offset) return
    panelRef.current?.focus()
  }, [offset, open])

  if (!open) return null

  const startDrag = (event) => {
    dragCleanupRef.current?.()
    const startY = event.touches ? event.touches[0].clientY : event.clientY
    const move = (moveEvent) => {
      const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY
      setOffset(Math.max(0, currentY - startY))
    }
    const cleanup = () => {
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', cleanup)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', cleanup)
      dragCleanupRef.current = null
    }
    const end = () => {
      setOffset((current) => {
        if (current > 110) onClose?.()
        return 0
      })
      cleanup()
    }
    dragCleanupRef.current = cleanup
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('touchend', end)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-sheet-backdrop absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={offset ? { transform: `translateY(${offset}px)` } : undefined}
        className="animate-sheet-in relative flex max-h-[90dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl outline-none sm:max-w-lg"
      >
        <div
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          className="shrink-0 cursor-grab touch-none px-4 pt-3 active:cursor-grabbing"
        >
          <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-300" />
        </div>
        <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-4 pt-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold tracking-tight text-slate-950">
              {title}
            </h2>
            {description ? <p className="mt-1 text-[13px] leading-5 text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={19} />
          </button>
        </div>
        <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6', !footer && 'pb-[max(1.5rem,env(safe-area-inset-bottom))]')}>
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
