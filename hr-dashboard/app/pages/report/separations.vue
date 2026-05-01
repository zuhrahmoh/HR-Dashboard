<template>
  <div class="space-y-6" :data-report-ready="reportReady ? '1' : undefined">
    <div class="space-y-1">
      <h1 class="text-3xl font-semibold">Separations</h1>
      <p class="text-base text-slate-600">Employees who left during the active month, grouped by country.</p>
    </div>

    <hr />

    <section class="space-y-4">
      <ReportKpiTile
        label="Separations (month)"
        :value="separationsCount"
        :subtitle="monthLabel"
        :insight="separationsInsight"
        :accent="ACCENTS.attrition"
      />

      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="flex items-end justify-between gap-3">
          <div class="space-y-1">
            <h2 class="text-base font-semibold text-hr-navy">Separated employees</h2>
            <p class="text-sm text-slate-600">Ordered by country; includes separation type.</p>
          </div>
        </div>

        <div class="mt-4 space-y-5">
          <div v-if="itemsByCountry.size === 0" class="text-sm text-slate-700">No separations recorded for the month.</div>

          <section v-for="[country, rows] in itemsByCountryEntries" :key="country" class="rounded-md border border-slate-200 bg-white p-3">
            <div class="flex items-baseline justify-between gap-3">
              <div class="text-sm font-semibold text-hr-navy">{{ country }}</div>
              <div class="text-xs font-semibold tabular-nums text-slate-600">{{ rows.length }}</div>
            </div>

            <div class="mt-3 overflow-hidden rounded-md border border-slate-200">
              <table class="min-w-full text-left text-sm">
                <thead class="bg-slate-50 text-slate-700">
                  <tr>
                    <th class="px-3 py-2 font-semibold">Employee</th>
                    <th class="px-3 py-2 font-semibold">Position</th>
                    <th class="px-3 py-2 font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in rows" :key="r.employeeKey" class="border-t border-hr-navy/25">
                    <td class="px-3 py-2 text-slate-900">{{ r.name }}</td>
                    <td class="px-3 py-2 text-slate-700">{{ r.position || '—' }}</td>
                    <td class="min-w-0 px-3 py-2">
                      <span :class="[tableDataBadgeClass, typeBadgeClass(r.separationType)]">
                        {{ formatType(r.separationType) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import ReportKpiTile from '~/components/ReportKpiTile.vue'
import { tableDataBadgeClass } from '~/utils/tableBadge'

type SeparationType =
  | 'resigned'
  | 'retired'
  | 'fired'
  | 'vsep'
  | 'end_of_contract'
  | 'probation_failure'
  | 'retrenchment'
  | 'separated'

type HomeAnalytics = {
  separations: {
    currentMonth: string
    months: string[]
    byMonth: Record<string, Record<SeparationType, number> & { headcountAfter: number }>
  }
}

type SeparationRow = {
  employeeKey: string
  name: string
  position: string
  countryAssigned: string
  separationType: SeparationType
}

type SeparationsResponse = {
  currentMonth: string
  months: string[]
  items: SeparationRow[]
}

const ACCENTS = {
  attrition: '#ec4899'
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
const monthKey = computed(() => reportMonthKey.value || analytics.value?.separations?.currentMonth || '')

const { data: separationsData, pending: separationsPending } = await useFetch<SeparationsResponse>('/api/odoo/separations', {
  query: computed(() => ({ month: monthKey.value || undefined })),
  watch: [monthKey]
})

const separationsCount = computed(() => {
  return separationsData.value?.items?.length ?? 0
})

const monthLabel = computed(() => (monthKey.value ? `Month: ${monthKey.value}` : 'Month: —'))
const separationsInsight = computed(() => {
  if (!monthKey.value) return ''
  if (separationsCount.value === 0) return 'No separations recorded for the month.'
  if (separationsCount.value === 1) return '1 separation recorded for the month.'
  return `${separationsCount.value} separations recorded for the month.`
})

const TYPE_LABELS: Record<SeparationType, string> = {
  resigned: 'Resigned',
  retired: 'Retired',
  fired: 'Fired',
  vsep: 'VSEP',
  end_of_contract: 'End of Contract',
  probation_failure: 'Probation Failure',
  retrenchment: 'Retrenchment',
  separated: 'Separated'
}

const TYPE_BADGE_CLASSES: Record<SeparationType, string> = {
  resigned: 'border-teal-200 bg-teal-50 text-teal-800',
  retired: 'border-purple-200 bg-purple-50 text-purple-800',
  fired: 'border-pink-200 bg-pink-50 text-pink-800',
  vsep: 'border-blue-200 bg-blue-50 text-blue-800',
  end_of_contract: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  probation_failure: 'border-rose-200 bg-rose-50 text-rose-800',
  retrenchment: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800',
  separated: 'border-slate-200 bg-slate-50 text-slate-700'
}

function formatType(v: SeparationType) {
  return TYPE_LABELS[v] ?? 'Separated'
}

function typeBadgeClass(v: SeparationType) {
  return TYPE_BADGE_CLASSES[v] ?? TYPE_BADGE_CLASSES.separated
}

const itemsByCountry = computed(() => {
  const map = new Map<string, SeparationRow[]>()
  for (const r of separationsData.value?.items ?? []) {
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

const itemsByCountryEntries = computed(() => {
  const entries = Array.from(itemsByCountry.value.entries())
  entries.sort((a, b) => a[0].localeCompare(b[0]))
  return entries
})

const reportReady = ref(false)
watchEffect(async () => {
  if (analyticsPending.value || separationsPending.value) {
    reportReady.value = false
    return
  }
  await nextTick()
  reportReady.value = true
})
</script>

