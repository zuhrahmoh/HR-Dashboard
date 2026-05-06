<template>
  <div class="space-y-6" :data-report-ready="reportReady ? '1' : undefined">
    <section>
      <header class="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0 space-y-1">
          <h1 class="text-gradient-brand text-3xl font-extrabold tracking-tight">HR Dashboard</h1>
          <p class="text-sm leading-snug text-slate-600">
            View company-wide workforce movement, composition, and cost insights.
          </p>
        </div>
        <time
          :datetime="dashboardMonthDatetime"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-purple-200/70 bg-white/80 px-2.5 py-1 text-xs font-semibold text-brand-blue shadow-sm backdrop-blur"
        >
          <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
          {{ dashboardMonthLabel }}
        </time>
      </header>

      <div
        v-if="!analyticsPending && !analyticsError"
        class="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5 [&>*]:h-32 [&>*]:min-h-0 [&>*]:w-full"
      >
          <HeadcountDistributionKpi
            :overall="analytics?.employmentTypeBreakdown?.overall ?? { permanent: 0, contracted: 0, interns: 0, total: 0 }"
            :ramps-headcount="rampsHeadcountKpi"
            :edo-headcount="edoHeadcountKpi"
            :independent-contractors="headcountEmploymentSubtotals.independentContractors"
          />

          <DashboardKpiCard dense title="Net change" tone="purple">
            <template #body>
              <div class="text-2xl font-extrabold tabular-nums tracking-tight" :class="netChangeValueClass">
                {{ netChangeFormatted }}
              </div>
            </template>
            <template #footer>
              <p class="w-full px-0.5 text-center text-[11px] font-semibold leading-snug text-brand-purple">
                {{ netChangeSubtitle }}
              </p>
            </template>
          </DashboardKpiCard>

          <MonthlyMetricKpiCard
            v-model="selectedSeparationsMonth"
            dense
            title="Employee Separations"
            tone="red"
            :month-options="analytics?.separations?.months ?? []"
            :display-count="separationsSelectedCount"
          >
            <template #icon>
              <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M7 12h10M13 8l4 4-4 4" />
              </svg>
            </template>
            <template #actions>
              <button
                v-if="!isReportMode"
                type="button"
                class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-pink-200 bg-pink-50 text-pink-900 hover:bg-pink-100/90"
                aria-label="See separation details"
                @click="openSeparationsDetails"
              >
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
            dense
            title="Employee Additions"
            tone="green"
            :month-options="analytics?.additions?.months ?? []"
            :display-count="additionsSelectedCount"
          >
            <template #icon>
              <svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
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
                class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100/90"
                aria-label="See addition details"
                @click="openAdditionsDetails"
              >
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

          <DashboardKpiCard dense title="Total Workforce Cost" tone="blue">
            <template #body>
              <div class="text-center">
                <div class="text-2xl font-extrabold tabular-nums tracking-tight text-brand-blue">
                  {{ expenses ? formatCurrencyCompact(totalOutgoingExpensesKpi) : '—' }}
                </div>
              </div>
            </template>
            <template #footer>
              <p class="w-full px-0.5 text-center text-[11px] font-semibold leading-snug text-slate-500">
                {{ expenseMonthDisplay || 'All countries' }}
              </p>
            </template>
          </DashboardKpiCard>
      </div>
    </section>

    <div v-if="analyticsPending" class="pb-8 text-sm text-slate-800">Loading…</div>
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
      <section id="workforce-snapshot" class="surface-tint-hero scroll-mt-32 space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
        <header class="flex min-w-0 flex-wrap items-start justify-between gap-4 gap-y-3">
          <div class="flex min-w-0 items-start gap-3">
            <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
            <div class="min-w-0 space-y-0.5">
              <h2 class="text-gradient-brand text-xl font-bold tracking-tight">Workforce Snapshot</h2>
              <p class="text-sm text-slate-500">Headcount distribution and trend.</p>
            </div>
          </div>
          <GenerateSummaryReportMenu v-if="!isReportMode" class="shrink-0 pt-0.5" />
        </header>

        <div class="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-12 lg:items-stretch lg:gap-3">
          <div
            id="geographical-distribution"
            class="scroll-mt-32 flex min-h-[12rem] flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3 shadow-card lg:col-span-4 lg:min-h-[14rem]"
          >
            <h3 class="shrink-0 text-sm font-semibold text-hr-navy">Geographical Distribution</h3>
            <p class="mt-0.5 text-[11px] leading-snug text-slate-500">Headcount by location. Excludes archived employees.</p>
            <div class="mt-2 min-h-0 w-full min-w-0 flex-1 overflow-hidden">
              <GeoEmploymentStackedBarChart :items="analytics?.employmentTypeBreakdown?.byCountry ?? []" />
            </div>
          </div>

          <section
            class="flex min-h-[12rem] flex-col rounded-xl border border-slate-200/80 bg-white p-3 shadow-card lg:col-span-8 lg:min-h-[14rem]"
          >
            <div class="flex shrink-0 items-center justify-between gap-2">
              <h3 class="min-w-0 truncate text-sm font-semibold text-hr-navy">Headcount Over Time</h3>
              <button
                type="button"
                class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-brand-blue bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-brand-blue transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 mr-0.5"
                :disabled="snapshotSaving || !totalCurrentHeadcount"
                :title="`Save current headcount (${totalCurrentHeadcount}) for this month`"
                @click="saveHeadcountSnapshot"
              >
                <!-- Spinner while saving -->
                <svg v-if="snapshotSaving" class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <!-- Tick on success -->
                <svg v-else-if="snapshotSaved" class="h-3.5 w-3.5 text-teal-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" />
                </svg>
                <!-- Reload icon at rest -->
                <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" />
                </svg>
                <span>{{ snapshotSaved ? 'Saved' : 'Update' }}</span>
              </button>
            </div>
            <div class="mt-1.5 min-h-0 flex-1 overflow-hidden lg:min-h-[9.5rem]">
              <HeadcountMonthlyLineChart
                :items="headcountSnapshots?.items ?? []"
                title="Headcount Over Time"
                :show-header="false"
                fill-height
                trim-y-axis
                :y-min="100"
                compact
              />
            </div>
          </section>
        </div>
      </section>

      <section id="cost-overview" class="surface-tint-hero scroll-mt-32 space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <header class="flex min-w-0 items-start gap-3">
            <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
            <div class="min-w-0 space-y-0.5">
              <h2 class="text-gradient-brand text-xl font-bold tracking-tight">Workforce Cost Breakdown</h2>
              <p class="text-sm text-slate-500">Payroll and workforce costs by country.</p>
            </div>
          </header>

          <div
            v-if="(expenses?.availableMonths?.length ?? 0) > 0"
            class="flex w-full min-w-0 flex-wrap items-end justify-end gap-3 sm:w-auto sm:shrink-0"
          >
            <label class="space-y-1">
              <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Month</div>
              <select
                v-model="selectedMonthModel"
                class="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none"
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
                class="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none"
              >
                <option v-for="c in CURRENCIES" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>

            <label
              class="flex h-9 items-center gap-2 self-end rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm"
            >
              <input
                v-model="showNetChanges"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-hr-navy focus:ring-hr-navy/40"
                :disabled="!baselineMonthKey"
              />
              <span class="whitespace-nowrap">Show net changes</span>
            </label>
          </div>
        </div>

        <div v-if="expensesPending" class="rounded-xl border border-slate-200/80 bg-white shadow-card p-4 text-slate-800">
          Loading expenses…
        </div>
        <div v-else-if="expensesError" class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load expenses.
          <div v-if="expensesErrorMessage" class="mt-2 text-sm text-red-700/80">
            {{ expensesErrorMessage }}
          </div>
        </div>
        <div v-else-if="(expenses?.items?.length ?? 0) === 0" class="rounded-xl border border-slate-200/80 bg-white shadow-card p-4 text-slate-800">
          No expenses data.
        </div>

        <div v-else class="space-y-3">
          <div v-if="expenses?.warning" class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {{ expenses.warning }}
          </div>

          <div
            v-if="showNetChanges && baselineMonthKey"
            class="rounded-xl border border-slate-200/80 bg-white shadow-card p-3 text-sm text-slate-600"
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
              :allowance="convertUsd(item.allowance)"
              :overtime="convertUsd(item.overtime)"
              :vc="convertUsd(item.vc)"
              :nis-company="convertUsd(item.nisCompany)"
              :medical-plan-employer="convertUsd(item.medicalPlanEmployer)"
              :total="convertUsd(item.total)"
              :show-deltas="showNetChanges && !!baselineMonthKey"
              :delta-gross-salary="convertUsd(expenseDeltasByCountry.get(item.country)?.grossSalary ?? 0)"
              :delta-allowance="convertUsd(expenseDeltasByCountry.get(item.country)?.allowance ?? 0)"
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
              class="rounded-xl border border-slate-200/80 bg-white shadow-card p-4"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <h3 class="truncate text-sm font-semibold text-hr-navy" :title="item.country">{{ item.country || '—' }}</h3>
                  <p v-if="expenseMonthDisplay" class="mt-0.5 text-sm text-slate-400">{{ expenseMonthDisplay }}</p>
                </div>
                <div class="text-right">
                  <div class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total outgoing</div>
                  <div class="text-base font-semibold tabular-nums text-hr-navy">
                    {{ formatCurrency(convertUsd(item.total)) }}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section id="workforce-movement" class="surface-tint-hero scroll-mt-32 space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
        <header class="flex items-start gap-3">
          <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
          <div class="min-w-0 space-y-0.5">
            <h2 class="text-gradient-brand text-xl font-bold tracking-tight">Workforce Movement</h2>
            <p class="text-sm text-slate-500">Hiring and separation trends over time.</p>
          </div>
        </header>
        <div class="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch lg:gap-3">
          <section
            class="flex min-h-[12rem] flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3 shadow-card lg:min-h-[13rem]"
          >
            <AdditionsYearLineChart compact :items="analytics?.additionsByYear ?? []" />
          </section>
          <section
            class="flex min-h-[12rem] flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3 shadow-card lg:min-h-[13rem]"
          >
            <SeparationsYearLineChart compact :items="analytics?.separationsByYear ?? []" :by-type="null" />
          </section>
        </div>
      </section>

      <section id="workforce-composition" class="surface-tint-hero scroll-mt-32 space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
        <header class="flex items-start gap-3">
          <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
          <div class="min-w-0 space-y-0.5">
            <h2 class="text-gradient-brand text-xl font-bold tracking-tight">Workforce Composition</h2>
            <p class="text-sm text-slate-500">Gender and age mix.</p>
          </div>
        </header>

        <div class="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-12 lg:items-stretch lg:gap-3">
          <section
            class="flex min-h-[11rem] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3 shadow-card lg:col-span-4 lg:min-h-[13rem]"
          >
            <div class="shrink-0 space-y-0.5">
              <div class="text-sm font-semibold text-hr-navy">Gender breakdown</div>
            </div>
            <div class="mt-2 flex min-h-0 flex-1 flex-col">
              <GenderBreakdownPie
                :overall="analytics?.genderBreakdown?.overall ?? { male: 0, female: 0, total: 0 }"
                :by-country="analytics?.genderBreakdown?.byCountry ?? []"
                :hide-title="true"
                :compact="true"
                filter-placement="corner"
                compact-size="md"
                fill-height
              />
            </div>
          </section>

          <section
            class="flex min-h-[11rem] min-w-0 flex-col overflow-visible rounded-xl border border-slate-200/80 bg-white p-3 shadow-card lg:col-span-8 lg:min-h-[13rem]"
          >
            <div class="shrink-0 text-sm font-semibold text-hr-navy">Average age by country</div>
            <p class="mt-0.5 text-[11px] text-slate-500">Male and female averages side-by-side.</p>
            <div class="mt-2 min-h-0 flex-1 overflow-x-auto overflow-y-visible">
              <AverageAgeGroupedBarChart compact embedded :items="avgAgeByCountryGenderRows" hide-heading />
            </div>
          </section>
        </div>
      </section>
    </template>


  </div>
