<template>
  <div class="space-y-6" :data-report-ready="reportReady ? '1' : undefined">
    <div class="space-y-1">
      <h1 class="text-gradient-brand text-3xl font-extrabold tracking-tight">Progressive Discipline</h1>
      <p class="text-slate-600">
        Case rows from Odoo (employee profile → HR Settings). The Include in Report column is stored in the dashboard database for summaries only, not in Odoo.
      </p>
    </div>

    <div class="surface-tint-card rounded-md p-3 text-xs text-slate-800">
      <div class="flex items-center gap-2 font-semibold text-brand-blue">
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 text-brand-blue">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M10 18a8 8 0 1 0 0-16a8 8 0 0 0 0 16Zm0-13.25a1 1 0 0 1 1 1V12a1 1 0 1 1-2 0V5.75a1 1 0 0 1 1-1Zm0 11.75a1.25 1.25 0 1 0 0-2.5a1.25 1.25 0 0 0 0 2.5Z"
          />
        </svg>
        <span>Progressive Discipline</span>
      </div>
      <div class="mt-2 space-y-1 text-slate-800/90">
        <div>
          1. Investigation of matter - Receive and acknowledge matter from complainant, (b) information gathering and investigation, (c) discuss and decide if to dismiss or file charge against employee and set hearing.
        </div>
        <div>
          2. Meet with employee/ recommendation - Conduct disciplinary meeting/ formal hearing, present a report to Executive Management inclusive of finding and recommendations (with required supports) on the matter.
        </div>
        <div>
          3. Finalize outcome of matter – Guilty: apply sentencing (fille note, warning with/without PIP, suspension with/without pay, termination or termination with legal action) or Innocent: dismiss charges.
        </div>
      </div>
    </div>

    <section class="surface-tint-hero space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
      <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div class="flex min-w-0 items-start gap-3">
          <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
          <h2 class="text-gradient-brand text-xl font-bold tracking-tight">Cases</h2>
        </div>
        <div class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue">
          <span class="uppercase tracking-wide opacity-80">Count</span>
          <span class="tabular-nums">{{ casesForDisplay.length }}</span>
        </div>
      </div>

      <div v-if="pending && cases.length === 0" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">Loading…</div>
      <div v-else-if="error && cases.length === 0" class="rounded-md border border-pink-200 bg-pink-50 p-4 text-pink-800">
        Failed to load cases.
        <div v-if="errorMessage" class="mt-2 text-xs text-pink-700/80">{{ errorMessage }}</div>
      </div>
      <div v-else class="overflow-hidden rounded-md border border-slate-200 bg-white shadow-card">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-100 text-slate-600">
              <tr>
                <th class="px-4 py-3 font-medium">Employee</th>
                <th class="px-4 py-3 font-medium">Country</th>
                <th class="px-4 py-3 font-medium">Summary</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Created Date</th>
                <th class="px-4 py-3 font-medium">Include in Report</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in casesForDisplay" :key="c.id" class="border-t border-hr-navy/25 align-top">
                <td class="px-4 py-3 text-slate-900">{{ c.employeeName }}</td>
                <td class="px-4 py-3 text-slate-800">{{ c.country || '—' }}</td>
                <td class="px-4 py-3 text-slate-800">{{ c.summary }}</td>
                <td class="min-w-0 px-4 py-3">
                  <span :class="[tableDataBadgeClass, statusBadgeClass(c.status)]">
                    {{ c.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-800">{{ formatDate(c.createdAt) }}</td>
                <td class="px-4 py-3">
                  <label class="inline-flex items-center gap-2 text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      class="relative h-5 w-5 appearance-none rounded border border-slate-600 bg-transparent align-middle checked:border-hr-navy checked:bg-hr-navy focus:outline-none focus:ring-2 focus:ring-slate-500/40 focus:ring-offset-0 disabled:opacity-60 checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:h-2.5 checked:after:w-1.5 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 checked:after:rotate-45 checked:after:border-b-2 checked:after:border-r-2 checked:after:border-white checked:after:content-['']"
                      :checked="!!c.includeInReport"
                      :disabled="!!includeSaving[c.id]"
                      @change="onIncludeChange(c, $event)"
                    />
                    <span class="text-slate-600">Include</span>
                  </label>
                </td>
              </tr>

              <tr v-if="cases.length === 0" class="border-t border-hr-navy/25">
                <td colspan="6" class="px-4 py-6 text-center text-slate-600">No cases yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-if="isReportMode && cases.length > casesForDisplay.length" class="mt-3 text-xs text-slate-400">
        Showing top {{ casesForDisplay.length }} cases. See the dashboard for the full list.
      </div>

      <div v-if="!pending && !error && actionError" class="text-xs text-pink-700">{{ actionError }}</div>
    </section>
  </div>
</template>

<script setup lang="ts">
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

const route = useRoute()
const isReportMode = computed(() => route.query.report === '1')

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

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString()
}

const {
  data,
  pending,
  error,
  refresh: refreshCases
} = useFetch<DisciplinaryCase[]>('/api/odoo/disciplinary-cases')

const cases = computed(() => data.value ?? [])
const errorMessage = computed(() => getErrorMessage(error.value))

const REPORT_TOP_CASES = 15

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

const casesSorted = computed(() =>
  cases.value
    .slice()
    .sort((a, b) => compareDisciplineCountries(a.country, b.country) || b.createdAt.localeCompare(a.createdAt) || a.employeeName.localeCompare(b.employeeName))
)

const casesForDisplay = computed(() => (isReportMode.value ? casesSorted.value.slice(0, REPORT_TOP_CASES) : casesSorted.value))

const actionError = ref('')

const includeSaving = ref<Record<string, boolean>>({})

async function setIncludeInReport(id: string, next: boolean) {
  actionError.value = ''
  includeSaving.value = { ...includeSaving.value, [id]: true }
  try {
    await $fetch(`/api/odoo/disciplinary-cases/${encodeURIComponent(id)}`, { method: 'PUT', body: { includeInReport: next } })
    await refreshCases()
  } catch (err) {
    actionError.value = getErrorMessage(err)
  } finally {
    const { [id]: _ignored, ...rest } = includeSaving.value
    includeSaving.value = rest
  }
}

function onIncludeChange(c: DisciplinaryCase, ev: Event) {
  const el = ev.target as HTMLInputElement | null
  void setIncludeInReport(c.id, !!el?.checked)
}

function normalizeStatus(value: string) {
  return value.trim().toLowerCase()
}

function statusBadgeClass(value: string) {
  const v = normalizeStatus(value)
  if (v === 'investigation') return 'border-blue-200 bg-blue-50 text-blue-900'
  if (v === 'disciplinary meeting') return 'border-pink-200 bg-pink-50 text-pink-800'
  if (v === 'conciliation') return 'border-teal-200 bg-teal-50 text-teal-800'
  if (v === 'outcome to be communicated') return 'border-purple-200 bg-purple-50 text-purple-800'
  if (v === 'finalize outcome') return 'border-purple-200 bg-purple-50 text-brand-purple'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

const reportReady = ref(false)
watchEffect(async () => {
  if (!isReportMode.value) {
    reportReady.value = true
    return
  }

  if (pending.value) {
    reportReady.value = false
    return
  }

  await nextTick()
  reportReady.value = true
})
</script>
