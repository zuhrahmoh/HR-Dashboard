<template>
  <div class="space-y-6" :data-report-ready="reportReady ? '1' : undefined">
    <div class="space-y-1">
      <h1 class="text-3xl font-semibold">Disciplinary</h1>
      <p class="text-base text-slate-300">Active disciplinary cases snapshot.</p>
    </div>

    <hr class="border-slate-800" />

    <section class="space-y-4">
      <ReportKpiTile
        label="Active disciplinary cases"
        :value="includedCases.length"
        :subtitle="mostCommonStageLabel"
        :insight="casesInsight"
        :accent="ACCENTS.discipline"
      />

      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-slate-900">Cases</h2>
          <p class="text-sm text-slate-600">Table view (created date omitted in report).</p>
        </div>

        <div class="mt-4 overflow-hidden rounded-md border border-slate-200">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-700">
              <tr>
                <th class="px-3 py-2 font-semibold">Employee</th>
                <th class="px-3 py-2 font-semibold">Country</th>
                <th class="px-3 py-2 font-semibold">Summary</th>
                <th class="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in casesForDisplay" :key="c.id" class="border-t border-slate-200 align-top">
                <td class="px-3 py-2 text-slate-900">{{ c.employeeName || '—' }}</td>
                <td class="px-3 py-2 text-slate-700">{{ c.country || '—' }}</td>
                <td class="px-3 py-2 text-slate-700">{{ c.summary || '—' }}</td>
                <td class="min-w-0 px-3 py-2">
                  <span :class="[tableDataBadgeClass, statusBadgeClass(c.status)]">
                    {{ c.status || '—' }}
                  </span>
                </td>
              </tr>
              <tr v-if="casesForDisplay.length === 0" class="border-t border-slate-200">
                <td colspan="4" class="px-3 py-6 text-center text-slate-600">No cases yet.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="includedCases.length > casesForDisplay.length" class="mt-3 text-xs text-slate-500">
          Showing top {{ casesForDisplay.length }} cases. See the dashboard for the full list.
        </div>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import ReportKpiTile from '~/components/ReportKpiTile.vue'
import { tableDataBadgeClass } from '~/utils/tableBadge'

type DisciplinaryCase = {
  id: string
  employeeName: string
  department?: string
  caseType?: string
  country?: string
  summary: string
  status: string
  includeInReport: boolean
  createdAt: string
}

const ACCENTS = {
  discipline: '#6d28d9'
} as const

const { data, pending } = await useFetch<DisciplinaryCase[]>('/api/odoo/disciplinary-cases')
const cases = computed(() => data.value ?? [])

const includedCases = computed(() => cases.value.filter((c) => !!c.includeInReport))

const REPORT_TOP_CASES = 20

function normalizeCountry(value: string) {
  const v = (value || '').trim().toLowerCase()
  if (!v) return ''
  if (v === 'trinidad and tobago' || v === 'trinidad & tobago' || v === 'trinidad') return 'trinidad and tobago'
  if (v === 'guyana' || v === 'guy') return 'guyana'
  return v
}

function countryRank(value: string) {
  const v = normalizeCountry(value)
  if (v === 'trinidad and tobago') return 0
  if (v === 'guyana') return 1
  return 2
}

function compareDisciplineCountries(a: string | undefined, b: string | undefined) {
  const ar = countryRank(a ?? '')
  const br = countryRank(b ?? '')
  if (ar !== br) return ar - br
  const an = (a || '—').trim() || '—'
  const bn = (b || '—').trim() || '—'
  return an.localeCompare(bn)
}

const includedCasesSorted = computed(() =>
  includedCases.value
    .slice()
    .sort((a, b) => compareDisciplineCountries(a.country, b.country) || b.createdAt.localeCompare(a.createdAt) || a.employeeName.localeCompare(b.employeeName))
)

const casesForDisplay = computed(() => includedCasesSorted.value.slice(0, REPORT_TOP_CASES))

function normalizeStatus(value: string) {
  return (value || '').trim().toLowerCase()
}

function statusBadgeClass(value: string) {
  const v = normalizeStatus(value)
  if (v === 'investigation') return 'border-sky-200 bg-sky-50 text-sky-800'
  if (v === 'disciplinary meeting') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (v === 'finalize outcome') return 'border-violet-200 bg-violet-50 text-violet-800'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

const mostCommonStage = computed(() => {
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
  return best?.status ?? ''
})

const mostCommonStageLabel = computed(() => (mostCommonStage.value ? `Most common stage: ${mostCommonStage.value}` : 'Most common stage: —'))
const casesInsight = computed(() => {
  const n = includedCases.value.length
  if (n === 0) return 'No active disciplinary cases.'
  if (n === 1) return '1 active disciplinary case.'
  return `${n} active disciplinary cases.`
})

const reportReady = ref(false)
watchEffect(async () => {
  if (pending.value) {
    reportReady.value = false
    return
  }
  await nextTick()
  reportReady.value = true
})
</script>

