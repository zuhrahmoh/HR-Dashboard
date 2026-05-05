<template>
  <div class="space-y-5 p-1" :data-report-ready="reportReady ? '1' : undefined">

    <div class="rpt-section-title">Executive Summary</div>

    <!-- KPI metric blocks -->
    <div class="grid grid-cols-4 gap-2">
      <div class="rpt-metric-block">
        <div class="rpt-metric-label">Headcount</div>
        <div class="rpt-metric-value">{{ totalHeadcount || '—' }}</div>
        <div class="rpt-metric-note">{{ rampsEdoLabel }}</div>
        <div v-if="consultantsLabel" class="rpt-metric-note">{{ consultantsLabel }}</div>
      </div>
      <div class="rpt-metric-block">
        <div class="rpt-metric-label">Net Change</div>
        <div
          class="rpt-metric-value"
          :style="netChange > 0 ? 'color:#15803d' : netChange < 0 ? 'color:#b91c1c' : ''"
        >
          {{ netChange >= 0 ? '+' : '' }}{{ netChange }}
        </div>
        <div class="rpt-metric-note">{{ monthLabel }}</div>
      </div>
      <div class="rpt-metric-block">
        <div class="rpt-metric-label">Employee Additions</div>
        <div class="rpt-metric-value">{{ additionsThisMonth }}</div>
        <div class="rpt-metric-note">{{ monthLabel }}</div>
      </div>
      <div class="rpt-metric-block">
        <div class="rpt-metric-label">Employee Separations</div>
        <div class="rpt-metric-value">{{ separationsThisMonth }}</div>
        <div class="rpt-metric-note">{{ monthLabel }}</div>
      </div>
    </div>

    <!-- Report Highlights -->
    <div>
      <div class="rpt-subsection-title">Report Highlights</div>
      <ul class="list-disc space-y-1.5 pl-5">
        <li v-for="bullet in highlights" :key="bullet" class="text-[12.5px] text-slate-700">{{ bullet }}</li>
      </ul>
    </div>

  </div>
</template>

<script setup lang="ts">
type HomeAnalytics = {
  headcountByCountry: Array<{ country: string; headcount: number }>
  headcountEmploymentSubtotals?: { independentContractors: number }
  employmentTypeBreakdown?: {
    overall: { permanent: number; contracted: number; interns: number; total: number }
  }
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
}

type Vacancy = { id: string; positionTitle: string; department: string; country: string; priority: string; createdAt: string }
type DisciplinaryCase = { id: string; status: string; includeInReport?: boolean }
type ExpensesResponse = { month: string | null; items: Array<{ country: string; total: number }> }
type SeparationsResponse = { items: Array<{ employeeKey: string }> }

const RAMPS_COUNTRIES = ['Trinidad and Tobago', 'Guyana', 'Suriname', 'Mexico', 'Colombia', 'USA'] as const
const EDO_COUNTRIES = ['El Dorado Offshore TT', 'El Dorado Offshore GY'] as const

