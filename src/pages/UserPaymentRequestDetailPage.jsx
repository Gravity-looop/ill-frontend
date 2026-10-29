import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Info, Maximize2, UploadCloud, X } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import ProtectedImage from '../components/ProtectedImage'
import Sheet from '../components/Sheet'
import { Button, ErrorState, Field, Input, LoadingState, Notice, Textarea } from '../components/ui'

export default function UserPaymentRequestDetailPage() {
  const { id } = useParams()
  const [request, setRequest] = useState(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [zoomOpen, setZoomOpen] = useState(false)
  const [proposedAmount, setProposedAmount] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadRequest = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRequest(await api.userPaymentRequest(id))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadRequest()
  }, [loadRequest])

  useEffect(() => {
    if (!file) {
      setPreview('')
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    setSuccess(false)
    if (!file) {
      setFormError('Choose a payment screenshot to continue.')
      return
    }
    if (request.amount == null && !proposedAmount.trim()) {
      setFormError('Enter the amount you paid to continue.')
      return
    }
    setSubmitting(true)
    const payload = new FormData()
    payload.append('screenshot', file)
    if (request.amount == null) payload.append('proposed_amount', proposedAmount.trim())
    payload.append('text', text.trim())
    try {
      await api.createSubmission(id, payload)
      setSuccess(true)
      setFile(null)
      setProposedAmount('')
      setText('')
    } catch (requestError) {
      setFormError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-5">
        <LoadingState label="Loading payment request" />
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="px-4 py-5">
        <ErrorState message={error || 'Payment request not found.'} onRetry={loadRequest} />
      </div>
    )
  }

  const needsAmount = request.amount == null

  return (
    <div className="px-4 py-5">
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="group relative w-full max-w-[280px]"
        >
          <ProtectedImage
            url={request.qr_image_url}
            alt={`Payment QR for ${request.transaction_id}`}
            className="aspect-square w-full rounded-2xl bg-white object-contain p-2 ring-1 ring-slate-200"
          />
          <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/75 text-white transition group-hover:bg-slate-900">
            <Maximize2 size={15} />
          </span>
        </button>
      </div>

      {request.instructions ? (
        <div className="mt-4 rounded-2xl bg-cyan-50 p-4">
          <div className="flex gap-2.5">
            <Info className="mt-0.5 shrink-0 text-cyan-600" size={17} />
            <p className="min-w-0 whitespace-pre-wrap break-words text-[13px] leading-6 text-cyan-800">
              {request.instructions}
            </p>
          </div>
        </div>
      ) : null}

      {success ? (
        <div className="mt-4">
          <Notice tone="success">
            <span className="flex items-start gap-1.5">
              <CheckCircle2 className="mt-0.5 shrink-0" size={16} />
              <span>
                <strong>Submission received.</strong> Your proof is waiting for review.{' '}
                <Link to="/user/submissions" className="font-bold underline">
                  View my proofs
                </Link>
                .
              </span>
            </span>
          </Notice>
        </div>
      ) : null}

      <form className="mt-4 rounded-2xl border border-slate-200 bg-white p-4" onSubmit={handleSubmit}>
        <div className="space-y-4">
          {formError ? <Notice tone="error">{formError}</Notice> : null}

          {needsAmount ? (
            <Field label="Amount you paid" htmlFor="proposed_amount" hint="Up to two decimal places.">
              <Input
                id="proposed_amount"
                name="proposed_amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                required
                value={proposedAmount}
                onChange={(event) => {
                  setProposedAmount(event.target.value)
                  setFormError('')
                }}
                placeholder="75.25"
              />
            </Field>
          ) : null}

          <Field label="Payment screenshot" htmlFor="screenshot" hint="PNG, JPG or WebP · max 5 MB.">
            {preview ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="relative bg-slate-950">
                  <img src={preview} alt="Selected payment proof" className="h-52 w-full object-contain" />
                  <button
                    type="button"
                    aria-label="Remove screenshot"
                    onClick={() => setFile(null)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="truncate border-t border-slate-100 px-3.5 py-2.5 text-[13px] font-semibold text-slate-600">
                  {file.name}
                </p>
              </div>
            ) : (
              <label
                htmlFor="screenshot"
                className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center transition active:border-cyan-500 active:bg-cyan-50"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-cyan-600 shadow-sm">
                  <UploadCloud size={22} />
                </span>
                <span className="mt-3 text-sm font-bold text-slate-700">Tap to choose a screenshot</span>
                <span className="mt-1 text-xs text-slate-400">PNG, JPG or WebP up to 5 MB</span>
              </label>
            )}
            <input
              id="screenshot"
              name="screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null)
                setFormError('')
              }}
            />
          </Field>

          <Field label="Note for the reviewer" htmlFor="text" hint="Max 2,000 characters.">
            <Textarea
              id="text"
              name="text"
              required
              maxLength={2000}
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setFormError('')
              }}
              placeholder="Example: paid using the QR code above. Reference ABC123"
            />
          </Field>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          size="lg"
          className="mt-5 w-full bg-cyan-600 shadow-cyan-200 hover:bg-cyan-700 focus-visible:ring-cyan-500"
        >
          {submitting ? 'Submitting…' : success ? 'Submit another proof' : 'Submit'}
        </Button>
      </form>

      <Sheet
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        title={request.transaction_id}
        description="Hold your phone over the code to pay, or screenshot it to keep a copy."
      >
        <div className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
          <ProtectedImage
            url={request.qr_image_url}
            alt={`Payment QR for ${request.transaction_id}`}
            className="aspect-square w-full object-contain"
          />
        </div>
      </Sheet>
    </div>
  )
}
