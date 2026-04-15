import { getGraphAccessToken, graphGetJson } from './graph'

export type SharePointExpenseRow = {
  country: string
  monthKey: string
  monthLabel: string
  grossSalary: number
  overtime: number
  vc: number
  nisCompany: number
  medicalPlanEmployer: number
  totalOutgoingExpenses: number
}

type GraphListItemsResponse = {
  value: Array<{
    id: string
    fields?: Record<string, unknown>
  }>
  '@odata.nextLink'?: string
}

type SiteResponse = { id: string }

let cached:
  | {
      expiresAtMs: number
      rows: SharePointExpenseRow[]
    }
  | null = null

function nowMs() {
  return Date.now()
}

function normalizeGuid(raw: string) {
  const trimmed = raw.trim()
  const m = trimmed.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/)
  return m ? m[0] : trimmed
}

function normalizeKey(raw: string) {
  const lowered = raw.trim().toLowerCase()
  // SharePoint internal field names may encode spaces/symbols like "_x0020_".
  const withoutEncoded = lowered.replace(/_?x00[0-9a-f]{2}_?/g, '')
  return withoutEncoded.replace(/[^a-z0-9]+/g, '')
}

function normalizeMonthKey(raw: string) {
  const key = raw.trim().replace(/\s+/g, ' ').toLowerCase()
  if (key === 'decemeber') return 'december'
  return key
}

