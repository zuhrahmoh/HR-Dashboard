<template>
  <div class="space-y-6" :data-report-ready="reportReady ? '1' : undefined">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="space-y-1">
        <h1 class="text-3xl font-semibold">HR Dashboard — Executive Summary</h1>
        <p class="text-base text-slate-300">
          High-level snapshot generated from the live dashboard data sources.
        </p>
      </div>
    </div>

    <hr class="border-slate-800" />

    <section class="space-y-3">
      <ReportSectionHeader title="Key metrics" subtitle="Workforce, hiring, vacancies and cases." />
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportKpiTile
          label="Headcount"
          :value="kpiHeadcount"
          :subtitle="kpiTopHub"
          :insight="insightHeadcount"
          :accent="ACCENTS.workforce"
        />
        <ReportKpiTile
          label="Additions (month)"
          :value="kpiAdditions"
          :subtitle="kpiAdditionsSubtitle"
          :insight="insightAdditions"
          :accent="ACCENTS.hiring"
        />
        <ReportKpiTile
          label="Separations (month)"
          :value="kpiSeparations"
          :subtitle="kpiSeparationsSubtitle"
          :insight="insightSeparations"
          :accent="ACCENTS.attrition"
        />
        <ReportKpiTile
          label="Critical vacancies"
          :value="kpiCriticalVacancies"
          :subtitle="kpiVacanciesSubtitle"
          :insight="insightVacancies"
          :accent="ACCENTS.recruitment"
        />
      </div>
    </section>

    <section class="space-y-3">
      <ReportSectionHeader title="At a glance" subtitle="Highest spend and case volume." />
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ReportKpiTile
          label="Highest spend (month)"
          :value="kpiHighestSpendValue"
          :subtitle="kpiHighestSpendSubtitle"
          :insight="insightSpend"
          :accent="ACCENTS.expense"
        />
        <ReportKpiTile
          label="Active disciplinary cases"
          :value="kpiDisciplineCases"
          :subtitle="kpiDisciplineSubtitle"
          :insight="insightDiscipline"
          :accent="ACCENTS.discipline"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import ReportKpiTile from '~/components/ReportKpiTile.vue'
import ReportSectionHeader from '~/components/ReportSectionHeader.vue'

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
}

type Vacancy = {
  id: string
  positionTitle: string
  department: string
  country: string
  priority: string
  createdAt: string
}

type DisciplinaryCase = {
  id: string
  status: string
  createdAt: string
  includeInReport?: boolean
}

type ExpensesResponse = {
  month: string | null
  items: Array<{ country: string; total: number }>
  source: 'sharepoint' | 'csv'
}

type SeparationsResponse = {
  items: Array<{ employeeKey: string }>
}

const route = useRoute()
const isReportMode = computed(() => route.query.report === '1')
const reportMonth = computed(() => (typeof route.query.reportMonth === 'string' ? route.query.reportMonth.trim() : ''))
const reportMonthKey = computed(() => (/^\d{4}-\d{2}$/.test(reportMonth.value) ? reportMonth.value : ''))

const { data: analyticsData, pending: analyticsPending } = await useFetch<HomeAnalytics>('/api/odoo/analytics/home')
const { data: vacanciesData, pending: vacanciesPending } = await useFetch<Vacancy[]>('/api/vacancies')
const { data: casesData, pending: casesPending } = await useFetch<DisciplinaryCase[]>('/api/odoo/disciplinary-cases')
const { data: expensesData, pending: expensesPending } = await useFetch<ExpensesResponse>('/api/expenses', {
  query: computed(() => ({ month: reportMonthKey.value || undefined })),
  watch: [reportMonthKey]
})

const analytics = computed(() => analyticsData.value ?? null)
const vacancies = computed(() => vacanciesData.value ?? [])
const cases = computed(() => casesData.value ?? [])
const expenses = computed(() => expensesData.value ?? null)

const includedCases = computed(() => cases.value.filter((c) => !!c.includeInReport))

const generatedLabel = computed(() => {
  const d = new Date()
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
})

const ACCENTS = {
  workforce: '#0f172a',
  hiring: '#047857',
  attrition: '#b91c1c',
  recruitment: '#1d4ed8',
  discipline: '#6d28d9',
  expense: '#0f766e'
} as const

