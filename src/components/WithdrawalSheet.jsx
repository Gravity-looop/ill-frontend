import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Copy, Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { buildPayeeSummary, copyText } from '../lib/clipboard'
import Sheet from './Sheet'
import { Button, Field, Input, Notice, Textarea, formatInr, cn } from './ui'

const MAX_PAYEES = 5
const ACCOUNT_PATTERN = /^[0-9]{6,34}$/
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/

function emptyPayee() {
  return { payee_name: '', account_number: '', ifsc: '', amount: '' }
}

function normalisePayee(payee) {
  return {
    ...payee,
    payee_name: payee.payee_name.replace(/\s+/g, ' ').trim(),
    account_number: payee.account_number.replace(/\s+/g, '').trim(),
    ifsc: payee.ifsc.replace(/\s+/g, '').trim().toUpperCase(),
    amount: payee.amount.trim(),
  }
}

function validatePayee(payee, index) {
  const value = normalisePayee(payee)
  if (!value.payee_name) return `Payee ${index + 1}: enter the account name.`
  if (!ACCOUNT_PATTERN.test(value.account_number)) {
    return `Payee ${index + 1}: enter a valid account number.`
  }
  if (!IFSC_PATTERN.test(value.ifsc)) {
    return `Payee ${index + 1}: enter a valid IFSC code.`
  }
  const amount = Number(value.amount)
  if (!value.amount || !Number.isFinite(amount) || amount <= 0) {
    return `Payee ${index + 1}: enter an amount greater than zero.`
  }
  if (value.amount.split('.')[1]?.length > 2) {
    return `Payee ${index + 1}: use no more than 2 decimal places.`
  }
  return ''
}

