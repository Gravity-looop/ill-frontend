import { useEffect, useState } from 'react'
import { ImageOff, LoaderCircle } from 'lucide-react'
import { fetchProtectedFile } from '../lib/api'
import { cn } from './ui'

export default function ProtectedImage({ url, alt, className }) {
  const [objectUrl, setObjectUrl] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    let createdUrl = ''
    setObjectUrl('')
    setError(false)
    if (!url) {
      setError(true)
      return undefined
    }
    fetchProtectedFile(url)
      .then((blob) => {
        if (!active) return
        createdUrl = URL.createObjectURL(blob)
        setObjectUrl(createdUrl)
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [url])

  if (error) {
    return (
      <div className={cn('flex items-center justify-center rounded-xl bg-slate-100 text-slate-400', className)}>
        <ImageOff size={20} />
      </div>
    )
  }
  if (!objectUrl) {
    return (
      <div className={cn('flex items-center justify-center rounded-xl bg-slate-100 text-indigo-500', className)}>
        <LoaderCircle className="animate-spin" size={20} />
      </div>
    )
  }
  return <img src={objectUrl} alt={alt} className={className} />
}