function safeNum(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

const totalHeadcount = computed(() => (analytics.value?.headcountByCountry ?? []).reduce((acc, i) => acc + safeNum(i.headcount), 0))
const topHub = computed(() => {
  const items = (analytics.value?.headcountByCountry ?? []).slice().sort((a, b) => safeNum(b.headcount) - safeNum(a.headcount))
  const top = items[0]
  if (!top || totalHeadcount.value <= 0) return null
  const pct = (safeNum(top.headcount) / totalHeadcount.value) * 100
  return { country: top.country || '—', count: safeNum(top.headcount), pct }
})

const monthKey = computed(() => reportMonthKey.value || analytics.value?.additions?.currentMonth || analytics.value?.separations?.currentMonth || '')
const additionsThisMonth = computed(() => safeNum(analytics.value?.additions?.byMonth?.[monthKey.value]?.hires ?? 0))

const { data: separationsData, pending: separationsPending } = await useFetch<SeparationsResponse>('/api/odoo/separations', {
  query: computed(() => ({ month: monthKey.value || undefined })),
  watch: [monthKey]
})

const separationsThisMonth = computed(() => separationsData.value?.items?.length ?? 0)
const netChange = computed(() => additionsThisMonth.value - separationsThisMonth.value)

function normalizePriority(v: string) {
  return (v || '').trim().toLowerCase()
}

function priorityRank(v: string) {
  const p = normalizePriority(v)
  if (p === 'high') return 0
  if (p === 'medium') return 1
  if (p === 'low') return 2
  return 3
}

const topPriorityRoles = computed(() => {
  const sorted = vacancies.value
    .slice()
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const roles: string[] = []
  for (const v of sorted) {
    const title = (v.positionTitle || '').trim()
    if (!title) continue
    if (!roles.includes(title)) roles.push(title)
    if (roles.length >= 3) break
  }
  return roles
})

const mostCommonDisciplineStatus = computed(() => {
  const counts = new Map<string, number>()
  for (const c of includedCases.value) {
    const s = (c.status || '').trim()
    if (!s) continue
    counts.set(s, (counts.get(s) ?? 0) + 1)
  }
  let best: { status: string; count: number } | null = null
  for (const [status, count] of counts.entries()) {
    if (!best || count > best.count) best = { status, count }
  }
  return best
})

const highestSpend = computed(() => {
  const items = (expenses.value?.items ?? []).slice().filter((i) => (i.country || '').trim())
  items.sort((a, b) => safeNum(b.total) - safeNum(a.total))
  const top = items[0]
  if (!top) return null
  return { country: top.country, total: safeNum(top.total), month: expenses.value?.month ?? null }
})

const fmtUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'code', maximumFractionDigits: 0 })

const kpiHeadcount = computed(() => totalHeadcount.value || '—')
const kpiTopHub = computed(() => (topHub.value ? `Largest hub: ${topHub.value.country} (${topHub.value.count}, ${topHub.value.pct.toFixed(0)}%)` : 'Largest hub: —'))

const kpiAdditions = computed(() => additionsThisMonth.value)
const kpiAdditionsSubtitle = computed(() => (monthKey.value ? `Month: ${monthKey.value}` : 'Month: —'))
const kpiSeparations = computed(() => separationsThisMonth.value)
const kpiSeparationsSubtitle = computed(() => (monthKey.value ? `Month: ${monthKey.value}` : 'Month: —'))

const kpiCriticalVacancies = computed(() => vacancies.value.length)
const kpiVacanciesSubtitle = computed(() => (topPriorityRoles.value.length ? `Top roles: ${topPriorityRoles.value.join(', ')}` : 'Top roles: —'))

const kpiDisciplineCases = computed(() => includedCases.value.length)
const kpiDisciplineSubtitle = computed(() => (mostCommonDisciplineStatus.value ? `Most common stage: ${mostCommonDisciplineStatus.value.status}` : 'Most common stage: —'))

const kpiHighestSpendValue = computed(() => (highestSpend.value ? fmtUsd.format(highestSpend.value.total) : '—'))
const kpiHighestSpendSubtitle = computed(() =>
  highestSpend.value ? `Country: ${highestSpend.value.country}${highestSpend.value.month ? ` · ${highestSpend.value.month}` : ''}` : 'Country: —'
)

const insightHeadcount = computed(() => {
  if (!monthKey.value) return ''
  if (netChange.value > 0) return `Workforce grew by ${netChange.value} net this month.`
  if (netChange.value < 0) return `Workforce declined by ${Math.abs(netChange.value)} net this month.`
  return 'Workforce remained flat net this month.'
})

const insightAdditions = computed(() => {
  if (!monthKey.value) return ''
  if (additionsThisMonth.value === 0) return 'No new hires recorded for the month.'
  if (additionsThisMonth.value === 1) return '1 new hire recorded for the month.'
  return `${additionsThisMonth.value} new hires recorded for the month.`
})

const insightSeparations = computed(() => {
  if (!monthKey.value) return ''
  if (separationsThisMonth.value === 0) return 'No separations recorded for the month.'
  if (separationsThisMonth.value === 1) return '1 separation recorded for the month.'
  return `${separationsThisMonth.value} separations recorded for the month.`
})

const insightVacancies = computed(() => {
  const n = vacancies.value.length
  if (n === 0) return 'No critical vacancies currently tracked.'
  if (n === 1) return '1 critical vacancy currently tracked.'
  return `${n} critical vacancies currently tracked.`
})

const insightSpend = computed(() => (highestSpend.value ? `Highest spend country this month: ${highestSpend.value.country}.` : ''))
const insightDiscipline = computed(() => {
  const n = includedCases.value.length
  if (n === 0) return 'No active disciplinary cases.'
  if (n === 1) return '1 active disciplinary case.'
  return `${n} active disciplinary cases.`
})

const reportReady = ref(false)
watchEffect(async () => {
  if (!isReportMode.value) {
    reportReady.value = true
    return
  }
  const ready =
    !analyticsPending.value &&
    !separationsPending.value &&
    !vacanciesPending.value &&
    !casesPending.value &&
    !expensesPending.value &&
    !!analytics.value &&
    Array.isArray(vacancies.value) &&
    Array.isArray(cases.value)

  if (!ready) {
    reportReady.value = false
    return
  }

  await nextTick()
  reportReady.value = true
})
</script>

