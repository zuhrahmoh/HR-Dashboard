<template>
  <section class="space-y-3">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-1">
        <h2 class="text-base font-semibold text-slate-200">Medical Enrollments</h2>
        <p class="text-xs text-slate-400">Track enrollment plans and required follow-ups.</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="shrink-0 text-xs text-slate-400">Count: {{ filteredItems.length }}</div>
        <button
          v-if="!showCreateForm"
          type="button"
          class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
          @click="showCreateForm = true"
        >
          + Add enrollment
        </button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <label class="flex items-center gap-2 text-sm font-medium text-slate-300">
        <span class="whitespace-nowrap">Stage</span>
        <select
          v-model="filters.stage"
          class="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus:border-slate-600"
        >
          <option value="">All</option>
          <option v-for="s in MEDICAL_STAGES" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>

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

      <label class="flex items-center gap-2 text-sm font-medium text-slate-300">
        <span class="whitespace-nowrap">Vendor</span>
        <select
          v-model="filters.vendor"
          class="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus:border-slate-600"
        >
          <option value="">All</option>
          <option v-for="v in MEDICAL_VENDORS" :key="v" :value="v">{{ v }}</option>
        </select>
      </label>

      <button
        v-if="hasActiveFilters"
        type="button"
        class="h-8 rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-slate-200 hover:bg-slate-800/40"
        @click="clearFilters"
      >
        Clear
      </button>
    </div>

    <form
      v-if="showCreateForm"
      class="rounded-md border border-slate-800 bg-slate-900 p-4"
      @submit.prevent="createEnrollment"
    >
      <div class="grid grid-cols-1 gap-3 md:grid-cols-6">
        <label class="block md:col-span-2">
          <div class="mb-1 text-sm text-slate-300">Name</div>
          <input v-model="createForm.employeeName" type="text" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
        </label>

        <label class="block">
          <div class="mb-1 text-sm text-slate-300">Country</div>
          <select v-model="createForm.country" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50">
            <option value="" disabled>Select country</option>
            <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>

        <label class="block">
          <div class="mb-1 text-sm text-slate-300">Enrollment Type</div>
          <select
            v-model="createForm.enrollmentType"
            class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
          >
            <option value="" disabled>Select type</option>
            <option v-for="t in MEDICAL_ENROLLMENT_TYPES" :key="t" :value="t">{{ t }}</option>
          </select>
          <input
            v-if="createForm.enrollmentType === 'Other'"
            v-model="createForm.enrollmentTypeCustom"
            type="text"
            class="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            placeholder="Enter custom type"
          />
        </label>

        <label class="block">
          <div class="mb-1 text-sm text-slate-300">Vendor / Provider</div>
          <select v-model="createForm.vendor" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50">
            <option value="" disabled>Select vendor</option>
            <option v-for="v in MEDICAL_VENDORS" :key="v" :value="v">{{ v }}</option>
          </select>
        </label>

        <label class="block md:col-span-2">
          <div class="mb-1 text-sm text-slate-300">Status</div>
          <select v-model="createForm.stage" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50">
            <option value="" disabled>Select stage</option>
            <option v-for="s in MEDICAL_STAGES" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>

        <label class="block">
          <div class="mb-1 text-sm text-slate-300">Date Initiated</div>
          <DateInput v-model="createForm.dateInitiated" />
        </label>

        <label class="block md:col-span-2">
          <div class="mb-1 text-sm text-slate-300">Next Action</div>
          <input v-model="createForm.nextAction" type="text" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
        </label>

        <label class="block md:col-span-6">
          <div class="mb-1 text-sm text-slate-300">Attachments (link)</div>
          <input
            v-model="createForm.attachmentsUrl"
            type="url"
            class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            placeholder="https://..."
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
            Add enrollment
          </button>
        </div>
      </div>
    </form>

    <div v-if="pending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
    <div v-else-if="error" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
      Failed to load medical enrollments.
      <div v-if="errorMessage" class="mt-2 text-xs text-red-200/80">{{ errorMessage }}</div>
    </div>

    <div v-else class="rounded-md border border-slate-800 bg-slate-900">
      <div class="overflow-x-auto overflow-y-visible">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-950 text-slate-300">
            <tr>
              <th class="px-4 py-3 font-medium">Name</th>
              <th class="px-4 py-3 font-medium">Country</th>
              <th class="px-4 py-3 font-medium">Enrollment Type</th>
              <th class="px-4 py-3 font-medium">Vendor</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Date Initiated</th>
              <th class="px-4 py-3 font-medium">Next Action</th>
              <th class="px-4 py-3 font-medium">Attachments</th>
              <th class="px-4 py-3 font-medium">Last Updated</th>
              <th class="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredItems" :key="row.id" class="border-t border-slate-800 align-top">
              <template v-if="editId === row.id">
                <td class="px-4 py-3">
                  <input v-model="editForm.employeeName" type="text" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
                </td>
                <td class="px-4 py-3">
                  <select v-model="editForm.country" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50">
                    <option value="" disabled>Select country</option>
                    <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
                  </select>
                </td>
                <td class="px-4 py-3">
                  <select v-model="editForm.enrollmentType" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50">
                    <option value="" disabled>Select type</option>
                    <option v-for="t in MEDICAL_ENROLLMENT_TYPES" :key="t" :value="t">{{ t }}</option>
                  </select>
                  <input
                    v-if="editForm.enrollmentType === 'Other'"
                    v-model="editForm.enrollmentTypeCustom"
                    type="text"
                    class="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                    placeholder="Enter custom type"
                  />
                </td>
                <td class="px-4 py-3">
                  <select v-model="editForm.vendor" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50">
                    <option value="" disabled>Select vendor</option>
                    <option v-for="v in MEDICAL_VENDORS" :key="v" :value="v">{{ v }}</option>
                  </select>
                </td>
                <td class="px-4 py-3">
                  <select v-model="editForm.stage" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50">
                    <option value="" disabled>Select stage</option>
                    <option v-for="s in MEDICAL_STAGES" :key="s" :value="s">{{ s }}</option>
                  </select>
                </td>
                <td class="px-4 py-3">
                  <DateInput v-model="editForm.dateInitiated" />
                </td>
                <td class="px-4 py-3">
                  <input v-model="editForm.nextAction" type="text" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
                </td>
                <td class="px-4 py-3">
                  <input v-model="editForm.attachmentsUrl" type="url" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
                </td>
                <td class="px-4 py-3 text-slate-200">{{ formatDate(row.updatedAt) }}</td>
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
                <td class="px-4 py-3 font-medium text-slate-50">
                  <div class="max-w-56 truncate" :title="row.employeeName">{{ row.employeeName }}</div>
                </td>
                <td class="px-4 py-3 text-slate-200">{{ row.country }}</td>
                <td class="px-4 py-3">
                  <span
                    v-if="row.enrollmentType"
                    class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                    :class="enrollmentTypeBadgeClass(row.enrollmentType)"
                  >
                    {{ row.enrollmentType }}
                  </span>
                  <span v-else class="text-slate-400">—</span>
                </td>
                <td class="px-4 py-3 text-slate-200">{{ row.vendor || '—' }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" :class="stageBadgeClass(row.stage)">
                    {{ displayStage(row.stage) }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-4 py-3 tabular-nums text-slate-200">{{ row.dateInitiated || '—' }}</td>
                <td class="px-4 py-3 text-slate-200">
                  <div class="max-w-72 whitespace-normal break-words">{{ row.nextAction || '—' }}</div>
                </td>
                <td class="px-4 py-3 text-slate-200">
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
                <td class="whitespace-nowrap px-4 py-3 text-slate-200">{{ formatDate(row.updatedAt) }}</td>
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
                      @click="deleteEnrollment(row.id)"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </template>
            </tr>

            <tr v-if="filteredItems.length === 0" class="border-t border-slate-800">
              <td colspan="10" class="px-4 py-6 text-center text-slate-300">No enrollments found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="!pending && !error && actionError" class="text-xs text-red-200">{{ actionError }}</div>
  </section>
</template>

<script setup lang="ts">
import DateInput from '~/components/DateInput.vue'

type MedicalEnrollment = {
  id: string
  employeeName: string
  country: string
  enrollmentType?: string
  vendor?: string
  stage: string
  dateInitiated?: string
  nextAction?: string
  hrRepresentative?: string
  notes?: string
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

const MEDICAL_ENROLLMENT_TYPES = ['New enrollment', 'Change', 'Termination', 'Other'] as const

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

function normalizeForMatch(value: string) {
  return (value ?? '').trim().toLowerCase()
}

function stageBadgeClass(stage: string) {
  const v = normalizeForMatch(normalizeStage(stage))
  if (v.includes('tentative')) return 'border-slate-700 bg-slate-900 text-slate-200'
  if (v.includes('in progress')) return 'border-sky-900/60 bg-sky-950/30 text-sky-200'
  if (v.includes('completed')) return 'border-violet-900/60 bg-violet-950/30 text-violet-200'
  if (v.includes('approved')) return 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200'
  if (v.includes('submitted') || v.includes('pending')) return 'border-amber-900/60 bg-amber-950/30 text-amber-200'
  return 'border-sky-900/60 bg-sky-950/30 text-sky-200'
}

function enrollmentTypeBadgeClass(value: string) {
  const v = normalizeForMatch(value)
  if (v === 'new enrollment' || v === 'new enrolment' || v === 'new') return 'border-cyan-900/60 bg-cyan-950/30 text-cyan-200'
  if (v === 'change' || v === 'updated' || v === 'update') return 'border-fuchsia-900/60 bg-fuchsia-950/30 text-fuchsia-200'
  if (v === 'termination' || v === 'terminated' || v === 'cancelled' || v === 'canceled') return 'border-rose-900/60 bg-rose-950/30 text-rose-200'
  return 'border-lime-900/60 bg-lime-950/30 text-lime-200'
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

function enrollmentTypeForSubmit(selection: string, custom: string) {
  if (selection !== 'Other') return selection
  const c = (custom ?? '').trim()
  return c || 'Other'
}

function splitEnrollmentTypeForForm(value: string) {
  const v = normalizeEnrollmentType(value)
  if (!v) return { selection: '', custom: '' }
  const isPreset = (MEDICAL_ENROLLMENT_TYPES as readonly string[]).includes(v as any)
  if (isPreset) return { selection: v, custom: '' }
  return { selection: 'Other', custom: v }
}


const {
  data,
  pending,
  error,
  refresh: refreshItems
} = await useFetch<MedicalEnrollment[]>('/api/medical-enrollments')

const items = computed(() => data.value ?? [])
const errorMessage = computed(() => getErrorMessage(error.value))

const { data: employeesData } = await useFetch<Employee[]>('/api/employees')
const countries = computed(() => uniqueSorted((employeesData.value ?? []).map((e) => e.countryAssigned)))

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
    if (country && r.country !== country) return false
    if (vendor && (r.vendor || '') !== vendor) return false
    return true
  })
})

