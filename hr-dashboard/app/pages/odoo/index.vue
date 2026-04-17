<template>
  <div class="space-y-6" :data-report-ready="reportReady ? '1' : undefined">
    <div class="space-y-1">
      <h1 class="text-3xl font-semibold">HR Dashboard</h1>
      <p class="text-base text-slate-600">Employee analytics sourced from the Odoo(Laser) Employee module.</p>
    </div>

    <div v-if="analyticsPending" class="text-sm text-slate-800">Loading…</div>
    <div v-else-if="analyticsError" class="text-sm text-red-600">
      Failed to load analytics.
      <div v-if="analyticsErrorMessage" class="mt-2 text-xs text-red-600/90">
        {{ analyticsErrorMessage }}
      </div>
      <div v-if="isFetchFailed(analyticsErrorMessage)" class="mt-2 text-xs text-slate-500">
        Ensure the dev server is running and reachable. Check /api/odoo/health for Odoo config.
      </div>
    </div>
    <template v-else>
      <div class="grid min-h-0 grid-cols-2 items-stretch gap-4 lg:grid-cols-4 [&>*]:h-full [&>*]:min-h-0">
        <DashboardKpiCard title="Total headcount" tone="blue">
          <template #body>
            <div class="flex items-center gap-3">
              <span class="shrink-0 text-blue-800" aria-hidden="true">
                <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <div class="text-xl font-bold tabular-nums tracking-tight text-hr-navy">{{ totalHeadcountNow }}</div>
            </div>
          </template>
          <template #footer>
            <div class="flex w-full flex-col items-center gap-1 text-center">
              <p
                class="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-xs font-semibold leading-snug text-hr-navy"
              >
                <span>RAMPS: <span class="tabular-nums">{{ rampsHeadcountKpi }}</span></span>
                <span class="shrink-0 font-normal text-hr-navy/55" aria-hidden="true">|</span>
                <span>EDO: <span class="tabular-nums">{{ edoHeadcountKpi }}</span></span>
              </p>
              <p
                class="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-0 text-[11px] font-medium leading-tight text-hr-navy/70"
              >
                <span>Consultants: <span class="tabular-nums">{{ headcountEmploymentSubtotals.consultants }}</span></span>
                <span class="shrink-0 font-normal text-hr-navy/45" aria-hidden="true">|</span>
                <span>
                  Independent contractors:
                  <span class="tabular-nums">{{ headcountEmploymentSubtotals.independentContractors }}</span>
                </span>
              </p>
            </div>
          </template>
        </DashboardKpiCard>

        <DashboardKpiCard title="Company-wide average age" tone="purple">
          <template #body>
            <div class="text-xl font-bold tabular-nums text-hr-navy">{{ companyWideOverallAge }}</div>
          </template>
          <template #footer>
            <div
              class="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-xs font-semibold leading-tight text-hr-navy"
            >
              <div class="flex items-center gap-1.5 whitespace-nowrap">
                <span class="h-2 w-2 shrink-0 rounded-sm bg-sky-300" aria-hidden="true" />
                <span>Male</span>
                <span class="tabular-nums">{{ companyWideMaleAge }}</span>
              </div>
              <div class="flex items-center gap-1.5 whitespace-nowrap">
                <span class="h-2 w-2 shrink-0 rounded-sm bg-pink-300" aria-hidden="true" />
                <span>Female</span>
                <span class="tabular-nums">{{ companyWideFemaleAge }}</span>
              </div>
            </div>
          </template>
        </DashboardKpiCard>

        <MonthlyMetricKpiCard
          v-model="selectedSeparationsMonth"
          compact
          title="Employee Separations"
          tone="red"
          :month-options="analytics?.separations?.months ?? []"
          :display-count="separationsSelectedCount"
        >
          <template #icon>
            <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M7 12h10M13 8l4 4-4 4" />
            </svg>
          </template>
          <template #actions>
            <button
              v-if="!isReportMode"
              type="button"
              class="inline-flex min-h-[1.25rem] items-center gap-0.5 rounded-md border border-slate-300 bg-white px-1.5 py-0.5 text-xs font-semibold leading-tight text-hr-navy hover:bg-slate-100"
              @click="openSeparationsDetails"
            >
              <span>See details</span>
              <svg
                class="h-3 w-3 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m11.25 4.5 7.5 7.5-7.5 7.5M3.75 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </template>
        </MonthlyMetricKpiCard>

        <MonthlyMetricKpiCard
          v-model="selectedAdditionsMonth"
          compact
          title="Employee Additions"
          tone="green"
          :month-options="analytics?.additions?.months ?? []"
          :display-count="additionsSelectedCount"
        >
          <template #icon>
            <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="10" cy="10" r="5.5" />
              <path d="M15.5 15.5L20 20" />
              <circle cx="10" cy="9" r="2" fill="currentColor" stroke="none" />
              <path d="M6.5 14.5c.8-1.2 2-2 3.5-2s2.7.8 3.5 2" />
            </svg>
          </template>
          <template #actions>
            <button
              v-if="!isReportMode"
              type="button"
              class="inline-flex min-h-[1.25rem] items-center gap-0.5 rounded-md border border-slate-300 bg-white px-1.5 py-0.5 text-xs font-semibold leading-tight text-hr-navy hover:bg-slate-100"
              @click="openAdditionsDetails"
            >
              <span>See details</span>
              <svg
                class="h-3 w-3 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m11.25 4.5 7.5 7.5-7.5 7.5M3.75 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </template>
        </MonthlyMetricKpiCard>
      </div>

      <div
        class="mt-4 grid min-h-0 grid-cols-1 gap-4 lg:h-[min(44rem,calc(100vh-14rem))] lg:min-h-[36rem] lg:grid-cols-3 lg:grid-rows-2 lg:gap-4 lg:[grid-template-rows:minmax(0,1fr)_minmax(0,1fr)]"
      >
        <section
          class="flex min-h-[12rem] flex-col overflow-hidden rounded-md border border-slate-200 bg-white p-4 shadow-card lg:h-full lg:min-h-0"
        >
          <div class="mb-1 shrink-0">
            <h2 class="text-lg font-semibold text-hr-navy">Geographical Headcount</h2>
          </div>
          <p class="shrink-0 text-sm text-slate-400">Excludes archived employees.</p>
          <div class="mt-2 min-h-0 flex-1 overflow-hidden">
            <HeadcountBarChart :items="analytics?.headcountByCountry ?? []" />
          </div>
        </section>

        <section
          class="flex min-h-[12rem] flex-col overflow-hidden rounded-md border border-slate-200 bg-white p-4 shadow-card lg:h-full lg:min-h-0"
        >
          <SeparationsYearLineChart :items="analytics?.separationsByYear ?? []" :by-type="null" />
        </section>

        <section
          class="flex min-h-[12rem] flex-col overflow-hidden rounded-md border border-slate-200 bg-white p-4 shadow-card lg:h-full lg:min-h-0"
        >
          <AdditionsYearLineChart :items="analytics?.additionsByYear ?? []" />
        </section>

        <section
          class="flex min-h-[12rem] flex-col overflow-hidden rounded-md border border-slate-200 bg-white p-4 shadow-card lg:h-full lg:min-h-0"
        >
          <h2 class="shrink-0 text-lg font-semibold text-hr-navy">Headcount Over Time</h2>
          <div class="mt-2 min-h-0 flex-1">
            <HeadcountMonthlyLineChart
              :items="headcountSnapshots?.items ?? []"
              title="Headcount Over Time"
              :show-header="false"
              fill-height
            />
          </div>
        </section>

        <section
          class="flex min-h-[12rem] flex-col overflow-hidden rounded-md border border-slate-200 bg-white p-4 shadow-card lg:h-full lg:min-h-0"
        >
          <div class="shrink-0 space-y-0.5">
            <div class="text-lg font-semibold text-hr-navy">Permanent vs Contracted</div>
            <div class="text-xs text-slate-400">Contracted includes interns.</div>
          </div>
          <div class="mt-2 flex min-h-0 flex-1 flex-col">
            <PermanentVsContractedPie
              :overall="analytics?.employmentTypeBreakdown?.overall ?? { permanent: 0, contracted: 0, total: 0 }"
              :by-country="analytics?.employmentTypeBreakdown?.byCountry ?? []"
              :compact="true"
              :show-filter="true"
              filter-placement="corner"
              compact-size="lg"
            />
          </div>
        </section>

        <section
          class="flex min-h-[12rem] flex-col overflow-hidden rounded-md border border-slate-200 bg-white p-4 shadow-card lg:h-full lg:min-h-0"
        >
          <div class="shrink-0 space-y-0.5">
            <div class="text-lg font-semibold text-hr-navy">Gender breakdown</div>
          </div>
          <div class="mt-2 flex min-h-0 flex-1 flex-col">
            <GenderBreakdownPie
              :overall="analytics?.genderBreakdown?.overall ?? { male: 0, female: 0, total: 0 }"
              :by-country="analytics?.genderBreakdown?.byCountry ?? []"
              :hide-title="true"
              :compact="true"
              filter-placement="corner"
              compact-size="lg"
              fill-height
            />
          </div>
        </section>
      </div>
    </template>

    <section class="space-y-3 rounded-md border border-slate-200 bg-white p-4 shadow-card">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-hr-navy">Global Expense Breakdown</h2>
          <p class="text-sm text-slate-400">General expenses breakdown by country</p>
        </div>

        <div v-if="(expenses?.availableMonths?.length ?? 0) > 0" class="flex flex-wrap items-center gap-3">
          <label class="space-y-1">
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Month</div>
            <select
              v-model="selectedMonthModel"
              class="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
            >
              <option v-for="m in expenses?.availableMonths ?? []" :key="m" :value="m">
                {{ monthLabel(m) }}
              </option>
            </select>
          </label>

          <label class="space-y-1">
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Currency</div>
            <select
              v-model="selectedCurrency"
              class="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
            >
              <option v-for="c in CURRENCIES" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>

          <label class="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white shadow-card px-3 text-sm text-slate-800">
            <input
              v-model="showNetChanges"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-600 bg-slate-50 text-emerald-400 focus:ring-emerald-400"
              :disabled="!baselineMonthKey"
            />
            <span>Show net changes</span>
          </label>
        </div>
      </div>

      <div v-if="expensesPending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">
        Loading expenses…
      </div>
      <div v-else-if="expensesError" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load expenses.
        <div v-if="expensesErrorMessage" class="mt-2 text-sm text-red-200/80">
          {{ expensesErrorMessage }}
        </div>
      </div>
      <div v-else-if="(expenses?.items?.length ?? 0) === 0" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">
        No expenses data.
      </div>

      <div v-else class="space-y-4">
        <div v-if="expenses?.warning" class="rounded-md border border-amber-900/40 bg-amber-950/25 p-3 text-sm text-amber-200">
          {{ expenses.warning }}
        </div>

        <div
          v-if="showNetChanges && baselineMonthKey"
          class="rounded-md border border-slate-200 bg-white shadow-card p-3 text-sm text-slate-600"
        >
          Comparing to
          <span class="font-semibold text-hr-navy">{{ monthLabel(baselineMonthKey) }}</span>
        </div>

        <div v-if="expenseDetailedItems.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ExpenseCountryCard
            v-for="item in expenseDetailedItems"
            :key="item.country"
            :country="item.country"
            :month="expenseMonthRaw"
            :currency="selectedCurrency"
            :gross-salary="convertUsd(item.grossSalary)"
            :overtime="convertUsd(item.overtime)"
            :vc="convertUsd(item.vc)"
            :nis-company="convertUsd(item.nisCompany)"
            :medical-plan-employer="convertUsd(item.medicalPlanEmployer)"
            :total="convertUsd(item.total)"
            :show-deltas="showNetChanges && !!baselineMonthKey"
            :delta-gross-salary="convertUsd(expenseDeltasByCountry.get(item.country)?.grossSalary ?? 0)"
            :delta-overtime="convertUsd(expenseDeltasByCountry.get(item.country)?.overtime ?? 0)"
            :delta-vc="convertUsd(expenseDeltasByCountry.get(item.country)?.vc ?? 0)"
            :delta-nis-company="convertUsd(expenseDeltasByCountry.get(item.country)?.nisCompany ?? 0)"
            :delta-medical-plan-employer="convertUsd(expenseDeltasByCountry.get(item.country)?.medicalPlanEmployer ?? 0)"
            :delta-total="convertUsd(expenseDeltasByCountry.get(item.country)?.total ?? 0)"
          />
        </div>

        <div v-if="expenseTotalOnlyItems.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <section
            v-for="item in expenseTotalOnlyItems"
            :key="item.country"
            class="rounded-md border border-slate-200 bg-white shadow-card p-4"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <h3 class="truncate text-sm font-semibold text-hr-navy" :title="item.country">{{ item.country || '—' }}</h3>
                <p v-if="expenseMonthDisplay" class="mt-0.5 text-sm text-slate-400">{{ expenseMonthDisplay }}</p>
              </div>
              <div class="text-right text-sm font-semibold tabular-nums text-emerald-700">
                {{ formatCurrency(convertUsd(item.total)) }}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>

    <section class="space-y-3 report-page report-keep">
      <AverageAgeGroupedBarChart :items="avgAgeByCountryGenderRows" />
    </section>

  </div>
