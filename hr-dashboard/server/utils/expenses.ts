import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadExpensesRowsFromSharePoint } from './sharepointExpenses'

export type ExpenseCountryBreakdown = {
  country: string
  grossSalary: number
  allowance: number
  overtime: number
  vc: number
  nisCompany: number
  medicalPlanEmployer: number
  total: number
}

export type ExpensesSnapshot = {
  month: string | null
  items: ExpenseCountryBreakdown[]
}

type CanonicalRow = Record<string, string>

let cached:
  | {
      csvPath: string
      mtimeMs: number
      snapshot: ExpensesSnapshot
    }
  | null = null

export type ExpenseCountryDelta = ExpenseCountryBreakdown

export type ExpensesResponse = ExpensesSnapshot & {
  monthKey: string | null
  availableMonths: string[]
  monthLabels: Record<string, string>
  previousMonth: string | null
  compareTo: string | null
  deltas?: ExpenseCountryDelta[]
  source: 'sharepoint' | 'csv'
  warning?: string
}

function normalizeHeader(header: string) {
  return header.trim().replace(/\s+/g, ' ').toLowerCase()
}

function canonicalHeaderKey(rawHeader: string) {
  const h = normalizeHeader(rawHeader)
  if (!h) return ''
  if (h === 'country') return 'country'
  if (h === 'month') return 'month'
  if (h === 'gross salary') return 'grossSalary'
  if (h === 'allowance' || h === 'allowances') return 'allowance'
  if (h === 'overtime') return 'overtime'
  if (h === 'vc') return 'vc'
  if (h === 'nis (company)') return 'nisCompany'
  if (h === 'medical plan (employer)') return 'medicalPlanEmployer'
  return h
}

function normalizeFieldValue(v: string) {
  return v.trim()
}

function normalizeMonthKey(v: string) {
  const key = v.trim().replace(/\s+/g, ' ').toLowerCase()
  if (key === 'decemeber') return 'december'
  return key
}

function normalizeExpenseCountryName(raw: string) {
  const v = String(raw ?? '').trim().replace(/\s+/g, ' ')
  if (!v) return ''
  if (v.toLowerCase() === 'columbia') return 'Colombia'
  return v
}

function isYyyyMm(v: string) {
  return /^\d{4}-\d{2}$/.test(v)
}

function parseAmount(raw: string) {
  const cleaned = raw.replace(/[^\d.-]/g, '')
  const n = cleaned ? Number(cleaned) : 0
  return Number.isFinite(n) ? n : 0
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1]
        if (next === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }

    if (ch === ',') {
      row.push(cell)
      cell = ''
      continue
    }

    if (ch === '\n') {
      row.push(cell)
      cell = ''
      rows.push(row)
      row = []
      continue
    }

    if (ch === '\r') continue

    cell += ch
  }

  row.push(cell)
  if (row.length > 1 || (row[0] ?? '').trim() !== '') rows.push(row)
  return rows
}

function resolveExpensesCsvPath() {
  const candidates = [
    fileURLToPath(new URL('../../data/global_expenses.csv', import.meta.url)),
    fileURLToPath(new URL('../../../global_expenses.csv', import.meta.url))
  ]

  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return candidates[1]!
}

function canonicalizeRows(csvText: string): CanonicalRow[] {
  const rows = parseCsv(csvText)
  if (rows.length === 0) return []

  const headerRow = rows[0]!
  const headers = headerRow.map(canonicalHeaderKey)

  const out: CanonicalRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]!
    if (r.every((c) => !c || c.trim() === '')) continue
    const obj: CanonicalRow = {}
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j]
      if (!key) continue
      obj[key] = normalizeFieldValue(r[j] ?? '')
    }
    out.push(obj)
  }
  return out
}

function pickMonthSnapshot(rows: CanonicalRow[]) {
  const lastLabelByKey = new Map<string, string>()
  const uniqueKeys = new Set<string>()
  let lastKey: string | null = null

  for (const r of rows) {
    const label = String(r.month ?? '').trim()
    if (!label) continue
    const key = normalizeMonthKey(label)
    uniqueKeys.add(key)
    lastLabelByKey.set(key, label)
    lastKey = key
  }

  if (!lastKey) return { month: null as string | null, monthKey: null as string | null }

  if (uniqueKeys.size === 1) {
    const only = lastKey
    return { month: lastLabelByKey.get(only) ?? null, monthKey: only }
  }

  return { month: lastLabelByKey.get(lastKey) ?? null, monthKey: lastKey }
}

type NormalizedExpenseRow = {
  country: string
  monthKey: string
  monthLabel: string
  grossSalary: number
  allowance: number
  overtime: number
  vc: number
  nisCompany: number
  medicalPlanEmployer: number
}

function sortMonthKeysNewestFirst(keysInEncounterOrder: string[]) {
  const unique: string[] = []
  const seen = new Set<string>()
  for (const k of keysInEncounterOrder) {
    if (!k) continue
    if (seen.has(k)) continue
    seen.add(k)
    unique.push(k)
  }

  const allYyyyMm = unique.length > 0 && unique.every(isYyyyMm)
  if (allYyyyMm) return unique.slice().sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))

  // Fallback: preserve encounter order (newest assumed to be last encountered)
  return unique.slice().reverse()
}

