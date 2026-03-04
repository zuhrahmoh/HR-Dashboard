import { getQuery } from 'h3'
import { loadEmployeesFromOdoo } from '../../utils/odooEmployees'

type Row = {
  employeeKey: string
  name: string
  position: string
  department: string
  countryAssigned: string
  startDate: string | null
  tenure?: string
  createdAt: string | null
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

function parseYmdUtcMs(ymd: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const ms = Date.UTC(y, mo - 1, d)
  const dt = new Date(ms)
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
  return ms
}

function addMonthsClampedUtcMs(startUtcMs: number, months: number) {
  const dt = new Date(startUtcMs)
  const y = dt.getUTCFullYear()
  const m0 = dt.getUTCMonth()
  const d = dt.getUTCDate()
  const target = new Date(Date.UTC(y, m0 + months, 1))
  const ty = target.getUTCFullYear()
  const tm0 = target.getUTCMonth()
  const lastDay = new Date(Date.UTC(ty, tm0 + 1, 0)).getUTCDate()
  const td = Math.min(d, lastDay)
  return Date.UTC(ty, tm0, td)
}

function monthKeyFromUtcMs(utcMs: number) {
  const d = new Date(utcMs)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + 1
  return `${y}-${String(m).padStart(2, '0')}`
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

function isReasonableAdditionYmd(ymd: string) {
  const y = Number(ymd.slice(0, 4))
  if (!Number.isFinite(y)) return false
  const currentYear = new Date().getUTCFullYear()
  // Historical reporting & headcount snapshots begin in 2022; older Odoo dates are often placeholders/import artefacts.
  return y >= 2022 && y <= currentYear + 1
}

export default defineEventHandler(async (event): Promise<Response> => {
  const q = getQuery(event)
  const requestedMonth = typeof q.month === 'string' ? q.month.trim() : ''
  const probation =
    q.probation === '1' || q.probation === 'true' || q.probation === 'yes' || q.probation === 'on' || q.probation === 1
  const currentMonth = monthKeyFromUtcMs(utcTodayMs())
  const activeMonth = /^\d{4}-\d{2}$/.test(requestedMonth) ? requestedMonth : currentMonth

  const employees = await loadEmployeesFromOdoo({ includeInactive: true })

  const additionMonths = employees
    .map((e) => ((e.startDate ?? '').trim() || (e.createdAt ?? '').trim() || '').trim())
    .filter(Boolean)
    .filter((ymd) => isReasonableAdditionYmd(ymd))
    .map((ymd) => ymd.slice(0, 7))
    .filter((m) => /^\d{4}-\d{2}$/.test(m))

  const nowIdx = monthIndexFromKey(currentMonth) ?? 0
  const minCreateIdx = additionMonths.length > 0 ? Math.min(...additionMonths.map((m) => monthIndexFromKey(m) ?? nowIdx)) : nowIdx
  const MAX_MONTHS = 48
  const span = Math.max(0, nowIdx - minCreateIdx) + 1
  const countMonths = Math.min(MAX_MONTHS, span)
  const startIdx = nowIdx - (countMonths - 1)
  const months = Array.from({ length: countMonths }, (_, i) => monthKeyFromIndex(startIdx + i)).reverse()

  const today = utcTodayMs()
  const items: Row[] = (probation
    ? employees.filter((e) => {
        const start = (e.startDate ?? '').trim()
        const startMs = start ? parseYmdUtcMs(start) : null
        if (!startMs) return false
        const probationEnd = addMonthsClampedUtcMs(startMs, 6)
        return today < probationEnd
      })
    : employees.filter((e) => {
        const ymd = ((e.startDate ?? '').trim() || (e.createdAt ?? '').trim() || '').trim()
        if (!ymd || !isReasonableAdditionYmd(ymd)) return false
        return ymd.slice(0, 7) === activeMonth
      })
  )
    .map((e) => ({
      employeeKey: e.employeeKey,
      name: e.name,
      position: e.position,
      department: e.department,
      countryAssigned: e.countryAssigned,
      startDate: e.startDate ?? null,
      tenure: e.tenure,
      createdAt: e.createdAt ?? null
    }))
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '') || a.employeeKey.localeCompare(b.employeeKey))

  return { currentMonth, months, items }
})

