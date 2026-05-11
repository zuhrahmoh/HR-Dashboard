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

      <div class="flex flex-wrap items-center gap-2">
        <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
          <span class="whitespace-nowrap">Country</span>
          <select
            v-model="filters.country"
            class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          >
            <option value="">All</option>
            <option v-for="c in countryFilterOptions" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>

        <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
          <span class="whitespace-nowrap">Status</span>
          <select
            v-model="filters.status"
            class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          >
            <option value="">All</option>
            <option v-for="s in statusFilterOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="h-8 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 hover:bg-slate-100"
          @click="clearFilters"
        >
          Clear
        </button>

        <button
          v-if="completedCaseRows.length > 0"
          type="button"
          class="ml-auto inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800 hover:bg-teal-100"
          @click="completedHistoryOpen = true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-4 w-4 shrink-0"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 4v5h5" />
            <path d="M12 7v5l3 2" />
          </svg>
          <span>Completed Cases ({{ completedCaseRows.length }})</span>
        </button>
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
                <th class="px-4 py-3 text-center font-medium">Mark Completed</th>
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
                <td class="px-4 py-3 text-center">
                  <input
                    :id="`mark-completed-dc-${c.id}`"
                    type="checkbox"
                    class="h-4 w-4 cursor-pointer accent-teal-600"
                    :checked="false"
                    :aria-label="`Mark ${c.employeeName} case as completed`"
                    @change="(event) => void markCompleted(c, (event.target as HTMLInputElement).checked)"
                  />
                </td>
              </tr>

              <tr v-if="cases.length === 0" class="border-t border-hr-navy/25">
                <td colspan="7" class="px-4 py-6 text-center text-slate-600">No cases yet.</td>
              </tr>
              <tr v-else-if="casesForDisplay.length === 0" class="border-t border-hr-navy/25">
                <td colspan="7" class="px-4 py-6 text-center text-slate-600">No cases match the filters.</td>
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

    <Teleport to="body">
      <div
        v-if="completedHistoryOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="completed-discipline-dialog-title"
      >
        <button
          type="button"
          class="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]"
          aria-label="Dismiss"
          @click="completedHistoryOpen = false"
        />
        <div
          class="relative z-10 flex max-h-[92vh] w-full max-w-[95vw] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card"
          @click.stop
        >
          <div class="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div class="min-w-0">
              <h2 id="completed-discipline-dialog-title" class="text-base font-semibold text-slate-900">Completed Discipline Cases</h2>
              <p class="mt-0.5 text-xs text-slate-500">Cases marked as completed on the dashboard. Snapshot taken at the time of completion.</p>
            </div>
            <button
              type="button"
              class="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
              @click="completedHistoryOpen = false"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5" aria-hidden="true">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.21 4.21a.75.75 0 0 1 1.06 0L10 8.94l4.73-4.73a.75.75 0 1 1 1.06 1.06L11.06 10l4.73 4.73a.75.75 0 1 1-1.06 1.06L10 11.06l-4.73 4.73a.75.75 0 1 1-1.06-1.06L8.94 10 4.21 5.27a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </div>

          <div class="min-w-0 overflow-auto px-5 py-4">
            <div v-if="completedCaseRows.length === 0" class="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-800">
              No completed cases yet.
            </div>
            <div v-else class="rounded-md border border-slate-200 bg-white">
              <table class="w-full table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col style="width: 14%" />
                  <col style="width: 10%" />
                  <col style="width: 22%" />
                  <col style="width: 14%" />
                  <col style="width: 10%" />
                  <col style="width: 30%" />
                </colgroup>
                <thead class="bg-slate-100 text-slate-600">
                  <tr>
                    <th class="px-3 py-3 align-bottom font-medium">Employee</th>
                    <th class="px-3 py-3 align-bottom font-medium">Country</th>
                    <th class="px-3 py-3 align-bottom font-medium">Summary</th>
                    <th class="px-3 py-3 align-bottom font-medium">Status</th>
                    <th class="px-3 py-3 align-bottom font-medium">Created Date</th>
                    <th class="px-3 py-3 align-bottom font-medium">Audit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="entry in completedCaseRows" :key="entry.odooLineId" class="border-t border-hr-navy/25 align-top">
                    <td class="min-w-0 break-words px-3 py-3 align-top font-medium text-slate-900">{{ entry.snapshot.employeeName }}</td>
                    <td class="min-w-0 px-3 py-3 align-top text-slate-800">{{ entry.snapshot.country || '—' }}</td>
                    <td class="min-w-0 break-words px-3 py-3 align-top text-slate-800">{{ entry.snapshot.summary }}</td>
                    <td class="min-w-0 px-3 py-3 align-top">
                      <span :class="[tableDataBadgeClass, statusBadgeClass(entry.snapshot.status)]">
                        {{ entry.snapshot.status }}
                      </span>
                    </td>
                    <td class="min-w-0 whitespace-nowrap px-3 py-3 align-top tabular-nums text-slate-800">{{ formatDate(entry.snapshot.createdAt) }}</td>
                    <td class="min-w-0 px-3 py-3 align-top">
                      <CompletedAuditCell
                        :created-at="entry.snapshot.createdAt"
                        :last-modified-at="entry.snapshot.lastModifiedAt"
                        :last-modified-by="entry.snapshot.lastModifiedBy"
                        :completed-at="entry.completedAt"
                        @reopen="void reopenCompleted(entry.odooLineId)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
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
  lastModifiedAt: string
  lastModifiedBy: string
}