function asString(v: unknown) {
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

function parseAmount(raw: unknown) {
  const s = asString(raw)
  const cleaned = s.replace(/[^\d.-]/g, '')
  const n = cleaned ? Number(cleaned) : 0
  return Number.isFinite(n) ? n : 0
}

function toMonthKeyFromDateString(raw: string) {
  const d = new Date(raw)
  if (!Number.isFinite(d.getTime())) return null
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function toMonthKey(raw: unknown) {
  const s = asString(raw).trim()
  if (!s) return null
  if (/^\d{4}-\d{2}$/.test(s)) return s
  const fromDate = toMonthKeyFromDateString(s)
  if (fromDate) return fromDate
  return normalizeMonthKey(s)
}

function isYyyyMm(v: string) {
  return /^\d{4}-\d{2}$/.test(v)
}

function getFieldValue(fields: Record<string, unknown>, candidates: string[]) {
  for (const c of candidates) {
    if (Object.prototype.hasOwnProperty.call(fields, c)) return fields[c]
  }
  const candidateNorms = new Set(candidates.map(normalizeKey))
  let prefixFallback: unknown = undefined
  for (const [k, v] of Object.entries(fields)) {
    const nk = normalizeKey(k)
    if (candidateNorms.has(nk)) return v
    for (const cn of candidateNorms) {
      if (!nk.startsWith(cn)) continue
      const s = asString(v).trim()
      if (s !== '' && s !== '0' && s !== '$0' && s !== '$0.00') return v
      if (prefixFallback === undefined) prefixFallback = v
    }
  }
  return prefixFallback
}

function extractExpenseRow(fields: Record<string, unknown>): SharePointExpenseRow | null {
  const title = asString(getFieldValue(fields, ['Title', 'title'])).trim()
  const countryCode = asString(getFieldValue(fields, ['Country', 'country'])).trim()
  const countryName = asString(getFieldValue(fields, ['CountryName', 'countryName'])).trim()
  const country = title || countryName || countryCode

  const monthKeyRaw =
    getFieldValue(fields, ['MonthKey', 'monthKey', 'Month', 'month', 'MonthStart', 'monthStart', 'MonthStartDate'])
  const monthKey = toMonthKey(monthKeyRaw)
  let monthLabel = asString(
    getFieldValue(fields, ['MonthLabel', 'monthLabel', 'Month', 'month', 'MonthKey', 'monthKey', 'MonthStart'])
  ).trim()

  if (!country || !monthKey) return null

  if (!monthLabel) monthLabel = monthKey
  if (isYyyyMm(monthKey)) {
    const labelKey = toMonthKey(monthLabel)
    if (labelKey === monthKey && monthLabel.length > 7) monthLabel = monthKey
  }

  // Prefer strict internal field names from the current SharePoint list (verified via Graph):
  // - Salaries_x0028_inclusiveofPAYE_x (displayed as "Gross Salary")
  // - NIS_x0028_Company_x0029_ (displayed as "NIS (Company)")
  // - Total (displayed as "Total Outgoing Expenses")
  // Fallbacks exist to reduce breakage if the list schema changes later.
  const grossSalary = parseAmount(
    (fields['Salaries_x0028_inclusiveofPAYE_x'] as unknown) ??
      getFieldValue(fields, ['Gross Salary', 'GrossSalary', 'grossSalary', 'GrossSalaryUSD'])
  )

  const overtime = parseAmount((fields['Overtime'] as unknown) ?? getFieldValue(fields, ['Overtime', 'overtime']))
  const vc = parseAmount((fields['VC'] as unknown) ?? getFieldValue(fields, ['VC', 'Vc', 'vc']))
  const nisCompany = parseAmount(
    (fields['NIS_x0028_Company_x0029_'] as unknown) ??
      getFieldValue(fields, ['NIS_x0028_Company_x0029_', 'NIS (Company)', 'NISCompany', 'nisCompany', 'NIS', 'nis'])
  )
  const medicalPlanEmployer = parseAmount(
    getFieldValue(fields, [
      'Medical_x0020_Plan_x0020__x0028_Employer_x0029_',
      'Medical_x0020_Plan_x0028_Employer_x0029_',
      'Medical Plan (Employer)',
      'MedicalPlanEmployer',
      'medicalPlanEmployer',
      'MedicalPlan_x0028_Employer_x0029_'
    ])
  )

  const totalOutgoingExpensesDirect = parseAmount(
    (fields['Total'] as unknown) ??
      getFieldValue(fields, ['Total', 'Total Outgoing Expenses', 'TotalOutgoingExpenses', 'totalOutgoingExpenses', 'TotalOutgoingEx', 'totalOutgoingEx'])
  )

  const totalOutgoingExpenses = totalOutgoingExpensesDirect

  return {
    country,
    monthKey,
    monthLabel,
    grossSalary,
    overtime,
    vc,
    nisCompany,
    medicalPlanEmployer,
    totalOutgoingExpenses
  }
}

async function resolveSiteId(input: { accessToken: string; hostname: string; siteId?: string; sitePath?: string }) {
  if (input.siteId && input.siteId.trim()) return input.siteId.trim()
  const sitePath = (input.sitePath || '/').trim() || '/'
  if (sitePath === '/' || sitePath.toLowerCase() === '/root') return 'root'
  const url = `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(input.hostname)}:${sitePath}`
  const site = await graphGetJson<SiteResponse>({ accessToken: input.accessToken, url })
  return site.id
}

async function loadAllListItems(input: { accessToken: string; siteId: string; listId: string }) {
  const items: Array<{ id: string; fields?: Record<string, unknown> }> = []
  const siteIdPath = input.siteId.includes(',')
    ? input.siteId
        .split(',')
        .map((p) => encodeURIComponent(p))
        .join(',')
    : encodeURIComponent(input.siteId)
  let url = `https://graph.microsoft.com/v1.0/sites/${siteIdPath}/lists/${encodeURIComponent(input.listId)}/items?$expand=fields&$top=200`

  for (let i = 0; i < 50; i++) {
    const page = await graphGetJson<GraphListItemsResponse>({ accessToken: input.accessToken, url })
    items.push(...(page.value || []))
    if (!page['@odata.nextLink']) break
    url = page['@odata.nextLink']
  }

  return items
}

export async function loadExpensesRowsFromSharePoint(input: {
  tenantId: string
  clientId: string
  clientSecret: string
  hostname: string
  siteId?: string
  sitePath?: string
  listId: string
  cacheTtlMs?: number
}): Promise<SharePointExpenseRow[]> {
  const isDev = process.env.NODE_ENV !== 'production'
  const ttlMs = isDev ? 0 : Number.isFinite(input.cacheTtlMs) ? Math.max(0, input.cacheTtlMs as number) : 10 * 60_000
  const c = cached
  if (c && c.expiresAtMs > nowMs()) return c.rows

  const accessToken = await getGraphAccessToken({
    tenantId: input.tenantId,
    clientId: input.clientId,
    clientSecret: input.clientSecret
  })

  const siteId = await resolveSiteId({
    accessToken,
    hostname: input.hostname,
    siteId: input.siteId,
    sitePath: input.sitePath
  })

  const listId = normalizeGuid(input.listId)
  const items = await loadAllListItems({ accessToken, siteId, listId })

  const rows: SharePointExpenseRow[] = []
  for (const it of items) {
    const fields = it.fields || {}
    const row = extractExpenseRow(fields)
    if (row) rows.push(row)
  }

  cached = { expiresAtMs: nowMs() + ttlMs, rows }
  return rows
}

