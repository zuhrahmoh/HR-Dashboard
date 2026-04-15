<template>
  <div class="space-y-6" :data-report-ready="reportReady ? '1' : undefined">
    <div class="space-y-1">
      <h1 class="text-3xl font-semibold">Critical vacancies</h1>
      <p class="text-base text-slate-300">Current critical vacancies snapshot and distribution by country.</p>
    </div>

    <hr class="border-slate-800" />

    <section class="space-y-4">
      <ReportKpiTile
        label="Critical vacancies"
        :value="highPriorityVacancies.length"
        :subtitle="topRolesLabel"
        :insight="vacanciesInsight"
        :accent="ACCENTS.recruitment"
      />

      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-slate-900">Vacancies by country</h2>
          <p class="text-sm text-slate-600">Count of vacancies per country.</p>
        </div>

        <div class="mt-4 space-y-2">
          <div v-if="vacancyCounts.length === 0" class="text-sm text-slate-700">No vacancy data.</div>

          <div v-for="row in vacancyCounts" :key="row.country" class="grid grid-cols-[6rem_1fr_auto] items-center gap-3">
            <div class="truncate text-xs font-semibold text-slate-700" :title="row.country">{{ row.country }}</div>
            <div class="h-3 w-full overflow-hidden rounded bg-slate-100 ring-1 ring-inset ring-slate-200">
              <div
                class="h-full rounded bg-rose-400"
                :style="{
                  width: row.widthPct,
                  minWidth: row.count > 0 ? '3px' : undefined
                }"
              />
            </div>
            <div class="text-xs font-semibold tabular-nums text-slate-700">{{ row.count }}</div>
          </div>
        </div>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-slate-900">Critical Vacancy listing</h2>
        </div>

        <div class="mt-4 space-y-2">
          <div v-if="highPriorityVacancies.length === 0" class="text-sm text-slate-700">No high priority vacancies.</div>

          <div
            v-for="v in highPriorityVacanciesForDisplay"
            :key="v.id"
            class="rounded-md border border-slate-200 bg-white px-3 py-2"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate text-sm font-semibold text-slate-900">{{ v.positionTitle || '—' }}</div>
                <div class="mt-0.5 text-xs text-slate-600">{{ (v.department || '—') + ' · ' + (v.country || '—') }}</div>
              </div>
              <div class="shrink-0">
                <span :class="[tableDataBadgeClass, 'border-red-900/60 bg-red-950/30 text-red-200']">
                  High
                </span>
              </div>
            </div>
          </div>

          <div v-if="highPriorityVacancies.length > highPriorityVacanciesForDisplay.length" class="mt-2 text-xs text-slate-500">
            Showing top {{ highPriorityVacanciesForDisplay.length }} vacancies. See the dashboard for the full list.
          </div>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import ReportKpiTile from '~/components/ReportKpiTile.vue'
import { tableDataBadgeClass } from '~/utils/tableBadge'

type Vacancy = {
  id: string
  positionTitle: string
  department: string
  country: string
  priority: string
  createdAt: string
}

const ACCENTS = {
  recruitment: '#1d4ed8'
} as const

const { data: vacanciesData, pending: vacanciesPending } = await useFetch<Vacancy[]>('/api/vacancies')
const vacancies = computed(() => vacanciesData.value ?? [])
const highPriorityVacancies = computed(() => vacancies.value.filter((v) => normalizePriority(v.priority) === 'high'))

function normalizePriority(value: string) {
  return (value || '').trim().toLowerCase()
}
function formatPriority(value: string) {
  const v = normalizePriority(value)
  if (v === 'high') return 'High'
  if (v === 'medium') return 'Medium'
  if (v === 'low') return 'Low'
  return (value || '').trim() || '—'
}
function priorityBadgeClass(value: string) {
  const v = normalizePriority(value)
  if (v === 'high') return 'border-red-200 bg-red-50 text-red-800'
  if (v === 'medium') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (v === 'low') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

const REPORT_TOP_VACANCIES = 12
const highPriorityVacanciesForDisplay = computed(() => highPriorityVacancies.value.slice(0, REPORT_TOP_VACANCIES))

function priorityRank(p: string) {
  const v = normalizePriority(p)
  if (v === 'high') return 0
  if (v === 'medium') return 1
  if (v === 'low') return 2
  return 3
}

const topRoles = computed(() => {
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

const topRolesLabel = computed(() => (topRoles.value.length ? `Top roles: ${topRoles.value.join(', ')}` : 'Top roles: —'))
const vacanciesInsight = computed(() => {
  const total = vacancies.value.length
  const high = highPriorityVacancies.value.length
  const other = Math.max(0, total - high)
  if (total === 0) return 'No vacancies currently tracked.'
  if (total === 1) return `Total vacancies tracked: 1 (High priority: ${high}, other priorities: ${other}).`
  return `Total vacancies tracked: ${total} (High priority: ${high}, other priorities: ${other}).`
})

const vacancyCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const v of vacancies.value) {
    const c = (v.country || '—').trim() || '—'
    counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  const rows = Array.from(counts.entries()).map(([country, count]) => ({ country, count }))
  rows.sort((a, b) => b.count - a.count || a.country.localeCompare(b.country))
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0)
  return rows.map((r) => ({ ...r, widthPct: max > 0 ? `${Math.max(0, Math.min(100, (r.count / max) * 100))}%` : '0%' }))
})

const reportReady = ref(false)
watchEffect(async () => {
  if (vacanciesPending.value) {
    reportReady.value = false
    return
  }
  await nextTick()
  reportReady.value = true
})
</script>

