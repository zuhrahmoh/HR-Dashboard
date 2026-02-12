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
          <NuxtLink to="/odoo/employees" class="text-sm text-slate-300 hover:text-slate-50">← Back to Employees</NuxtLink>
          <h1 class="text-3xl font-semibold tracking-tight">Employee Profile</h1>
          <p class="text-sm text-slate-300">Read-only view sourced from Odoo.</p>
        </div>

        <a
          v-if="employeeKey"
          :href="`/api/odoo/employees/${employeeKey}/pdf`"
          class="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
        >
          Download PDF
        </a>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section class="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-black/30">
          <div class="flex items-center gap-3">
            <div class="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-800 bg-slate-950 ring-1 ring-slate-700/40">
              <div class="grid h-full w-full place-items-center text-base font-semibold text-slate-300">{{ initials }}</div>
            </div>
            <div class="min-w-0">
              <div class="truncate text-lg font-semibold text-slate-50">{{ employee.name }}</div>
              <div class="mt-0.5 truncate text-sm text-slate-300">{{ employee.position || '—' }}</div>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold text-slate-100" :class="statusPillClass">
              {{ employee.employeeStatus || '—' }}
            </span>
            <span
              v-if="employee.employeeType"
              class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold text-slate-100"
              :class="employmentTypePillClass"
            >
              {{ toTitleCase(employee.employeeType) }}
            </span>
          </div>
          <div class="mt-4 rounded-lg bg-slate-950/40 p-3 ring-1 ring-slate-800/60">
            <dl class="space-y-3 text-sm">
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
          <div class="mt-3 rounded-lg bg-slate-950/40 p-4 ring-1 ring-slate-800/60">
            <dl class="space-y-3 text-sm">
              <div class="space-y-1">
                <dt class="text-slate-400">Work Email</dt>
                <dd class="break-words text-slate-50">{{ employee.workEmail ?? '—' }}</dd>
              </div>
              <div class="space-y-1">
                <dt class="text-slate-400">Work Phone</dt>
                <dd class="break-words text-slate-50">{{ employee.workPhone ?? '—' }}</dd>
              </div>
              <div class="space-y-1">
                <dt class="text-slate-400">Personal Phone</dt>
                <dd class="break-words text-slate-50">{{ employee.personalPhone ?? '—' }}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section class="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-black/30 lg:col-span-2">
          <h2 class="text-sm font-semibold text-slate-200">Employment</h2>
          <div class="mt-4 rounded-lg bg-slate-950/40 p-4 ring-1 ring-slate-800/60">
            <dl class="grid grid-cols-5 gap-x-4 gap-y-1 text-sm">
              <div class="min-w-0">
                <dt class="text-slate-400">Start Date</dt>
                <dd class="truncate text-slate-50">{{ formatYmdDateOrDash(employee.startDate) }}</dd>
              </div>
              <div class="min-w-0">
                <dt class="text-slate-400">Tenure</dt>
                <dd class="truncate text-slate-50">{{ employee.tenure ?? '—' }}</dd>
              </div>
              <div class="min-w-0">
                <dt class="text-slate-400">Contract/Probation End</dt>
                <dd class="truncate text-slate-50">{{ formatYmdDateOrDash(employee.contractOrProbationEndDate) }}</dd>
              </div>
              <div class="min-w-0">
                <dt class="text-slate-400">Gender</dt>
                <dd class="truncate text-slate-50">{{ employee.gender ?? '—' }}</dd>
              </div>
              <div class="min-w-0 text-right">
                <dt class="text-slate-400">Employee Key</dt>
                <dd class="truncate font-mono text-slate-400">{{ employee.employeeKey }}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section class="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-black/30 lg:col-span-2">
          <h2 class="text-sm font-semibold text-slate-200">Talent</h2>
          <div class="mt-4 rounded-lg bg-slate-950/40 p-4 ring-1 ring-slate-800/60">
            <div class="flex flex-wrap items-center gap-3 text-sm">
              <span class="text-slate-400">Rating</span>
              <span class="font-medium text-slate-50">{{ displayTalentRating }}</span>
              <div class="flex gap-0.5" aria-hidden="true">
                <template v-for="n in 5" :key="n">
                  <svg
                    class="h-5 w-5 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    :class="n <= talentRatingStars ? 'text-yellow-400' : 'text-slate-600'"
                  >
                    <path
                      d="M10 2.25a5.75 5.75 0 1 0 0 11.5a5.75 5.75 0 0 0 0-11.5Zm0 2.05l.86 1.75l1.93.28l-1.39 1.35l.33 1.92L10 8.75L8.27 9.65l.33-1.92L7.2 6.38l1.93-.28L10 4.3Z"
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                    />
                    <path d="M7.0 12.55L3.8 19.25l4.6-3l1.85-3.7Z" />
                    <path d="M7.0 12.55L3.8 19.25l4.6-3l1.85-3.7Z" transform="translate(20 0) scale(-1 1)" />
                  </svg>
                </template>
              </div>
            </div>
          </div>
        </section>
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
  employeeType?: string
  gender?: string
  reportingTo?: string
  workEmail?: string
  personalEmail?: string
  workPhone?: string
  personalPhone?: string
  tenure?: string
  contractOrProbationEndDate?: string | null
  talentRating?: string
}

const route = useRoute()
const employeeKey = computed(() => String(route.params.employeeKey || ''))

const { data, pending, error } = await useFetch<Employee>(() => `/api/odoo/employees/${employeeKey.value}`)
const employee = computed(() => data.value ?? null)

const initials = computed(() => {
  const name = (employee.value?.name ?? '').trim()
  if (!name) return '—'
  const parts = name.split(/\s+/g).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (a + b).toUpperCase() || '—'
})

function normalizeStatus(value: string) {
  return value.trim().toLowerCase()
}

function normalizeEmployeeType(value: string) {
  const v = value.trim().toLowerCase()
  if (!v) return ''
  if (v.includes('perm')) return 'permanent'
  if (v.includes('contract')) return 'contract'
  if (v.includes('fixed')) return 'contract'
  if (v.includes('temp')) return 'contract'
  return v
}

const statusPillClass = computed(() => {
  const s = normalizeStatus(employee.value?.employeeStatus ?? '')
  if (s === 'active') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
  if (s === 'resigned' || s === 'fired' || s === 'retired' || s === 'separated') return 'border-slate-700 bg-slate-950 text-slate-200'
  return 'border-slate-700 bg-slate-950 text-slate-200'
})

const employmentTypePillClass = computed(() => {
  const t = normalizeEmployeeType(employee.value?.employeeType ?? '')
  if (t.includes('contract')) return 'border-violet-400/30 bg-violet-500/10 text-violet-100'
  if (t.includes('permanent')) return 'border-pink-400/30 bg-pink-500/10 text-pink-100'
  if (t.includes('intern')) return 'border-teal-400/30 bg-teal-500/10 text-teal-100'
  return 'border-slate-700 bg-slate-950 text-slate-200'
})

function toTitleCase(input: string) {
  return input
    .trim()
    .split(/\s+/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const TALENT_RATING_TO_STARS: Record<string, number> = {
  C: 1,
  'B-': 2,
  B: 3,
  'B+': 4,
  A: 5,
}

function parseTalentRatingStars(rating: string | undefined): number {
  if (!rating?.trim()) return 0
  const key = rating.trim().toUpperCase()
  return TALENT_RATING_TO_STARS[key] ?? 0
}

const displayTalentRating = computed(() => {
  const r = employee.value?.talentRating?.trim()
  return r || '—'
})

const talentRatingStars = computed(() => parseTalentRatingStars(employee.value?.talentRating))
</script>

