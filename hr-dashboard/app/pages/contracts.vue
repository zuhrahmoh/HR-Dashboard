<template>
  <div class="min-w-0 space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold">Employee Contract Management</h1>
      <p class="text-slate-300">Track employee contract information. Contract changes are maintained in Odoo (employee profile → Contract notification).</p>
    </div>

    <hr class="border-slate-800" />

    <section class="min-w-0 space-y-3">
      <div class="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-slate-200">Contract Changes</h2>
          <p class="text-xs text-slate-400">Read-only: sourced from Odoo employee profiles.</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <label class="flex items-center gap-2 text-sm font-medium text-slate-300">
            <span class="whitespace-nowrap">Country</span>
            <select
              v-model="filters.country"
              class="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus:border-slate-600"
            >
              <option value="">All</option>
              <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>

          <div class="flex items-center gap-2 text-sm font-medium text-slate-300">
            <span class="whitespace-nowrap">Change type</span>
            <div ref="filterChangeTypeEl" class="relative">
              <button
                type="button"
                class="flex h-8 min-w-[11rem] items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-2 text-left text-sm text-slate-100 hover:bg-slate-900/40"
                aria-haspopup="listbox"
                :aria-expanded="filterChangeTypeOpen"
                @click="filterChangeTypeOpen = !filterChangeTypeOpen"
                @keydown.escape.prevent="filterChangeTypeOpen = false"
              >
                <span class="min-w-0 truncate">{{ filterChangeTypesSummary(filters.changeTypes) }}</span>
                <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                  />
                </svg>
              </button>
              <div
                v-if="filterChangeTypeOpen"
                class="absolute z-30 right-0 mt-1 max-h-56 w-max min-w-full overflow-auto rounded-md border border-slate-800 bg-slate-950 py-1 shadow-lg"
                role="listbox"
                @keydown.escape.prevent="filterChangeTypeOpen = false"
              >
                <label
                  v-for="t in changeTypeFilterOptions"
                  :key="t"
                  class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-slate-900/40"
                >
                  <input v-model="filters.changeTypes" type="checkbox" :value="t" class="h-4 w-4 accent-slate-200" />
                  <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" :class="changeTypeBadgeClass(t)">
                    {{ t }}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <button
            v-if="hasActiveFilters"
            type="button"
            class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
            @click="clearFilters"
          >
            Clear
          </button>

          <div class="shrink-0 text-xs text-slate-400">Count: {{ filteredContractChanges.length }}</div>
        </div>
      </div>

      <div v-if="pending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div v-else-if="error" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load contract changes.
        <div v-if="errorMessage" class="mt-2 text-xs text-red-200/80">{{ errorMessage }}</div>
      </div>

      <div v-else class="rounded-md border border-slate-800 bg-slate-900">
        <table class="w-full table-fixed border-collapse text-left text-sm">
          <colgroup>
            <col style="width: 15%" />
            <col style="width: 9%" />
            <col style="width: 12%" />
            <col style="width: 12%" />
            <col style="width: 18%" />
            <col style="width: 14%" />
            <col style="width: 20%" />
          </colgroup>
          <thead class="bg-slate-950 text-slate-300">
            <tr>
              <th class="px-3 py-3 align-bottom font-medium">Employee</th>
              <th class="px-3 py-3 align-bottom font-medium">Country</th>
              <th class="px-3 py-3 align-bottom font-medium">Department</th>
              <th class="px-3 py-3 align-bottom font-medium">Position</th>
              <th class="px-3 py-3 align-bottom font-medium">Change</th>
              <th class="px-3 py-3 align-bottom font-medium">Status</th>
              <th class="px-3 py-3 align-bottom font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredContractChanges" :key="row.id" class="border-t border-slate-800 align-top">
              <td class="min-w-0 break-words px-3 py-3 align-top text-slate-50">{{ row.employeeName }}</td>
              <td class="min-w-0 break-words px-3 py-3 align-top text-slate-200">{{ row.country || '—' }}</td>
              <td class="min-w-0 break-words px-3 py-3 align-top text-slate-200">{{ row.department }}</td>
              <td class="min-w-0 break-words px-3 py-3 align-top text-slate-200">{{ row.position }}</td>
              <td class="min-w-0 px-3 py-3 align-top">
                <div class="flex flex-wrap content-start gap-1.5">
                  <span v-for="t in row.changeTypes" :key="t" :class="[tableDataBadgeClass, changeTypeBadgeClass(t)]">
                    {{ t }}
                  </span>
                  <span v-if="(row.changeTypes?.length ?? 0) === 0" class="text-slate-400">—</span>
                </div>
              </td>
              <td class="min-w-0 px-3 py-3 align-top">
                <span :class="[tableDataBadgeClass, statusBadgeClass(row.status ?? '')]">
                  {{ row.status || '—' }}
                </span>
              </td>
              <td class="min-w-0 px-3 py-3 align-top text-slate-200">
                <div class="break-words whitespace-pre-wrap">{{ row.description }}</div>
              </td>
            </tr>

            <tr v-if="contractChanges.length === 0" class="border-t border-slate-800">
              <td colspan="7" class="px-3 py-6 text-center text-slate-300">No contract changes yet.</td>
            </tr>
            <tr v-else-if="filteredContractChanges.length === 0" class="border-t border-slate-800">
              <td colspan="7" class="px-3 py-6 text-center text-slate-300">No contract changes match the filters.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <hr class="border-slate-800" />

    <section class="min-w-0 space-y-3">
      <div class="flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div class="min-w-0 space-y-1">
          <h2 class="text-lg font-semibold text-slate-200">Upcoming Contract End Dates</h2>
          <p class="text-xs text-slate-400">
            Contract/probation end dates within the next {{ upcomingWindowDays }} days. 6 week notices highlighted.
          </p>
        </div>

        <label class="space-y-1">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Window</div>
          <select
            v-model="upcomingWindowDays"
            class="h-9 rounded-md border border-slate-700 bg-slate-950/40 px-2 text-sm text-slate-200 focus:border-slate-500 focus:outline-none"
          >
            <option value="30">Next 30 days</option>
            <option value="60">Next 60 days</option>
            <option value="90">Next 90 days</option>
          </select>
        </label>
      </div>

      <div v-if="upcomingPending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div v-else-if="upcomingError" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load upcoming contracts.
        <div v-if="upcomingErrorMessage" class="mt-2 text-xs text-red-200/80">{{ upcomingErrorMessage }}</div>
      </div>
      <UpcomingContractsTable
        v-else
        :upcoming-contract-items="upcomingContractExpiries"
        :upcoming-probation-items="upcomingProbations"
        :expired-contract-items="expiredContracts"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ensureUsaOption } from '~/utils/countryOptions'
