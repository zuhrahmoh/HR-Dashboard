<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-3xl font-semibold">HR Analytics (Odoo)</h1>
      <p class="text-base text-slate-300">Employee analytics sourced from the Odoo Employee module.</p>
    </div>

    <hr class="border-slate-800" />

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section class="rounded-md border border-slate-800 bg-slate-900 p-4">
        <h2 class="mb-1 text-lg font-semibold text-slate-200">Geographical Headcount</h2>
        <p class="mb-4 text-sm text-slate-400">Excludes resigned employees.</p>

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
        <HeadcountBarChart v-else :items="analytics?.headcountByCountry ?? []" />
      </section>

      <section class="rounded-md border border-slate-800 bg-slate-900 p-4">
        <h2 class="mb-1 text-lg font-semibold text-slate-200">Employee Separations</h2>
        <p class="mb-4 text-sm text-slate-400">Separated employees (by month and reason).</p>

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
        <SeparationsDonut
          v-else
          :separations="analytics?.separations ?? { currentMonth: '', months: [], byMonth: {} }"
        />
      </section>

      <section class="rounded-md border border-slate-800 bg-slate-900 p-4">
        <h2 class="mb-1 text-lg font-semibold text-slate-200">Employee Additions</h2>
        <p class="mb-4 text-sm text-slate-400">New hires added (relative to current headcount).</p>

        <div v-if="analyticsPending" class="text-sm text-slate-200">Loading…</div>
        <div v-else-if="analyticsError" class="text-sm text-red-200">
          Failed to load additions.
          <div v-if="analyticsErrorMessage" class="mt-2 text-xs text-red-200/80">{{ analyticsErrorMessage }}</div>
          <div v-if="isFetchFailed(analyticsErrorMessage)" class="mt-2 text-xs text-slate-400">
            Ensure the dev server is running and reachable. Check /api/odoo/health for Odoo config.
          </div>
        </div>
        <AdditionsDonut
          v-else
          :additions="analytics?.additions ?? { currentMonth: '', months: [], byMonth: {} }"
          :total-headcount="totalHeadcountNow"
        />
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
                {{ (expenses?.monthLabels && expenses.monthLabels[m]) || m }}
              </option>
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
          <span class="font-semibold text-slate-200">{{ (expenses?.monthLabels && expenses.monthLabels[baselineMonthKey]) || baselineMonthKey }}</span>
        </div>

        <div v-if="expenseDetailedItems.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ExpenseCountryCard
            v-for="item in expenseDetailedItems"
            :key="item.country"
            :country="item.country"
            :month="expenses?.month ?? null"
            :gross-salary="item.grossSalary"
            :paye="item.paye"
            :overtime="item.overtime"
            :vc="item.vc"
            :health-surcharge="item.healthSurcharge"
            :nis-company="item.nisCompany"
            :total="item.total"
            :show-deltas="showNetChanges && !!baselineMonthKey"
            :delta-gross-salary="expenseDeltasByCountry.get(item.country)?.grossSalary ?? 0"
            :delta-paye="expenseDeltasByCountry.get(item.country)?.paye ?? 0"
            :delta-overtime="expenseDeltasByCountry.get(item.country)?.overtime ?? 0"
            :delta-vc="expenseDeltasByCountry.get(item.country)?.vc ?? 0"
            :delta-health-surcharge="expenseDeltasByCountry.get(item.country)?.healthSurcharge ?? 0"
            :delta-nis-company="expenseDeltasByCountry.get(item.country)?.nisCompany ?? 0"
            :delta-total="expenseDeltasByCountry.get(item.country)?.total ?? 0"
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
                {{ formatCurrency(item.total) }}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>

    <hr class="border-slate-800" />

    <section class="space-y-3">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold text-slate-200">Talent Density</h2>
        <p class="text-sm text-slate-400">Leaders and Players distribution by rating buckets. Excludes resigned employees.</p>
      </div>

      <div v-if="analyticsPending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div v-else-if="analyticsError" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load analytics.
        <div v-if="analyticsErrorMessage" class="mt-2 text-sm text-red-200/80">
          {{ analyticsErrorMessage }}
        </div>
      </div>
      <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div class="space-y-4 lg:col-span-8">
          <section class="rounded-md border border-slate-800 bg-slate-900 p-4">
            <TalentDensityStackedBar title="Leaders" :segments="analytics?.talentDensity.leaders ?? []" />
          </section>
          <section class="rounded-md border border-slate-800 bg-slate-900 p-4">
            <TalentDensityStackedBar title="Players" :segments="analytics?.talentDensity.players ?? []" />
          </section>
        </div>

        <section class="rounded-md border border-slate-800 bg-slate-900 p-4 lg:col-span-4">
          <GenderBreakdownPie
            :overall="analytics?.genderBreakdown?.overall ?? { male: 0, female: 0, total: 0 }"
            :by-country="analytics?.genderBreakdown?.byCountry ?? []"
          />
        </section>
      </div>
    </section>

    <hr class="border-slate-800" />

    <section class="space-y-3">
      <AverageAgeGroupedBarChart :items="analytics?.avgAgeByCountryGender ?? []" />
    </section>

    <hr class="border-slate-800" />

    <section class="space-y-3">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold text-slate-200">Upcoming Contracts</h2>
        <p class="text-sm text-slate-400">Contract/probation end dates within the next 60 days. Excludes resigned employees.</p>
      </div>

      <div v-if="analyticsPending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div v-else-if="analyticsError" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load analytics.
        <div v-if="analyticsErrorMessage" class="mt-2 text-sm text-red-200/80">
          {{ analyticsErrorMessage }}
        </div>
      </div>
      <UpcomingContractsTable v-else :items="analytics?.upcomingContracts ?? []" />
    </section>
  </div>
</template>

<script setup lang="ts">
type HomeAnalytics = {
  headcountByCountry: Array<{ country: string; headcount: number }>
  separations: {
    currentMonth: string
    months: string[]
    byMonth: Record<string, { resigned: number; retired: number; fired: number; headcountAfter: number }>
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

type ExpensesSnapshot = {
  month: string | null
  items: Array<{
    country: string
    grossSalary: number
    paye: number
    overtime: number
    vc: number
    healthSurcharge: number
    nisCompany: number
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

const { data: analyticsData, pending: analyticsPending, error: analyticsError } = await useFetch<HomeAnalytics>('/api/odoo/analytics/home')
const analytics = computed(() => analyticsData.value ?? null)
const analyticsErrorMessage = computed(() => getErrorMessage(analyticsError.value))

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

const { data: expensesData, pending: expensesPending, error: expensesError } = await useFetch<ExpensesResponse>('/api/expenses', {
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

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
function formatCurrency(v: number) {
  const n = Number.isFinite(v) ? v : 0
  return fmt.format(n)
}

type ExpenseItem = ExpensesSnapshot['items'][number]
function isTotalOnlyExpense(item: ExpenseItem) {
  return item.grossSalary === 0 && item.paye === 0 && item.overtime === 0 && item.vc === 0 && item.healthSurcharge === 0 && item.nisCompany === 0
}

const expenseDetailedItems = computed(() => (expenses.value?.items ?? []).filter((i) => !isTotalOnlyExpense(i)))
const expenseTotalOnlyItems = computed(() => (expenses.value?.items ?? []).filter((i) => isTotalOnlyExpense(i)))

type ExpenseDelta = NonNullable<ExpensesResponse['deltas']>[number]
const expenseDeltasByCountry = computed(() => {
  const map = new Map<string, ExpenseDelta>()
  for (const d of expenses.value?.deltas ?? []) map.set(d.country, d)
  return map
})
</script>

