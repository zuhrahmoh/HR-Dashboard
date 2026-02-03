<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold">HR Analytics</h1>
      <p class="text-slate-300">A real-time overview of workforce composition, employee movement, and people-related costs across regions.</p>
    </div>

    <hr class="border-slate-800" />

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section class="rounded-md border border-slate-800 bg-slate-900 p-4">
        <h2 class="mb-1 text-base font-semibold text-slate-200">Geographical Headcount</h2>
        <p class="mb-4 text-xs text-slate-400">Excludes resigned employees.</p>

        <div v-if="analyticsPending" class="text-sm text-slate-200">Loading…</div>
        <div v-else-if="analyticsError" class="text-sm text-red-200">
          Failed to load analytics.
          <div v-if="analyticsErrorMessage" class="mt-2 text-xs text-red-200/80">
            {{ analyticsErrorMessage }}
          </div>
        </div>
        <HeadcountBarChart v-else :items="analytics?.headcountByCountry ?? []" />
      </section>

      <section class="rounded-md border border-slate-800 bg-slate-900 p-4">
        <h2 class="mb-1 text-base font-semibold text-slate-200">Employee Separations</h2>
        <p class="mb-4 text-xs text-slate-400">R = resigned, T = total employees.</p>

        <div v-if="analyticsPending" class="text-sm text-slate-200">Loading…</div>
        <div v-else-if="analyticsError" class="text-sm text-red-200">
          Failed to load analytics.
          <div v-if="analyticsErrorMessage" class="mt-2 text-xs text-red-200/80">
            {{ analyticsErrorMessage }}
          </div>
        </div>
        <SeparationsDonut v-else :resigned="analytics?.separations.resigned ?? 0" :total="analytics?.separations.total ?? 0" />
      </section>

      <section class="rounded-md border border-slate-800 bg-slate-900 p-4">
        <h2 class="mb-1 text-base font-semibold text-slate-200">Employee Additions</h2>
        <p class="mb-4 text-xs text-slate-400">H = new hires, T = total employees.</p>

        <div v-if="analyticsPending || newHiresPending" class="text-sm text-slate-200">Loading…</div>
        <div v-else-if="analyticsError || newHiresError" class="text-sm text-red-200">
          Failed to load additions.
          <div v-if="additionsErrorMessage" class="mt-2 text-xs text-red-200/80">
            {{ additionsErrorMessage }}
          </div>
        </div>
        <AdditionsDonut v-else :hires="newHires.length" :total="analytics?.separations.total ?? 0" />
      </section>
    </div>

    <hr class="border-slate-800" />

    <section class="space-y-3">
      <div class="space-y-1">
        <h2 class="text-base font-semibold text-slate-200">Global Expense Breakdown</h2>
        <p class="text-xs text-slate-400">General expenses breakdown by country</p>
      </div>

      <div v-if="expensesPending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">
        Loading expenses…
      </div>
      <div v-else-if="expensesError" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load expenses.
        <div v-if="expensesErrorMessage" class="mt-2 text-xs text-red-200/80">
          {{ expensesErrorMessage }}
        </div>
      </div>
      <div v-else-if="(expenses?.items?.length ?? 0) === 0" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">
        No expenses data.
      </div>

      <div v-else class="space-y-4">
        <div v-if="expenseDetailedItems.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ExpenseCountryCard
            v-for="item in expenseDetailedItems"
            :key="item.country"
            :country="item.country"
            :month="expenses?.month ?? null"
            :salaries-inclusive-of-paye="item.salariesInclusiveOfPaye"
            :overtime="item.overtime"
            :vc="item.vc"
            :other-allowances="item.otherAllowances"
            :nis-company="item.nisCompany"
            :total="item.total"
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
                <p v-if="expenses?.month" class="mt-0.5 text-xs text-slate-400">{{ expenses.month }}</p>
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
        <h2 class="text-base font-semibold text-slate-200">Talent Density</h2>
        <p class="text-xs text-slate-400">Leaders and Players distribution by rating buckets. Excludes resigned employees.</p>
      </div>

      <div v-if="analyticsPending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div v-else-if="analyticsError" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load analytics.
        <div v-if="analyticsErrorMessage" class="mt-2 text-xs text-red-200/80">
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
      <div class="space-y-1">
        <h2 class="text-base font-semibold text-slate-200">Upcoming Contracts</h2>
        <p class="text-xs text-slate-400">Contract/probation end dates within the next 60 days. Excludes resigned employees.</p>
      </div>

      <div v-if="analyticsPending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div v-else-if="analyticsError" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load analytics.
        <div v-if="analyticsErrorMessage" class="mt-2 text-xs text-red-200/80">
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

type ExpensesSnapshot = {
  month: string | null
  items: Array<{
    country: string
    salariesInclusiveOfPaye: number
    overtime: number
    vc: number
    otherAllowances: number
    nisCompany: number
    total: number
  }>
}

type NewHire = {
  id: string
  name: string
  position: string
  country: string
  startDate: string
  status: string
  createdAt: string
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

const { data: analyticsData, pending: analyticsPending, error: analyticsError } = await useFetch<HomeAnalytics>('/api/analytics/home')
const analytics = computed(() => analyticsData.value ?? null)
const analyticsErrorMessage = computed(() => getErrorMessage(analyticsError.value))

const { data: newHiresData, pending: newHiresPending, error: newHiresError } = await useFetch<NewHire[]>('/api/new-hires')
const newHires = computed(() => newHiresData.value ?? [])
const newHiresErrorMessage = computed(() => getErrorMessage(newHiresError.value))
const additionsErrorMessage = computed(() => newHiresErrorMessage.value || analyticsErrorMessage.value)

const { data: expensesData, pending: expensesPending, error: expensesError } = await useFetch<ExpensesSnapshot>('/api/expenses')
const expenses = computed(() => expensesData.value ?? null)
const expensesErrorMessage = computed(() => getErrorMessage(expensesError.value))

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
function formatCurrency(v: number) {
  const n = Number.isFinite(v) ? v : 0
  return fmt.format(n)
}

type ExpenseItem = ExpensesSnapshot['items'][number]
function isTotalOnlyExpense(item: ExpenseItem) {
  return item.overtime === 0 && item.vc === 0 && item.otherAllowances === 0 && item.nisCompany === 0
}

const expenseDetailedItems = computed(() => (expenses.value?.items ?? []).filter((i) => !isTotalOnlyExpense(i)))
const expenseTotalOnlyItems = computed(() => (expenses.value?.items ?? []).filter((i) => isTotalOnlyExpense(i)))
</script>