function safeNum(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function sumBy(items: Array<{ country: string; headcount: number }>, countries: readonly string[]) {
  const map = new Map(items.map((i) => [i.country, safeNum(i.headcount)]))
  return countries.reduce((s, c) => s + (map.get(c) ?? 0), 0)
}

definePageMeta({ layout: false })

const route = useRoute()
const reportMonth = computed(() => (typeof route.query.reportMonth === 'string' ? route.query.reportMonth.trim() : ''))
const reportMonthKey = computed(() => (/^\d{4}-\d{2}$/.test(reportMonth.value) ? reportMonth.value : ''))

// Run independent fetches in parallel; separations depends on analytics' currentMonth so it follows.
const [
  { data: analyticsData, pending: analyticsPending },
  { data: vacanciesData, pending: vacanciesPending },
  { data: casesData, pending: casesPending },
  { data: expensesData, pending: expensesPending }
] = await Promise.all([
  useFetch<HomeAnalytics>('/api/odoo/analytics/home'),
  useFetch<Vacancy[]>('/api/vacancies'),
  useFetch<DisciplinaryCase[]>('/api/odoo/disciplinary-cases'),
  useFetch<ExpensesResponse>('/api/expenses', {
    query: computed(() => ({ month: reportMonthKey.value || undefined })),
    watch: [reportMonthKey]
  })
])

const analytics = computed(() => analyticsData.value ?? null)
const vacancies = computed(() => vacanciesData.value ?? [])
const includedCases = computed(() => (casesData.value ?? []).filter((c) => !!c.includeInReport))

const monthKey = computed(() => reportMonthKey.value || analytics.value?.additions?.currentMonth || analytics.value?.separations?.currentMonth || '')
const monthLabel = computed(() => {
  if (!monthKey.value) return '—'
  const [y, m] = monthKey.value.split('-')
  try {
    return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-TT', { month: 'long', year: 'numeric' })
  } catch { return monthKey.value }
})

const { data: separationsData, pending: separationsPending } = await useFetch<SeparationsResponse>('/api/odoo/separations', {
  query: { month: monthKey.value || undefined }
})

const additionsThisMonth = computed(() => safeNum(analytics.value?.additions?.byMonth?.[monthKey.value]?.hires ?? 0))
const separationsThisMonth = computed(() => separationsData.value?.items?.length ?? 0)
const netChange = computed(() => additionsThisMonth.value - separationsThisMonth.value)

const totalHeadcount = computed(() => (analytics.value?.headcountByCountry ?? []).reduce((a, i) => a + safeNum(i.headcount), 0))

const rampsCount = computed(() => sumBy(analytics.value?.headcountByCountry ?? [], RAMPS_COUNTRIES))
const edoCount = computed(() => sumBy(analytics.value?.headcountByCountry ?? [], EDO_COUNTRIES))
const rampsEdoLabel = computed(() => `RAMPS ${rampsCount.value} | EDO ${edoCount.value}`)

const consultantsLabel = computed(() => {
  const ic = safeNum(analytics.value?.headcountEmploymentSubtotals?.independentContractors)
  if (ic === 0) return ''
  return `Independent contractors ${ic}`
})

const topHub = computed(() => {
  const items = (analytics.value?.headcountByCountry ?? []).slice().sort((a, b) => safeNum(b.headcount) - safeNum(a.headcount))
  const top = items[0]
  if (!top || totalHeadcount.value <= 0) return null
  return { country: top.country, count: safeNum(top.headcount), pct: Math.round((safeNum(top.headcount) / totalHeadcount.value) * 100) }
})

const highestSpend = computed(() => {
  const items = (expensesData.value?.items ?? []).slice().filter((i) => i.country)
  items.sort((a, b) => safeNum(b.total) - safeNum(a.total))
  return items[0] ?? null
})
const fmtUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'code', maximumFractionDigits: 0 })

const highlights = computed(() => {
  const bullets: string[] = []
  if (topHub.value) {
    bullets.push(`Workforce is concentrated in ${topHub.value.country} (${topHub.value.count} of ${totalHeadcount.value} employees, ${topHub.value.pct}%).`)
  }
  if (monthKey.value) {
    const sign = netChange.value > 0 ? 'positive' : netChange.value < 0 ? 'negative' : 'flat'
    bullets.push(`Net workforce movement for ${monthLabel.value} is ${sign} (${netChange.value >= 0 ? '+' : ''}${netChange.value}).`)
  }
  if (highestSpend.value) {
    bullets.push(`Highest payroll/workforce cost: ${highestSpend.value.country} at ${fmtUsd.format(highestSpend.value.total)} for the reporting period.`)
  }
  if (vacancies.value.length > 0) {
    bullets.push(`${vacancies.value.length} critical ${vacancies.value.length === 1 ? 'vacancy is' : 'vacancies are'} currently tracked across all countries.`)
  }
  if (includedCases.value.length > 0) {
    bullets.push(`${includedCases.value.length} progressive discipline ${includedCases.value.length === 1 ? 'case is' : 'cases are'} included in this report — see the Progressive Discipline section.`)
  } else {
    bullets.push('No progressive discipline cases were selected for inclusion in this report.')
  }
  return bullets
})

const reportReady = computed(() =>
  !analyticsPending.value && !separationsPending.value && !vacanciesPending.value && !casesPending.value && !expensesPending.value
)
</script>
