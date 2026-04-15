<template>
  <div class="space-y-6" :data-report-ready="reportReady ? '1' : undefined">
    <div class="space-y-1">
      <h1 class="text-3xl font-semibold">Recruitment</h1>
      <p class="text-base text-slate-300">New hires and active recruitment pipeline snapshot.</p>
    </div>

    <hr class="border-slate-800" />

    <section class="space-y-4">
      <ReportKpiTile
        label="New hires (month)"
        :value="newHiresCount"
        :subtitle="monthLabel"
        :insight="newHiresInsight"
        :accent="ACCENTS.hiring"
      />

      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-slate-900">New hires</h2>
          <p class="text-sm text-slate-600">New hires recorded for the active month, grouped by country.</p>
        </div>

        <div class="mt-4 space-y-5">
          <div v-if="newHiresByCountry.size === 0" class="text-sm text-slate-700">No new hires recorded for the month.</div>

          <section
            v-for="[country, rows] in newHiresByCountryEntries"
            :key="country"
            class="rounded-md border border-slate-200 bg-white p-3"
          >
            <div class="flex items-baseline justify-between gap-3">
              <div class="text-sm font-semibold text-slate-900">{{ country }}</div>
              <div class="text-xs font-semibold tabular-nums text-slate-600">{{ rows.length }}</div>
            </div>

            <div class="mt-3 overflow-hidden rounded-md border border-slate-200">
              <table class="min-w-full text-left text-sm">
                <thead class="bg-slate-50 text-slate-700">
                  <tr>
                    <th class="px-3 py-2 font-semibold">Employee</th>
                    <th class="px-3 py-2 font-semibold">Position</th>
                    <th class="px-3 py-2 font-semibold">Start date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in rows" :key="r.employeeKey" class="border-t border-slate-200">
                    <td class="px-3 py-2 text-slate-900">{{ r.name }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ r.position || '—' }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ formatYmdDateOrDash(r.startDate) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </section>

    <section class="space-y-4">
      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-slate-900">Recruitment &amp; onboarding</h2>
          <p class="text-sm text-slate-600">Candidates in the offer and pre-onboarding stages.</p>
        </div>

        <div class="mt-4 overflow-hidden rounded-md border border-slate-200">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-700">
              <tr>
                <th class="px-3 py-2 font-semibold">Candidate</th>
                <th class="px-3 py-2 font-semibold">Position</th>
                <th class="px-3 py-2 font-semibold">Country</th>
                <th class="px-3 py-2 font-semibold">Stage</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in candidatesForDisplay" :key="c.id" class="border-t border-slate-200 align-top">
                <td class="px-3 py-2 text-slate-900">{{ c.candidateName || '—' }}</td>
                <td class="px-3 py-2 text-slate-700">{{ c.position || '—' }}</td>
                <td class="px-3 py-2 text-slate-700">{{ c.country || '—' }}</td>
                <td class="min-w-0 px-3 py-2">
                  <span :class="[tableDataBadgeClass, stageBadgeClass(c.stage)]">
                    {{ normalizeStageLabel(c.stage) || '—' }}
                  </span>
                </td>
              </tr>
              <tr v-if="candidatesForDisplay.length === 0" class="border-t border-slate-200">
                <td colspan="4" class="px-3 py-6 text-center text-slate-600">No candidates found.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="offerStageCandidates.length > candidatesForDisplay.length" class="mt-3 text-xs text-slate-500">
          Showing top {{ candidatesForDisplay.length }} candidates. See the dashboard for the full list.
        </div>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import { formatYmdDateOrDash } from '~/utils/dates'
import { tableDataBadgeClass } from '~/utils/tableBadge'
import ReportKpiTile from '~/components/ReportKpiTile.vue'

type HomeAnalytics = {
  additions: { currentMonth: string; months: string[]; byMonth: Record<string, { hires: number }> }
}

type OdooNewHire = {
  employeeKey: string
  name: string
  position: string
  department: string
  countryAssigned: string
  startDate: string | null
  tenure?: string
  createdAt: string | null
}

type OdooNewHiresResponse = {
  currentMonth: string
  months: string[]
  items: OdooNewHire[]
}

type CriticalRecruitment = {
  id: string
  candidateName: string
  position: string
  country: string
  stage: string
  notes?: string
  createdAt: string
}

const ACCENTS = {
  hiring: '#047857'
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
const monthKey = computed(() => reportMonthKey.value || analytics.value?.additions?.currentMonth || '')

const { data: newHiresData, pending: newHiresPending } = await useFetch<OdooNewHiresResponse>('/api/odoo/new-hires', {
  query: computed(() => ({ month: monthKey.value || undefined })),
  watch: [monthKey]
})

const newHires = computed(() => newHiresData.value?.items ?? [])
const newHiresCount = computed(() => safeNum(analytics.value?.additions?.byMonth?.[monthKey.value]?.hires ?? newHires.value.length))

const monthLabel = computed(() => (monthKey.value ? `Month: ${monthKey.value}` : 'Month: —'))
const newHiresInsight = computed(() => {
  if (!monthKey.value) return ''
  if (newHiresCount.value === 0) return 'No new hires recorded for the month.'
  if (newHiresCount.value === 1) return '1 new hire recorded for the month.'
  return `${newHiresCount.value} new hires recorded for the month.`
})

const newHiresByCountry = computed(() => {
  const map = new Map<string, OdooNewHire[]>()
  for (const r of newHires.value) {
    const c = (r.countryAssigned || '—').trim() || '—'
    const arr = map.get(c) ?? []
    arr.push(r)
    map.set(c, arr)
  }
  for (const [k, arr] of map.entries()) {
    arr.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '') || a.employeeKey.localeCompare(b.employeeKey))
    map.set(k, arr)
  }
  return map
})

const newHiresByCountryEntries = computed(() => {
  const entries = Array.from(newHiresByCountry.value.entries())
  entries.sort((a, b) => a[0].localeCompare(b[0]))
  return entries
})

const { data: candidatesData, pending: candidatesPending } = await useFetch<CriticalRecruitment[]>('/api/critical-recruitment')
const candidates = computed(() => candidatesData.value ?? [])

const offerStageCandidates = computed(() =>
  candidates.value.filter((c) => {
    const stage = normalizeStageLabel(c.stage).toLowerCase()
    return stage === 'offer stage' || stage === 'pre-onboarding stage'
  })
)

const REPORT_TOP_CANDIDATES = 15
const candidatesForDisplay = computed(() => offerStageCandidates.value.slice(0, REPORT_TOP_CANDIDATES))

function normalizeStageLabel(value: string) {
  const trimmed = (value || '').trim()
  if (!trimmed) return ''
  const v = trimmed.toLowerCase()
  if (v === 'pre-onboarding stage') return 'Pre-Onboarding Stage'
  if (v === 'interview & evaluation stage') return 'Interview & Evaluation Stage'
  if (v === 'offer stage') return 'Offer Stage'
  if (v === 'feedback stage') return 'Feedback Stage'
  return trimmed
}

function stageBadgeClass(value: string) {
  const v = normalizeStageLabel(value).toLowerCase()
  if (v === 'pre-onboarding stage') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (v === 'interview & evaluation stage') return 'border-sky-200 bg-sky-50 text-sky-800'
  if (v === 'offer stage') return 'border-violet-200 bg-violet-50 text-violet-800'
  if (v === 'feedback stage') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

const reportReady = ref(false)
watchEffect(async () => {
  if (analyticsPending.value || newHiresPending.value || candidatesPending.value) {
    reportReady.value = false
    return
  }
  await nextTick()
  reportReady.value = true
})
</script>

