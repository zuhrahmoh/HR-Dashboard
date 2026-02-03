import { readFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export type ExpenseCountryBreakdown = {
  country: string
  salariesInclusiveOfPaye: number
  overtime: number
  vc: number
  otherAllowances: number
  nisCompany: number
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

function normalizeHeader(header: string) {
  return header.trim().replace(/\s+/g, ' ').toLowerCase()
}

function canonicalHeaderKey(rawHeader: string) {
  const h = normalizeHeader(rawHeader)
  if (!h) return ''
  if (h === 'country') return 'country'
  if (h === 'month') return 'month'
  if (h === 'salaries inclusive of paye') return 'salariesInclusiveOfPaye'
  if (h === 'overtime') return 'overtime'
  if (h === 'vc') return 'vc'
  if (h === 'other allowances') return 'otherAllowances'
  if (h === 'nis (company)') return 'nisCompany'
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
  if (row.length > 1 || row[0].trim() !== '') rows.push(row)
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
  return candidates[1]
}

function canonicalizeRows(csvText: string): CanonicalRow[] {
  const rows = parseCsv(csvText)
  if (rows.length === 0) return []

  const headerRow = rows[0]
  const headers = headerRow.map(canonicalHeaderKey)

  const out: CanonicalRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
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
    const country = String(r.country ?? '').trim()
    const prev = countryMap.get(country) ?? {
      country,
      salariesInclusiveOfPaye: 0,
      overtime: 0,
      vc: 0,
      otherAllowances: 0,
      nisCompany: 0
    }

    prev.salariesInclusiveOfPaye += parseAmount(r.salariesInclusiveOfPaye ?? '')
    prev.overtime += parseAmount(r.overtime ?? '')
    prev.vc += parseAmount(r.vc ?? '')
    prev.otherAllowances += parseAmount(r.otherAllowances ?? '')
    prev.nisCompany += parseAmount(r.nisCompany ?? '')

    countryMap.set(country, prev)
  }

  const items: ExpenseCountryBreakdown[] = Array.from(countryMap.values())
    .map((i) => ({
      ...i,
      total: i.salariesInclusiveOfPaye + i.overtime + i.vc + i.otherAllowances + i.nisCompany
    }))
    .sort((a, b) => b.total - a.total || a.country.localeCompare(b.country))

  const snapshot = { month, items }
  cached = { csvPath, mtimeMs, snapshot }
  return snapshot
}