type DisciplinaryCaseSnapshot = {
  employeeName: string
  country?: string
  summary: string
  status: string
  createdAt: string
  lastModifiedAt: string
  lastModifiedBy: string
}

type DisciplinaryCaseCompletion = {
  completedAt: string
  snapshot: DisciplinaryCaseSnapshot
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

const filters = reactive({
  country: '',
  status: ''
})

const hasActiveFilters = computed(() => Object.values(filters).some((v) => (v ?? '').trim() !== ''))

function clearFilters() {
  filters.country = ''
  filters.status = ''
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

const countryFilterOptions = computed(() => uniqueSorted(cases.value.map((c) => c.country || '')))

const statusFilterOptions = computed(() => uniqueSorted(cases.value.map((c) => c.status)))

const { data: completionsPayload, refresh: refreshCompletions } = useFetch<{
  completions: Record<string, DisciplinaryCaseCompletion>
}>('/api/disciplinary-case-reviews')

const completionsByLineId = ref<Record<string, DisciplinaryCaseCompletion>>({})

watch(
  completionsPayload,
  (p) => {
    completionsByLineId.value = p?.completions ?? {}
  },
  { immediate: true }
)

const completedHistoryOpen = ref(false)

function buildSnapshot(c: DisciplinaryCase): DisciplinaryCaseSnapshot {
  return {
    employeeName: c.employeeName,
    country: c.country,
    summary: c.summary,
    status: c.status,
    createdAt: c.createdAt,
    lastModifiedAt: c.lastModifiedAt,
    lastModifiedBy: c.lastModifiedBy
  }
}

async function markCompleted(c: DisciplinaryCase, completed: boolean) {
  const prev = { ...completionsByLineId.value }
  const next = { ...completionsByLineId.value }
  if (completed) {
    next[c.id] = { completedAt: new Date().toISOString(), snapshot: buildSnapshot(c) }
  } else {
    delete next[c.id]
  }
  completionsByLineId.value = next
  try {
    await $fetch('/api/disciplinary-case-reviews', {
      method: 'PUT',
      body: completed
        ? { odooLineId: c.id, completed: true, snapshot: buildSnapshot(c) }
        : { odooLineId: c.id, completed: false }
    })
    await refreshCompletions()
  } catch (err) {
    completionsByLineId.value = prev
    throw err
  }
}

async function reopenCompleted(odooLineId: string) {
  const prev = { ...completionsByLineId.value }
  const next = { ...completionsByLineId.value }
  delete next[odooLineId]
  completionsByLineId.value = next
  try {
    await $fetch('/api/disciplinary-case-reviews', {
      method: 'PUT',
      body: { odooLineId, completed: false }
    })
    await refreshCompletions()
  } catch (err) {
    completionsByLineId.value = prev
    throw err
  }
}

const completedCaseRows = computed(() => {
  return Object.entries(completionsByLineId.value)
    .map(([odooLineId, entry]) => ({ odooLineId, ...entry }))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
})

const casesFiltered = computed(() => {
  const country = filters.country.trim()
  const status = filters.status.trim()
  const completions = completionsByLineId.value
  return casesSorted.value.filter((c) => {
    if (completions[c.id]) return false
    if (country && (c.country || '') !== country) return false
    if (status && c.status !== status) return false
    return true
  })
})

const casesForDisplay = computed(() => (isReportMode.value ? casesFiltered.value.slice(0, REPORT_TOP_CASES) : casesFiltered.value))

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
