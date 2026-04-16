<template>
  <div class="space-y-6" :data-report-ready="reportReady ? '1' : undefined">
    <div class="space-y-1">
      <h1 class="text-3xl font-semibold">HR Dashboard</h1>
      <p class="text-base text-slate-300">Employee analytics sourced from the Odoo(Laser) Employee module.</p>
    </div>

    <hr class="border-slate-800" />

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section class="flex h-[20rem] flex-col rounded-md border border-slate-800 bg-slate-900 p-4">
        <div class="mb-1 flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-slate-200">Geographical Headcount</h2>
          <button
            v-if="!showHeadcountOverview && !reportHomeAll"
            type="button"
            class="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-800/70"
            @click="showHeadcountOverview = true"
          >
            <span class="inline-flex items-center gap-1.5">
              <span>View trends</span>
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" class="h-3.5 w-3.5" stroke="currentColor" stroke-width="1.75">
                <path d="M5.25 3.5L9.25 8l-4 4.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M8.25 3.5L12.25 8l-4 4.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </button>
          <button
            v-else-if="!reportHomeAll"
            type="button"
            class="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-800/70"
            @click="showHeadcountOverview = false"
          >
            ← Back
          </button>
        </div>
        <p class="text-sm text-slate-400">Excludes resigned employees.</p>
        <div class="text-right text-sm font-semibold tabular-nums text-orange-400">Total: {{ totalHeadcountNow }}</div>
        <div class="mb-4" />

        <div v-if="analyticsPending" class="text-sm text-slate-200">Loading…</div>
        <div v-else-if="analyticsError" class="text-sm text-red-200">
          Failed to load analytics.
          <div v-if="analyticsErrorMessage" class="mt-2 text-xs text-red-200/80">
            {{ analyticsErrorMessage }}
          </div>
          <div v-if="isFetchFailed(analyticsErrorMessage)" class="mt-2 text-xs text-slate-400">
            Ensure the dev server is running and reachable. Check /api/odoo/health for Odoo config.
          </div>
        </div>
        <div v-else class="mt-2 min-h-0 flex-1">
          <HeadcountMonthlyLineChart
            v-if="showHeadcountOverview"
            :items="headcountSnapshots?.items ?? []"
            title="Geographical headcount trend"
            :show-header="false"
          />
          <HeadcountBarChart
            v-else
            :items="analytics?.headcountByCountry ?? []"
          />
        </div>
      </section>

      <section class="flex h-[20rem] flex-col rounded-md border border-slate-800 bg-slate-900 p-4">
        <div class="mb-1 flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-slate-200">Employee Separations</h2>
          <button
            v-if="!showSeparationsOverview && !reportHomeAll"
            type="button"
            class="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-800/70"
            @click="showSeparationsOverview = true"
          >
            <span class="inline-flex items-center gap-1.5">
              <span>View trends</span>
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" class="h-3.5 w-3.5" stroke="currentColor" stroke-width="1.75">
                <path d="M5.25 3.5L9.25 8l-4 4.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M8.25 3.5L12.25 8l-4 4.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </button>
          <button
            v-else-if="!reportHomeAll"
            type="button"
            class="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-800/70"
            @click="showSeparationsOverview = false"
          >
            ← Back
          </button>
        </div>
        <p class="mb-4 text-sm text-slate-400">Separated employees (by month).</p>

        <div v-if="analyticsPending" class="text-sm text-slate-200">Loading…</div>
        <div v-else-if="analyticsError" class="text-sm text-red-200">
          Failed to load analytics.
          <div v-if="analyticsErrorMessage" class="mt-2 text-xs text-red-200/80">
            {{ analyticsErrorMessage }}
          </div>
          <div v-if="isFetchFailed(analyticsErrorMessage)" class="mt-2 text-xs text-slate-400">
            Ensure the dev server is running and reachable. Check /api/odoo/health for Odoo config.
          </div>
        </div>
        <template v-else>
          <template v-if="reportHomeAll">
            <SeparationsDonut
              :separations="analytics?.separations ?? { currentMonth: '', months: [], byMonth: {} }"
              :show-breakdown="false"
              show-recruitment-details-link
            />
            <div class="mt-3">
              <SeparationsYearLineChart :items="analytics?.separationsByYear ?? []" :by-type="null" />
            </div>
          </template>
          <template v-else>
            <SeparationsYearLineChart
              v-if="showSeparationsOverview"
              :items="analytics?.separationsByYear ?? []"
              :by-type="null"
            />
            <SeparationsDonut
              v-else
              :separations="analytics?.separations ?? { currentMonth: '', months: [], byMonth: {} }"
              :show-breakdown="false"
              show-recruitment-details-link
            />
          </template>
        </template>
      </section>

      <section class="flex h-[20rem] flex-col rounded-md border border-slate-800 bg-slate-900 p-4">
        <div class="mb-1 flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-slate-200">Employee Additions</h2>
          <button
            v-if="!showAdditionsOverview && !reportHomeAll"
            type="button"
            class="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-800/70"
            @click="showAdditionsOverview = true"
          >
            <span class="inline-flex items-center gap-1.5">
              <span>View trends</span>
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" class="h-3.5 w-3.5" stroke="currentColor" stroke-width="1.75">
                <path d="M5.25 3.5L9.25 8l-4 4.5" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M8.25 3.5L12.25 8l-4 4.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </button>
          <button
            v-else-if="!reportHomeAll"
            type="button"
            class="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-800/70"
            @click="showAdditionsOverview = false"
          >
            ← Back
          </button>
        </div>
        <p class="mb-4 text-sm text-slate-400">New hires added (relative to current headcount).</p>

        <div v-if="analyticsPending" class="text-sm text-slate-200">Loading…</div>
        <div v-else-if="analyticsError" class="text-sm text-red-200">
          Failed to load additions.
          <div v-if="analyticsErrorMessage" class="mt-2 text-xs text-red-200/80">{{ analyticsErrorMessage }}</div>
          <div v-if="isFetchFailed(analyticsErrorMessage)" class="mt-2 text-xs text-slate-400">
            Ensure the dev server is running and reachable. Check /api/odoo/health for Odoo config.
          </div>
        </div>
        <template v-else>
          <template v-if="reportHomeAll">
            <AdditionsDonut
              :additions="analytics?.additions ?? { currentMonth: '', months: [], byMonth: {} }"
              :total-headcount="totalHeadcountNow"
              show-recruitment-details-link
            />
            <div class="mt-3">
              <AdditionsYearLineChart :items="analytics?.additionsByYear ?? []" />
            </div>
          </template>
          <template v-else>
            <AdditionsYearLineChart
              v-if="showAdditionsOverview"
              :items="analytics?.additionsByYear ?? []"
            />
            <AdditionsDonut
              v-else
              :additions="analytics?.additions ?? { currentMonth: '', months: [], byMonth: {} }"
              :total-headcount="totalHeadcountNow"
              show-recruitment-details-link
            />
          </template>
        </template>
      </section>
    </div>

    <hr class="border-slate-800" />

    <section class="space-y-3">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-slate-200">Global Expense Breakdown</h2>
          <p class="text-sm text-slate-400">General expenses breakdown by country</p>
        </div>

        <div v-if="(expenses?.availableMonths?.length ?? 0) > 0" class="flex flex-wrap items-center gap-3">
          <label class="space-y-1">
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Month</div>
            <select
              v-model="selectedMonthModel"
              class="h-9 rounded-md border border-slate-700 bg-slate-950/40 px-2 text-sm text-slate-200 focus:border-slate-500 focus:outline-none"
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
              class="h-9 rounded-md border border-slate-700 bg-slate-950/40 px-2 text-sm text-slate-200 focus:border-slate-500 focus:outline-none"
            >
              <option v-for="c in CURRENCIES" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>

          <label class="flex h-9 items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 text-sm text-slate-200">
            <input
              v-model="showNetChanges"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-600 bg-slate-950/40 text-emerald-400 focus:ring-emerald-400"
              :disabled="!baselineMonthKey"
            />
            <span>Show net changes</span>
          </label>
        </div>
      </div>

      <div v-if="expensesPending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">
        Loading expenses…
      </div>
      <div v-else-if="expensesError" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load expenses.
        <div v-if="expensesErrorMessage" class="mt-2 text-sm text-red-200/80">
          {{ expensesErrorMessage }}
        </div>
      </div>
      <div v-else-if="(expenses?.items?.length ?? 0) === 0" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">
        No expenses data.
      </div>

      <div v-else class="space-y-4">
        <div v-if="expenses?.warning" class="rounded-md border border-amber-900/40 bg-amber-950/25 p-3 text-sm text-amber-200">
          {{ expenses.warning }}
        </div>

        <div
          v-if="showNetChanges && baselineMonthKey"
          class="rounded-md border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300"
        >
          Comparing to
          <span class="font-semibold text-slate-200">{{ monthLabel(baselineMonthKey) }}</span>
        </div>

        <div v-if="expenseDetailedItems.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ExpenseCountryCard
            v-for="item in expenseDetailedItems"
            :key="item.country"
            :country="item.country"
            :month="expenses?.month ?? null"
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
            class="rounded-md border border-slate-800 bg-slate-900 p-4"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <h3 class="truncate text-sm font-semibold text-slate-100" :title="item.country">{{ item.country || '—' }}</h3>
                <p v-if="expenses?.month" class="mt-0.5 text-sm text-slate-400">{{ expenses.month }}</p>
              </div>
              <div class="text-right text-sm font-semibold tabular-nums text-emerald-400">
                {{ formatCurrency(convertUsd(item.total)) }}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>

    <hr class="border-slate-800" />

    <section class="space-y-3">
      <div v-if="analyticsPending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div v-else-if="analyticsError" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load analytics.
        <div v-if="analyticsErrorMessage" class="mt-2 text-sm text-red-200/80">
          {{ analyticsErrorMessage }}
        </div>
      </div>
      <!--
        Talent density UI removed; `analytics.talentDensity` still returned by GET /api/odoo/analytics/home.
        Restore with TalentDensityStackedBar for leaders/players when re-enabling.
      -->
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section class="flex min-h-[20rem] flex-col rounded-md border border-slate-800 bg-slate-900 p-4">
          <div class="space-y-1">
            <div class="text-base font-semibold text-slate-200">Permanent vs Contracted</div>
            <div class="text-xs text-slate-400">Contracted includes interns.</div>
          </div>
          <div class="mt-2 min-h-0 flex-1">
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

        <section class="flex min-h-[20rem] flex-col rounded-md border border-slate-800 bg-slate-900 p-4">
          <div class="space-y-1">
            <div class="text-base font-semibold text-slate-200">Gender breakdown</div>
          </div>
          <div class="mt-2 min-h-0 flex-1">
            <GenderBreakdownPie
              :overall="analytics?.genderBreakdown?.overall ?? { male: 0, female: 0, total: 0 }"
              :by-country="analytics?.genderBreakdown?.byCountry ?? []"
              :hide-title="true"
              :compact="true"
              filter-placement="corner"
              compact-size="lg"
            />
          </div>
        </section>
      </div>
    </section>

    <hr class="border-slate-800" />

    <section class="space-y-3 report-page report-keep">
      <AverageAgeGroupedBarChart :items="analytics?.avgAgeByCountryGender ?? []" />
    </section>

  </div>
</template>

<script setup lang="ts">
import HeadcountMonthlyLineChart from '~/components/HeadcountMonthlyLineChart.vue'
import PermanentVsContractedPie from '~/components/PermanentVsContractedPie.vue'

type HomeAnalytics = {
  headcountByCountry: Array<{ country: string; headcount: number }>
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
const reportHomeAll = computed(() => route.query.report === '1' && route.query.home === 'all')

const showHeadcountOverview = ref(false)
const showSeparationsOverview = ref(false)
const showAdditionsOverview = ref(false)

const headcountAfterSeparations = computed(() => {
  const s = analytics.value?.separations
  if (!s) return 0
  const m = s.currentMonth
  return s.byMonth?.[m]?.headcountAfter ?? 0
})

const totalHeadcountNow = computed(() => (analytics.value?.headcountByCountry ?? []).reduce((acc, i) => acc + (i.headcount ?? 0), 0))

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
  const m = /^(\d{4})-(\d{2})$/.exec(candidate)
  if (!m) return key
  const y = Number(m[1])
  const mo = Number(m[2])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return key
  const dt = new Date(Date.UTC(y, mo - 1, 1))
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(dt)
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

