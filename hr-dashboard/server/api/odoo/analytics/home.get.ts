import { getQuery } from 'h3'
import { loadEmployeesFromOdoo } from '../../../utils/odooEmployees'
import { BRANCH_COUNTRIES } from '../../../utils/branchClassification'

type HomeAnalytics = {
  headcountByCountry: Array<{ country: string; headcount: number }>
  /** Active employees with Odoo `employment_type` independent contractor (from Laser field mapping). */
  headcountEmploymentSubtotals: { independentContractors: number }
  employmentTypeBreakdown: {
    overall: { permanent: number; contracted: number; interns: number; total: number }
    byCountry: Array<{
      country: string
      permanent: number
      contracted: number
      interns: number
      total: number
    }>
  }
  separations: {
    currentMonth: string
    months: string[]
    byMonth: Record<
      string,
      {
        resigned: number
        retired: number
        fired: number
        vsep: number
        end_of_contract: number
        probation_failure: number
        retrenchment: number
        separated: number
        headcountAfter: number
      }
    >
  }
  separationsByYear: Array<{ year: number; count: number }>
  separationsByYearByType: {
    resigned: Array<{ year: number; count: number }>
    retired: Array<{ year: number; count: number }>
    fired: Array<{ year: number; count: number }>
    vsep: Array<{ year: number; count: number }>
    end_of_contract: Array<{ year: number; count: number }>
    probation_failure: Array<{ year: number; count: number }>
    retrenchment: Array<{ year: number; count: number }>
    separated: Array<{ year: number; count: number }>
  }
  additions: {
    currentMonth: string
    months: string[]
    byMonth: Record<string, { hires: number }>
  }
  additionsByYear: Array<{ year: number; count: number }>
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
  upcomingContractExpiries: Array<{
    employeeKey: string
    name: string
    department: string
    position: string
    reportingTo: string
    countryAssigned: string
    contractOrProbationEndDate: string
    daysRemaining: number
  }>
  upcomingProbations: Array<{
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

type SeparationBucket =
  | 'resigned'
  | 'retired'
  | 'fired'
  | 'vsep'
  | 'end_of_contract'
  | 'probation_failure'
  | 'retrenchment'

function normalizeSeparatedStatus(status: string): SeparationBucket | null {
  const v = status.trim().toLowerCase()
  if (v === 'resigned') return 'resigned'
  if (v === 'retired') return 'retired'
  if (v === 'fired') return 'fired'
  if (v === 'vsep') return 'vsep'
  if (v === 'end of contract') return 'end_of_contract'
  if (v === 'probation failure') return 'probation_failure'
  if (v === 'retrenchment') return 'retrenchment'
  if (v === 'terminated' || v.includes('terminate') || v.includes('termination')) return 'fired'
  return null
}

function normalizeGender(raw: string | undefined): 'male' | 'female' | null {
  const v = (raw ?? '').trim().toLowerCase()
  if (!v) return null
  if (v.startsWith('m')) return 'male'
  if (v.startsWith('f')) return 'female'
  return null
}

/** Permanent vs contracted-without-intern vs intern — used for stacked breakdowns and KPI. */
function classifyWorkforceBucket(raw: string | undefined): 'permanent' | 'contracted' | 'intern' {
  const v = (raw ?? '').trim().toLowerCase()
  if (!v) return 'permanent'
  if (v.includes('intern')) return 'intern'
  if (v.includes('contract') || v.includes('fixed') || v.includes('temp') || v.includes('casual')) return 'contracted'
  if (v.includes('permanent') || v.includes('perm')) return 'permanent'
  return 'permanent'
}

function isContractStyleEmployee(raw: string | undefined) {
  const b = classifyWorkforceBucket(raw)
  return b === 'contracted' || b === 'intern'
}

/** Uses `Employee.employeeType` (Odoo `employment_type` / mapped field) — distinct from permanent/contract pie logic. */
function isIndependentContractor(raw: string | undefined): boolean {
  const v = (raw ?? '').trim().toLowerCase()
  if (!v) return false
  return (
    v === 'independent_contractor' ||
    v.includes('independent contractor') ||
    (v.includes('independent') && v.includes('contract'))
  )
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
  const b = m[1]!.toUpperCase()
  if (b === 'A' || b === 'B' || b === 'C') return b
  if (b === 'B+') return 'B+'
  if (b === 'B-') return 'B-'
  return null
}

function normName(input: string) {
  return (input ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isReasonableAdditionYmd(ymd: string) {
  const y = Number(ymd.slice(0, 4))
  if (!Number.isFinite(y)) return false
  const currentYear = new Date().getUTCFullYear()
  // Historical reporting & headcount snapshots begin in 2022; older Odoo dates are often placeholders/import artefacts.
  return y >= 2022 && y <= currentYear + 1
}

// TEMP (one-time): exclude mistakenly archived employees from separations visuals/tables.
const TEMP_EXCLUDED_SEPARATION_NAMES = new Set(['Jared Rogers', 'Joshua Phillips'].map(normName))
function isTempExcludedSeparationName(name: string) {
  const n = normName(name)
  return n ? TEMP_EXCLUDED_SEPARATION_NAMES.has(n) : false
}

export default defineEventHandler(async (event): Promise<HomeAnalytics> => {
  const q = getQuery(event)
  const upcomingDaysRaw = typeof q.upcomingDays === 'string' ? q.upcomingDays : ''
  const upcomingDaysNum = Number(upcomingDaysRaw)
  const upcomingDays =
    Number.isFinite(upcomingDaysNum) && (upcomingDaysNum === 30 || upcomingDaysNum === 60 || upcomingDaysNum === 90)
      ? upcomingDaysNum
      : 60

  const employees = await loadEmployeesFromOdoo({ includeInactive: true })

  const activeNowCount = employees.reduce((acc, e) => acc + (isActiveStatus(e.employeeStatus) ? 1 : 0), 0)

  // Additions (monthly new hires): prefer start date/date hired; fall back to create_date.
  const additionRows = employees
    .map((e) => {
      const ymd = (e.startDate ?? '').trim() || (e.createdAt ?? '').trim() || null
      if (!ymd || !isReasonableAdditionYmd(ymd)) return null
      const ms = ymd ? parseYmdToUtcMs(ymd) : null
      if (!ymd || ms === null) return null
      return { monthKey: ymd.slice(0, 7), ms }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)

  const additionsByYearMap = new Map<number, number>()
  for (const r of additionRows) {
    const year = Number(r.monthKey.slice(0, 4))
    if (!Number.isFinite(year)) continue
    additionsByYearMap.set(year, (additionsByYearMap.get(year) ?? 0) + 1)
  }
  const additionsByYear = Array.from(additionsByYearMap.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year)

  const separatedRows = employees
    .filter((e) => isSeparatedStatus(e.employeeStatus))
    .filter((e) => !isTempExcludedSeparationName(e.name))
    .map((e) => {
      const ymd = e.separatedAt ?? null
      const ms = ymd ? parseYmdToUtcMs(ymd) : null
      if (!ymd || ms === null) return null
      const monthKey = ymd.slice(0, 7)
      const bucket = normalizeSeparatedStatus(e.employeeStatus)
      return { monthKey, ms, bucket }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)

  const separationsByYearMap = new Map<number, number>()
  const separationsByYearTypeMaps: Record<SeparationBucket | 'separated', Map<number, number>> = {
    resigned: new Map<number, number>(),
    retired: new Map<number, number>(),
    fired: new Map<number, number>(),
    vsep: new Map<number, number>(),
    end_of_contract: new Map<number, number>(),
    probation_failure: new Map<number, number>(),
    retrenchment: new Map<number, number>(),
    separated: new Map<number, number>()
  }
  for (const r of separatedRows) {
    const year = Number(r.monthKey.slice(0, 4))
    if (!Number.isFinite(year)) continue
    separationsByYearMap.set(year, (separationsByYearMap.get(year) ?? 0) + 1)
    const key = (r.bucket ?? 'separated') as keyof typeof separationsByYearTypeMaps
    const m = separationsByYearTypeMaps[key]
    m.set(year, (m.get(year) ?? 0) + 1)
  }
  const separationsByYear = Array.from(separationsByYearMap.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year)

  const toYearSeries = (m: Map<number, number>) =>
    Array.from(m.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year)

  const separationsByYearByType: HomeAnalytics['separationsByYearByType'] = {
    resigned: toYearSeries(separationsByYearTypeMaps.resigned),
    retired: toYearSeries(separationsByYearTypeMaps.retired),
    fired: toYearSeries(separationsByYearTypeMaps.fired),
    vsep: toYearSeries(separationsByYearTypeMaps.vsep),
    end_of_contract: toYearSeries(separationsByYearTypeMaps.end_of_contract),
    probation_failure: toYearSeries(separationsByYearTypeMaps.probation_failure),
    retrenchment: toYearSeries(separationsByYearTypeMaps.retrenchment),
    separated: toYearSeries(separationsByYearTypeMaps.separated)
  }

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

  type MonthCounts = {
    resigned: number
    retired: number
    fired: number
    vsep: number
    end_of_contract: number
    probation_failure: number
    retrenchment: number
    separated: number
  }
  const emptyMonthCounts = (): MonthCounts => ({
    resigned: 0,
    retired: 0,
    fired: 0,
    vsep: 0,
    end_of_contract: 0,
    probation_failure: 0,
    retrenchment: 0,
    separated: 0
  })
  const countsByMonth = new Map<string, MonthCounts>()
  const sepMs = separatedRows.map((r) => r.ms).sort((a, b) => a - b)

  for (const r of separatedRows) {
    const cur = countsByMonth.get(r.monthKey) ?? emptyMonthCounts()
    const key: keyof MonthCounts = r.bucket ?? 'separated'
    cur[key] += 1
    countsByMonth.set(r.monthKey, cur)
  }

  function countSeparatedAfter(utcMs: number) {
    let lo = 0
    let hi = sepMs.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (sepMs[mid]! <= utcMs) lo = mid + 1
      else hi = mid
    }
    return sepMs.length - lo
  }

  const separationsByMonth: HomeAnalytics['separations']['byMonth'] = {}
  for (const m of months) {
    const c = countsByMonth.get(m) ?? emptyMonthCounts()
    const endMs = monthEndUtcMs(m)
    const afterCount = endMs === null ? 0 : countSeparatedAfter(endMs)
    separationsByMonth[m] = {
      ...c,
      headcountAfter: activeNowCount + afterCount
    }
  }

  const minCreateIdx =
    additionRows.length > 0
      ? Math.min(...additionRows.map((r) => monthIndexFromKey(r.monthKey) ?? nowMonthIdx))
      : nowMonthIdx
  const spanCreate = Math.max(0, nowMonthIdx - minCreateIdx) + 1
  const countCreateMonths = Math.min(MAX_MONTHS, spanCreate)
  const startCreateIdx = nowMonthIdx - (countCreateMonths - 1)
  const createMonths = Array.from({ length: countCreateMonths }, (_, i) => monthKeyFromIndex(startCreateIdx + i)).reverse()

  const hiresByMonthMap = new Map<string, number>()
  for (const r of additionRows) {
    hiresByMonthMap.set(r.monthKey, (hiresByMonthMap.get(r.monthKey) ?? 0) + 1)
  }

  const additionsByMonth: HomeAnalytics['additions']['byMonth'] = {}
  for (const m of createMonths) {
    additionsByMonth[m] = { hires: hiresByMonthMap.get(m) ?? 0 }
  }

  const headcountMap = new Map<string, number>()
  const genderByCountry = new Map<string, { male: number; female: number }>()
  const employmentByCountry = new Map<string, { permanent: number; contracted: number; interns: number }>()
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
  let permanentOverall = 0
  let contractedOverall = 0
  let internsOverall = 0
  let independentContractorsActive = 0
  const todayUtcMs = utcTodayMs()

  for (const e of employees) {
    if (!isActiveStatus(e.employeeStatus)) continue
    if (isIndependentContractor(e.employeeType)) independentContractorsActive += 1

    const country = (e.countryAssigned ?? '').trim()
    headcountMap.set(country, (headcountMap.get(country) ?? 0) + 1)

    const bucket = classifyWorkforceBucket((e as any).employeeType as string | undefined)
    const empCurrent = employmentByCountry.get(country) ?? { permanent: 0, contracted: 0, interns: 0 }
    if (bucket === 'intern') {
      empCurrent.interns += 1
      internsOverall += 1
    } else if (bucket === 'contracted') {
      empCurrent.contracted += 1
      contractedOverall += 1
    } else {
      empCurrent.permanent += 1
      permanentOverall += 1
    }
    employmentByCountry.set(country, empCurrent)

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

  const headcountByCountryOrdered: HomeAnalytics['headcountByCountry'] = BRANCH_COUNTRIES.map((country) => ({
    country,
    headcount: headcountMap.get(country) ?? 0
  }))

  const employmentTypeByCountryOrdered: HomeAnalytics['employmentTypeBreakdown']['byCountry'] = BRANCH_COUNTRIES.map((country) => {
    const counts = employmentByCountry.get(country) ?? { permanent: 0, contracted: 0, interns: 0 }
    const total = counts.permanent + counts.contracted + counts.interns
    return { country, permanent: counts.permanent, contracted: counts.contracted, interns: counts.interns, total }
  })

  const genderByCountryList = Array.from(genderByCountry.entries())
    .map(([country, counts]) => ({
      country,
      male: counts.male,
      female: counts.female,
      total: counts.male + counts.female
    }))

  const genderByCountryOrdered: HomeAnalytics['genderBreakdown']['byCountry'] = BRANCH_COUNTRIES.map(
    (country) => {
      const counts = genderByCountry.get(country) ?? { male: 0, female: 0 }
      return { country, male: counts.male, female: counts.female, total: counts.male + counts.female }
    }
  )

  const avgAgeByCountryGender = Array.from(ageByCountry.entries())
    .map(([country, acc]) => ({
      country,
      maleAvgAge: acc.maleCount > 0 ? acc.maleSum / acc.maleCount : null,
      femaleAvgAge: acc.femaleCount > 0 ? acc.femaleSum / acc.femaleCount : null,
      maleCount: acc.maleCount,
      femaleCount: acc.femaleCount
    }))

  const avgAgeByCountryGenderOrdered: HomeAnalytics['avgAgeByCountryGender'] = BRANCH_COUNTRIES.map(
    (country) => {
      const acc = ageByCountry.get(country) ?? null
      return {
        country,
        maleAvgAge: acc && acc.maleCount > 0 ? acc.maleSum / acc.maleCount : null,
        femaleAvgAge: acc && acc.femaleCount > 0 ? acc.femaleSum / acc.femaleCount : null,
        maleCount: acc ? acc.maleCount : 0,
        femaleCount: acc ? acc.femaleCount : 0
      }
    }
  )

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
  function toEndRow(e: (typeof employees)[number], endYmd: string | null) {
    if (!endYmd) return null
    const endMs = parseYmdToUtcMs(endYmd)
    if (endMs === null) return null
    const daysRemaining = Math.floor((endMs - todayMs) / DAY_MS)
    return {
      employeeKey: e.employeeKey,
      name: e.name,
      department: e.department,
      position: e.position,
      reportingTo: e.reportingTo ?? '',
      countryAssigned: e.countryAssigned,
      contractOrProbationEndDate: endYmd,
      daysRemaining
    }
  }

  // Symmetric window: rows persist on the table for `upcomingDays` days after their end date passes.
  const upcomingContractExpiries = employees
    .filter((e) => isActiveStatus(e.employeeStatus))
    .filter((e) => isContractStyleEmployee(e.employeeType))
    .map((e) => toEndRow(e, e.contractEndDate ?? null))
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .filter((r) => r.daysRemaining >= -upcomingDays && r.daysRemaining <= upcomingDays)
    .sort(
      (a, b) =>
        a.contractOrProbationEndDate.localeCompare(b.contractOrProbationEndDate) ||
        a.name.localeCompare(b.name) ||
        a.employeeKey.localeCompare(b.employeeKey)
    )

  const upcomingProbations = employees
    .filter((e) => isActiveStatus(e.employeeStatus))
    .map((e) => toEndRow(e, e.probationEndDate ?? null))
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .filter((r) => r.daysRemaining >= -upcomingDays && r.daysRemaining <= upcomingDays)
    .sort(
      (a, b) =>
        a.contractOrProbationEndDate.localeCompare(b.contractOrProbationEndDate) ||
        a.name.localeCompare(b.name) ||
        a.employeeKey.localeCompare(b.employeeKey)
    )

  return {
    headcountByCountry: headcountByCountryOrdered,
    headcountEmploymentSubtotals: {
      independentContractors: independentContractorsActive
    },
    employmentTypeBreakdown: {
      overall: {
        permanent: permanentOverall,
        contracted: contractedOverall,
        interns: internsOverall,
        total: permanentOverall + contractedOverall + internsOverall
      },
      byCountry: employmentTypeByCountryOrdered
    },
    separations: { currentMonth: nowMonthKey, months, byMonth: separationsByMonth },
    separationsByYear,
    separationsByYearByType,
    additions: { currentMonth: nowMonthKey, months: createMonths, byMonth: additionsByMonth },
    additionsByYear,
    genderBreakdown: {
      overall: { male: maleOverall, female: femaleOverall, total: maleOverall + femaleOverall },
      byCountry: genderByCountryOrdered
    },
    avgAgeByCountryGender: avgAgeByCountryGenderOrdered,
    talentDensity,
    upcomingContractExpiries,
    upcomingProbations
  }
})

