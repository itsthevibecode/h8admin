import { createHmac, timingSafeEqual } from 'crypto'

export interface BaasDebitPayload {
  eventId: string
  eventType: string
  bsb: string
  accountNumber: string
  billerName: string
  amountCents: number
  reference: string
  mandateId: string
}

const HANDLED_EVENTS = new Set(['direct_debit.inbound', 'payto.mandate.debit'])

export function isHandledBaasEvent(eventType: string) {
  return HANDLED_EVENTS.has(eventType.trim().toLowerCase())
}

export function verifyBaasSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string | undefined
) {
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[baas] BAAS_WEBHOOK_SECRET is not set; skipping HMAC verification in development'
      )
      return true
    }
    return false
  }

  if (!signatureHeader) return false

  const provided = signatureHeader.includes('=')
    ? signatureHeader.split('=').pop() || ''
    : signatureHeader
  const expectedHex = createHmac('sha256', secret).update(rawBody).digest('hex')

  try {
    const expected = Buffer.from(expectedHex, 'hex')
    const actual = Buffer.from(provided, 'hex')
    if (expected.length === 0 || expected.length !== actual.length) return false
    return timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

export function parseBaasDebitPayload(body: unknown): BaasDebitPayload | null {
  if (!body || typeof body !== 'object') return null
  const root = body as Record<string, unknown>
  const data =
    root.data && typeof root.data === 'object'
      ? (root.data as Record<string, unknown>)
      : root

  const eventId = stringField(root.eventId ?? data.eventId ?? root.id)
  const eventType = stringField(root.eventType ?? data.eventType ?? root.type)
  const bsb = stringField(data.bsb ?? root.bsb)
  const accountNumber = stringField(data.accountNumber ?? root.accountNumber)
  const billerName = stringField(data.billerName ?? root.billerName ?? data.remitterName)
  const amountCents = numberField(data.amountCents ?? root.amountCents ?? data.amount)
  const reference = stringField(data.reference ?? root.reference) || eventId
  const mandateId = stringField(data.mandateId ?? root.mandateId)

  if (!eventId || !eventType || !bsb || !accountNumber || !billerName || amountCents === null) {
    return null
  }

  return {
    eventId,
    eventType,
    bsb,
    accountNumber,
    billerName,
    amountCents,
    reference,
    mandateId,
  }
}

function stringField(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function numberField(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}
