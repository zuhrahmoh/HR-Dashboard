<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-1">
        <NuxtLink to="/odoo/employees" class="text-sm text-slate-300 hover:text-slate-50">← Back to Employees</NuxtLink>
        <h1 class="text-2xl font-semibold">Employee Profile (Odoo)</h1>
        <p class="text-slate-300">Read-only view sourced from Odoo.</p>
      </div>
    </div>

    <hr class="border-slate-800" />

    <div v-if="pending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">
      Loading employee…
    </div>
    <div v-else-if="error" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
      Employee not found.
    </div>

    <div v-else-if="employee" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section class="rounded-md border border-slate-800 bg-slate-900 p-4">
        <h2 class="mb-3 text-sm font-semibold text-slate-200">Personal</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between gap-4">
            <dt class="text-slate-400">Name</dt>
            <dd class="text-slate-50">{{ employee.name }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-slate-400">Gender</dt>
            <dd class="text-slate-50">{{ employee.gender ?? '—' }}</dd>
          </div>
        </dl>
      </section>

      <section class="rounded-md border border-slate-800 bg-slate-900 p-4">
        <h2 class="mb-3 text-sm font-semibold text-slate-200">Organization</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between gap-4">
            <dt class="text-slate-400">Department</dt>
            <dd class="text-slate-50">{{ employee.department }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-slate-400">Position</dt>
            <dd class="text-slate-50">{{ employee.position }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-slate-400">Reporting To</dt>
            <dd class="text-slate-50">{{ employee.reportingTo ?? '—' }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-slate-400">Country Assigned</dt>
            <dd class="text-slate-50">{{ employee.countryAssigned }}</dd>
          </div>
        </dl>
      </section>

      <section class="rounded-md border border-slate-800 bg-slate-900 p-4">
        <h2 class="mb-3 text-sm font-semibold text-slate-200">Employment</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between gap-4">
            <dt class="text-slate-400">Employee Key</dt>
            <dd class="font-mono text-slate-50">{{ employee.employeeKey }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-slate-400">Status</dt>
            <dd class="text-slate-50">{{ employee.employeeStatus }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-slate-400">Employment Type</dt>
            <dd class="text-slate-50">{{ employee.employeeType ? toTitleCase(employee.employeeType) : '—' }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-slate-400">Start Date</dt>
            <dd class="text-slate-50">{{ formatYmdDateOrDash(employee.startDate) }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-slate-400">Contract/Probation End</dt>
            <dd class="text-slate-50">{{ formatYmdDateOrDash(employee.contractOrProbationEndDate) }}</dd>
          </div>
        </dl>
      </section>

      <section class="rounded-md border border-slate-800 bg-slate-900 p-4">
        <h2 class="mb-3 text-sm font-semibold text-slate-200">Talent</h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between gap-4">
            <dt class="text-slate-400">Rating</dt>
            <dd class="text-slate-50">{{ employee.talentRating ?? '—' }}</dd>
          </div>
        </dl>
      </section>
    </div>
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
  employeeStatus: string
  employeeType?: string
  gender?: string
  reportingTo?: string
  contractOrProbationEndDate?: string | null
  talentRating?: string
}

const route = useRoute()
const employeeKey = computed(() => String(route.params.employeeKey || ''))

const { data, pending, error } = await useFetch<Employee>(() => `/api/odoo/employees/${employeeKey.value}`)
const employee = computed(() => data.value ?? null)

function toTitleCase(input: string) {
  return input
    .trim()
    .split(/\s+/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
</script>

