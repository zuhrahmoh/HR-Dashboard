<template>
  <div class="space-y-6">
    <div v-if="pending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">
      Loading employee…
    </div>
    <div v-else-if="error" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
      Employee not found.
    </div>

    <div v-else-if="employee" class="space-y-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-1">
          <NuxtLink to="/employees" class="text-sm text-slate-300 hover:text-slate-50">← Back to Employees</NuxtLink>
          <h1 class="text-3xl font-semibold tracking-tight">Employee Profile</h1>
          <p class="text-sm text-slate-300">Read-only view sourced from the employee CSV.</p>
        </div>

        <a
          v-if="employeeKey"
          :href="`/api/employees/${employeeKey}/pdf`"
          class="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
        >
          Download PDF
        </a>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr] lg:items-start">
        <aside class="space-y-4">
          <section class="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-black/30">
            <div class="flex items-center gap-3">
              <div class="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-800 bg-slate-950 ring-1 ring-slate-700/40">
                <div class="grid h-full w-full place-items-center text-base font-semibold text-slate-300">
                  {{ initials }}
                </div>
              </div>

              <div class="min-w-0">
                <div class="truncate text-base font-semibold text-slate-50">{{ employee.name }}</div>
                <div class="mt-0.5 truncate text-sm text-slate-300">{{ employee.position || '—' }}</div>
              </div>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <span class="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-200">
                {{ employee.employeeStatus || '—' }}
              </span>
              <span
                v-if="employee.employeeType"
                class="inline-flex items-center rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-200"
              >
                {{ employee.employeeType }}
              </span>
            </div>

            <div class="mt-4 rounded-lg bg-slate-950/40 p-3 ring-1 ring-slate-800/60">
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-400">Department</dt>
                  <dd class="text-right text-slate-50">{{ employee.department || '—' }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-400">Country</dt>
                  <dd class="text-right text-slate-50">{{ employee.countryAssigned || '—' }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-400">Reporting To</dt>
                  <dd class="text-right text-slate-50">{{ employee.reportingTo ?? '—' }}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section class="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-black/30">
            <h2 class="text-sm font-semibold text-slate-200">Contact</h2>
            <div class="mt-3 rounded-lg bg-slate-950/40 p-3 ring-1 ring-slate-800/60">
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-400">Email</dt>
                  <dd class="text-right text-slate-50">{{ employee.email ?? '—' }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-400">Phone</dt>
                  <dd class="text-right text-slate-50">{{ employee.phone ?? '—' }}</dd>
                </div>
              </dl>
            </div>
          </section>
        </aside>

        <div class="space-y-4">
          <section class="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-black/30">
            <h2 class="text-sm font-semibold text-slate-200">Employment</h2>
            <div class="mt-3 rounded-lg bg-slate-950/40 p-3 ring-1 ring-slate-800/60">
              <dl class="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-400">Start Date</dt>
                  <dd class="text-right text-slate-50">{{ formatYmdDateOrDash(employee.startDate) }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-400">Contract/Probation End</dt>
                  <dd class="text-right text-slate-50">{{ formatYmdDateOrDash(employee.contractOrProbationEndDate) }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-400">Gender</dt>
                  <dd class="text-right text-slate-50">{{ employee.gender ?? '—' }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-400">Employee Key</dt>
                  <dd class="text-right font-mono text-slate-400">{{ employee.employeeKey }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-400">Employment Status</dt>
                  <dd class="text-right text-slate-50">{{ employee.employmentStatus ?? '—' }}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section class="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-black/30">
            <h2 class="text-sm font-semibold text-slate-200">Compensation</h2>
            <div class="mt-3 rounded-lg bg-slate-950/40 p-3 ring-1 ring-slate-800/60">
              <dl class="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-400">Monthly Salary</dt>
                  <dd class="text-right text-slate-50">{{ employee.monthlySalary ?? '—' }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-400">Allowances</dt>
                  <dd class="text-right text-slate-50">{{ employee.allowances ?? '—' }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-400">Type of Allowance</dt>
                  <dd class="text-right text-slate-50">{{ employee.typeOfAllowance ?? '—' }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-400">Gross Salary</dt>
                  <dd class="text-right text-slate-50">{{ employee.grossSalary ?? '—' }}</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      </div>
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
  gender?: string
  reportingTo?: string
  email?: string
  phone?: string
  employeeType?: string
  employmentStatus?: string
  contractOrProbationEndDate?: string | null
  monthlySalary?: string
  allowances?: string
  grossSalary?: string
  typeOfAllowance?: string
}

const route = useRoute()
const employeeKey = computed(() => String(route.params.employeeKey || ''))

const { data, pending, error } = await useFetch<Employee>(() => `/api/employees/${employeeKey.value}`)
const employee = computed(() => data.value ?? null)

const initials = computed(() => {
  const name = (employee.value?.name ?? '').trim()
  if (!name) return '—'
  const parts = name.split(/\s+/g).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (a + b).toUpperCase() || '—'
})
</script>