export default function WithdrawalSheet({ open, onClose, onCreated }) {
  const [balance, setBalance] = useState({ balance: '0.00', pending_amount: '0.00', available_balance: '0.00' })
  const [payees, setPayees] = useState([emptyPayee()])
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)
  const [copied, setCopied] = useState(false)

  const loadBalance = useCallback(async () => {
    try {
      setBalance(await api.withdrawalBalance())
    } catch {
      setBalance({ balance: '0.00', pending_amount: '0.00', available_balance: '0.00' })
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setCreated(null)
    setCopied(false)
    setFormError('')
    loadBalance()
  }, [loadBalance, open])

  const available = Number(balance.available_balance || 0)
  const filled = useMemo(
    () => payees.filter((payee) => normalisePayee(payee).amount).map(normalisePayee),
    [payees],
  )
  const total = useMemo(
    () => filled.reduce((sum, payee) => sum + (Number(payee.amount) || 0), 0),
    [filled],
  )
  const overAvailable = filled.length > 0 && total > available
  const blocked = filled.length === 0 || overAvailable

  const updatePayee = (index, key, value) => {
    setFormError('')
    setPayees((current) =>
      current.map((payee, position) => (position === index ? { ...payee, [key]: value } : payee)),
    )
  }

  const addPayee = () => {
    setFormError('')
    setPayees((current) => (current.length < MAX_PAYEES ? [...current, emptyPayee()] : current))
  }

  const removePayee = (index) => {
    setFormError('')
    setPayees((current) => (current.length === 1 ? [emptyPayee()] : current.filter((_, position) => position !== index)))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!filled.length) {
      setFormError('Add at least one payee with an amount.')
      return
    }
    for (let index = 0; index < payees.length; index += 1) {
      const message = validatePayee(payees[index], index)
      if (message) {
        setFormError(message)
        return
      }
    }
    const accountNumbers = filled.map((payee) => payee.account_number)
    if (new Set(accountNumbers).size !== accountNumbers.length) {
      setFormError('Each payee must use a different account number.')
      return
    }
    if (total > available) {
      setFormError('This total is higher than your available balance.')
      return
    }

    setSubmitting(true)
    try {
      const withdrawal = await api.createWithdrawal({
        note: note.trim(),
        payees: filled.map((payee) => ({
          payee_name: payee.payee_name,
          account_number: payee.account_number,
          ifsc: payee.ifsc,
          amount: payee.amount,
        })),
      })
      setCreated(withdrawal)
      setPayees([emptyPayee()])
      setNote('')
      loadBalance()
      onCreated?.(withdrawal)
    } catch (requestError) {
      setFormError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = async () => {
    const copiedOk = await copyText(buildPayeeSummary(created?.payees || filled))
    if (!copiedOk) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="INR Withdrawal"
      description="Send your available balance to one or more Indian bank accounts."
      footer={
        created ? (
          <Button size="lg" className="w-full bg-cyan-600 shadow-cyan-200 hover:bg-cyan-700 focus-visible:ring-cyan-500" onClick={onClose}>
            Done
          </Button>
        ) : (
          <Button
            type="submit"
            form="withdrawal-form"
            disabled={submitting || blocked}
            size="lg"
            className="w-full bg-cyan-600 shadow-cyan-200 hover:bg-cyan-700 focus-visible:ring-cyan-500"
          >
            {submitting ? 'Submitting…' : `Request ${formatInr(total)}`}
          </Button>
        )
      }
    >
      {created ? (
        <div className="space-y-4">
          <Notice tone="success">
            <strong>{created.reference}</strong> is pending review. We will debit {formatInr(created.total_amount)} once the
            payout is confirmed.
          </Notice>
          <div className="rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-bold text-slate-900">Payee details</p>
              <Button variant="secondary" size="sm" onClick={handleCopy}>
                {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                {copied ? 'Copied' : 'Copy all'}
              </Button>
            </div>
            <ul className="divide-y divide-slate-100">
              {(created.payees || []).map((payee) => (
                <li key={payee.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{payee.payee_name}</p>
                    <p className="shrink-0 text-sm font-bold text-slate-900">{formatInr(payee.amount)}</p>
                  </div>
                  <p className="mt-1 font-mono text-[13px] text-slate-500">A/C {payee.account_number}</p>
                  <p className="font-mono text-[13px] text-slate-500">IFSC {payee.ifsc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <form id="withdrawal-form" className="space-y-4" onSubmit={handleSubmit}>
          {formError ? <Notice tone="error">{formError}</Notice> : null}

          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3.5 text-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Balance</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{formatInr(balance.balance)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pending</p>
              <p className="mt-1 text-sm font-bold text-amber-600">{formatInr(balance.pending_amount)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Available</p>
              <p className="mt-1 text-sm font-bold text-emerald-600">{formatInr(balance.available_balance)}</p>
            </div>
          </div>

          {payees.map((payee, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 p-3.5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Payee {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removePayee(index)}
                  aria-label={`Remove payee ${index + 1}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition active:bg-rose-50 active:text-rose-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <Field label="Account name" htmlFor={`payee_name_${index}`}>
                  <Input
                    id={`payee_name_${index}`}
                    value={payee.payee_name}
                    onChange={(event) => updatePayee(index, 'payee_name', event.target.value)}
                    placeholder="Ravi Kumar"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Account number" htmlFor={`account_number_${index}`}>
                  <Input
                    id={`account_number_${index}`}
                    value={payee.account_number}
                    inputMode="numeric"
                    onChange={(event) => updatePayee(index, 'account_number', event.target.value.replace(/[^\d\s]/g, ''))}
                    placeholder="123456789012"
                    autoComplete="off"
                  />
                </Field>
                <Field label="IFSC code" htmlFor={`ifsc_${index}`}>
                  <Input
                    id={`ifsc_${index}`}
                    value={payee.ifsc}
                    onChange={(event) => updatePayee(index, 'ifsc', event.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    maxLength={11}
                    autoComplete="off"
                    className="font-mono"
                  />
                </Field>
                <Field label="Amount (INR)" htmlFor={`amount_${index}`}>
                  <Input
                    id={`amount_${index}`}
                    value={payee.amount}
                    inputMode="decimal"
                    onChange={(event) => updatePayee(index, 'amount', event.target.value)}
                    placeholder="1500.00"
                  />
                </Field>
              </div>
            </div>
          ))}

          <Button
            variant="secondary"
            size="sm"
            onClick={addPayee}
            disabled={payees.length >= MAX_PAYEES}
            className="w-full"
          >
            <Plus size={15} /> {payees.length >= MAX_PAYEES ? `Maximum ${MAX_PAYEES} payees` : 'Add another payee'}
          </Button>

          <div
            className={cn(
              'flex items-center justify-between rounded-2xl px-4 py-3 text-sm',
              overAvailable ? 'bg-rose-50 text-rose-700' : 'bg-cyan-50 text-cyan-800',
            )}
          >
            <span className="font-semibold">Total</span>
            <span className="font-bold">{formatInr(total)}</span>
          </div>
          {overAvailable ? (
            <Notice tone="error">
              This is {formatInr(total - available)} more than your available balance of {formatInr(available)}.
            </Notice>
          ) : null}

          <Field label="Note for the reviewer" htmlFor="withdrawal_note" hint="Optional · max 2,000 characters.">
            <Textarea
              id="withdrawal_note"
              value={note}
              maxLength={2000}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Example: monthly payouts for the team"
              className="min-h-20"
            />
          </Field>
        </form>
      )}
    </Sheet>
  )
}