const showCreateForm = ref(false)
const saving = ref(false)
const actionError = ref('')
const createError = ref('')

const createForm = reactive({
  employeeName: '',
  country: '',
  enrollmentType: '',
  enrollmentTypeCustom: '',
  vendor: '',
  stage: '',
  dateInitiated: '',
  nextAction: '',
  attachmentsUrl: ''
})

const editId = ref<string | null>(null)
const editForm = reactive({
  employeeName: '',
  country: '',
  enrollmentType: '',
  enrollmentTypeCustom: '',
  vendor: '',
  stage: '',
  dateInitiated: '',
  nextAction: '',
  attachmentsUrl: ''
})

const editError = ref('')

function cancelCreate() {
  createError.value = ''
  showCreateForm.value = false
}

async function createEnrollment() {
  createError.value = ''
  saving.value = true
  try {
    await $fetch('/api/medical-enrollments', {
      method: 'POST',
      body: {
        employeeName: createForm.employeeName,
        country: createForm.country,
        enrollmentType: enrollmentTypeForSubmit(createForm.enrollmentType, createForm.enrollmentTypeCustom),
        vendor: createForm.vendor,
        stage: normalizeStage(createForm.stage),
        dateInitiated: createForm.dateInitiated,
        nextAction: createForm.nextAction,
        attachmentsUrl: createForm.attachmentsUrl
      }
    })
    createForm.employeeName = ''
    createForm.country = ''
    createForm.enrollmentType = ''
    createForm.enrollmentTypeCustom = ''
    createForm.vendor = ''
    createForm.stage = ''
    createForm.dateInitiated = ''
    createForm.nextAction = ''
    createForm.attachmentsUrl = ''
    showCreateForm.value = false
    await refreshItems()
  } catch (err) {
    createError.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}

function startEdit(row: MedicalEnrollment) {
  editError.value = ''
  editId.value = row.id
  editForm.employeeName = row.employeeName
  editForm.country = row.country
  const et = splitEnrollmentTypeForForm(row.enrollmentType || '')
  editForm.enrollmentType = et.selection
  editForm.enrollmentTypeCustom = et.custom
  editForm.vendor = row.vendor || ''
  editForm.stage = normalizeStage(row.stage)
  editForm.dateInitiated = row.dateInitiated || ''
  editForm.nextAction = row.nextAction || ''
  editForm.attachmentsUrl = row.attachmentsUrl || ''
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
    await $fetch(`/api/medical-enrollments/${id}`, {
      method: 'PUT',
      body: {
        employeeName: editForm.employeeName,
        country: editForm.country,
        enrollmentType: enrollmentTypeForSubmit(editForm.enrollmentType, editForm.enrollmentTypeCustom),
        vendor: editForm.vendor,
        stage: normalizeStage(editForm.stage),
        dateInitiated: editForm.dateInitiated,
        nextAction: editForm.nextAction,
        attachmentsUrl: editForm.attachmentsUrl
      }
    })
    editId.value = null
    await refreshItems()
  } catch (err) {
    editError.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}

async function deleteEnrollment(id: string) {
  actionError.value = ''
  const ok = import.meta.client ? window.confirm('Delete this enrollment?') : true
  if (!ok) return

  saving.value = true
  try {
    await $fetch(`/api/medical-enrollments/${id}`, { method: 'DELETE' })
    if (editId.value === id) editId.value = null
    await refreshItems()
  } catch (err) {
    actionError.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}
</script>

