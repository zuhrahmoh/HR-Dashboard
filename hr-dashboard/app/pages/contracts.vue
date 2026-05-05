<template>
  <div class="min-w-0 space-y-6">
    <div class="space-y-3">
      <div class="space-y-1">
        <h1 class="text-gradient-brand text-3xl font-extrabold tracking-tight">Employee Contract Management</h1>
        <p class="text-slate-600">Track employee contract information. Contract changes are maintained in Odoo (employee profile → Contract notification).</p>
      </div>
    </div>

    <section
      aria-label="Contracts overview"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      <button type="button" class="surface-tint-card relative overflow-hidden rounded-xl p-4 pl-5 shadow-card text-left scale-[0.97] transition-transform hover:scale-[1.00] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40" @click="navigateContractsSection('contract-changes')">
        <span aria-hidden="true" class="absolute inset-x-0 top-0 h-[3px] bg-brand-blue" />
        <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Contract Changes</div>
        <div class="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-brand-blue">{{ awaitingApprovalKpi }}</div>
        <div class="mt-1 text-sm text-slate-500">Awaiting approval</div>
      </button>
      <button type="button" class="surface-tint-card relative overflow-hidden rounded-xl p-4 pl-5 shadow-card text-left scale-[0.97] transition-transform hover:scale-[1.00] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40" @click="navigateContractsSection('upcoming-contract-expiries')">
        <span aria-hidden="true" class="absolute inset-x-0 top-0 h-[3px] bg-teal-500" />
        <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Expiring Contracts</div>
        <div class="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-teal-600">{{ expiringContractsKpi }}</div>
        <div class="mt-1 text-sm text-slate-500">Next 60 days</div>
      </button>
      <button type="button" class="surface-tint-card relative overflow-hidden rounded-xl p-4 pl-5 shadow-card text-left scale-[0.97] transition-transform hover:scale-[1.00] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40" @click="navigateContractsSection('upcoming-probations')">
        <span aria-hidden="true" class="absolute inset-x-0 top-0 h-[3px] bg-brand-purple" />
        <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Probation Reviews Due</div>
        <div class="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-brand-purple">{{ upcomingProbationsKpi }}</div>
        <div class="mt-1 text-sm text-slate-500">Next 60 days</div>
      </button>
      <button type="button" class="surface-tint-card relative overflow-hidden rounded-xl p-4 pl-5 shadow-card text-left scale-[0.97] transition-transform hover:scale-[1.00] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40" @click="navigateContractsSection('upcoming-contract-expiries')">
        <span aria-hidden="true" class="absolute inset-x-0 top-0 h-[3px] bg-pink-500" />
        <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Pending Actions</div>
        <div class="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-pink-600">{{ pendingActionsKpi }}</div>
        <div class="mt-1 text-sm text-slate-500">{{ pendingActionsContractsKpi }} contracts • {{ pendingActionsProbationsKpi }} probations</div>
      </button>
    </section>

    <nav
      class="surface-tint-nav sticky top-[3.25rem] z-20 -mx-1 flex flex-wrap items-center gap-x-1 gap-y-1 rounded-md px-1.5 pt-1 pb-1.5 backdrop-blur-sm"
      aria-label="Contract sections"
    >
      <span class="shrink-0 pr-0.5 text-[10px] font-semibold tracking-wide text-brand-blue">JUMP TO:</span>
      <template v-for="(item, i) in contractsSectionNavItems" :key="item.id">
        <span
          v-if="i > 0"
          class="px-1 text-[11px] font-light text-hr-navy/35 select-none"
          aria-hidden="true"
        >|</span>
        <button
          type="button"
          class="rounded-md px-3 py-2 text-xs font-medium text-hr-navy transition hover:bg-purple-100/60 hover:text-brand-purple"
          @click="navigateContractsSection(item.id)"
        >
          {{ item.label }}
        </button>
      </template>
      <button
        v-if="showContractsBackToTop"
        type="button"
        class="ml-auto inline-flex items-center gap-1.5 rounded-md border border-brand-blue bg-brand-blue/10 px-3 py-1.5 text-xs font-semibold text-brand-blue shadow-sm transition hover:bg-brand-blue/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
        @click="scrollContractsToTop"
      >
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M10 16V4M5 9l5-5 5 5" />
        </svg>
        <span>Back to top</span>
      </button>
    </nav>

    <section id="contract-changes" class="surface-tint-hero scroll-mt-32 min-w-0 space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
      <div class="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div class="flex min-w-0 items-start gap-3">
          <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
          <div class="min-w-0 space-y-0.5">
            <h2 class="text-gradient-brand text-xl font-bold tracking-tight">Contract Changes</h2>
            <p class="text-xs text-slate-500">Read-only: sourced from Odoo employee profiles.</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-3">
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

          <div class="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span class="whitespace-nowrap">Change type</span>
            <div ref="filterChangeTypeEl" class="relative">
              <button
                type="button"
                class="flex h-8 min-w-[11rem] items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 text-left text-sm text-slate-900 hover:bg-slate-50"
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
                class="absolute z-30 right-0 mt-1 max-h-56 w-max min-w-full overflow-auto rounded-md border border-slate-200 bg-slate-50 py-1 shadow-lg"
                role="listbox"
                @keydown.escape.prevent="filterChangeTypeOpen = false"
              >
                <label
                  v-for="t in changeTypeFilterOptions"
                  :key="t"
                  class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
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
            class="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100"
            @click="clearFilters"
          >
            Clear
          </button>

          <div class="shrink-0 text-xs text-slate-400">Count: {{ filteredContractChanges.length }}</div>
        </div>
      </div>

      <div v-if="pending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">Loading…</div>
      <div v-else-if="error" class="rounded-md border border-pink-200 bg-pink-50 p-4 text-pink-800">
        Failed to load contract changes.
        <div v-if="errorMessage" class="mt-2 text-xs text-pink-700/80">{{ errorMessage }}</div>
      </div>

      <div v-else class="rounded-md border border-slate-200 bg-white shadow-card">
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
          <thead class="bg-slate-100 text-slate-600">
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
            <tr v-for="row in filteredContractChanges" :key="row.id" class="border-t border-hr-navy/25 align-top">
              <td class="min-w-0 break-words px-3 py-3 align-top text-slate-900">{{ row.employeeName }}</td>
              <td class="min-w-0 break-words px-3 py-3 align-top text-slate-800">{{ row.country || '—' }}</td>
              <td class="min-w-0 break-words px-3 py-3 align-top text-slate-800">{{ row.department }}</td>
              <td class="min-w-0 break-words px-3 py-3 align-top text-slate-800">{{ row.position }}</td>
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
              <td class="min-w-0 px-3 py-3 align-top text-slate-800">
                <div class="break-words whitespace-pre-wrap">{{ row.description }}</div>
              </td>
            </tr>

            <tr v-if="contractChanges.length === 0" class="border-t border-hr-navy/25">
              <td colspan="7" class="px-3 py-6 text-center text-slate-600">No contract changes yet.</td>
            </tr>
            <tr v-else-if="filteredContractChanges.length === 0" class="border-t border-hr-navy/25">
              <td colspan="7" class="px-3 py-6 text-center text-slate-600">No contract changes match the filters.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="surface-tint-hero min-w-0 space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
      <div class="flex min-w-0 items-start gap-3">
        <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
        <div class="min-w-0 space-y-0.5">
          <h2 class="text-gradient-brand text-xl font-bold tracking-tight">Contract End Dates</h2>
          <p class="text-sm text-slate-500">
            Contract/probation end dates within ±{{ upcomingWindowDays }} days of today. Expired items highlighted.
          </p>
        </div>
      </div>

      <div v-if="upcomingPending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">Loading…</div>
      <div v-else-if="upcomingError" class="rounded-md border border-pink-200 bg-pink-50 p-4 text-pink-800">
        Failed to load upcoming contracts.
        <div v-if="upcomingErrorMessage" class="mt-2 text-xs text-pink-700/80">{{ upcomingErrorMessage }}</div>
      </div>
      <div v-else>
        <UpcomingContractsTable
          v-model:window-days="upcomingWindowDays"
          :upcoming-contract-items="upcomingContractExpiries"
          :upcoming-probation-items="upcomingProbations"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ensureUsaOption } from '~/utils/countryOptions'
