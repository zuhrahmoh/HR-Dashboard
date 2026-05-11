<template>
  <section id="medical-enrollments" class="surface-tint-hero scroll-mt-32 min-w-0 space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
    <div class="flex min-w-0 flex-wrap items-start justify-between gap-4">
      <div class="flex min-w-0 items-start gap-3">
        <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
        <div class="min-w-0 space-y-0.5">
          <h2 class="text-gradient-brand text-xl font-bold tracking-tight">Medical Enrollments</h2>
          <p class="text-xs text-slate-500">Read-only: sourced from Odoo (employee profile → Medical Information).</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue">
          <span class="uppercase tracking-wide opacity-80">Count</span>
          <span class="tabular-nums">{{ filteredItems.length }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
        <span class="whitespace-nowrap">Stage</span>
        <select
          v-model="filters.stage"
          class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
        >
          <option value="">All</option>
          <option v-for="s in stageFilterOptions" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
        <span class="whitespace-nowrap">Country</span>
        <select
          v-model="filters.country"
          class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
        >
          <option value="">All</option>
          <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
        <span class="whitespace-nowrap">Vendor</span>
        <select
          v-model="filters.vendor"
          class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
        >
          <option value="">All</option>
          <option v-for="v in vendorFilterOptions" :key="v" :value="v">{{ v }}</option>
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
        v-if="completedMedicalEnrollmentRows.length > 0"
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
        <span>Completed Enrollments ({{ completedMedicalEnrollmentRows.length }})</span>
      </button>
    </div>

    <div v-if="pending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">Loading…</div>
    <div v-else-if="error" class="rounded-md border border-pink-200 bg-pink-50 p-4 text-pink-800">
      Failed to load medical enrollments.
      <div v-if="errorMessage" class="mt-2 text-xs text-pink-700/80">{{ errorMessage }}</div>
    </div>

    <div v-else class="rounded-md border border-slate-200 bg-white shadow-card">
      <table class="w-full table-fixed border-collapse text-left text-sm">
        <colgroup>
          <col style="width: 12%" />
          <col style="width: 9%" />
          <col style="width: 10%" />
          <col style="width: 10%" />
          <col style="width: 20%" />
          <col style="width: 10%" />
          <col style="width: 14%" />
          <col style="width: 8%" />
          <col style="width: 7%" />
        </colgroup>
        <thead class="bg-slate-100 text-slate-600">
          <tr>
            <th class="px-3 py-3 align-bottom font-medium">Name</th>
            <th class="px-3 py-3 align-bottom font-medium">Country</th>
            <th class="px-3 py-3 align-bottom font-medium">Type</th>
            <th class="px-3 py-3 align-bottom font-medium">Vendor</th>
            <th class="px-3 py-3 align-bottom font-medium">Status</th>
            <th class="px-3 py-3 align-bottom font-medium">Started</th>
            <th class="px-3 py-3 align-bottom font-medium">Next Action</th>
            <th class="px-3 py-3 align-bottom font-medium">Updated</th>
            <th class="px-3 py-3 text-center align-bottom font-medium">Mark Completed</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredItems" :key="row.id" class="border-t border-hr-navy/25 align-top">
            <td class="min-w-0 break-words px-3 py-3 align-top font-medium text-slate-900">{{ row.employeeName }}</td>
            <td class="min-w-0 px-3 py-3 align-top text-slate-800">{{ row.country || '—' }}</td>
            <td class="min-w-0 px-3 py-3 align-top">
              <span
                v-if="row.enrollmentType"
                :class="[tableDataBadgeClass, enrollmentTypeBadgeClass(row.enrollmentType)]"
              >
                {{ normalizeEnrollmentType(row.enrollmentType) }}
              </span>
              <span v-else class="text-slate-400">—</span>
            </td>
            <td class="min-w-0 px-3 py-3 align-top text-slate-800">{{ row.vendor || '—' }}</td>
            <td class="min-w-0 px-3 py-3 align-top">
              <span :class="[tableDataBadgeClass, stageBadgeClass(row.stage)]">
                {{ displayStage(row.stage) }}
              </span>
            </td>
            <td class="min-w-0 whitespace-nowrap px-3 py-3 align-top tabular-nums text-slate-800">{{ row.dateInitiated || '—' }}</td>
            <td class="min-w-0 break-words px-3 py-3 align-top text-slate-800">{{ row.nextAction || '—' }}</td>
            <td class="min-w-0 whitespace-nowrap px-3 py-3 align-top text-slate-800">{{ formatDate(row.updatedAt) }}</td>
            <td class="px-3 py-3 text-center align-top">
              <input
                :id="`mark-completed-med-${row.id}`"
                type="checkbox"
                class="h-4 w-4 cursor-pointer accent-teal-600"
                :checked="false"
                :aria-label="`Mark ${row.employeeName} enrollment as completed`"
                @change="(event) => void markCompleted(row, (event.target as HTMLInputElement).checked)"
              />
            </td>
          </tr>

          <tr v-if="items.length === 0" class="border-t border-hr-navy/25">
            <td colspan="9" class="px-3 py-6 text-center text-slate-600">No enrollments found.</td>
          </tr>
          <tr v-else-if="filteredItems.length === 0" class="border-t border-hr-navy/25">
            <td colspan="9" class="px-3 py-6 text-center text-slate-600">No enrollments match the filters.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div
        v-if="completedHistoryOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="completed-medical-dialog-title"
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
              <h2 id="completed-medical-dialog-title" class="text-base font-semibold text-slate-900">Completed Medical Enrollments</h2>
              <p class="mt-0.5 text-xs text-slate-500">Medical enrollments marked as completed on the dashboard. Snapshot taken at the time of completion.</p>
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
            <div v-if="completedMedicalEnrollmentRows.length === 0" class="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-800">
              No completed enrollments yet.
            </div>
            <div v-else class="rounded-md border border-slate-200 bg-white">
              <table class="w-full table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col style="width: 12%" />
                  <col style="width: 8%" />
                  <col style="width: 9%" />
                  <col style="width: 9%" />
                  <col style="width: 16%" />
                  <col style="width: 9%" />
                  <col style="width: 13%" />
                  <col style="width: 24%" />
                </colgroup>
                <thead class="bg-slate-100 text-slate-600">
                  <tr>
                    <th class="px-3 py-3 align-bottom font-medium">Name</th>
                    <th class="px-3 py-3 align-bottom font-medium">Country</th>
                    <th class="px-3 py-3 align-bottom font-medium">Type</th>
                    <th class="px-3 py-3 align-bottom font-medium">Vendor</th>
                    <th class="px-3 py-3 align-bottom font-medium">Status</th>
                    <th class="px-3 py-3 align-bottom font-medium">Started</th>
                    <th class="px-3 py-3 align-bottom font-medium">Next Action</th>
                    <th class="px-3 py-3 align-bottom font-medium">Audit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="entry in completedMedicalEnrollmentRows" :key="entry.odooLineId" class="border-t border-hr-navy/25 align-top">
                    <td class="min-w-0 break-words px-3 py-3 align-top font-medium text-slate-900">{{ entry.snapshot.employeeName }}</td>
                    <td class="min-w-0 px-3 py-3 align-top text-slate-800">{{ entry.snapshot.country || '—' }}</td>
                    <td class="min-w-0 px-3 py-3 align-top">
                      <span
                        v-if="entry.snapshot.enrollmentType"
                        :class="[tableDataBadgeClass, enrollmentTypeBadgeClass(entry.snapshot.enrollmentType)]"
                      >
                        {{ normalizeEnrollmentType(entry.snapshot.enrollmentType) }}
                      </span>
                      <span v-else class="text-slate-400">—</span>
                    </td>
                    <td class="min-w-0 px-3 py-3 align-top text-slate-800">{{ entry.snapshot.vendor || '—' }}</td>
                    <td class="min-w-0 px-3 py-3 align-top">
                      <span :class="[tableDataBadgeClass, stageBadgeClass(entry.snapshot.stage)]">
                        {{ displayStage(entry.snapshot.stage) }}
                      </span>
                    </td>
                    <td class="min-w-0 whitespace-nowrap px-3 py-3 align-top tabular-nums text-slate-800">{{ entry.snapshot.dateInitiated || '—' }}</td>
                    <td class="min-w-0 break-words px-3 py-3 align-top text-slate-800">{{ entry.snapshot.nextAction || '—' }}</td>
                    <td class="min-w-0 px-3 py-3 align-top">
                      <CompletedAuditCell
                        :created-at="entry.snapshot.createdAt"
                        :last-modified-at="entry.snapshot.updatedAt"
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
  </section>
</template>

<script setup lang="ts">
import { ensureUsaOption } from '~/utils/countryOptions'
import { tableDataBadgeClass } from '~/utils/tableBadge'

type MedicalEnrollment = {
  id: string
  employeeName: string
  country: string
  enrollmentType?: string
  vendor?: string
  stage: string
  dateInitiated?: string
  nextAction?: string
  createdAt: string
  updatedAt: string
  lastModifiedBy: string
}

type MedicalEnrollmentSnapshot = {
  employeeName: string
  country?: string
  enrollmentType?: string
  vendor?: string
  stage: string
  dateInitiated?: string
  nextAction?: string
  createdAt: string
  updatedAt: string
  lastModifiedBy: string
}

type MedicalEnrollmentCompletion = {
  completedAt: string
  snapshot: MedicalEnrollmentSnapshot
}

type Employee = {
  name: string
  department: string
  countryAssigned: string
}

const MEDICAL_VENDORS = ['IBWIL', 'GTM'] as const

const MEDICAL_STAGES = [
  'Enrollment tentative to be confirmed',
  'Enrollment form in progress',
  'Form completed (to be forwarded)',
  'Form submitted to vendor (approval/confirmation pending)',
  'Enrollment approved'
] as const

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function normalizeStage(value: string) {
  const v = (value ?? '').trim().replace(/^\d+(?:\.\d+)?\s*/, '').trim()
  if (v === 'Enrollment tentative (to be confirmed)') return 'Enrollment tentative to be confirmed'
  return v
}

function displayStage(value: string) {
  return normalizeStage(value) || '—'
}

function normalizeForMatch(value: string) {
  return (value ?? '').trim().toLowerCase()
}

function stageBadgeClass(stage: string) {
  const v = normalizeForMatch(normalizeStage(stage))
  if (v.includes('tentative')) return 'border-slate-300 bg-white text-slate-800'
  if (v.includes('in progress')) return 'border-blue-200 bg-blue-50 text-blue-900'
  if (v.includes('completed')) return 'border-purple-200 bg-purple-50 text-purple-800'
  if (v.includes('approved')) return 'border-teal-200 bg-teal-50 text-teal-800'
  if (v.includes('submitted') || v.includes('pending')) return 'border-pink-200 bg-pink-50 text-pink-800'
  return 'border-blue-200 bg-blue-50 text-blue-900'
}

function enrollmentTypeBadgeClass(value: string) {
  const v = normalizeForMatch(value)
  if (v === 'new enrollment' || v === 'new enrolment' || v === 'new') return 'border-teal-200 bg-teal-50 text-teal-800'
  if (v === 'change' || v === 'updated' || v === 'update') return 'border-purple-200 bg-purple-50 text-brand-purple'
  if (v === 'termination' || v === 'terminated' || v === 'cancelled' || v === 'canceled') return 'border-pink-200 bg-pink-50 text-pink-800'
  return 'border-blue-200 bg-blue-50 text-blue-900'
}

function normalizeEnrollmentType(value: string) {
  const raw = (value ?? '').trim()
  if (!raw) return ''
  const v = normalizeForMatch(raw)
  if (v === 'new enrollment' || v === 'new enrolment' || v === 'new') return 'New enrollment'
  if (v === 'change' || v === 'updated' || v === 'update') return 'Change'
  if (v === 'termination' || v === 'terminated' || v === 'cancelled' || v === 'canceled') return 'Termination'
  if (v === 'other') return 'Other'
  return raw
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

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString()
}

const { data, pending, error } = useFetch<MedicalEnrollment[]>('/api/odoo/medical-enrollments')

const items = computed(() => data.value ?? [])
const errorMessage = computed(() => getErrorMessage(error.value))

const { data: completionsPayload, refresh: refreshCompletions } = useFetch<{
  completions: Record<string, MedicalEnrollmentCompletion>
}>('/api/medical-enrollment-reviews')

const completionsByLineId = ref<Record<string, MedicalEnrollmentCompletion>>({})

watch(
  completionsPayload,
  (p) => {
    completionsByLineId.value = p?.completions ?? {}
  },
  { immediate: true }
)

const completedHistoryOpen = ref(false)

function buildSnapshot(row: MedicalEnrollment): MedicalEnrollmentSnapshot {
  return {
    employeeName: row.employeeName,
    country: row.country,
    enrollmentType: row.enrollmentType,
    vendor: row.vendor,
    stage: row.stage,
    dateInitiated: row.dateInitiated,
    nextAction: row.nextAction,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastModifiedBy: row.lastModifiedBy
  }
}

async function markCompleted(row: MedicalEnrollment, completed: boolean) {
  const prev = { ...completionsByLineId.value }
  const next = { ...completionsByLineId.value }
  if (completed) {
    next[row.id] = { completedAt: new Date().toISOString(), snapshot: buildSnapshot(row) }
  } else {
    delete next[row.id]
  }
  completionsByLineId.value = next
  try {
    await $fetch('/api/medical-enrollment-reviews', {
      method: 'PUT',
      body: completed
        ? { odooLineId: row.id, completed: true, snapshot: buildSnapshot(row) }
        : { odooLineId: row.id, completed: false }
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
    await $fetch('/api/medical-enrollment-reviews', {
      method: 'PUT',
      body: { odooLineId, completed: false }
    })
    await refreshCompletions()
  } catch (err) {
    completionsByLineId.value = prev
    throw err
  }
}

const completedMedicalEnrollmentRows = computed(() => {
  return Object.entries(completionsByLineId.value)
    .map(([odooLineId, entry]) => ({ odooLineId, ...entry }))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
})

const { data: employeesData } = useFetch<Employee[]>('/api/odoo/employees')
const countries = computed(() => ensureUsaOption(uniqueSorted((employeesData.value ?? []).map((e) => e.countryAssigned))))

const stageFilterOptions = computed(() => {
  const fromRows = uniqueSorted((items.value ?? []).map((r) => normalizeStage(r.stage)).filter(Boolean))
  return uniqueSorted([...(MEDICAL_STAGES as readonly string[]), ...fromRows])
})

const vendorFilterOptions = computed(() => {
  const fromRows = uniqueSorted((items.value ?? []).map((r) => (r.vendor ?? '').trim()).filter(Boolean))
  return uniqueSorted([...(MEDICAL_VENDORS as readonly string[]), ...fromRows])
})

const filters = reactive({
  stage: '',
  country: '',
  vendor: ''
})

const hasActiveFilters = computed(() => Object.values(filters).some((v) => (v ?? '').trim() !== ''))

function clearFilters() {
  filters.stage = ''
  filters.country = ''
  filters.vendor = ''
}

const filteredItems = computed(() => {
  const list = items.value ?? []
  const stage = filters.stage.trim()
  const country = filters.country.trim()
  const vendor = filters.vendor.trim()
  const completions = completionsByLineId.value

  return list.filter((r) => {
    if (completions[r.id]) return false
    if (stage && normalizeStage(r.stage) !== stage) return false
    if (country && (r.country || '') !== country) return false
    if (vendor && (r.vendor || '') !== vendor) return false
    return true
  })
})
</script>
