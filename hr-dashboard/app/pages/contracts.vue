<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold">Employee Contract Management</h1>
      <p class="text-slate-300">Track employee contract information and manage changes.</p>
    </div>

    <hr class="border-slate-800" />

    <section class="space-y-3">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-slate-200">Contract Changes</h2>
          <p class="text-xs text-slate-400">Manually log employee contract changes.</p>
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

          <button
            v-if="hasActiveFilters"
            type="button"
            class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
            @click="clearFilters"
          >
            Clear
          </button>

          <div class="shrink-0 text-xs text-slate-400">Count: {{ filteredContractChanges.length }}</div>
          <button
            v-if="!showCreateForm"
            type="button"
            class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
            @click="showCreateForm = true"
          >
            + Add change
          </button>
        </div>
      </div>

      <form v-if="showCreateForm" class="rounded-md border border-slate-800 bg-slate-900 p-4" @submit.prevent="createChange">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-6">
          <label class="block md:col-span-2">
            <div class="mb-1 text-sm text-slate-300">Employee Name</div>
            <input
              v-model="createForm.employeeName"
              type="text"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            />
          </label>

          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Country</div>
            <select
              v-model="createForm.country"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            >
              <option value="" disabled>Select country</option>
              <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>

          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Department</div>
            <select
              v-model="createForm.department"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            >
              <option value="" disabled>Select department</option>
              <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
            </select>
          </label>

          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Position</div>
            <input
              v-model="createForm.position"
              type="text"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            />
          </label>

          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Change Type</div>
            <div ref="createChangeTypeEl" class="relative">
              <button
                type="button"
                class="flex w-full items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-left text-sm text-slate-50 hover:bg-slate-900/40"
                aria-haspopup="listbox"
                :aria-expanded="createChangeTypeOpen"
                @click="toggleCreateChangeTypeOpen"
                @keydown.escape.prevent="createChangeTypeOpen = false"
              >
                <span class="min-w-0 truncate" :class="createForm.changeTypes.length ? 'text-slate-50' : 'text-slate-500'">
                  {{ changeTypesSummary(createForm.changeTypes) }}
                </span>
                <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                  />
                </svg>
              </button>

              <div
                v-if="createChangeTypeOpen"
                class="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-slate-800 bg-slate-950 shadow-lg"
                role="listbox"
                @keydown.escape.prevent="createChangeTypeOpen = false"
              >
                <div class="py-1">
                  <label
                    v-for="t in CHANGE_TYPES"
                    :key="t"
                    class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-slate-900/40"
                  >
                    <input v-model="createForm.changeTypes" type="checkbox" :value="t" class="h-4 w-4 accent-slate-200" />
                    <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" :class="changeTypeBadgeClass(t)">
                      {{ t }}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </label>

          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Status</div>
            <div ref="createStatusEl" class="relative">
              <button
                type="button"
                class="flex w-full items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-left text-sm text-slate-50 hover:bg-slate-900/40"
                aria-haspopup="listbox"
                :aria-expanded="createStatusOpen"
                @click="toggleCreateStatusOpen"
                @keydown.escape.prevent="createStatusOpen = false"
              >
                <span
                  class="inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium"
                  :class="statusBadgeClass(createForm.status)"
                >
                  {{ createForm.status }}
                </span>
                <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                  />
                </svg>
              </button>

              <div
                v-if="createStatusOpen"
                class="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-slate-800 bg-slate-950 shadow-lg"
                role="listbox"
                @keydown.escape.prevent="createStatusOpen = false"
              >
                <button
                  v-for="s in STATUSES"
                  :key="s"
                  type="button"
                  class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-900/40"
                  @click="setCreateStatus(s as Status)"
                >
                  <span
                    class="inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium"
                    :class="statusBadgeClass(s as Status)"
                  >
                    {{ s }}
                  </span>
                  <span v-if="s === createForm.status" class="text-slate-300">✓</span>
                </button>
              </div>
            </div>
          </label>

          <label class="block md:col-span-6">
            <div class="mb-1 text-sm text-slate-300">Description of Change</div>
            <textarea
              v-model="createForm.description"
              rows="3"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            />
          </label>
        </div>

        <div class="mt-3 flex items-center justify-between gap-3">
          <div v-if="createError" class="text-xs text-red-200">{{ createError }}</div>
          <div class="ml-auto flex items-center gap-2">
            <button
              type="button"
              class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
              @click="cancelCreate"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40 disabled:opacity-60"
              :disabled="saving"
            >
              Add change
            </button>
          </div>
        </div>
      </form>

      <div v-if="pending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div v-else-if="error" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load contract changes.
        <div v-if="errorMessage" class="mt-2 text-xs text-red-200/80">{{ errorMessage }}</div>
      </div>

      <div v-else class="rounded-md border border-slate-800 bg-slate-900">
        <div class="overflow-x-auto overflow-y-visible">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-950 text-slate-300">
              <tr>
                <th class="px-4 py-3 font-medium">Employee Name</th>
                <th class="px-4 py-3 font-medium">Country</th>
                <th class="px-4 py-3 font-medium">Department</th>
                <th class="px-4 py-3 font-medium">Position</th>
                <th class="px-4 py-3 font-medium">Change Type</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Description of Change</th>
                <th class="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredContractChanges" :key="row.id" class="border-t border-slate-800 align-top">
                <template v-if="editId === row.id">
                  <td class="px-4 py-3">
                    <input
                      v-model="editForm.employeeName"
                      type="text"
                      class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <select
                      v-model="editForm.country"
                      class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                    >
                      <option value="" disabled>Select country</option>
                      <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </td>
                  <td class="px-4 py-3">
                    <select
                      v-model="editForm.department"
                      class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                    >
                      <option value="" disabled>Select department</option>
                      <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
                    </select>
                  </td>
                  <td class="px-4 py-3">
                    <input
                      v-model="editForm.position"
                      type="text"
                      class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <div ref="editChangeTypeEl" class="relative">
                      <button
                        type="button"
                        class="flex w-full items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-left text-sm text-slate-50 hover:bg-slate-900/40"
                        aria-haspopup="listbox"
                        :aria-expanded="editChangeTypeOpen"
                        @click="toggleEditChangeTypeOpen"
                        @keydown.escape.prevent="editChangeTypeOpen = false"
                      >
                        <span class="min-w-0 truncate" :class="editForm.changeTypes.length ? 'text-slate-50' : 'text-slate-500'">
                          {{ changeTypesSummary(editForm.changeTypes) }}
                        </span>
                        <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true">
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                          />
                        </svg>
                      </button>

                      <div
                        v-if="editChangeTypeOpen"
                        class="mt-1 w-full overflow-hidden rounded-md border border-slate-800 bg-slate-950 shadow-lg"
                        role="listbox"
                        @keydown.escape.prevent="editChangeTypeOpen = false"
                      >
                        <div class="py-1">
                          <label
                            v-for="t in CHANGE_TYPES"
                            :key="t"
                            class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-slate-900/40"
                          >
                            <input v-model="editForm.changeTypes" type="checkbox" :value="t" class="h-4 w-4 accent-slate-200" />
                            <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" :class="changeTypeBadgeClass(t)">
                              {{ t }}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <div ref="editStatusEl" class="relative">
                      <button
                        type="button"
                        class="flex w-full items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-left text-sm text-slate-50 hover:bg-slate-900/40"
                        aria-haspopup="listbox"
                        :aria-expanded="editStatusOpen"
                        @click="toggleEditStatusOpen"
                        @keydown.escape.prevent="editStatusOpen = false"
                      >
                        <span
                          class="inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium"
                          :class="statusBadgeClass(editForm.status)"
                        >
                          {{ editForm.status }}
                        </span>
                        <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true">
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                          />
                        </svg>
                      </button>

                      <div
                        v-if="editStatusOpen"
                        class="mt-1 w-full overflow-hidden rounded-md border border-slate-800 bg-slate-950 shadow-lg"
                        role="listbox"
                        @keydown.escape.prevent="editStatusOpen = false"
                      >
                        <button
                          v-for="s in STATUSES"
                          :key="s"
                          type="button"
                          class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-900/40"
                          @click="setEditStatus(s as Status)"
                        >
                          <span
                            class="inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium"
                            :class="statusBadgeClass(s as Status)"
                          >
                            {{ s }}
                          </span>
                          <span v-if="s === editForm.status" class="text-slate-300">✓</span>
                        </button>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <textarea
                      v-model="editForm.description"
                      rows="3"
                      class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                    />
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40"
                        @click="cancelEdit"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40 disabled:opacity-60"
                        :disabled="saving"
                        @click="saveEdit"
                      >
                        Save
                      </button>
                    </div>
                    <div v-if="editError" class="mt-2 text-xs text-red-200">{{ editError }}</div>
                  </td>
                </template>

                <template v-else>
                  <td class="px-4 py-3 text-slate-50">{{ row.employeeName }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ row.country || '—' }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ row.department }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ row.position }}</td>
                  <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="t in row.changeTypes"
                        :key="t"
                        class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                        :class="changeTypeBadgeClass(t)"
                      >
                        {{ t }}
                      </span>
                      <span v-if="(row.changeTypes?.length ?? 0) === 0" class="text-slate-400">—</span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium"
                      :class="statusBadgeClass((row.status ?? DEFAULT_STATUS) as Status)"
                    >
                      {{ row.status ?? DEFAULT_STATUS }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-slate-200">
                    <div class="whitespace-pre-wrap break-words">{{ row.description }}</div>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40"
                        @click="startEdit(row)"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        class="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-950/50"
                        @click="deleteChange(row.id)"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </template>
              </tr>

              <tr v-if="contractChanges.length === 0" class="border-t border-slate-800">
                <td colspan="8" class="px-4 py-6 text-center text-slate-300">No contract changes yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="!pending && !error && actionError" class="text-xs text-red-200">{{ actionError }}</div>
    </section>

    <hr class="border-slate-800" />

    <section class="space-y-3">
      <div class="space-y-1">
        <h2 class="text-base font-semibold text-slate-200">Upcoming Contracts</h2>
        <p class="text-xs text-slate-400">Contract/probation end dates within the next 60 days (approximately 2 months). 6 week notices highlighted.</p>
      </div>

      <div v-if="upcomingPending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div v-else-if="upcomingError" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load upcoming contracts.
        <div v-if="upcomingErrorMessage" class="mt-2 text-xs text-red-200/80">{{ upcomingErrorMessage }}</div>
      </div>
      <UpcomingContractsTable v-else :items="upcomingContracts" />
    </section>
  </div>
</template>

<script setup lang="ts">
type ChangeType = 'Salary' | 'Role' | 'Reporting' | 'Job Title' | 'Contract Extension' | 'Non-Renewal'
type Status = 'Approval required' | 'Approved' | 'On Hold'

type ContractChange = {
  id: string
  employeeName: string
  country?: string
  department: string
  position: string
  changeTypes: ChangeType[]
  status?: Status
  description: string
  createdAt: string
}

type Employee = { department: string; countryAssigned: string }

type HomeAnalytics = {
  upcomingContracts: Array<{
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

const CHANGE_TYPES: ChangeType[] = ['Salary', 'Role', 'Reporting', 'Job Title', 'Contract Extension', 'Non-Renewal']
const STATUSES: Status[] = ['Approval required', 'Approved', 'On Hold']
const DEFAULT_STATUS: Status = 'Approval required'

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function changeTypesSummary(values: ChangeType[]) {
  if (!values.length) return 'Select change type(s)'
  if (values.length <= 2) return values.join(', ')
  return `${values.length} selected`
}

function changeTypeBadgeClass(value: ChangeType) {
  if (value === 'Salary') return 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200'
  if (value === 'Role') return 'border-cyan-900/60 bg-cyan-950/30 text-cyan-200'
  if (value === 'Reporting') return 'border-teal-900/60 bg-teal-950/30 text-teal-200'
  if (value === 'Job Title') return 'border-sky-900/60 bg-sky-950/30 text-sky-200'
  if (value === 'Contract Extension') return 'border-violet-900/60 bg-violet-950/30 text-violet-200'
  return 'border-red-900/60 bg-red-950/30 text-red-200'
}

function statusBadgeClass(value: Status) {
  if (value === 'Approved') return 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200'
  if (value === 'On Hold') return 'border-slate-700 bg-slate-900 text-slate-200'
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

const {
  data,
  pending,
  error,
  refresh: refreshChanges
} = await useFetch<ContractChange[]>('/api/contract-changes')

const contractChanges = computed(() => data.value ?? [])
const errorMessage = computed(() => getErrorMessage(error.value))

const {
  data: upcomingData,
  pending: upcomingPending,
  error: upcomingError
} = await useFetch<HomeAnalytics>('/api/analytics/home')
const upcomingErrorMessage = computed(() => getErrorMessage(upcomingError.value))
const upcomingContracts = computed(() => upcomingData.value?.upcomingContracts ?? [])

const { data: employeesData } = await useFetch<Employee[]>('/api/employees')
const departments = computed(() => uniqueSorted((employeesData.value ?? []).map((e) => e.department)))
const countries = computed(() => uniqueSorted((employeesData.value ?? []).map((e) => e.countryAssigned)))

const filters = reactive({
  country: ''
})

const hasActiveFilters = computed(() => Object.values(filters).some((v) => (v ?? '').trim() !== ''))

function clearFilters() {
  filters.country = ''
}

const filteredContractChanges = computed(() => {
  const list = contractChanges.value ?? []
  const country = filters.country.trim()
  return list.filter((r) => {
    if (country && (r.country || '') !== country) return false
    return true
  })
})

const showCreateForm = ref(false)
const saving = ref(false)
const actionError = ref('')
const createError = ref('')

const createChangeTypeEl = ref<HTMLElement | null>(null)
const createChangeTypeOpen = ref(false)
const editChangeTypeEl = ref<HTMLElement | null>(null)
const editChangeTypeOpen = ref(false)
const createStatusEl = ref<HTMLElement | null>(null)
const createStatusOpen = ref(false)
const editStatusEl = ref<HTMLElement | null>(null)
const editStatusOpen = ref(false)

const createForm = reactive<{
  employeeName: string
  country: string
  department: string
  position: string
  changeTypes: ChangeType[]
  status: Status
  description: string
}>({
  employeeName: '',
  country: '',
  department: '',
  position: '',
  changeTypes: [],
  status: DEFAULT_STATUS,
  description: ''
})

const editId = ref<string | null>(null)
const editForm = reactive<{
  employeeName: string
  country: string
  department: string
  position: string
  changeTypes: ChangeType[]
  status: Status
  description: string
}>({
  employeeName: '',
  country: '',
  department: '',
  position: '',
  changeTypes: [],
  status: DEFAULT_STATUS,
  description: ''
})

const editError = ref('')

function cancelCreate() {
  createError.value = ''
  showCreateForm.value = false
  createChangeTypeOpen.value = false
  createStatusOpen.value = false
}

async function createChange() {
  createError.value = ''
  saving.value = true
  try {
    await $fetch('/api/contract-changes', { method: 'POST', body: { ...createForm } })
    createForm.employeeName = ''
    createForm.country = ''
    createForm.department = ''
    createForm.position = ''
    createForm.changeTypes = []
    createForm.status = DEFAULT_STATUS
    createForm.description = ''
    showCreateForm.value = false
    createChangeTypeOpen.value = false
    createStatusOpen.value = false
    await refreshChanges()
  } catch (err) {
    createError.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}

function startEdit(row: ContractChange) {
  editError.value = ''
  editId.value = row.id
  editForm.employeeName = row.employeeName
  editForm.country = row.country || ''
  editForm.department = row.department
  editForm.position = row.position
  editForm.changeTypes = (row.changeTypes ?? []).slice()
  editForm.status = (row.status ?? DEFAULT_STATUS) as Status
  editForm.description = row.description
  editChangeTypeOpen.value = false
  editStatusOpen.value = false
}

function cancelEdit() {
  editId.value = null
  editError.value = ''
  editChangeTypeOpen.value = false
  editStatusOpen.value = false
}

async function saveEdit() {
  const id = editId.value
  if (!id) return
  editError.value = ''
  saving.value = true
  try {
    await $fetch(`/api/contract-changes/${id}`, { method: 'PUT', body: { ...editForm } })
    editId.value = null
    editChangeTypeOpen.value = false
    editStatusOpen.value = false
    await refreshChanges()
  } catch (err) {
    editError.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}

async function deleteChange(id: string) {
  actionError.value = ''
  const ok = import.meta.client ? window.confirm('Delete this contract change?') : true
  if (!ok) return

  saving.value = true
  try {
    await $fetch(`/api/contract-changes/${id}`, { method: 'DELETE' })
    if (editId.value === id) editId.value = null
    editChangeTypeOpen.value = false
    editStatusOpen.value = false
    await refreshChanges()
  } catch (err) {
    actionError.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}

function toggleCreateChangeTypeOpen() {
  createChangeTypeOpen.value = !createChangeTypeOpen.value
}

function toggleEditChangeTypeOpen() {
  editChangeTypeOpen.value = !editChangeTypeOpen.value
}

function toggleCreateStatusOpen() {
  createStatusOpen.value = !createStatusOpen.value
}

function toggleEditStatusOpen() {
  editStatusOpen.value = !editStatusOpen.value
}

function setCreateStatus(value: Status) {
  createForm.status = value
  createStatusOpen.value = false
}

function setEditStatus(value: Status) {
  editForm.status = value
  editStatusOpen.value = false
}

function handleDocumentPointerDown(event: PointerEvent) {
  const t = event.target as Node | null
  if (!t) return

  if (createChangeTypeOpen.value && createChangeTypeEl.value && !createChangeTypeEl.value.contains(t)) {
    createChangeTypeOpen.value = false
  }
  if (editChangeTypeOpen.value && editChangeTypeEl.value && !editChangeTypeEl.value.contains(t)) {
    editChangeTypeOpen.value = false
  }
  if (createStatusOpen.value && createStatusEl.value && !createStatusEl.value.contains(t)) {
    createStatusOpen.value = false
  }
  if (editStatusOpen.value && editStatusEl.value && !editStatusEl.value.contains(t)) {
    editStatusOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

