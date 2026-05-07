<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-gradient-brand text-3xl font-extrabold tracking-tight">Employees</h1>
      </div>
    </div>

    <div class="surface-tint-hero space-y-3 rounded-2xl p-4 shadow-card sm:p-5">
      <label class="block">
        <div class="mb-1 text-sm text-slate-600">Search</div>
        <div class="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          >
            <path d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5a6.75 6.75 0 0 0 0-13.5Z" stroke="currentColor" stroke-width="1.5" />
            <path d="M16 16l4.25 4.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <input
            v-model="search"
            type="text"
            class="w-full rounded-md border border-slate-200 bg-white shadow-card px-3 py-2 pl-9 text-sm text-slate-900 placeholder:text-slate-500"
            placeholder="Type a name or Odoo ID…"
          />
        </div>
      </label>

      <div class="space-y-2">
        <div class="flex items-center gap-2 text-sm font-medium text-slate-400">
          <span>Filters</span>
          <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4" aria-hidden="true">
            <path
              d="M3 4.5h18l-7 8v6l-4 2v-8l-7-8Z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
          </svg>
        </div>

        <div class="flex flex-col gap-3 md:flex-row md:items-end md:gap-2">
          <label class="block md:flex-1">
            <div class="mb-1 text-sm text-slate-600">Country</div>
            <select v-model="country" class="w-full rounded-md border border-slate-200 bg-white shadow-card px-3 py-2 text-sm text-slate-900">
              <option value="">All</option>
              <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>

          <label class="block md:flex-1">
            <div class="mb-1 text-sm text-slate-600">Department</div>
            <select v-model="department" class="w-full rounded-md border border-slate-200 bg-white shadow-card px-3 py-2 text-sm text-slate-900">
              <option value="">All</option>
              <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
            </select>
          </label>

          <label class="block md:flex-1">
            <div class="mb-1 text-sm text-slate-600">Employment Type</div>
            <select
              v-model="employmentType"
              class="w-full rounded-md border border-slate-200 bg-white shadow-card px-3 py-2 text-sm text-slate-900"
            >
              <option value="">All</option>
              <option v-for="t in employmentTypes" :key="t" :value="t">{{ toTitleCase(t) }}</option>
            </select>
          </label>

          <label class="block md:flex-1">
            <div class="mb-1 text-sm text-slate-600">Status</div>
            <select v-model="status" class="w-full rounded-md border border-slate-200 bg-white shadow-card px-3 py-2 text-sm text-slate-900">
              <option value="">All</option>
              <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
        </div>

        <div class="flex flex-wrap items-center gap-2 pt-3">
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick view</span>
          <button
            type="button"
            role="switch"
            :aria-checked="onProbation"
            class="group inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-card transition-colors focus:outline-none focus:ring-2 focus:ring-hr-navy/30"
            :class="
              onProbation
                ? 'border-hr-navy bg-hr-navy text-white hover:bg-hr-navy/90'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            "
            @click="onProbation = !onProbation"
          >
            <span
              class="inline-block h-2 w-2 rounded-full transition-colors"
              :class="onProbation ? 'bg-hr-mint' : 'bg-slate-300'"
              aria-hidden="true"
            />
            <span>On probation</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="pending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">
      Loading employees…
    </div>
    <div v-else-if="error" class="rounded-md border border-pink-200 bg-pink-50 p-4 text-pink-800">
      Failed to load employees.
      <div v-if="errorMessage" class="mt-2 text-xs text-pink-700/80">
        {{ errorMessage }}
      </div>
    </div>

    <template v-else>
      <div :class="employeesTableContainerClass">
        <div class="flex items-center justify-between border-b border-hr-navy/25 px-4 py-2 text-sm text-slate-600">
          <div>{{ filteredEmployees.length }} employee(s)</div>
          <button
            class="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100"
            type="button"
            @click="resetFilters"
          >
            Reset filters
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-100 text-slate-600">
              <tr>
                <th class="px-4 py-3 font-medium">Name</th>
                <th class="px-4 py-3 font-medium">Department</th>
                <th class="px-4 py-3 font-medium">Position</th>
                <th class="px-4 py-3 font-medium">Country</th>
                <th class="px-4 py-3 font-medium">Employment Type</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Start Date</th>
                <th v-if="onProbation" class="px-4 py-3 font-medium">Probation End</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="e in filteredEmployees"
                :key="e.employeeKey"
                :class="employeesTableRowClass"
                @click="goToEmployee(e.employeeKey)"
              >
                <td class="px-4 py-4 text-slate-900">{{ e.name }}</td>
                <td class="px-4 py-4 text-slate-800">{{ e.department }}</td>
                <td class="px-4 py-4 text-slate-800">{{ e.position }}</td>
                <td class="px-4 py-4 text-slate-800">{{ e.countryAssigned }}</td>
                <td class="px-4 py-4 text-slate-800">{{ e.employeeType ? toTitleCase(e.employeeType) : '—' }}</td>
                <td class="min-w-0 px-4 py-4">
                  <span :class="[tableDataBadgeClass, employeeStatusBadgeClass(e.employeeStatus)]">
                    {{ e.employeeStatus }}
                  </span>
                </td>
                <td class="px-4 py-4 text-slate-800">{{ formatYmdDateOrDash(e.startDate) }}</td>
                <td v-if="onProbation" class="px-4 py-4 text-slate-800">{{ formatYmdDateOrDash(e.probationEndDate ?? null) }}</td>
              </tr>
              <tr v-if="filteredEmployees.length === 0" class="border-t border-hr-navy/25">
                <td :colspan="onProbation ? 8 : 7" class="px-4 py-6 text-center text-slate-600">No matching employees.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { formatYmdDateOrDash } from '~/utils/dates'
