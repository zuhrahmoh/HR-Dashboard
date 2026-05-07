<template>
  <section id="eap-referrals" class="surface-tint-hero scroll-mt-32 min-w-0 space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
    <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <div class="flex min-w-0 items-start gap-3">
        <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
        <div class="min-w-0 space-y-0.5">
          <h2 class="text-gradient-brand text-xl font-bold tracking-tight">Employee Assistance Program Referrals</h2>
          <p class="text-xs text-slate-500">Tracked manually in this app.</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <button
          v-if="!showForm"
          type="button"
          class="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100"
          @click="openCreateForm"
        >
          <span aria-hidden="true" class="mr-1.5 font-semibold">+</span>
          <span>Add referral</span>
        </button>
        <div class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue">
          <span class="uppercase tracking-wide opacity-80">Count</span>
          <span class="tabular-nums">{{ items.length }}</span>
        </div>
      </div>
    </div>

    <form
      v-if="showForm"
      class="rounded-md border border-slate-200 bg-white shadow-card p-4"
      @submit.prevent="submitForm"
    >
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label class="block">
          <div class="mb-1 text-sm text-slate-600">Employee</div>
          <input
            v-model="form.employeeName"
            type="text"
            class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label class="block">
          <div class="mb-1 text-sm text-slate-600">Country</div>
          <input
            v-model="form.country"
            type="text"
            class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label class="block">
          <div class="mb-1 text-sm text-slate-600">Source</div>
          <input
            v-model="form.referralSource"
            type="text"
            class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            placeholder="e.g. Self-referral, Manager"
          />
        </label>
        <label class="block">
          <div class="mb-1 text-sm text-slate-600">Ref. date</div>
          <input
            v-model="form.referralDate"
            type="date"
            class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label class="block">
          <div class="mb-1 text-sm text-slate-600">Category</div>
          <select
            v-model="form.reasonCategory"
            class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          >
            <option value="" disabled>Select category</option>
            <option v-for="c in reasonCategories" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>
        <label class="block">
          <div class="mb-1 text-sm text-slate-600">Status</div>
          <select
            v-model="form.programStatus"
            class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          >
            <option value="" disabled>Select status</option>
            <option v-for="s in programStatuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>
        <label class="block md:col-span-3">
          <div class="mb-1 text-sm text-slate-600">Reason</div>
          <textarea
            v-model="form.reasonDetails"
            rows="2"
            class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
            placeholder="Brief description of the reason for referral"
          />
        </label>
        <label class="block md:col-span-3">
          <div class="mb-1 text-sm text-slate-600">Outcome</div>
          <textarea
            v-model="form.outcomeNotes"
            rows="2"
            class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
            placeholder="Outcome notes (optional)"
          />
        </label>
        <label class="block">
          <div class="mb-1 text-sm text-slate-600">Closed</div>
          <input
            v-model="form.closeDate"
            type="date"
            class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
        </label>
      </div>

      <div class="mt-3 flex items-center justify-between gap-3">
        <div v-if="formError" class="text-xs text-pink-700">{{ formError }}</div>
        <div class="ml-auto flex items-center gap-2">
          <button
            type="button"
            class="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100"
            @click="cancelForm"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100 disabled:opacity-60"
            :disabled="saving"
          >
            <span>{{ editId ? 'Save changes' : 'Add referral' }}</span>
          </button>
        </div>
      </div>
    </form>

    <div v-if="pending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">Loading…</div>
    <div v-else-if="error" class="rounded-md border border-pink-200 bg-pink-50 p-4 text-pink-800">
      Failed to load EAP referrals.
      <div v-if="errorMessage" class="mt-2 text-xs text-pink-700/80">{{ errorMessage }}</div>
    </div>

    <div v-else class="rounded-md border border-slate-200 bg-white shadow-card">
      <table class="w-full table-fixed border-collapse text-left text-sm">
        <colgroup>
          <col style="width: 11%" />
          <col style="width: 7%" />
          <col style="width: 9%" />
          <col style="width: 8%" />
          <col style="width: 11%" />
          <col style="width: 16%" />
          <col style="width: 9%" />
          <col style="width: 13%" />
          <col style="width: 8%" />
          <col style="width: 8%" />
        </colgroup>
        <thead class="bg-slate-100 text-slate-600">
          <tr>
            <th class="px-3 py-3 align-bottom font-medium">Employee</th>
            <th class="px-3 py-3 align-bottom font-medium">Country</th>
            <th class="px-3 py-3 align-bottom font-medium">Source</th>
            <th class="px-3 py-3 align-bottom font-medium">Ref. date</th>
            <th class="px-3 py-3 align-bottom font-medium">Category</th>
            <th class="px-3 py-3 align-bottom font-medium">Reason</th>
            <th class="px-3 py-3 align-bottom font-medium">Status</th>
            <th class="px-3 py-3 align-bottom font-medium">Outcome</th>
            <th class="px-3 py-3 align-bottom font-medium">Closed</th>
            <th class="px-3 py-3 align-bottom font-medium" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in items" :key="row.id" class="border-t border-hr-navy/25 align-top">
            <td class="min-w-0 break-words px-3 py-3 align-top font-medium text-slate-900">{{ row.employeeName }}</td>
            <td class="min-w-0 break-words px-3 py-3 align-top text-slate-800">{{ row.country || '—' }}</td>
            <td class="min-w-0 break-words px-3 py-3 align-top text-slate-800">{{ row.referralSource || '—' }}</td>
            <td class="min-w-0 whitespace-nowrap px-3 py-3 align-top tabular-nums text-slate-800">{{ row.referralDate || '—' }}</td>
            <td class="min-w-0 px-3 py-3 align-top">
              <span
                v-if="normalizeReasonCategory(row.reasonCategory)"
                :class="[tableDataBadgeClass, reasonCategoryBadgeClass(row.reasonCategory)]"
              >
                {{ normalizeReasonCategory(row.reasonCategory) }}
              </span>
              <span v-else class="text-slate-400">—</span>
            </td>
            <td class="min-w-0 break-words px-3 py-3 align-top text-slate-800">
              <div class="whitespace-pre-wrap break-words">{{ row.reasonDetails || '—' }}</div>
            </td>
            <td class="min-w-0 px-3 py-3 align-top">
              <span :class="[tableDataBadgeClass, programStatusBadgeClass(row.programStatus)]">
                {{ row.programStatus || '—' }}
              </span>
            </td>
            <td class="min-w-0 break-words px-3 py-3 align-top text-slate-800">
              <div class="whitespace-pre-wrap break-words">{{ row.outcomeNotes || '—' }}</div>
            </td>
            <td class="min-w-0 whitespace-nowrap px-3 py-3 align-top tabular-nums text-slate-800">{{ row.closeDate || '—' }}</td>
            <td class="min-w-0 px-3 py-3 align-top text-right">
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  class="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 hover:bg-slate-100"
                  @click="startEdit(row)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-md border border-pink-200 bg-pink-50 p-1.5 text-pink-800 hover:bg-pink-100 disabled:opacity-60"
                  :disabled="saving && deletingId === row.id"
                  aria-label="Delete referral"
                  title="Delete"
                  @click="askDeleteReferral(row)"
                >
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                    <path d="M3.5 5.5h13" />
                    <path d="M8 5.5V4a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 12 4v1.5" />
                    <path d="M5.5 5.5 6 16a1.5 1.5 0 0 0 1.5 1.4h5A1.5 1.5 0 0 0 14 16l.5-10.5" />
                    <path d="M8.5 9v5" />
                    <path d="M11.5 9v5" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="items.length === 0" class="border-t border-hr-navy/25">
            <td colspan="10" class="px-3 py-6 text-center text-slate-600">No referrals yet.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div
        v-if="deleteTarget"
        class="fixed inset-0 z-[1000] flex items-center justify-center px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="eap-delete-title"
      >
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="cancelDelete" />
        <div class="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div class="flex items-start gap-3">
            <div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-700">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true">
                <path d="M3.5 5.5h13" />
                <path d="M8 5.5V4a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 12 4v1.5" />
                <path d="M5.5 5.5 6 16a1.5 1.5 0 0 0 1.5 1.4h5A1.5 1.5 0 0 0 14 16l.5-10.5" />
                <path d="M8.5 9v5" />
                <path d="M11.5 9v5" />
              </svg>
            </div>
            <div class="min-w-0">
              <h3 id="eap-delete-title" class="text-base font-semibold text-hr-navy">Delete referral?</h3>
              <p class="mt-1 text-sm text-slate-600">
                This will permanently remove the EAP referral for
                <span class="font-medium text-slate-900">{{ deleteTarget.employeeName || 'this employee' }}</span>. This action cannot be undone.
              </p>
            </div>
          </div>
          <div v-if="deleteError" class="mt-3 rounded-md border border-pink-200 bg-pink-50 px-3 py-2 text-xs text-pink-800">{{ deleteError }}</div>
          <div class="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              class="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100 disabled:opacity-60"
              :disabled="saving"
              @click="cancelDelete"
            >
              Cancel
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-md border border-pink-200 bg-pink-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-pink-700 disabled:opacity-60"
              :disabled="saving"
              @click="confirmDelete"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true">
                <path d="M3.5 5.5h13" />
                <path d="M8 5.5V4a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 12 4v1.5" />
                <path d="M5.5 5.5 6 16a1.5 1.5 0 0 0 1.5 1.4h5A1.5 1.5 0 0 0 14 16l.5-10.5" />
              </svg>
              <span>{{ saving ? 'Deleting…' : 'Delete' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { tableDataBadgeClass } from '~/utils/tableBadge'

type EapReferral = {
  id: string
  employeeName: string
  country: string
  referralSource?: string | null
  referralDate: string
  reasonCategory: string
  reasonDetails?: string | null
  programStatus: string
  outcomeNotes?: string | null
  closeDate?: string | null
  createdAt: string
  updatedAt: string
}

const reasonCategories = ['Work-related matter', 'Personal matters'] as const
const programStatuses = ['Active', 'Contacted', 'On Hold', 'Completed', 'Exited'] as const

function normalizeForMatch(value: string) {
  return (value ?? '').trim().toLowerCase()
}

function normalizeReasonCategory(value: string) {
  const v = normalizeForMatch(value)
  if (v === 'work-related matter' || v === 'work related matter') return 'Work-related matter'
  if (v === 'personal matters' || v === 'personal matter') return 'Personal matters'
  return (value ?? '').trim()
}

function reasonCategoryBadgeClass(value: string) {
  const v = normalizeForMatch(normalizeReasonCategory(value))
  if (v === 'work-related matter') return 'border-indigo-200 bg-indigo-50 text-indigo-900'
  if (v === 'personal matters') return 'border-orange-200 bg-orange-50 text-orange-900'
  return 'border-slate-300 bg-white text-slate-800'
}

function programStatusBadgeClass(value: string) {
  const v = normalizeForMatch(value)
  if (v === 'active') return 'border-teal-200 bg-teal-50 text-teal-800'
  if (v === 'completed' || v === 'exited') return 'border-purple-200 bg-purple-50 text-brand-purple'
  if (v === 'on hold') return 'border-slate-300 bg-white text-slate-800'
  if (v === 'contacted') return 'border-blue-200 bg-blue-50 text-blue-900'
  return 'border-pink-200 bg-pink-50 text-pink-800'
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

const { data, pending, error, refresh } = useFetch<EapReferral[]>('/api/eap-referrals')

const items = computed(() => data.value ?? [])
const errorMessage = computed(() => getErrorMessage(error.value))

const showForm = ref(false)
const editId = ref<string | null>(null)
const saving = ref(false)
const deletingId = ref<string | null>(null)
const formError = ref('')

const emptyForm = () => ({
  employeeName: '',
  country: '',
  referralSource: '',
  referralDate: '',
  reasonCategory: '',
  reasonDetails: '',
  programStatus: '',
  outcomeNotes: '',
  closeDate: ''
})

const form = reactive(emptyForm())

function resetForm() {
  Object.assign(form, emptyForm())
  formError.value = ''
}

function openCreateForm() {
  editId.value = null
  resetForm()
  showForm.value = true
}

function startEdit(row: EapReferral) {
  editId.value = row.id
  form.employeeName = row.employeeName
  form.country = row.country
  form.referralSource = row.referralSource ?? ''
  form.referralDate = row.referralDate
  form.reasonCategory = normalizeReasonCategory(row.reasonCategory)
  form.reasonDetails = row.reasonDetails ?? ''
  form.programStatus = row.programStatus
  form.outcomeNotes = row.outcomeNotes ?? ''
  form.closeDate = row.closeDate ?? ''
  formError.value = ''
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editId.value = null
  resetForm()
}

async function submitForm() {
  formError.value = ''
  saving.value = true
  try {
    const body = {
      employeeName: form.employeeName.trim(),
      country: form.country.trim(),
      referralSource: form.referralSource.trim() || undefined,
      referralDate: form.referralDate.trim(),
      reasonCategory: normalizeReasonCategory(form.reasonCategory),
      reasonDetails: form.reasonDetails.trim() || undefined,
      programStatus: form.programStatus.trim(),
      outcomeNotes: form.outcomeNotes.trim() || undefined,
      closeDate: form.closeDate.trim() || undefined
    }
    if (editId.value) {
      await $fetch(`/api/eap-referrals/${editId.value}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/eap-referrals', { method: 'POST', body })
    }
    showForm.value = false
    editId.value = null
    resetForm()
    await refresh()
  } catch (err) {
    formError.value = getErrorMessage(err) || 'Failed to save referral.'
  } finally {
    saving.value = false
  }
}

const deleteTarget = ref<EapReferral | null>(null)
const deleteError = ref('')

function askDeleteReferral(row: EapReferral) {
  deleteTarget.value = row
  deleteError.value = ''
}

function cancelDelete() {
  if (saving.value) return
  deleteTarget.value = null
  deleteError.value = ''
}

async function confirmDelete() {
  const target = deleteTarget.value
  if (!target) return
  deleteError.value = ''
  saving.value = true
  deletingId.value = target.id
  try {
    await $fetch(`/api/eap-referrals/${target.id}`, { method: 'DELETE' })
    if (editId.value === target.id) cancelForm()
    deleteTarget.value = null
    await refresh()
  } catch (err) {
    deleteError.value = getErrorMessage(err) || 'Failed to delete referral.'
  } finally {
    saving.value = false
    deletingId.value = null
  }
}
</script>
