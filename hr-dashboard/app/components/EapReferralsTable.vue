<template>
  <section class="space-y-3">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-1">
        <h2 class="text-base font-semibold text-slate-200">Employee Assistance Program Referrals</h2>
        <p class="text-xs text-slate-400">Track EAP referrals and follow-ups.</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="shrink-0 text-xs text-slate-400">Count: {{ items.length }}</div>
        <button
          v-if="!showCreateForm"
          type="button"
          class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
          @click="showCreateForm = true"
        >
          + Add referral
        </button>
      </div>
    </div>

    <form v-if="showCreateForm" class="rounded-md border border-slate-800 bg-slate-900 p-4" @submit.prevent="createReferral">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-6">
        <label class="block md:col-span-2">
          <div class="mb-1 text-sm text-slate-300">Employee Name</div>
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
          <div class="mb-1 text-sm text-slate-300">Referral Source</div>
          <select v-model="createForm.referralSource" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50">
            <option value="" disabled>Select source</option>
            <option v-for="s in REFERRAL_SOURCES" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>

        <label class="block">
          <div class="mb-1 text-sm text-slate-300">Referral Date</div>
          <DateInput v-model="createForm.referralDate" />
        </label>

        <label class="block">
          <div class="mb-1 text-sm text-slate-300">Reason Category</div>
          <select v-model="createForm.reasonCategory" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50">
            <option value="" disabled>Select category</option>
            <option v-for="c in REASON_CATEGORIES" :key="c" :value="c">{{ c }}</option>
          </select>
          <input
            v-if="createForm.reasonCategory === 'Other'"
            v-model="createForm.reasonCategoryCustom"
            type="text"
            class="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            placeholder="Enter custom category"
          />
        </label>

        <label class="block md:col-span-3">
          <div class="mb-1 text-sm text-slate-300">Reason Details</div>
          <textarea v-model="createForm.reasonDetails" rows="2" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
        </label>

        <label class="block">
          <div class="mb-1 text-sm text-slate-300">Program Status</div>
          <select v-model="createForm.programStatus" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50">
            <option value="" disabled>Select status</option>
            <option v-for="s in PROGRAM_STATUSES" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>

        <label class="block md:col-span-3">
          <div class="mb-1 text-sm text-slate-300">Outcome / Notes</div>
          <textarea v-model="createForm.outcomeNotes" rows="2" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
        </label>

        <label class="block">
          <div class="mb-1 text-sm text-slate-300">Close Date</div>
          <DateInput v-model="createForm.closeDate" />
        </label>

        <label class="block md:col-span-2">
          <div class="mb-1 text-sm text-slate-300">Closed Reason</div>
          <select v-model="createForm.closedReason" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50">
            <option value="" disabled>Select reason</option>
            <option v-for="r in CLOSED_REASONS" :key="r" :value="r">{{ r }}</option>
          </select>
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
            Add referral
          </button>
        </div>
      </div>
    </form>

    <div v-if="pending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
    <div v-else-if="error" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
      Failed to load EAP referrals.
      <div v-if="errorMessage" class="mt-2 text-xs text-red-200/80">{{ errorMessage }}</div>
    </div>

    <div v-else class="rounded-md border border-slate-800 bg-slate-900">
      <div class="overflow-x-auto overflow-y-visible">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-950 text-slate-300">
            <tr>
              <th class="px-4 py-3 font-medium">Employee Name</th>
              <th class="px-4 py-3 font-medium">Country</th>
              <th class="px-4 py-3 font-medium">Referral Source</th>
              <th class="px-4 py-3 font-medium">Referral Date</th>
              <th class="px-4 py-3 font-medium">Reason Category</th>
              <th class="px-4 py-3 font-medium">Reason Details</th>
              <th class="px-4 py-3 font-medium">Program Status</th>
              <th class="px-4 py-3 font-medium">Outcome / Notes</th>
              <th class="px-4 py-3 font-medium">Close Date</th>
              <th class="px-4 py-3 font-medium">Closed Reason</th>
              <th class="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in items" :key="row.id" class="border-t border-slate-800 align-top">
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
                  <select v-model="editForm.referralSource" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50">
                    <option value="" disabled>Select source</option>
                    <option v-for="s in REFERRAL_SOURCES" :key="s" :value="s">{{ s }}</option>
                  </select>
                </td>
                <td class="px-4 py-3">
                  <DateInput v-model="editForm.referralDate" />
                </td>
                <td class="px-4 py-3">
                  <select v-model="editForm.reasonCategory" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50">
                    <option value="" disabled>Select category</option>
                    <option v-for="c in REASON_CATEGORIES" :key="c" :value="c">{{ c }}</option>
                  </select>
                  <input
                    v-if="editForm.reasonCategory === 'Other'"
                    v-model="editForm.reasonCategoryCustom"
                    type="text"
                    class="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                    placeholder="Enter custom category"
                  />
                </td>
                <td class="px-4 py-3">
                  <textarea v-model="editForm.reasonDetails" rows="2" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
                </td>
                <td class="px-4 py-3">
                  <select v-model="editForm.programStatus" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50">
                    <option value="" disabled>Select status</option>
                    <option v-for="s in PROGRAM_STATUSES" :key="s" :value="s">{{ s }}</option>
                  </select>
                </td>
                <td class="px-4 py-3">
                  <textarea v-model="editForm.outcomeNotes" rows="2" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
                </td>
                <td class="px-4 py-3">
                  <DateInput v-model="editForm.closeDate" />
                </td>
                <td class="px-4 py-3">
                  <select v-model="editForm.closedReason" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50">
                    <option value="" disabled>Select reason</option>
                    <option v-for="r in CLOSED_REASONS" :key="r" :value="r">{{ r }}</option>
                  </select>
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
                <td class="px-4 py-3 font-medium text-slate-50">
                  <div class="max-w-56 truncate" :title="row.employeeName">{{ row.employeeName }}</div>
                </td>
                <td class="px-4 py-3 text-slate-200">{{ row.country }}</td>
                <td class="px-4 py-3 text-slate-200">{{ row.referralSource || '—' }}</td>
                <td class="whitespace-nowrap px-4 py-3 tabular-nums text-slate-200">{{ row.referralDate }}</td>
                <td class="px-4 py-3">
                  <span
                    v-if="normalizeReasonCategory(row.reasonCategory)"
                    class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                    :class="reasonCategoryBadgeClass(row.reasonCategory)"
                  >
                    {{ normalizeReasonCategory(row.reasonCategory) }}
                  </span>
                  <span v-else class="text-slate-400">—</span>
                </td>
                <td class="px-4 py-3 text-slate-200">
                  <div class="max-w-[22rem] whitespace-pre-wrap break-words">{{ row.reasonDetails || '—' }}</div>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" :class="programStatusBadgeClass(row.programStatus)">
                    {{ row.programStatus }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-200">
                  <div class="max-w-[22rem] whitespace-pre-wrap break-words">{{ row.outcomeNotes || '—' }}</div>
                </td>
                <td class="whitespace-nowrap px-4 py-3 tabular-nums text-slate-200">{{ row.closeDate || '—' }}</td>
                <td class="px-4 py-3 text-slate-200">{{ row.closedReason || '—' }}</td>
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
                      @click="deleteReferral(row.id)"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </template>
            </tr>

            <tr v-if="items.length === 0" class="border-t border-slate-800">
              <td colspan="11" class="px-4 py-6 text-center text-slate-300">No referrals yet.</td>
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
import { ensureUsaOption } from '~/utils/countryOptions'

type EapReferral = {
  id: string
  employeeName: string
  country: string
  referralSource?: string
  referralDate: string
  reasonCategory: string
  reasonDetails?: string
  programStatus: string
  startDate?: string
  lastFollowUpDate?: string
  nextFollowUpDate?: string
  outcomeNotes?: string
  ownerHr?: string
  referralDocsUrl?: string
  closeDate?: string
  closedReason?: string
  createdAt: string
  updatedAt: string
}

type Employee = {
  name: string
  department: string
  countryAssigned: string
}

const REFERRAL_SOURCES = ['Manager', 'HR', 'Self', 'Medical', 'Other'] as const
const REASON_CATEGORIES = ['Stress Management', 'Underperformance', 'Leadership Issues', 'Personal Struggles', 'Other'] as const
const PROGRAM_STATUSES = ['Referred', 'Contacted', 'Active', 'On Hold', 'Completed', 'Exited'] as const
const CLOSED_REASONS = ['Completed', 'Withdrew', 'Not Eligible', 'Other'] as const

function normalizeReasonCategory(value: string) {
  const v = normalizeForMatch(value)
  if (v === 'drop in performance' || v === 'drop-in performance' || v === 'performance' || v === 'under performance') return 'Underperformance'
  if (v === 'leadership' || v === 'leadership issue' || v === 'leadership issues') return 'Leadership Issues'
  if (v === 'personal struggle' || v === 'personal struggles' || v === 'personal') return 'Personal Struggles'
  if (v === 'stress management' || v === 'stress') return 'Stress Management'
  return value.trim()
}

function reasonCategoryBadgeClass(value: string) {
  const v = normalizeForMatch(normalizeReasonCategory(value))
  if (v === 'stress management' || v === 'stress') return 'border-teal-900/60 bg-teal-950/30 text-teal-200'
  if (v === 'underperformance' || v === 'under performance' || v === 'performance' || v === 'drop in performance' || v === 'drop-in performance') return 'border-pink-900/60 bg-pink-950/30 text-pink-200'
  if (v === 'leadership issues' || v === 'leadership issue' || v === 'leadership') return 'border-indigo-900/60 bg-indigo-950/30 text-indigo-200'
  if (v === 'personal struggles' || v === 'personal struggle' || v === 'personal') return 'border-orange-900/60 bg-orange-950/30 text-orange-200'
  return 'border-lime-900/60 bg-lime-950/30 text-lime-200'
}


function reasonCategoryForSubmit(selection: string, custom: string) {
  if (selection !== 'Other') return selection
  const c = (custom ?? '').trim()
  return c || 'Other'
}

function splitReasonCategoryForForm(value: string) {
  const v = normalizeReasonCategory(value)
  const isPreset = (REASON_CATEGORIES as readonly string[]).includes(v)
  if (isPreset) return { selection: v, custom: '' }
  return { selection: 'Other', custom: v }
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function normalizeForMatch(value: string) {
  return (value ?? '').trim().toLowerCase()
}

function programStatusBadgeClass(value: string) {
  const v = normalizeForMatch(value)
  if (v === 'active') return 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200'
  if (v === 'completed' || v === 'exited') return 'border-violet-900/60 bg-violet-950/30 text-violet-200'
  if (v === 'on hold') return 'border-slate-700 bg-slate-900 text-slate-200'
  if (v === 'contacted') return 'border-sky-900/60 bg-sky-950/30 text-sky-200'
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

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString()
}

const {
  data,
  pending,
  error,
  refresh: refreshItems
} = await useFetch<EapReferral[]>('/api/eap-referrals')

const items = computed(() => data.value ?? [])
const errorMessage = computed(() => getErrorMessage(error.value))

const { data: employeesData } = await useFetch<Employee[]>('/api/odoo/employees')
const countries = computed(() => ensureUsaOption(uniqueSorted((employeesData.value ?? []).map((e) => e.countryAssigned))))

const showCreateForm = ref(false)
const saving = ref(false)
const actionError = ref('')
const createError = ref('')

const createForm = reactive({
  employeeName: '',
  country: '',
  referralSource: '',
  referralDate: '',
  reasonCategory: '',
  reasonCategoryCustom: '',
  reasonDetails: '',
  programStatus: '',
  outcomeNotes: '',
  closeDate: '',
  closedReason: ''
})

const editId = ref<string | null>(null)
const editForm = reactive({
  employeeName: '',
  country: '',
  referralSource: '',
  referralDate: '',
  reasonCategory: '',
  reasonCategoryCustom: '',
  reasonDetails: '',
  programStatus: '',
  outcomeNotes: '',
  closeDate: '',
  closedReason: ''
})

const editError = ref('')

function cancelCreate() {
  createError.value = ''
  showCreateForm.value = false
}

async function createReferral() {
  createError.value = ''
  saving.value = true
  try {
    await $fetch('/api/eap-referrals', {
      method: 'POST',
      body: {
        employeeName: createForm.employeeName,
        country: createForm.country,
        referralSource: createForm.referralSource,
        referralDate: createForm.referralDate,
        reasonCategory: reasonCategoryForSubmit(createForm.reasonCategory, createForm.reasonCategoryCustom),
        reasonDetails: createForm.reasonDetails,
        programStatus: createForm.programStatus,
        outcomeNotes: createForm.outcomeNotes,
        closeDate: createForm.closeDate,
        closedReason: createForm.closedReason
      }
    })
    createForm.employeeName = ''
    createForm.country = ''
    createForm.referralSource = ''
    createForm.referralDate = ''
    createForm.reasonCategory = ''
    createForm.reasonCategoryCustom = ''
    createForm.reasonDetails = ''
    createForm.programStatus = ''
    createForm.outcomeNotes = ''
    createForm.closeDate = ''
    createForm.closedReason = ''
    showCreateForm.value = false
    await refreshItems()
  } catch (err) {
    createError.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}

function startEdit(row: EapReferral) {
  editError.value = ''
  editId.value = row.id
  editForm.employeeName = row.employeeName
  editForm.country = row.country
  editForm.referralSource = row.referralSource || ''
  editForm.referralDate = row.referralDate
  const rc = splitReasonCategoryForForm(row.reasonCategory)
  editForm.reasonCategory = rc.selection
  editForm.reasonCategoryCustom = rc.custom
  editForm.reasonDetails = row.reasonDetails || ''
  editForm.programStatus = row.programStatus
  editForm.outcomeNotes = row.outcomeNotes || ''
  editForm.closeDate = row.closeDate || ''
  editForm.closedReason = row.closedReason || ''
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
    await $fetch(`/api/eap-referrals/${id}`, {
      method: 'PUT',
      body: {
        employeeName: editForm.employeeName,
        country: editForm.country,
        referralSource: editForm.referralSource,
        referralDate: editForm.referralDate,
        reasonCategory: reasonCategoryForSubmit(editForm.reasonCategory, editForm.reasonCategoryCustom),
        reasonDetails: editForm.reasonDetails,
        programStatus: editForm.programStatus,
        outcomeNotes: editForm.outcomeNotes,
        closeDate: editForm.closeDate,
        closedReason: editForm.closedReason
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

async function deleteReferral(id: string) {
  actionError.value = ''
  const ok = import.meta.client ? window.confirm('Delete this referral?') : true
  if (!ok) return

  saving.value = true
  try {
    await $fetch(`/api/eap-referrals/${id}`, { method: 'DELETE' })
    if (editId.value === id) editId.value = null
    await refreshItems()
  } catch (err) {
    actionError.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}
</script>

