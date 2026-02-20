import { getGraphAccessToken, graphGetJson } from './graph'

export type EmployeeCompensation = {
  name: string
  monthlySalary: number | null
  allowance: number | null
  currency: string | null
  grossSalary: number | null
}

type GraphListItemsResponse = {
  value: Array<{
    id: string
    fields?: Record<string, unknown>
  }>
  '@odata.nextLink'?: string
}

let cached:
  | {
      expiresAtMs: number
      items: EmployeeCompensation[]
    }
  | null = null

function nowMs() {
  return Date.now()
}

function normalizeSiteId(siteId: string, hostname: string) {
  const raw = siteId.trim()
  if (!raw) return ''
  const hasComma = raw.includes(',')
  if (!hasComma) return raw
  const first = raw.split(',')[0]?.trim() || ''
  if (first.includes('.')) return raw
  const host = hostname.trim()
  if (!host) return raw
  return `${host},${raw}`
}

function encodeSiteIdForPath(siteId: string) {
  // Graph siteId values are comma-delimited; commas must remain literal in the path.
  if (!siteId.includes(',')) return encodeURIComponent(siteId)
  return siteId
    .split(',')
    .map((p) => encodeURIComponent(p))
    .join(',')
}

function normalizeKey(raw: string) {
  const lowered = raw.trim().toLowerCase()
  const withoutEncoded = lowered.replace(/_?x00[0-9a-f]{2}_?/g, '')
  return withoutEncoded.replace(/[^a-z0-9]+/g, '')
}

function asString(v: unknown) {
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

function parseAmount(raw: unknown) {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0
  const s = asString(raw)
  const cleaned = s.replace(/[^\d.-]/g, '')
  const n = cleaned ? Number(cleaned) : 0
  return Number.isFinite(n) ? n : 0
}

function getFieldValue(fields: Record<string, unknown>, candidates: string[]) {
  for (const c of candidates) {
    if (Object.prototype.hasOwnProperty.call(fields, c)) return fields[c]
  }
  const candidateNorms = new Set(candidates.map(normalizeKey))
  for (const [k, v] of Object.entries(fields)) {
    const nk = normalizeKey(k)
    if (candidateNorms.has(nk)) return v
    for (const cn of candidateNorms) {
      if (nk.startsWith(cn)) return v
    }
  }
  return undefined
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function extractCompensation(fields: Record<string, unknown>): EmployeeCompensation | null {
  const name = asString(getFieldValue(fields, ['Name', 'name', 'Title', 'title'])).trim()
  if (!name) return null

  const monthlySalaryRaw = getFieldValue(fields, [
    'Monthly Salary',
    'MonthlySalary',
    'monthlySalary',
    // observed internal name
    'Salary'
  ])
  const allowanceRaw = getFieldValue(fields, ['Allowance', 'allowance', 'Allowances', 'allowances'])
  const currencyRaw = getFieldValue(fields, ['Currency', 'currency'])
  const grossSalaryRaw = getFieldValue(fields, ['Gross Salary', 'GrossSalary', 'grossSalary'])

  const monthlySalary = monthlySalaryRaw == null || asString(monthlySalaryRaw).trim() === '' ? null : parseAmount(monthlySalaryRaw)
  const allowance = allowanceRaw == null || asString(allowanceRaw).trim() === '' ? null : parseAmount(allowanceRaw)
  const grossSalary = grossSalaryRaw == null || asString(grossSalaryRaw).trim() === '' ? null : parseAmount(grossSalaryRaw)
  const currency = asString(currencyRaw).trim() || null

  return { name, monthlySalary, allowance, currency, grossSalary }
}

async function loadAllListItems(input: { accessToken: string; siteId: string; listId: string }) {
  const items: Array<{ id: string; fields?: Record<string, unknown> }> = []
  let url = `https://graph.microsoft.com/v1.0/sites/${encodeSiteIdForPath(input.siteId)}/lists/${encodeURIComponent(input.listId)}/items?$expand=fields&$top=200`

  for (let i = 0; i < 50; i++) {
    const page = await graphGetJson<GraphListItemsResponse>({ accessToken: input.accessToken, url })
    items.push(...(page.value || []))
    if (!page['@odata.nextLink']) break
    url = page['@odata.nextLink']
  }

  return items
}

async function loadAllListItemsWithFallback(input: { accessToken: string; siteIds: string[]; listId: string }) {
  let lastErr: unknown = null
  for (const siteId of input.siteIds.map((s) => s.trim()).filter(Boolean)) {
    try {
      return await loadAllListItems({ accessToken: input.accessToken, siteId, listId: input.listId })
    } catch (e) {
      lastErr = e
      const msg = e instanceof Error ? e.message : String(e)
      // If the provided siteId is wrong for the tenant, fall back to root.
      if (msg.toLowerCase().includes('invalid hostname')) continue
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr || 'Failed to load list items'))
}

export async function loadCompensationFromSharePoint(input: {
  tenantId: string
  clientId: string
  clientSecret: string
  hostname: string
  siteId: string
  listId: string
  cacheTtlMs?: number
}): Promise<EmployeeCompensation[]> {
  const isDev = process.env.NODE_ENV !== 'production'
  const ttlMs = isDev ? 0 : Number.isFinite(input.cacheTtlMs) ? Math.max(0, input.cacheTtlMs as number) : 10 * 60_000
  const c = cached
  if (c && c.expiresAtMs > nowMs()) return c.items

  const accessToken = await getGraphAccessToken({
    tenantId: input.tenantId,
    clientId: input.clientId,
    clientSecret: input.clientSecret
  })

  const siteId = normalizeSiteId(input.siteId, input.hostname)
  const rawItems = await loadAllListItemsWithFallback({ accessToken, siteIds: [siteId, 'root'], listId: input.listId })

  const items: EmployeeCompensation[] = []
  for (const it of rawItems) {
    const fields = it.fields || {}
    const row = extractCompensation(fields)
    if (row) items.push(row)
  }

  cached = { expiresAtMs: nowMs() + ttlMs, items }
  return items
}

export async function getCompensationForEmployeeName(input: {
  tenantId: string
  clientId: string
  clientSecret: string
  hostname: string
  siteId: string
  listId: string
  cacheTtlMs?: number
  name: string
}) {
  const items = await loadCompensationFromSharePoint(input)
  const target = normalizeName(input.name)
  if (!target) return null
  return items.find((i) => normalizeName(i.name) === target) ?? null
}

