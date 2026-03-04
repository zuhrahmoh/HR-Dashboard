<template>
  <div class="space-y-6" :data-report-ready="reportReady ? '1' : undefined">
    <div class="space-y-1">
      <h1 class="text-3xl font-semibold">Workforce overview</h1>
      <p class="text-base text-slate-300">Headcount distribution and key demographic snapshots.</p>
    </div>

    <hr class="border-slate-800" />

    <section class="space-y-4">
      <ReportKpiTile
        label="Headcount"
        :value="totalHeadcount"
        :subtitle="topHubLabel"
        insight=""
        :accent="ACCENTS.workforce"
      />

      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="mb-3 flex items-end justify-between gap-3">
          <div class="space-y-1">
            <h2 class="text-base font-semibold text-slate-900">Geographical headcount</h2>
            <p class="text-sm text-slate-600">Excludes resigned employees.</p>
          </div>
        </div>
        <div class="report-keep">
          <HeadcountBarChart :items="analytics?.headcountByCountry ?? []" :show-legend="true" />
        </div>

        <div class="mt-4 report-keep">
          <HeadcountMonthlyLineChart :items="headcountSnapshots?.items ?? []" variant="light" title="Headcount trend" />
        </div>
      </section>
    </section>

    <section class="report-page space-y-4">
      <section class="rounded-lg border border-slate-200 bg-white p-4 report-keep">
        <div class="mb-2 space-y-1">
          <h2 class="text-base font-semibold text-slate-900">Permanent vs contracted</h2>
          <p class="text-sm text-slate-600">Contracted includes interns.</p>
        </div>
        <div class="report-scale-92">
          <PermanentVsContractedPie
            :overall="analytics?.employmentTypeBreakdown?.overall ?? { permanent: 0, contracted: 0, total: 0 }"
            :by-country="analytics?.employmentTypeBreakdown?.byCountry ?? []"
            :show-filter="false"
            :compact="true"
          />
        </div>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-4 report-keep">
        <h2 class="text-base font-semibold text-slate-900">Gender breakdown</h2>
        <p class="mt-1 text-sm text-slate-600">Overall and by country.</p>
        <div class="mt-4 report-scale-92">
          <GenderBreakdownPie
            :overall="analytics?.genderBreakdown?.overall ?? { male: 0, female: 0, total: 0 }"
            :by-country="analytics?.genderBreakdown?.byCountry ?? []"
            :hide-title="true"
          />
        </div>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import ReportKpiTile from '~/components/ReportKpiTile.vue'
import HeadcountBarChart from '~/components/HeadcountBarChart.vue'
import HeadcountMonthlyLineChart from '~/components/HeadcountMonthlyLineChart.vue'
import PermanentVsContractedPie from '~/components/PermanentVsContractedPie.vue'
import GenderBreakdownPie from '~/components/GenderBreakdownPie.vue'

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
  additions: {
    currentMonth: string
    months: string[]
    byMonth: Record<string, { hires: number }>
  }
  genderBreakdown: {
    overall: { male: number; female: number; total: number }
    byCountry: Array<{ country: string; male: number; female: number; total: number }>
  }
}

const ACCENTS = {
  workforce: '#0f172a'
} as const

const route = useRoute()
const reportMonth = computed(() => (typeof route.query.reportMonth === 'string' ? route.query.reportMonth.trim() : ''))
const reportMonthKey = computed(() => (/^\d{4}-\d{2}$/.test(reportMonth.value) ? reportMonth.value : ''))

function safeNum(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

const { data: analyticsData, pending: analyticsPending } = await useFetch<HomeAnalytics>('/api/odoo/analytics/home')
const analytics = computed(() => analyticsData.value ?? null)

type HeadcountSnapshotsResponse = { items: Array<{ month: string; headcount: number }> }
const { data: headcountSnapshotsData, pending: headcountSnapshotsPending } = await useFetch<HeadcountSnapshotsResponse>(
  '/api/analytics/headcount-snapshots'
)
const headcountSnapshots = computed(() => headcountSnapshotsData.value ?? null)

const totalHeadcount = computed(() => (analytics.value?.headcountByCountry ?? []).reduce((acc, i) => acc + safeNum(i.headcount), 0))
const topHub = computed(() => {
  const items = (analytics.value?.headcountByCountry ?? []).slice().sort((a, b) => safeNum(b.headcount) - safeNum(a.headcount))
  const top = items[0]
  if (!top || totalHeadcount.value <= 0) return null
  const pct = (safeNum(top.headcount) / totalHeadcount.value) * 100
  return { country: top.country || '—', count: safeNum(top.headcount), pct }
})
const topHubLabel = computed(() =>
  topHub.value ? `Largest hub: ${topHub.value.country} (${topHub.value.count} employees, ${topHub.value.pct.toFixed(0)}%)` : 'Largest hub: —'
)

const reportReady = ref(false)
watchEffect(async () => {
  if (analyticsPending.value || headcountSnapshotsPending.value) {
    reportReady.value = false
    return
  }
  await nextTick()
  reportReady.value = true
})
</script>

