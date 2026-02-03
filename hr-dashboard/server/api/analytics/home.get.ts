import { loadEmployeesFromCsv } from '../../utils/employees'

type HomeAnalytics = {
  headcountByCountry: Array<{ country: string; headcount: number }>
  separations: { resigned: number; total: number; ratio: number }
  genderBreakdown: {
    overall: { male: number; female: number; total: number }
    byCountry: Array<{ country: string; male: number; female: number; total: number }>
  }
  talentDensity: {
    leaders: Array<{ bucket: 'A' | 'B+' | 'B' | 'B-'; count: number }>
    players: Array<{ bucket: 'A' | 'B+' | 'B' | 'B-' | 'C'; count: number }>
  }
  upcomingContracts: Array<{
    employeeKey: string
    name: string
    department: string
    position: string
    reportingTo: string
    countryAssigned: string
    contractOrProbationEndDate: string
    daysRemaining: number
  }>
}

function isResigned(status: string) {
  return status.trim().toLowerCase() === 'resigned'
}

function normalizeGender(raw: string | undefined): 'male' | 'female' | null {
  const v = (raw ?? '').trim().toLowerCase()
  if (!v) return null
  if (v.startsWith('m')) return 'male'
  if (v.startsWith('f')) return 'female'
  return null
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

function utcTodayMs() {
  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

function extractBucket(rating: string): 'A' | 'B+' | 'B' | 'B-' | 'C' | null {
  const m = /^(A|B\+|B-|B|C)(?:\s|$)/i.exec(rating.trim())
  if (!m) return null
  const b = m[1].toUpperCase()
  if (b === 'A' || b === 'B' || b === 'C') return b
  if (b === 'B+') return 'B+'
  if (b === 'B-') return 'B-'
  return null
}

export default defineEventHandler(async (): Promise<HomeAnalytics> => {
  const employees = await loadEmployeesFromCsv()

  const total = employees.length
  const resigned = employees.reduce((acc, e) => acc + (isResigned(e.employeeStatus) ? 1 : 0), 0)

  const headcountMap = new Map<string, number>()
  const genderByCountry = new Map<string, { male: number; female: number }>()
  let maleOverall = 0
  let femaleOverall = 0

  for (const e of employees) {
    if (isResigned(e.employeeStatus)) continue
    const country = (e.countryAssigned ?? '').trim()
    headcountMap.set(country, (headcountMap.get(country) ?? 0) + 1)

    const g = normalizeGender(e.gender)
    if (g) {
      const current = genderByCountry.get(country) ?? { male: 0, female: 0 }
      if (g === 'male') {
        current.male += 1
        maleOverall += 1
      } else {
        current.female += 1
        femaleOverall += 1
      }
      genderByCountry.set(country, current)
    }
  }

  const headcountByCountry = Array.from(headcountMap.entries())
    .map(([country, headcount]) => ({ country, headcount }))
    .sort((a, b) => b.headcount - a.headcount || a.country.localeCompare(b.country))

  const ratio = total > 0 ? resigned / total : 0

  const genderByCountryList = Array.from(genderByCountry.entries())
    .map(([country, counts]) => ({
      country,
      male: counts.male,
      female: counts.female,
      total: counts.male + counts.female
    }))
    .sort((a, b) => b.total - a.total || a.country.localeCompare(b.country))

  const leaderBuckets: Array<'A' | 'B+' | 'B' | 'B-'> = ['A', 'B+', 'B', 'B-']
  const playerBuckets: Array<'A' | 'B+' | 'B' | 'B-' | 'C'> = ['A', 'B+', 'B', 'B-', 'C']

  const leadersCount = new Map(leaderBuckets.map((b) => [b, 0]))
  const playersCount = new Map(playerBuckets.map((b) => [b, 0]))

  for (const e of employees) {
    if (isResigned(e.employeeStatus)) continue
    const rating = (e.talentRating ?? '').trim()
    if (!rating) continue
    const lower = rating.toLowerCase()
    const bucket = extractBucket(rating)
    if (!bucket) continue
    if (lower.includes('leader') && leadersCount.has(bucket as any)) {
      leadersCount.set(bucket as any, (leadersCount.get(bucket as any) ?? 0) + 1)
    } else if (lower.includes('player') && playersCount.has(bucket as any)) {
      playersCount.set(bucket as any, (playersCount.get(bucket as any) ?? 0) + 1)
    }
  }

  const talentDensity = {
    leaders: leaderBuckets.map((bucket) => ({ bucket, count: leadersCount.get(bucket) ?? 0 })),
    players: playerBuckets.map((bucket) => ({ bucket, count: playersCount.get(bucket) ?? 0 }))
  }

  const todayMs = utcTodayMs()
  const DAY_MS = 24 * 60 * 60 * 1000
  const upcomingContracts = employees
    .filter((e) => !isResigned(e.employeeStatus))
    .map((e) => {
      const ymd = e.contractOrProbationEndDate ?? null
      if (!ymd) return null
      const endMs = parseYmdToUtcMs(ymd)
      if (endMs === null) return null
      const daysRemaining = Math.floor((endMs - todayMs) / DAY_MS)
      if (daysRemaining < 0 || daysRemaining > 60) return null
      return {
        employeeKey: e.employeeKey,
        name: e.name,
        department: e.department,
        position: e.position,
        reportingTo: e.reportingTo ?? '',
        countryAssigned: e.countryAssigned,
        contractOrProbationEndDate: ymd,
        daysRemaining
      }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort(
      (a, b) =>
        a.contractOrProbationEndDate.localeCompare(b.contractOrProbationEndDate) ||
        a.name.localeCompare(b.name) ||
        a.employeeKey.localeCompare(b.employeeKey)
    )

  return {
    headcountByCountry,
    separations: { resigned, total, ratio },
    genderBreakdown: {
      overall: { male: maleOverall, female: femaleOverall, total: maleOverall + femaleOverall },
      byCountry: genderByCountryList
    },
    talentDensity,
    upcomingContracts
  }
})