</template>

<script setup lang="ts">
import HeadcountDistributionKpi from '~/components/HeadcountDistributionKpi.vue'
import GeoEmploymentStackedBarChart from '~/components/GeoEmploymentStackedBarChart.vue'
import HeadcountMonthlyLineChart from '~/components/HeadcountMonthlyLineChart.vue'
import { formatExpenseMonthLabel } from '~/utils/formatExpenseMonth'

const { data: authMe } = await useFetch<{ authenticated: boolean; user: { name: string; email: string } | null }>(
  '/api/auth/me',
  { key: 'auth-me' }
)

const welcomeDisplayName = computed(() => {
  const u = authMe.value?.user
  if (!u) return 'User'
  const nm = (u.name ?? '').trim()
  if (nm) {
    const first = nm.split(/\s+/)[0]
    return first ?? nm
  }
  const local = (u.email ?? '').split('@')[0]?.trim()
  return local || 'User'
})

const dashboardClockMs = ref(Date.now())
let dashboardClockTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  dashboardClockTimer = setInterval(() => {
    dashboardClockMs.value = Date.now()
  }, 60_000)
})

onUnmounted(() => {
  if (dashboardClockTimer !== undefined) clearInterval(dashboardClockTimer)
})

const dashboardMonthDatetime = computed(() => {
  void dashboardClockMs.value
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const dashboardMonthLabel = computed(() => {
  void dashboardClockMs.value
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
})

type HomeAnalytics = {
  headcountByCountry: Array<{ country: string; headcount: number }>
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

type ExpensesSnapshot = {
  month: string | null
  items: Array<{
    country: string
    grossSalary: number
    allowance: number
    overtime: number
    vc: number
    nisCompany: number
    medicalPlanEmployer: number
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
const { data: headcountSnapshots, refresh: refreshHeadcountSnapshots } = useFetch<HeadcountSnapshotsResponse>('/api/analytics/headcount-snapshots')

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

const netChangeMonthKey = computed(() => {
  const a = analytics.value
  if (!a) return ''
  return (a.additions?.currentMonth || a.separations?.currentMonth || '').trim()
})

const netChangeNet = computed(() => {
  const a = analytics.value
  const m = netChangeMonthKey.value
  if (!a || !m) return 0
  const hires = safeInt(a.additions?.byMonth?.[m]?.hires)
  const bm = a.separations?.byMonth?.[m]
  const sep = bm ? safeInt(bm.resigned) + safeInt(bm.retired) + safeInt(bm.fired) : 0
  return hires - sep
})

const netChangeFormatted = computed(() => {
  const n = netChangeNet.value
  if (n > 0) return `+${n}`
  return String(n)
})

const netChangeValueClass = computed(() => {
  const n = netChangeNet.value
  if (n > 0) return 'text-brand-purple'
  if (n < 0) return 'text-pink-600'
  return 'text-hr-navy'
})

function formatAnalyticsMonthLabel(monthKey: string) {
  const m = /^(\d{4})-(\d{2})$/.exec((monthKey ?? '').trim())
  if (!m) return monthKey || '—'
  const y = Number(m[1])
  const mo = Number(m[2])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return monthKey
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

const netChangeSubtitle = computed(() => {
  const m = netChangeMonthKey.value
  if (!m) return 'Current month —'
  return `Current month · ${formatAnalyticsMonthLabel(m)}`
})

function openSeparationsDetails() {
  const m = selectedSeparationsMonth.value.trim()
  if (!/^\d{4}-\d{2}$/.test(m)) return
  navigateTo(`/recruitment?section=recent-separations&sepMonth=${encodeURIComponent(m)}#recent-separations-table`)
}

function openAdditionsDetails() {
  const m = selectedAdditionsMonth.value.trim()
  if (!/^\d{4}-\d{2}$/.test(m)) return
  navigateTo(`/recruitment?section=recent-new-hires&hireMonth=${encodeURIComponent(m)}#recent-new-hires`)
}

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
  () => analytics.value?.headcountEmploymentSubtotals ?? { independentContractors: 0 }
)

/** Average age by country chart rows (from analytics). */
const avgAgeByCountryGenderRows = computed(() => analytics.value?.avgAgeByCountryGender ?? [])

const totalCurrentHeadcount = computed(
  () => analytics.value?.employmentTypeBreakdown?.overall?.total ?? 0
)
const snapshotSaving = ref(false)
const snapshotSaved = ref(false)

async function saveHeadcountSnapshot() {
  if (snapshotSaving.value || !totalCurrentHeadcount.value) return
  snapshotSaving.value = true
  snapshotSaved.value = false
  try {
    await $fetch('/api/analytics/headcount-snapshots', {
      method: 'POST',
      body: { headcount: totalCurrentHeadcount.value }
    })
    await refreshHeadcountSnapshots()
    snapshotSaved.value = true
    setTimeout(() => { snapshotSaved.value = false }, 2500)
  } finally {
    snapshotSaving.value = false
  }
}

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

const TOTAL_ONLY_COUNTRIES = new Set([
  'mexico',
  'colombia',
  'columbia',
  'usa',
  'u.s.a.',
  'united states',
  'united states of america'
])

function isTotalOnlyCountry(country: string) {
  return TOTAL_ONLY_COUNTRIES.has(String(country ?? '').trim().toLowerCase())
}

const expenseDetailedItems = computed(() => (expenses.value?.items ?? []).filter((i) => !isTotalOnlyCountry(i.country)))

const totalOutgoingExpensesKpi = computed(() => {
  const items = expenses.value?.items ?? []
  const rawUsd = items.reduce((sum, i) => sum + (Number.isFinite(i.total) ? i.total : 0), 0)
  return convertUsd(rawUsd)
})

const fmtCompact = computed(
  () => new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedCurrency.value, notation: 'compact', maximumFractionDigits: 1 })
)

function formatCurrencyCompact(v: number) {
  return fmtCompact.value.format(Number.isFinite(v) ? v : 0)
}
const expenseTotalOnlyItems = computed(() => (expenses.value?.items ?? []).filter((i) => isTotalOnlyCountry(i.country)))

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