import { tableDataBadgeClass } from '~/utils/tableBadge'

type ContractChange = {
  id: string
  employeeName: string
  country?: string
  department: string
  position: string
  changeTypes: string[]
  status?: string
  description: string
  createdAt: string
}

type Employee = { department: string; countryAssigned: string }

type HomeAnalytics = {
  upcomingContractExpiries: Array<{
    employeeKey: string
    name: string
    department: string
    position: string
    reportingTo: string
    countryAssigned: string
    contractOrProbationEndDate: string
    daysRemaining: number
  }>
  upcomingProbations: Array<{
    employeeKey: string
    name: string
    department: string
    position: string
    reportingTo: string
    countryAssigned: string
    contractOrProbationEndDate: string
    daysRemaining: number
  }>
  expiredContracts: Array<{
    employeeKey: string
    name: string
    department: string
    position: string
    reportingTo: string
    countryAssigned: string
    contractOrProbationEndDate: string
    daysRemaining: number
  }>
}

const KNOWN_CHANGE_LABELS = [
  'Salary',
  'Role',
  'Reporting',
  'Job Title',
  'Contract Extension',
  'Non-Renewal'
] as const

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function changeTypeBadgeClass(value: string) {
  const v = value.trim()
  if (v === 'Salary') return 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200'
  if (v === 'Role') return 'border-cyan-900/60 bg-cyan-950/30 text-cyan-200'
  if (v === 'Reporting') return 'border-teal-900/60 bg-teal-950/30 text-teal-200'
  if (v === 'Job Title') return 'border-sky-900/60 bg-sky-950/30 text-sky-200'
  if (v === 'Contract Extension') return 'border-violet-900/60 bg-violet-950/30 text-violet-200'
  if (v === 'Non-Renewal') return 'border-red-900/60 bg-red-950/30 text-red-200'
  return 'border-slate-700 bg-slate-900 text-slate-200'
}

