export async function copyText(value) {
  const text = String(value ?? '')
  if (!text) return false

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return legacyCopy(text)
    }
  }
  return legacyCopy(text)
}

function legacyCopy(text) {
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.top = '0'
  field.style.opacity = '0'
  document.body.appendChild(field)
  field.select()
  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }
  document.body.removeChild(field)
  return copied
}

export function buildPayeeSummary(payees = []) {
  return payees
    .map((payee) => `${payee.payee_name}\nA/C ${payee.account_number}\nIFSC ${payee.ifsc}\n₹${payee.amount}`)
    .join('\n\n')
}
