<template>
  <section class="min-w-0 space-y-3">
    <div class="flex min-w-0 flex-wrap items-start justify-between gap-4">
      <div class="space-y-1">
        <h2 class="text-base font-semibold text-hr-navy">Medical Enrollments</h2>
        <p class="text-xs text-slate-400">Read-only: sourced from Odoo (employee profile → Medical Information).</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="shrink-0 text-xs text-slate-400">Count: {{ filteredItems.length }}</div>
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
    </div>

    <div v-if="pending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">Loading…</div>
    <div v-else-if="error" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
      Failed to load medical enrollments.
      <div v-if="errorMessage" class="mt-2 text-xs text-red-200/80">{{ errorMessage }}</div>
    </div>

    <div v-else class="rounded-md border border-slate-200 bg-white shadow-card">
      <table class="w-full table-fixed border-collapse text-left text-sm">
        <colgroup>
          <col style="width: 11%" />
          <col style="width: 9%" />
          <col style="width: 10%" />
          <col style="width: 9%" />
          <col style="width: 20%" />
          <col style="width: 9%" />
          <col style="width: 15%" />
          <col style="width: 8%" />
          <col style="width: 9%" />
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
            <th class="px-3 py-3 align-bottom font-medium">Files</th>
            <th class="px-3 py-3 align-bottom font-medium">Updated</th>
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
            <td class="min-w-0 px-3 py-3 align-top text-slate-800">
              <a
                v-if="row.attachmentsUrl"
                :href="row.attachmentsUrl"
                target="_blank"
                rel="noreferrer"
                class="text-sky-200 hover:text-sky-100"
              >
                Open
              </a>
              <span v-else class="text-slate-400">—</span>
            </td>
            <td class="min-w-0 whitespace-nowrap px-3 py-3 align-top text-slate-800">{{ formatDate(row.updatedAt) }}</td>
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
  attachmentsUrl?: string
  createdAt: string
  updatedAt: string
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
  if (v.includes('in progress')) return 'border-sky-200 bg-sky-50 text-sky-900'
  if (v.includes('completed')) return 'border-violet-200 bg-violet-50 text-violet-900'
  if (v.includes('approved')) return 'border-emerald-200 bg-emerald-50 text-emerald-900'
  if (v.includes('submitted') || v.includes('pending')) return 'border-amber-200 bg-amber-50 text-amber-900'
  return 'border-sky-200 bg-sky-50 text-sky-900'
}

function enrollmentTypeBadgeClass(value: string) {
  const v = normalizeForMatch(value)
  if (v === 'new enrollment' || v === 'new enrolment' || v === 'new') return 'border-cyan-200 bg-cyan-50 text-cyan-900'
  if (v === 'change' || v === 'updated' || v === 'update') return 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900'
  if (v === 'termination' || v === 'terminated' || v === 'cancelled' || v === 'canceled') return 'border-rose-200 bg-rose-50 text-rose-900'
  return 'border-lime-200 bg-lime-50 text-lime-900'
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

  return list.filter((r) => {
    if (stage && normalizeStage(r.stage) !== stage) return false
    if (country && (r.country || '') !== country) return false
    if (vendor && (r.vendor || '') !== vendor) return false
    return true
  })
})
</script>