function aggregateSnapshot(rows: NormalizedExpenseRow[], selectedMonthKey: string | null) {
  const filtered = selectedMonthKey ? rows.filter((r) => r.monthKey === selectedMonthKey) : rows

  const countryMap = new Map<string, Omit<ExpenseCountryBreakdown, 'total'>>()
  for (const r of filtered) {
    const country = normalizeExpenseCountryName(r.country)
    if (!country) continue

    const prev = countryMap.get(country) ?? {
      country,
      grossSalary: 0,
      allowance: 0,
      overtime: 0,
      vc: 0,
      nisCompany: 0,
      medicalPlanEmployer: 0
    }

    prev.grossSalary += r.grossSalary
    prev.allowance += r.allowance
    prev.overtime += r.overtime
    prev.vc += r.vc
    prev.nisCompany += r.nisCompany
    prev.medicalPlanEmployer += r.medicalPlanEmployer

    countryMap.set(country, prev)
  }

  const items: ExpenseCountryBreakdown[] = Array.from(countryMap.values())
    .map((i) => ({
      ...i,
      total: i.grossSalary + i.allowance + i.overtime + i.vc + i.nisCompany + i.medicalPlanEmployer
    }))
    .sort((a, b) => b.total - a.total || a.country.localeCompare(b.country))

  return items
}

function computeDeltas(current: ExpenseCountryBreakdown[], baseline: ExpenseCountryBreakdown[]) {
  const byCountryCurrent = new Map(current.map((i) => [i.country, i]))
  const byCountryBaseline = new Map(baseline.map((i) => [i.country, i]))
  const countries = new Set<string>([...byCountryCurrent.keys(), ...byCountryBaseline.keys()])

  const deltas: ExpenseCountryDelta[] = []
  for (const country of countries) {
    const c = byCountryCurrent.get(country)
    const b = byCountryBaseline.get(country)

    const grossSalary = (c?.grossSalary ?? 0) - (b?.grossSalary ?? 0)
    const allowance = (c?.allowance ?? 0) - (b?.allowance ?? 0)
    const overtime = (c?.overtime ?? 0) - (b?.overtime ?? 0)
    const vc = (c?.vc ?? 0) - (b?.vc ?? 0)
    const nisCompany = (c?.nisCompany ?? 0) - (b?.nisCompany ?? 0)
    const medicalPlanEmployer = (c?.medicalPlanEmployer ?? 0) - (b?.medicalPlanEmployer ?? 0)
    const total = grossSalary + allowance + overtime + vc + nisCompany + medicalPlanEmployer

    deltas.push({
      country,
      grossSalary,
      allowance,
      overtime,
      vc,
      nisCompany,
      medicalPlanEmployer,
      total
    })
  }

  return deltas.sort((a, b) => Math.abs(b.total) - Math.abs(a.total) || a.country.localeCompare(b.country))
}

export async function loadExpensesFromCsv(): Promise<ExpensesSnapshot> {
  const csvPath = resolveExpensesCsvPath()
  const mtimeMs = await stat(csvPath)
    .then((s) => s.mtimeMs)
    .catch(() => 0)

  if (cached && cached.csvPath === csvPath && cached.mtimeMs === mtimeMs) return cached.snapshot

  const csvText = await readFile(csvPath, 'utf8')
  const rows = canonicalizeRows(csvText)
  const { month, monthKey } = pickMonthSnapshot(rows)

  const filtered = monthKey
    ? rows.filter((r) => normalizeMonthKey(String(r.month ?? '')) === monthKey)
    : rows

  const countryMap = new Map<string, Omit<ExpenseCountryBreakdown, 'total'>>()

  for (const r of filtered) {
    const country = normalizeExpenseCountryName(String(r.country ?? ''))
    const prev = countryMap.get(country) ?? {
      country,
      grossSalary: 0,
      allowance: 0,
      overtime: 0,
      vc: 0,
      nisCompany: 0,
      medicalPlanEmployer: 0
    }

    prev.grossSalary += parseAmount((r.grossSalary ?? '') as string)
    prev.allowance += parseAmount((r.allowance ?? '') as string)
    prev.overtime += parseAmount(r.overtime ?? '')
    prev.vc += parseAmount(r.vc ?? '')
    prev.nisCompany += parseAmount(r.nisCompany ?? '')
    prev.medicalPlanEmployer += parseAmount((r.medicalPlanEmployer ?? '') as string)

    countryMap.set(country, prev)
  }

  const items: ExpenseCountryBreakdown[] = Array.from(countryMap.values())
    .map((i) => ({
      ...i,
      total: i.grossSalary + i.allowance + i.overtime + i.vc + i.nisCompany + i.medicalPlanEmployer
    }))
    .sort((a, b) => b.total - a.total || a.country.localeCompare(b.country))

  const snapshot = { month, items }
  cached = { csvPath, mtimeMs, snapshot }
  return snapshot
}