function statusBadgeClass(value: string) {
  const v = value.trim().toLowerCase()
  if (v.includes('approved') && !v.includes('unapproved')) return 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200'
  if (v.includes('hold')) return 'border-slate-700 bg-slate-900 text-slate-200'
  if (v.includes('approval') && v.includes('required')) return 'border-amber-900/60 bg-amber-950/30 text-amber-200'
  if (!v) return 'border-slate-700 bg-slate-900 text-slate-200'
  return 'border-amber-900/60 bg-amber-950/30 text-amber-200'
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

const { data, pending, error } = useFetch<ContractChange[]>('/api/odoo/contract-changes')

const contractChanges = computed(() => data.value ?? [])
const errorMessage = computed(() => getErrorMessage(error.value))

const upcomingWindowDays = ref<'30' | '60' | '90'>('60')
const upcomingQuery = computed(() => ({ upcomingDays: upcomingWindowDays.value }))
const { data: upcomingData, pending: upcomingPending, error: upcomingError } = useFetch<HomeAnalytics>('/api/odoo/analytics/home', {
  query: upcomingQuery,
  watch: [upcomingQuery]
})
const upcomingErrorMessage = computed(() => getErrorMessage(upcomingError.value))
const upcomingContractExpiries = computed(() => upcomingData.value?.upcomingContractExpiries ?? [])
const upcomingProbations = computed(() => upcomingData.value?.upcomingProbations ?? [])
const expiredContracts = computed(() => upcomingData.value?.expiredContracts ?? [])

const { data: employeesData } = useFetch<Employee[]>('/api/odoo/employees')
const countries = computed(() => ensureUsaOption(uniqueSorted((employeesData.value ?? []).map((e) => e.countryAssigned))))

const changeTypeFilterOptions = computed(() => {
  const fromRows = uniqueSorted(contractChanges.value.flatMap((r) => r.changeTypes ?? []))
  if (fromRows.length) return fromRows
  return [...KNOWN_CHANGE_LABELS]
})

const filters = reactive({
  country: '',
  changeTypes: [] as string[]
})

const filterChangeTypeOpen = ref(false)
const filterChangeTypeEl = ref<HTMLElement | null>(null)

function filterChangeTypesSummary(selected: string[]) {
  if (!selected.length) return 'All types'
  if (selected.length === 1) return selected[0] ?? 'All types'
  if (selected.length === 2) return `${selected[0]}, ${selected[1]}`
  return `${selected.length} types`
}

const hasActiveFilters = computed(() => filters.country.trim() !== '' || filters.changeTypes.length > 0)

function clearFilters() {
  filters.country = ''
  filters.changeTypes = []
}

const filteredContractChanges = computed(() => {
  const list = contractChanges.value ?? []
  const country = filters.country.trim()
  const selTypes = filters.changeTypes
  return list.filter((r) => {
    if (country && (r.country || '') !== country) return false
    if (selTypes.length > 0) {
      const rowTypes = r.changeTypes ?? []
      if (!selTypes.some((t) => rowTypes.includes(t))) return false
    }
    return true
  })
})

function handleDocumentPointerDown(event: PointerEvent) {
  const t = event.target as Node | null
  if (!t) return
  if (filterChangeTypeOpen.value && filterChangeTypeEl.value && !filterChangeTypeEl.value.contains(t)) {
    filterChangeTypeOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>
