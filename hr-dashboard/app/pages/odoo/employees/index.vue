<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold">Employees (Odoo)</h1>
      </div>
    </div>

    <hr class="border-slate-800" />

    <div class="space-y-3">
      <label class="block">
        <div class="mb-1 text-sm text-slate-300">Search</div>
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
            class="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 pl-9 text-sm text-slate-50 placeholder:text-slate-500"
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
            <div class="mb-1 text-sm text-slate-300">Country</div>
            <select v-model="country" class="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-50">
              <option value="">All</option>
              <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>

          <label class="block md:flex-1">
            <div class="mb-1 text-sm text-slate-300">Department</div>
            <select v-model="department" class="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-50">
              <option value="">All</option>
              <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
            </select>
          </label>

          <label class="block md:flex-1">
            <div class="mb-1 text-sm text-slate-300">Employment Type</div>
            <select
              v-model="employmentType"
              class="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-50"
            >
              <option value="">All</option>
              <option v-for="t in employmentTypes" :key="t" :value="t">{{ toTitleCase(t) }}</option>
            </select>
          </label>

          <label class="block md:flex-1">
            <div class="mb-1 text-sm text-slate-300">Status</div>
            <select v-model="status" class="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-50">
              <option value="">All</option>
              <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
        </div>
      </div>
    </div>

    <div v-if="pending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">
      Loading employees…
    </div>
    <div v-else-if="error" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
      Failed to load employees.
      <div v-if="errorMessage" class="mt-2 text-xs text-red-200/80">
        {{ errorMessage }}
      </div>
    </div>

    <template v-else>
      <hr class="border-slate-800" />

      <div :class="employeesTableContainerClass">
        <div class="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-sm text-slate-300">
          <div>{{ filteredEmployees.length }} employee(s)</div>
          <button
            class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-900"
            type="button"
            @click="resetFilters"
          >
            Reset filters
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-950 text-slate-300">
              <tr>
                <th class="px-4 py-3 font-medium">Name</th>
                <th class="px-4 py-3 font-medium">Department</th>
                <th class="px-4 py-3 font-medium">Position</th>
                <th class="px-4 py-3 font-medium">Country</th>
                <th class="px-4 py-3 font-medium">Employment Type</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Start Date</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="e in filteredEmployees"
                :key="e.employeeKey"
                :class="employeesTableRowClass"
                @click="goToEmployee(e.employeeKey)"
              >
                <td class="px-4 py-4 text-slate-50">{{ e.name }}</td>
                <td class="px-4 py-4 text-slate-200">{{ e.department }}</td>
                <td class="px-4 py-4 text-slate-200">{{ e.position }}</td>
                <td class="px-4 py-4 text-slate-200">{{ e.countryAssigned }}</td>
                <td class="px-4 py-4 text-slate-200">{{ e.employeeType ? toTitleCase(e.employeeType) : '—' }}</td>
                <td class="px-4 py-4">
                  <span
                    class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                    :class="
                      isActiveStatus(e.employeeStatus)
                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                        : 'border-slate-700 bg-slate-800 text-slate-200'
                    "
                  >
                    {{ e.employeeStatus }}
                  </span>
                </td>
                <td class="px-4 py-4 text-slate-200">{{ formatYmdDateOrDash(e.startDate) }}</td>
              </tr>
              <tr v-if="filteredEmployees.length === 0" class="border-t border-slate-800">
                <td colspan="7" class="px-4 py-6 text-center text-slate-300">No matching employees.</td>
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

type Employee = {
  employeeKey: string
  name: string
  department: string
  position: string
  startDate: string | null
  countryAssigned: string
  employeeType?: string
  employeeStatus: string
}

const { data, pending, error } = await useFetch<Employee[]>('/api/odoo/employees')

const search = ref('')
const country = ref('')
const department = ref('')
const employmentType = ref('')
const status = ref('')

const employees = computed(() => data.value ?? [])

const employeesTableContainerClass = 'overflow-hidden rounded-md bg-slate-950'
const employeesTableRowClass = 'cursor-pointer border-t border-slate-800 bg-slate-950 hover:bg-slate-900/40'

function toTitleCase(input: string) {
  return input
    .trim()
    .split(/\s+/g)
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

const filteredEmployees = computed(() => {
  const qRaw = search.value.trim()
  const q = qRaw.toLowerCase()
  const qKey = /^\d+$/.test(qRaw) ? `odoo-${qRaw}` : /^odoo-\d+$/.test(q) ? q : null
  return employees.value
    .filter((e) => (q ? e.name.toLowerCase().includes(q) || (qKey ? e.employeeKey === qKey : false) : true))
    .filter((e) => (country.value ? e.countryAssigned === country.value : true))
    .filter((e) => (department.value ? e.department === department.value : true))
    .filter((e) => (employmentType.value ? (e.employeeType ?? '') === employmentType.value : true))
    .filter((e) => (status.value ? e.employeeStatus === status.value : true))
    .sort((a, b) => a.name.localeCompare(b.name))
})

function goToEmployee(employeeKey: string) {
  return navigateTo(`/odoo/employees/${employeeKey}`)
}

function isActiveStatus(statusLabel: string) {
  return statusLabel.trim().toLowerCase() === 'active'
}

function resetFilters() {
  search.value = ''
  country.value = ''
  department.value = ''
  employmentType.value = ''
  status.value = ''
}
</script>