import { tableDataBadgeClass } from '~/utils/tableBadge'

type Employee = {
  employeeKey: string
  name: string
  department: string
  position: string
  startDate: string | null
  countryAssigned: string
  employeeType?: string
  employeeStatus: string
  probationEndDate?: string | null
}

const { data, pending, error } = useFetch<Employee[]>('/api/odoo/employees')

const search = ref('')
const country = ref('')
const department = ref('')
const employmentType = ref('')
const status = ref('')
const onProbation = ref(false)

const employees = computed(() => data.value ?? [])

const employeesTableContainerClass = 'overflow-hidden rounded-md bg-white'
const employeesTableRowClass = 'cursor-pointer border-t border-hr-navy/25 bg-white hover:bg-slate-50'

function toTitleCase(input: string) {
  return input
    .trim()
    .split(/[\s_]+/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const errorMessage = computed(() => {
  const e = error.value as unknown as Record<string, unknown> | null
  if (!e) return ''
  const data = e['data'] as Record<string, unknown> | undefined
  return (
    (typeof data?.message === 'string' && data.message) ||
    (typeof e['message'] === 'string' && (e['message'] as string)) ||
    (typeof e['statusMessage'] === 'string' && (e['statusMessage'] as string)) ||
    ''
  )
})

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

const BRANCH_COUNTRIES = [
  'Trinidad and Tobago',
  'Guyana',
  'USA',
  'Suriname',
  'El Dorado Offshore GY',
  'El Dorado Offshore TT',
  'Mexico',
  'Colombia'
] as const

const countries = computed(() => {
  const present = new Set(uniqueSorted(employees.value.map((e) => e.countryAssigned)))
  present.add('USA')
  return BRANCH_COUNTRIES.filter((c) => present.has(c))
})
const departments = computed(() => uniqueSorted(employees.value.map((e) => e.department)))
const employmentTypes = computed(() => uniqueSorted(employees.value.map((e) => e.employeeType ?? '')))
const statuses = computed(() => uniqueSorted(employees.value.map((e) => e.employeeStatus)))

const todayYmd = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

function isOnProbation(e: Employee, today: string) {
  const end = (e.probationEndDate ?? '').trim()
  return end !== '' && end >= today
}

const filteredEmployees = computed(() => {
  const qRaw = search.value.trim()
  const q = qRaw.toLowerCase()
  const qKey = /^\d+$/.test(qRaw) ? `odoo-${qRaw}` : /^odoo-\d+$/.test(q) ? q : null
  const today = todayYmd.value
  return employees.value
    .filter((e) => (q ? e.name.toLowerCase().includes(q) || (qKey ? e.employeeKey === qKey : false) : true))
    .filter((e) => (country.value ? e.countryAssigned === country.value : true))
    .filter((e) => (department.value ? e.department === department.value : true))
    .filter((e) => (employmentType.value ? (e.employeeType ?? '') === employmentType.value : true))
    .filter((e) => (status.value ? e.employeeStatus === status.value : true))
    .filter((e) => (onProbation.value ? isOnProbation(e, today) : true))
    .sort((a, b) => a.name.localeCompare(b.name))
})

function goToEmployee(employeeKey: string) {
  return navigateTo(`/odoo/employees/${employeeKey}`)
}

function employeeStatusBadgeClass(statusLabel: string) {
  const s = statusLabel.trim().toLowerCase()
  if (s === 'active') return 'border-teal-200 bg-teal-50 text-teal-800'
  if (s === 'offboarding') return 'border-pink-200 bg-pink-50 text-pink-800'
  return 'border-slate-300 bg-slate-100 text-slate-800'
}

function resetFilters() {
  search.value = ''
  country.value = ''
  department.value = ''
  employmentType.value = ''
  status.value = ''
  onProbation.value = false
}
</script>