</template>

<script setup lang="ts">
import HeadcountMonthlyLineChart from '~/components/HeadcountMonthlyLineChart.vue'
import PermanentVsContractedPie from '~/components/PermanentVsContractedPie.vue'
import { companyWideAgeAverages, formatAgeOneDecimal } from '~/utils/companyWideAverageAge'
import { formatExpenseMonthLabel } from '~/utils/formatExpenseMonth'

type HomeAnalytics = {
  headcountByCountry: Array<{ country: string; headcount: number }>
  headcountEmploymentSubtotals: { consultants: number; independentContractors: number }
  employmentTypeBreakdown: {
    overall: { permanent: number; contracted: number; total: number }
    byCountry: Array<{ country: string; permanent: number; contracted: number; total: number }>
  }
  separations: {
    currentMonth: string
    months: string[]
    byMonth: Record<string, { resigned: number; retired: number; fired: number; headcountAfter: number }>
  }
  separationsByYear: Array<{ year: number; count: number }>
  separationsByYearByType: {
    resigned: Array<{ year: number; count: number }>
    retired: Array<{ year: number; count: number }>
    fired: Array<{ year: number; count: number }>
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
  expiredContracts: Array<{
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

type ExpensesSnapshot = {
  month: string | null
  items: Array<{
    country: string
    grossSalary: number
    overtime: number
    vc: number
    nisCompany: number
    medicalPlanEmployer: number
    totalOutgoingExpenses: number
    total: number
  }>
}

type ExpensesResponse = ExpensesSnapshot & {
  monthKey: string | null
  availableMonths: string[]
  monthLabels: Record<string, string>
  previousMonth: string | null
  compareTo: string | null
  deltas?: ExpensesSnapshot['items']
  source: 'sharepoint' | 'csv'
  warning?: string
}

function getErrorMessage(error: unknown) {
  const e = error as Record<string, unknown> | null
  if (!e) return ''
  const d = e['data'] as Record<string, unknown> | undefined
  return (
    (typeof d?.message === 'string' && d.message) ||
    (typeof e['message'] === 'string' && (e['message'] as string)) ||
    (typeof e['statusMessage'] === 'string' && (e['statusMessage'] as string)) ||
    ''
  )
}

function isFetchFailed(message: string) {
  return typeof message === 'string' && message.toLowerCase().includes('fetch failed')
}

const { data: analyticsData, pending: analyticsPending, error: analyticsError } = useFetch<HomeAnalytics>('/api/odoo/analytics/home')
const analytics = computed(() => analyticsData.value ?? null)
const analyticsErrorMessage = computed(() => getErrorMessage(analyticsError.value))

type HeadcountSnapshotsResponse = { items: Array<{ month: string; headcount: number }> }
const { data: headcountSnapshots } = useFetch<HeadcountSnapshotsResponse>('/api/analytics/headcount-snapshots')

const route = useRoute()
const isReportMode = computed(() => route.query.report === '1')
const selectedSeparationsMonth = ref('')
const selectedAdditionsMonth = ref('')

watch(
  () => analytics.value,
  (a) => {
    if (!a) return
    const sep = a.separations
    if (sep?.months?.length) {
      if (!selectedSeparationsMonth.value || !sep.months.includes(selectedSeparationsMonth.value)) {
        selectedSeparationsMonth.value = sep.currentMonth || sep.months[0] || ''
      }
    }
    const add = a.additions
    if (add?.months?.length) {
      if (!selectedAdditionsMonth.value || !add.months.includes(selectedAdditionsMonth.value)) {
        selectedAdditionsMonth.value = add.currentMonth || add.months[0] || ''
      }
    }
  },
  { immediate: true }
)

function safeInt(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

const separationsSelectedCount = computed(() => {
  const key = selectedSeparationsMonth.value
  const d = analytics.value?.separations?.byMonth?.[key]
  if (!d) return 0
  return safeInt(d.resigned) + safeInt(d.retired) + safeInt(d.fired)
})

const additionsSelectedCount = computed(() => {
  const key = selectedAdditionsMonth.value
  return safeInt(analytics.value?.additions?.byMonth?.[key]?.hires)
})

function openSeparationsDetails() {
  const m = selectedSeparationsMonth.value.trim()
  if (!/^\d{4}-\d{2}$/.test(m)) return
  navigateTo(`/recruitment?section=recent-separations&sepMonth=${encodeURIComponent(m)}#recent-separations-table`)
}

function openAdditionsDetails() {
  const m = selectedAdditionsMonth.value.trim()
  if (!/^\d{4}-\d{2}$/.test(m)) return
  navigateTo(`/recruitment?section=recent-new-hires&hireMonth=${encodeURIComponent(m)}#recent-new-hires-table`)
}

const headcountAfterSeparations = computed(() => {
  const s = analytics.value?.separations
  if (!s) return 0
  const m = s.currentMonth
  return s.byMonth?.[m]?.headcountAfter ?? 0
})

const totalHeadcountNow = computed(() => (analytics.value?.headcountByCountry ?? []).reduce((acc, i) => acc + (i.headcount ?? 0), 0))

/** TT, GUY, SUR, MEX, COL, USA — aligned with `BRANCH_COUNTRIES` / headcount bar labels. */
const RAMPS_HEADCOUNT_COUNTRIES = [
  'Trinidad and Tobago',
  'Guyana',
  'Suriname',
  'Mexico',
  'Colombia',
  'USA'
] as const
const EDO_HEADCOUNT_COUNTRIES = ['El Dorado Offshore TT', 'El Dorado Offshore GY'] as const

function sumHeadcountForCountries(items: Array<{ country: string; headcount: number }>, countries: readonly string[]) {
  const map = new Map(items.map((i) => [i.country, Number.isFinite(i.headcount) ? i.headcount : 0]))
  return countries.reduce((sum, c) => sum + (map.get(c) ?? 0), 0)
}

const rampsHeadcountKpi = computed(() =>
  sumHeadcountForCountries(analytics.value?.headcountByCountry ?? [], RAMPS_HEADCOUNT_COUNTRIES)
)
const edoHeadcountKpi = computed(() =>
  sumHeadcountForCountries(analytics.value?.headcountByCountry ?? [], EDO_HEADCOUNT_COUNTRIES)
)

const headcountEmploymentSubtotals = computed(
  () => analytics.value?.headcountEmploymentSubtotals ?? { consultants: 0, independentContractors: 0 }
)

/** Same rows as `AverageAgeGroupedBarChart` — KPI averages are derived from this list, not hardcoded. */
const avgAgeByCountryGenderRows = computed(() => analytics.value?.avgAgeByCountryGender ?? [])
const companyWideAgeAgg = computed(() => companyWideAgeAverages(avgAgeByCountryGenderRows.value))
const companyWideOverallAge = computed(() => formatAgeOneDecimal(companyWideAgeAgg.value.overallAvg))
const companyWideMaleAge = computed(() => formatAgeOneDecimal(companyWideAgeAgg.value.maleAvg))
const companyWideFemaleAge = computed(() => formatAgeOneDecimal(companyWideAgeAgg.value.femaleAvg))

const selectedMonth = ref<string>('')
const showNetChanges = ref(false)
const compareToMonth = ref<string>('')

const expensesQuery = computed(() => {
  const q: Record<string, string> = {}
  if (selectedMonth.value) q.month = selectedMonth.value
  if (compareToMonth.value) q.compareTo = compareToMonth.value
  return q
})

const { data: expensesData, pending: expensesPending, error: expensesError } = useFetch<ExpensesResponse>('/api/expenses', {
  query: expensesQuery,
  watch: [expensesQuery]
})
const expenses = computed(() => expensesData.value ?? null)
const expenseMonthRaw = computed(() => expenses.value?.month ?? expenses.value?.monthKey ?? null)
const expenseMonthDisplay = computed(() => formatExpenseMonthLabel(expenseMonthRaw.value ?? undefined))
const expensesErrorMessage = computed(() => getErrorMessage(expensesError.value))

const selectedMonthModel = computed({
  get() {
    return selectedMonth.value || expenses.value?.monthKey || ''
  },
  set(v: string) {
    selectedMonth.value = v
  }
})

const baselineMonthKey = computed(() => {
  const months = expenses.value?.availableMonths ?? []
  const currentKey = selectedMonth.value || expenses.value?.monthKey || ''
  if (!currentKey) return ''
  const idx = months.indexOf(currentKey)
  return idx >= 0 ? months[idx + 1] || '' : ''
})

watchEffect(() => {
  if (!showNetChanges.value) {
    compareToMonth.value = ''
    return
  }
  compareToMonth.value = baselineMonthKey.value || ''
})

type Currency = 'USD' | 'TTD' | 'GYD' | 'SRD' | 'MXN' | 'COP'
const CURRENCIES: Currency[] = ['USD', 'TTD', 'GYD', 'SRD', 'MXN', 'COP']
const USD_TO: Record<Currency, number> = {
  USD: 1,
  TTD: 6.8,
  GYD: 209.21,
  SRD: 37.64,
  MXN: 17.15,
  COP: 3696.24
}

const selectedCurrency = ref<Currency>('USD')
const fmt = computed(
  () => new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedCurrency.value, currencyDisplay: 'code' })
)

function convertUsd(v: number) {
  const n = Number.isFinite(v) ? v : 0
  return n * (USD_TO[selectedCurrency.value] ?? 1)
}

function formatCurrency(v: number) {
  const n = Number.isFinite(v) ? v : 0
  return fmt.value.format(n)
}

function monthLabel(monthKey: string) {
  const key = (monthKey ?? '').trim()
  if (!key) return ''
  const fromApi = expenses.value?.monthLabels?.[key]
  const apiLabel = typeof fromApi === 'string' ? fromApi.trim() : ''
  const candidate = apiLabel || key
  return formatExpenseMonthLabel(candidate) ?? key
}

type ExpenseItem = ExpensesSnapshot['items'][number]
function isTotalOnlyExpense(item: ExpenseItem) {
  return (
    item.grossSalary === 0 &&
    item.overtime === 0 &&
    item.vc === 0 &&
    item.nisCompany === 0 &&
    item.medicalPlanEmployer === 0
  )
}

const expenseDetailedItems = computed(() => (expenses.value?.items ?? []).filter((i) => !isTotalOnlyExpense(i)))
const expenseTotalOnlyItems = computed(() => (expenses.value?.items ?? []).filter((i) => isTotalOnlyExpense(i)))

type ExpenseDelta = NonNullable<ExpensesResponse['deltas']>[number]
const expenseDeltasByCountry = computed(() => {
  const map = new Map<string, ExpenseDelta>()
  for (const d of expenses.value?.deltas ?? []) map.set(d.country, d)
  return map
})

const reportReady = ref(false)
watchEffect(async () => {
  if (!isReportMode.value) {
    reportReady.value = true
    return
  }

  if (analyticsPending.value || expensesPending.value) {
    reportReady.value = false
    return
  }

  await nextTick()
  reportReady.value = true
})
</script>

