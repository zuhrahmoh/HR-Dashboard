<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold">Progressive Discipline</h1>
      <p class="text-slate-300">Log disciplinary cases and track status.</p>
    </div>

    <hr class="border-slate-800" />

    <div class="rounded-md border border-slate-700 bg-slate-800/20 p-3 text-xs text-slate-200">
      <div class="flex items-center gap-2 font-semibold text-slate-100">
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 text-amber-300">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M10 18a8 8 0 1 0 0-16a8 8 0 0 0 0 16Zm0-13.25a1 1 0 0 1 1 1V12a1 1 0 1 1-2 0V5.75a1 1 0 0 1 1-1Zm0 11.75a1.25 1.25 0 1 0 0-2.5a1.25 1.25 0 0 0 0 2.5Z"
          />
        </svg>
        <span>Progressive Discipline</span>
      </div>
      <div class="mt-2 space-y-1 text-slate-200/90">
        <div>
          1. Investigation of matter - Receive and acknowledge matter from complainant, (b) information gathering and investigation, (c) discuss and decide if to dismiss or file charge against employee and set hearing.
        </div>
        <div>
          2. Meet with employee/ recommendation - Conduct disciplinary meeting/ formal hearing, present a report to Executive Management inclusive of finding and recommendations (with required supports) on the matter.
        </div>
        <div>
          3. Finalize outcome of matter – Guilty: apply sentencing (fille note, warning with/without PIP, suspension with/without pay, termination or termination with legal action) or Innocent: dismiss charges.
        </div>
      </div>
    </div>

    <section class="space-y-3">
      <div class="space-y-2">
        <h2 class="text-base font-semibold text-slate-200">Cases</h2>
        <button
          v-if="!showCaseForm"
          type="button"
          class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
          @click="showCaseForm = true"
        >
          + Add case
        </button>
      </div>

      <form v-if="showCaseForm" class="rounded-md border border-slate-800 bg-slate-900 p-4" @submit.prevent="createCase">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-6">
          <label class="block md:col-span-2">
            <div class="mb-1 text-sm text-slate-300">Employee Name</div>
            <input
              v-model="caseForm.employeeName"
              type="text"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            />
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Department</div>
            <select
              v-model="caseForm.department"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            >
              <option value="" disabled>Select department</option>
              <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
            </select>
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Country</div>
            <select
              v-model="caseForm.country"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            >
              <option value="" disabled>Select country</option>
              <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Status</div>
            <select
              v-model="caseForm.status"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            >
              <option value="" disabled>Select status</option>
              <option v-for="s in DISCIPLINE_STATUSES" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
          <label class="block md:col-span-2">
            <div class="mb-1 text-sm text-slate-300">Summary</div>
            <input v-model="caseForm.summary" type="text" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
          </label>
        </div>

        <div class="mt-3 flex items-center justify-between gap-3">
          <div v-if="caseActionError" class="text-xs text-red-200">{{ caseActionError }}</div>
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
              Add case
            </button>
          </div>
        </div>
      </form>

      <div v-if="pending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div v-else-if="error" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load cases.
        <div v-if="errorMessage" class="mt-2 text-xs text-red-200/80">{{ errorMessage }}</div>
      </div>
      <div v-else class="overflow-hidden rounded-md border border-slate-800 bg-slate-900">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-950 text-slate-300">
              <tr>
                <th class="px-4 py-3 font-medium">Employee</th>
                <th class="px-4 py-3 font-medium">Department</th>
                <th class="px-4 py-3 font-medium">Country</th>
                <th class="px-4 py-3 font-medium">Summary</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Created Date</th>
                <th class="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in cases" :key="c.id" class="border-t border-slate-800 align-top">
                <template v-if="editId === c.id">
                  <td class="px-4 py-3">
                    <input
                      v-model="editForm.employeeName"
                      type="text"
                      class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                    />
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
                    <select
                      v-model="editForm.country"
                      class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                    >
                      <option value="" disabled>Select country</option>
                      <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </td>
                  <td class="px-4 py-3">
                    <input v-model="editForm.summary" type="text" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
                  </td>
                  <td class="px-4 py-3">
                    <select
                      v-model="editForm.status"
                      class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                    >
                      <option value="" disabled>Select status</option>
                      <option v-for="s in DISCIPLINE_STATUSES" :key="s" :value="s">{{ s }}</option>
                    </select>
                  </td>
                  <td class="px-4 py-3 text-slate-200">
                    {{ formatDate(c.createdAt) }}
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
                  <td class="px-4 py-3 text-slate-50">{{ c.employeeName }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ displayDepartment(c) }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ c.country || '—' }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ c.summary }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" :class="statusBadgeClass(c.status)">
                      {{ c.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-slate-200">{{ formatDate(c.createdAt) }}</td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40"
                        @click="startEdit(c)"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        class="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-950/50"
                        @click="deleteCase(c.id)"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </template>
              </tr>

              <tr v-if="cases.length === 0" class="border-t border-slate-800">
                <td colspan="7" class="px-4 py-6 text-center text-slate-300">No cases yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="!pending && !error && actionError" class="text-xs text-red-200">{{ actionError }}</div>
    </section>
  </div>
</template>

<script setup lang="ts">
type DisciplinaryCase = {
  id: string
  employeeName: string
  department?: string
  caseType?: string
  country?: string
  summary: string
  status: string
  createdAt: string
}

type Employee = {
  employeeKey: string
  name: string
  department: string
  countryAssigned: string
}

const DISCIPLINE_STATUSES = ['Investigation', 'Disciplinary meeting', 'Finalize Outcome'] as const

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

const {
  data,
  pending,
  error,
  refresh: refreshCases
} = await useFetch<DisciplinaryCase[]>('/api/disciplinary')

const cases = computed(() => data.value ?? [])
const errorMessage = computed(() => getErrorMessage(error.value))

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

const { data: employeesData } = await useFetch<Employee[]>('/api/employees')
const departments = computed(() => uniqueSorted((employeesData.value ?? []).map((e) => e.department)))
const countries = computed(() => uniqueSorted((employeesData.value ?? []).map((e) => e.countryAssigned)))

const showCaseForm = ref(false)
const caseForm = reactive({ employeeName: '', department: '', country: '', summary: '', status: '' })

const saving = ref(false)
const actionError = ref('')
const caseActionError = ref('')

const editId = ref<string | null>(null)
const editForm = reactive({ employeeName: '', department: '', country: '', summary: '', status: '' })
const editError = ref('')

function displayDepartment(c: DisciplinaryCase) {
  return c.department || c.caseType || '—'
}

function normalizeStatus(value: string) {
  return value.trim().toLowerCase()
}

function statusBadgeClass(value: string) {
  const v = normalizeStatus(value)
  if (v === 'investigation') return 'border-sky-900/60 bg-sky-950/30 text-sky-200'
  if (v === 'disciplinary meeting') return 'border-amber-900/60 bg-amber-950/30 text-amber-200'
  if (v === 'finalize outcome') return 'border-violet-900/60 bg-violet-950/30 text-violet-200'
  return 'border-slate-700 bg-slate-900 text-slate-200'
}

function cancelCreate() {
  caseActionError.value = ''
  showCaseForm.value = false
}

async function createCase() {
  caseActionError.value = ''
  saving.value = true
  try {
    await $fetch('/api/disciplinary', { method: 'POST', body: { ...caseForm } })
    caseForm.employeeName = ''
    caseForm.department = ''
    caseForm.country = ''
    caseForm.summary = ''
    caseForm.status = ''
    showCaseForm.value = false
    await refreshCases()
  } catch (err) {
    caseActionError.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}

function startEdit(c: DisciplinaryCase) {
  editError.value = ''
  editId.value = c.id
  editForm.employeeName = c.employeeName
  editForm.department = displayDepartment(c)
  editForm.country = c.country || ''
  editForm.summary = c.summary
  editForm.status = c.status
}

function cancelEdit() {
  editId.value = null
  editError.value = ''
}

async function saveEdit() {
  const id = editId.value
  if (!id) return
  editError.value = ''
  saving.value = true
  try {
    await $fetch(`/api/disciplinary/${id}`, { method: 'PUT', body: { ...editForm } })
    editId.value = null
    await refreshCases()
  } catch (err) {
    editError.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}

async function deleteCase(id: string) {
  actionError.value = ''
  saving.value = true
  try {
    await $fetch(`/api/disciplinary/${id}`, { method: 'DELETE' })
    if (editId.value === id) editId.value = null
    await refreshCases()
  } catch (err) {
    actionError.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}
</script>

