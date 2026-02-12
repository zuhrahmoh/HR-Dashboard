import { loadEmployeesFromOdoo } from '../../../utils/odooEmployees'

type HomeAnalytics = {
  headcountByCountry: Array<{ country: string; headcount: number }>
  separations: {
    currentMonth: string
    months: string[]
    byMonth: Record<
      string,
      {
        resigned: number
        retired: number
        fired: number
        headcountAfter: number
      }
    >
  }
  additions: {
    currentMonth: string
    months: string[]
    byMonth: Record<string, { hires: number }>
  }
  genderBreakdown: {
    overall: { male: number; female: number; total: number }
    byCountry: Array<{ country: string; male: number; female: number; total: number }>
  }
  avgAgeByCountryGender: Array<{
    country: string
    maleAvgAge: number | null
    femaleAvgAge: number | null
    maleCount: number
    femaleCount: number
  }>
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

function isActiveStatus(status: string) {
  return status.trim().toLowerCase() === 'active'
}

function isSeparatedStatus(status: string) {
  return !isActiveStatus(status)
}

function normalizeSeparatedStatus(status: string): 'resigned' | 'retired' | 'fired' | null {
  const v = status.trim().toLowerCase()
  if (v === 'resigned') return 'resigned'
  if (v === 'retired') return 'retired'
  if (v === 'fired') return 'fired'
  return null
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

function monthEndUtcMs(monthKey: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return null
  return Date.UTC(y, mo, 0)
}

function ageYearsFromBirthYmd(birthYmd: string, todayUtcMs: number): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthYmd.trim())
  if (!m) return null
  const by = Number(m[1])
  const bm = Number(m[2])
  const bd = Number(m[3])
  if (!Number.isFinite(by) || !Number.isFinite(bm) || !Number.isFinite(bd)) return null
  if (bm < 1 || bm > 12 || bd < 1 || bd > 31) return null

  const today = new Date(todayUtcMs)
  const ty = today.getUTCFullYear()
  const tm = today.getUTCMonth() + 1
  const td = today.getUTCDate()

  let age = ty - by
  if (tm < bm || (tm === bm && td < bd)) age -= 1
  if (!Number.isFinite(age) || age < 0 || age > 120) return null
  return age
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
  const employees = await loadEmployeesFromOdoo({ includeInactive: true })

  const activeNowCount = employees.reduce((acc, e) => acc + (isActiveStatus(e.employeeStatus) ? 1 : 0), 0)

  // Additions (monthly new hires, from create_date)
  const createdRows = employees
    .map((e) => {
      const ymd = e.createdAt ?? null
      const ms = ymd ? parseYmdToUtcMs(ymd) : null
      if (!ymd || ms === null) return null
      return { monthKey: ymd.slice(0, 7), ms }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)

  const separatedRows = employees
    .filter((e) => isSeparatedStatus(e.employeeStatus))
    .map((e) => {
      const ymd = e.separatedAt ?? null
      const ms = ymd ? parseYmdToUtcMs(ymd) : null
      if (!ymd || ms === null) return null
      const monthKey = ymd.slice(0, 7)
      const bucket = normalizeSeparatedStatus(e.employeeStatus)
      return { monthKey, ms, bucket }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)

  const nowMonthKey = monthKeyFromUtcMs(utcTodayMs())
  const nowMonthIdx = monthIndexFromKey(nowMonthKey) ?? 0
  const minSepIdx =
    separatedRows.length > 0
      ? Math.min(...separatedRows.map((r) => monthIndexFromKey(r.monthKey) ?? nowMonthIdx))
      : nowMonthIdx

  const MAX_MONTHS = 48
  const span = Math.max(0, nowMonthIdx - minSepIdx) + 1
  const countMonths = Math.min(MAX_MONTHS, span)
  const startIdx = nowMonthIdx - (countMonths - 1)
  const months = Array.from({ length: countMonths }, (_, i) => monthKeyFromIndex(startIdx + i)).reverse()

  const countsByMonth = new Map<string, { resigned: number; retired: number; fired: number }>()
  const sepMs = separatedRows.map((r) => r.ms).sort((a, b) => a - b)

  for (const r of separatedRows) {
    const cur = countsByMonth.get(r.monthKey) ?? { resigned: 0, retired: 0, fired: 0 }
    if (r.bucket === 'resigned') cur.resigned += 1
    else if (r.bucket === 'retired') cur.retired += 1
    else if (r.bucket === 'fired') cur.fired += 1
    countsByMonth.set(r.monthKey, cur)
  }

  function countSeparatedAfter(utcMs: number) {
    let lo = 0
    let hi = sepMs.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (sepMs[mid] <= utcMs) lo = mid + 1
      else hi = mid
    }
    return sepMs.length - lo
  }

  const separationsByMonth: HomeAnalytics['separations']['byMonth'] = {}
  for (const m of months) {
    const c = countsByMonth.get(m) ?? { resigned: 0, retired: 0, fired: 0 }
    const endMs = monthEndUtcMs(m)
    const afterCount = endMs === null ? 0 : countSeparatedAfter(endMs)
    separationsByMonth[m] = {
      resigned: c.resigned,
      retired: c.retired,
      fired: c.fired,
      headcountAfter: activeNowCount + afterCount
    }
  }

  const minCreateIdx =
    createdRows.length > 0
      ? Math.min(...createdRows.map((r) => monthIndexFromKey(r.monthKey) ?? nowMonthIdx))
      : nowMonthIdx
  const spanCreate = Math.max(0, nowMonthIdx - minCreateIdx) + 1
  const countCreateMonths = Math.min(MAX_MONTHS, spanCreate)
  const startCreateIdx = nowMonthIdx - (countCreateMonths - 1)
  const createMonths = Array.from({ length: countCreateMonths }, (_, i) => monthKeyFromIndex(startCreateIdx + i)).reverse()

  const hiresByMonthMap = new Map<string, number>()
  for (const r of createdRows) {
    hiresByMonthMap.set(r.monthKey, (hiresByMonthMap.get(r.monthKey) ?? 0) + 1)
  }

  const additionsByMonth: HomeAnalytics['additions']['byMonth'] = {}
  for (const m of createMonths) {
    additionsByMonth[m] = { hires: hiresByMonthMap.get(m) ?? 0 }
  }

  const headcountMap = new Map<string, number>()
  const genderByCountry = new Map<string, { male: number; female: number }>()
  const ageByCountry = new Map<
    string,
    {
      maleSum: number
      maleCount: number
      femaleSum: number
      femaleCount: number
    }
  >()
  let maleOverall = 0
  let femaleOverall = 0
  const todayUtcMs = utcTodayMs()

  for (const e of employees) {
    if (!isActiveStatus(e.employeeStatus)) continue
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

    const birth = (e as any).birthDate as string | null | undefined
    if (g && birth) {
      const age = ageYearsFromBirthYmd(birth, todayUtcMs)
      if (age !== null) {
        const acc = ageByCountry.get(country) ?? { maleSum: 0, maleCount: 0, femaleSum: 0, femaleCount: 0 }
        if (g === 'male') {
          acc.maleSum += age
          acc.maleCount += 1
        } else {
          acc.femaleSum += age
          acc.femaleCount += 1
        }
        ageByCountry.set(country, acc)
      }
    }
  }

  const headcountByCountry = Array.from(headcountMap.entries())
    .map(([country, headcount]) => ({ country, headcount }))
    .sort((a, b) => b.headcount - a.headcount || a.country.localeCompare(b.country))

  const genderByCountryList = Array.from(genderByCountry.entries())
    .map(([country, counts]) => ({
      country,
      male: counts.male,
      female: counts.female,
      total: counts.male + counts.female
    }))
    .sort((a, b) => b.total - a.total || a.country.localeCompare(b.country))

  const avgAgeByCountryGender = Array.from(ageByCountry.entries())
    .map(([country, acc]) => ({
      country,
      maleAvgAge: acc.maleCount > 0 ? acc.maleSum / acc.maleCount : null,
      femaleAvgAge: acc.femaleCount > 0 ? acc.femaleSum / acc.femaleCount : null,
      maleCount: acc.maleCount,
      femaleCount: acc.femaleCount
    }))
    .sort((a, b) => (b.maleCount + b.femaleCount) - (a.maleCount + a.femaleCount) || a.country.localeCompare(b.country))

  const leaderBuckets: Array<'A' | 'B+' | 'B' | 'B-'> = ['A', 'B+', 'B', 'B-']
  const playerBuckets: Array<'A' | 'B+' | 'B' | 'B-' | 'C'> = ['A', 'B+', 'B', 'B-', 'C']

  const leadersCount = new Map(leaderBuckets.map((b) => [b, 0]))
  const playersCount = new Map(playerBuckets.map((b) => [b, 0]))

  for (const e of employees) {
    if (!isActiveStatus(e.employeeStatus)) continue
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
    .filter((e) => isActiveStatus(e.employeeStatus))
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
    separations: { currentMonth: nowMonthKey, months, byMonth: separationsByMonth },
    additions: { currentMonth: nowMonthKey, months: createMonths, byMonth: additionsByMonth },
    genderBreakdown: {
      overall: { male: maleOverall, female: femaleOverall, total: maleOverall + femaleOverall },
      byCountry: genderByCountryList
    },
    avgAgeByCountryGender,
    talentDensity,
    upcomingContracts
  }
})