async function loadNormalizedRowsFromCsv() {
  const csvPath = resolveExpensesCsvPath()
  const csvText = await readFile(csvPath, 'utf8')
  const rows = canonicalizeRows(csvText)

  const out: NormalizedExpenseRow[] = []
  for (const r of rows) {
    const country = normalizeExpenseCountryName(String(r.country ?? ''))
    const monthLabel = String(r.month ?? '').trim()
    const monthKey = normalizeMonthKey(monthLabel)
    if (!country || !monthKey) continue

    out.push({
      country,
      monthKey,
      monthLabel: monthLabel || monthKey,
      grossSalary: parseAmount((r.grossSalary ?? '') as string),
      allowance: parseAmount((r.allowance ?? '') as string),
      overtime: parseAmount(r.overtime ?? ''),
      vc: parseAmount(r.vc ?? ''),
      nisCompany: parseAmount(r.nisCompany ?? ''),
      medicalPlanEmployer: parseAmount((r.medicalPlanEmployer ?? '') as string)
    })
  }

  return { csvPath, out }
}

export async function loadExpenses(input: {
  runtimeConfig: {
    graph?: { tenantId?: string; clientId?: string; clientSecret?: string }
    sharepoint?: { hostname?: string; siteId?: string; sitePath?: string; listId?: string; cacheTtlMs?: number }
  }
  month?: string
  compareTo?: string
}): Promise<ExpensesResponse> {
  const monthParam = typeof input.month === 'string' ? input.month.trim() : ''
  const compareToParam = typeof input.compareTo === 'string' ? input.compareTo.trim() : ''

  const graph = input.runtimeConfig.graph || {}
  const sp = input.runtimeConfig.sharepoint || {}

  const canUseSharePoint =
    !!graph.tenantId && !!graph.clientId && !!graph.clientSecret && !!sp.hostname && !!sp.listId

  if (canUseSharePoint) {
    try {
      const rows = await loadExpensesRowsFromSharePoint({
        tenantId: graph.tenantId || '',
        clientId: graph.clientId || '',
        clientSecret: graph.clientSecret || '',
        hostname: sp.hostname || '',
        siteId: sp.siteId || undefined,
        sitePath: sp.sitePath || undefined,
        listId: sp.listId || '',
        cacheTtlMs: sp.cacheTtlMs
      })

      const monthKeysEncountered = rows.map((r) => r.monthKey)
      const availableMonths = sortMonthKeysNewestFirst(monthKeysEncountered)

      const monthLabels: Record<string, string> = {}
      for (const r of rows) {
        if (!monthLabels[r.monthKey]) monthLabels[r.monthKey] = r.monthLabel || r.monthKey
      }

      const selectedMonthKey = monthParam && availableMonths.includes(monthParam) ? monthParam : availableMonths[0] || null
      const month = selectedMonthKey ? monthLabels[selectedMonthKey] ?? selectedMonthKey : null

      const selectedIndex = selectedMonthKey ? availableMonths.indexOf(selectedMonthKey) : -1
      const previousMonth = selectedIndex >= 0 ? availableMonths[selectedIndex + 1] ?? null : null

      const items = aggregateSnapshot(rows, selectedMonthKey)

      const compareTo = compareToParam && availableMonths.includes(compareToParam) ? compareToParam : null
      const deltas = compareTo ? computeDeltas(items, aggregateSnapshot(rows, compareTo)) : undefined

      return {
        month,
        monthKey: selectedMonthKey,
        items,
        availableMonths,
        monthLabels,
        previousMonth,
        compareTo,
        deltas,
        source: 'sharepoint'
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      const fallback = await loadExpenses({ runtimeConfig: { graph: {}, sharepoint: {} }, month: monthParam, compareTo: compareToParam })
      return {
        ...fallback,
        warning: `SharePoint read failed. Showing CSV data instead. (${message})`
      }
    }
  }

  const { out } = await loadNormalizedRowsFromCsv()
  const monthKeysEncountered = out.map((r) => r.monthKey)
  const availableMonths = sortMonthKeysNewestFirst(monthKeysEncountered)
  const monthLabels: Record<string, string> = {}
  for (const r of out) {
    if (!monthLabels[r.monthKey]) monthLabels[r.monthKey] = r.monthLabel || r.monthKey
  }

  const selectedMonthKey = monthParam && availableMonths.includes(monthParam) ? monthParam : availableMonths[0] || null
  const month = selectedMonthKey ? monthLabels[selectedMonthKey] ?? selectedMonthKey : null
  const selectedIndex = selectedMonthKey ? availableMonths.indexOf(selectedMonthKey) : -1
  const previousMonth = selectedIndex >= 0 ? availableMonths[selectedIndex + 1] ?? null : null

  const items = aggregateSnapshot(out, selectedMonthKey)
  const compareTo = compareToParam && availableMonths.includes(compareToParam) ? compareToParam : null
  const deltas = compareTo ? computeDeltas(items, aggregateSnapshot(out, compareTo)) : undefined

  return {
    month,
    monthKey: selectedMonthKey,
    items,
    availableMonths,
    monthLabels,
    previousMonth,
    compareTo,
    deltas,
    source: 'csv'
  }
}

