import { loadEmployeesFromOdoo } from '../../../utils/odooEmployees'

function parseYmdToUtcMs(ymd: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return null
  const year = Number(m[1])
  const monthIndex = Number(m[2]) - 1
  const day = Number(m[3])
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) return null
  return Date.UTC(year, monthIndex, day)
}

function isActiveStatus(status: string) {
  return status.trim().toLowerCase() === 'active'
}

export default defineEventHandler(async () => {
  const employees = await loadEmployeesFromOdoo({ includeInactive: true })

  const startYears: number[] = []
  for (const e of employees) {
    const ymd = e.startDate
    if (ymd) {
      const y = parseInt(ymd.slice(0, 4), 10)
      if (Number.isFinite(y)) startYears.push(y)
    }
  }
  const minYear = startYears.length ? Math.min(...startYears) : new Date().getUTCFullYear()
  const maxYear = new Date().getUTCFullYear()

  const headcountByYear: Array<{ year: number; headcount: number }> = []
  for (let year = minYear; year <= maxYear; year++) {
    const yearEndMs = Date.UTC(year, 11, 31)
    let count = 0
    for (const e of employees) {
      const startMs = e.startDate ? parseYmdToUtcMs(e.startDate) : null
      if (startMs === null || startMs > yearEndMs) continue
      const sepMs = e.separatedAt ? parseYmdToUtcMs(e.separatedAt) : null
      if (sepMs !== null && sepMs <= yearEndMs) continue
      count += 1
    }
    headcountByYear.push({ year, headcount: count })
  }

  return {
    note: 'Uses app exclusions (odooEmployeeExclusions) and dedupe (dedupeOdooEmployees). Headcount = employed as of 31 Dec each year.',
    totalEmployeesAfterExclusionsAndDedupe: employees.length,
    headcountByYear
  }
})