import { tableDataBadgeClass } from '~/utils/tableBadge'

const contractsSectionNavItems = [
  { id: 'contract-changes', label: 'Contract Changes' },
  { id: 'upcoming-contract-expiries', label: 'Contract Expiries' },
  { id: 'upcoming-probations', label: 'Probation Reviews' }
] as const

function scrollToContractsSection(id: string) {
  if (!import.meta.client) return
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const showContractsBackToTop = ref(false)

function navigateContractsSection(id: string) {
  showContractsBackToTop.value = true
  scrollToContractsSection(id)
}

function scrollContractsToTop() {
  if (!import.meta.client) return
  window.scrollTo({ top: 0, behavior: 'smooth' })
  showContractsBackToTop.value = false
}

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

/** Explicit light surfaces (hex) so badge colors never drift from cascade or palette tweaks. */
function changeTypeBadgeClass(value: string) {
  const v = value.trim()
  if (v === 'Salary') return 'border-[#bbf7d0] bg-[#ecfdf5] text-[#047857]'
  if (v === 'Role') return 'border-[#a5f3fc] bg-[#ecfeff] text-[#0e7490]'
  if (v === 'Reporting') return 'border-[#99f6e4] bg-[#f0fdfa] text-[#0f766e]'
  if (v === 'Job Title') return 'border-[#bae6fd] bg-[#f0f9ff] text-[#0369a1]'
  if (v === 'Contract Extension') return 'border-[#ddd6fe] bg-[#f5f3ff] text-[#5b21b6]'
  if (v === 'Non-Renewal') return 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]'
  return 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]'
}

