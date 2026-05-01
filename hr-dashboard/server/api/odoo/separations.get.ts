import { getQuery } from 'h3'
import { loadEmployeesFromOdoo } from '../../utils/odooEmployees'

type SeparationType =
  | 'resigned'
  | 'retired'
  | 'fired'
  | 'vsep'
  | 'end_of_contract'
  | 'probation_failure'
  | 'retrenchment'
  | 'separated'

type Row = {
  employeeKey: string
  name: string
  department: string
  position: string
  countryAssigned: string
  startDate: string | null
  separatedAt: string
  separationType: SeparationType
}

type Response = {
  currentMonth: string
  months: string[]
  items: Row[]
}

function utcTodayMs() {
  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

function monthKeyFromUtcMs(utcMs: number) {
  const d = new Date(utcMs)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + 1
  return `${y}-${String(m).padStart(2, '0')}`
}

function parseYmdToUtcMs(ymd: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return null
  const year = Number(m[1])
  const monthIndex = Number(m[2]) - 1
  const day = Number(m[3])
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) return null
  return Date.UTC(year, monthIndex, day)
}

function monthIndexFromKey(key: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(key.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return null
  return y * 12 + (mo - 1)
}

function monthKeyFromIndex(idx: number) {
  const y = Math.floor(idx / 12)
  const m0 = idx % 12
  return `${y}-${String(m0 + 1).padStart(2, '0')}`
}

function normalizeSeparationType(status: string): Row['separationType'] {
  const v = status.trim().toLowerCase()
  if (v === 'resigned') return 'resigned'
  if (v === 'retired') return 'retired'
  if (v === 'fired') return 'fired'
  if (v === 'vsep') return 'vsep'
  if (v === 'end of contract') return 'end_of_contract'
  if (v === 'probation failure') return 'probation_failure'
  if (v === 'retrenchment') return 'retrenchment'
  if (v === 'terminated' || v.includes('terminate') || v.includes('termination')) return 'fired'
  return 'separated'
}

function normName(input: string) {
  return (input ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// TEMP (one-time): exclude mistakenly archived employees from separations tables.
const TEMP_EXCLUDED_SEPARATION_NAMES = new Set(['Jared Rogers', 'Joshua Phillips'].map(normName))

// TEMP (one-time): exclude specific separations in specific months.
const TEMP_EXCLUDED_SEPARATION_NAMES_BY_MONTH = new Map<string, Set<string>>([
  ['2026-02', new Set(['Raj Mahabir'].map(normName))]
])

function isTempExcludedSeparationName(name: string, monthKey?: string) {
  const n = normName(name)
  if (!n) return false
  if (TEMP_EXCLUDED_SEPARATION_NAMES.has(n)) return true
  if (monthKey) {
    const set = TEMP_EXCLUDED_SEPARATION_NAMES_BY_MONTH.get(monthKey)
    if (set?.has(n)) return true
  }
  return false
}

export default defineEventHandler(async (event): Promise<Response> => {
  const q = getQuery(event)
  const requestedMonth = typeof q.month === 'string' ? q.month.trim() : ''
  const currentMonth = monthKeyFromUtcMs(utcTodayMs())
  const activeMonth = /^\d{4}-\d{2}$/.test(requestedMonth) ? requestedMonth : currentMonth

  const employees = await loadEmployeesFromOdoo({ includeInactive: true })

  const separatedRows = employees
    .filter((e) => (e.employeeStatus ?? '').trim().toLowerCase() !== 'active')
    .filter((e) => !isTempExcludedSeparationName(e.name))
    .map((e) => {
      const ymd = (e.separatedAt ?? '').trim()
      const ms = ymd ? parseYmdToUtcMs(ymd) : null
      if (!ymd || ms === null) return null
      const monthKey = ymd.slice(0, 7)
      return { monthKey, ms }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)

  const nowIdx = monthIndexFromKey(currentMonth) ?? 0
  const minSepIdx =
    separatedRows.length > 0 ? Math.min(...separatedRows.map((r) => monthIndexFromKey(r.monthKey) ?? nowIdx)) : nowIdx

  const MAX_MONTHS = 48
  const span = Math.max(0, nowIdx - minSepIdx) + 1
  const countMonths = Math.min(MAX_MONTHS, span)
  const startIdx = nowIdx - (countMonths - 1)
  const months = Array.from({ length: countMonths }, (_, i) => monthKeyFromIndex(startIdx + i)).reverse()

  const items: Row[] = employees
    .filter((e) => (e.employeeStatus ?? '').trim().toLowerCase() !== 'active')
    .filter((e) => !isTempExcludedSeparationName(e.name, activeMonth))
    .map((e) => {
      const separatedAt = (e.separatedAt ?? '').trim()
      if (!separatedAt) return null
      if (separatedAt.slice(0, 7) !== activeMonth) return null
      return {
        employeeKey: e.employeeKey,
        name: e.name,
        department: e.department,
        position: e.position,
        countryAssigned: e.countryAssigned,
        startDate: e.startDate ?? null,
        separatedAt,
        separationType: normalizeSeparationType(e.employeeStatus ?? '')
      }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort((a, b) => b.separatedAt.localeCompare(a.separatedAt) || a.name.localeCompare(b.name) || a.employeeKey.localeCompare(b.employeeKey))

  return { currentMonth, months, items }
})