function isAwaitingApprovalStatus(value: string) {
  const v = (value ?? '').trim().toLowerCase()
  if (!v) return false
  if (v.includes('unapproved') || v.includes('not approved') || v.includes('rejected')) return false
  if (v.includes('hold')) return false
  if (
    (v.includes('approved') || v.includes('complete')) &&
    !v.includes('approval required') &&
    !v.includes('pending') &&
    !v.includes('await')
  ) return false
  return (
    v.includes('approval') ||
    v.includes('required') ||
    v.includes('pending') ||
    v.includes('await') ||
    v.includes('review')
  )
}

function statusBadgeClass(value: string) {
  const v = value.trim().toLowerCase()
  if (!v) return 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]'
  if (v.includes('unapproved') || v.includes('not approved') || v.includes('rejected')) {
    return 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]'
  }
  if (v.includes('hold')) return 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]'
  if (
    (v.includes('approved') || v.includes('complete')) &&
    !v.includes('approval required') &&
    !v.includes('pending') &&
    !v.includes('await')
  ) {
    return 'border-[#bbf7d0] bg-[#ecfdf5] text-[#047857]'
  }
  if (isAwaitingApprovalStatus(value)) {
    return 'border-[#bae6fd] bg-[#f0f9ff] text-[#0369a1]'
  }
  return 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]'
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

const { data: kpiData } = useFetch<HomeAnalytics>('/api/odoo/analytics/home', {
  query: { upcomingDays: '90' }
})
const kpiContractExpiries = computed(() => kpiData.value?.upcomingContractExpiries ?? [])
const kpiProbations = computed(() => kpiData.value?.upcomingProbations ?? [])

const awaitingApprovalKpi = computed(
  () => contractChanges.value.filter((r) => isAwaitingApprovalStatus(r.status ?? '')).length
)
const expiringContractsKpi = computed(
  () => kpiContractExpiries.value.filter((r) => r.daysRemaining >= 0 && r.daysRemaining <= 60).length
)
const upcomingProbationsKpi = computed(
  () => kpiProbations.value.filter((r) => r.daysRemaining >= 0 && r.daysRemaining <= 60).length
)
const pendingActionsContractsKpi = computed(
  () => kpiContractExpiries.value.filter((r) => r.daysRemaining < 0).length
)
const pendingActionsProbationsKpi = computed(
  () => kpiProbations.value.filter((r) => r.daysRemaining < 0).length
)
const pendingActionsKpi = computed(
  () => pendingActionsContractsKpi.value + pendingActionsProbationsKpi.value
)

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
