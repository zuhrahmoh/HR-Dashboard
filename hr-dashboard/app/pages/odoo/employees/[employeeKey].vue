<template>
  <div class="space-y-5">
    <div v-if="pending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">
      Loading employee…
    </div>
    <div v-else-if="error" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
      Employee not found.
    </div>

    <div v-else-if="employee" class="space-y-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1">
          <NuxtLink to="/odoo/employees" class="text-sm text-slate-300 hover:text-slate-50">← Back to Employees</NuxtLink>
          <h1 class="text-3xl font-semibold tracking-tight">Employee Profile</h1>
        </div>

        <div class="flex flex-col items-end gap-2">
          <a
            v-if="employeeKey"
            :href="`/api/odoo/employees/${employeeKey}/pdf`"
            class="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
          >
            Download PDF
          </a>

          <button
            type="button"
            class="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!employeeKey || uploading"
            @click="openUploadPicker"
          >
            {{ uploading ? 'Uploading…' : 'Upload Document' }}
          </button>
          <input ref="uploadInput" type="file" class="hidden" @change="onFilePicked" />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section class="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-lg shadow-black/30">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex items-center gap-3">
              <div class="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-800 bg-slate-950 ring-1 ring-slate-700/40">
                <div class="grid h-full w-full place-items-center text-base font-semibold text-slate-300">{{ initials }}</div>
              </div>
              <div class="min-w-0">
                <div class="truncate text-lg font-semibold text-slate-50">{{ employee.name }}</div>
                <div class="mt-0.5 truncate text-sm text-slate-300">{{ employee.position || '—' }}</div>
              </div>
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
          <div class="mt-4 flex-1 rounded-lg bg-slate-950/40 p-3 ring-1 ring-slate-800/60">
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">Department</dt>
                <dd class="text-right text-slate-50">{{ employee.department || '—' }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">Company</dt>
                <dd class="text-right text-slate-50">{{ employee.companyName || '—' }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">Country</dt>
                <dd class="text-right text-slate-50">{{ employee.countryAssigned || '—' }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">Reporting To</dt>
                <dd class="text-right text-slate-50">{{ employee.reportingTo ?? '—' }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">Talent Rating</dt>
                <dd class="text-right text-slate-50">
                  <div class="flex flex-col items-end gap-1.5">
                    <span class="text-slate-50">{{ displayTalentRating }}</span>
                    <div class="flex justify-end gap-1" aria-hidden="true">
                      <template v-for="n in 5" :key="n">
                        <div
                          class="grid h-5 w-5 shrink-0 place-items-center rounded-full border"
                          :class="
                            n <= talentRatingStars
                              ? 'border-yellow-400/70 bg-yellow-400/10 text-yellow-400'
                              : 'border-slate-600 bg-slate-950 text-slate-500'
                          "
                        >
                          <svg class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
                            <path
                              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                            />
                          </svg>
                        </div>
                      </template>
                    </div>
                  </div>
                </dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">Talent Rating Score</dt>
                <dd class="text-right text-slate-50">0-25</dd>
              </div>
            </dl>
          </div>
        </section>

        <section class="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-black/30">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <h2 class="text-sm font-semibold text-slate-200">Contact</h2>
            <h2 class="text-sm font-semibold text-slate-200">Employment</h2>
          </div>

          <div class="mt-4 flex-1 overflow-hidden rounded-lg bg-slate-950/40 ring-1 ring-slate-800/60">
            <div class="grid h-full grid-cols-1 divide-y divide-slate-800/80 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div class="h-full p-4">
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

              <div class="h-full p-4">
                <dl class="space-y-3 text-sm">
                  <div class="space-y-1">
                    <dt class="text-slate-400">Start Date</dt>
                    <dd class="break-words text-slate-50">{{ formatYmdDateOrDash(employee.startDate) }}</dd>
                  </div>
                  <div class="space-y-1">
                    <dt class="text-slate-400">Tenure</dt>
                    <dd class="break-words text-slate-50">{{ employee.tenure ?? '—' }}</dd>
                  </div>
                  <div class="space-y-1">
                    <dt class="text-slate-400">Contract/Probation End</dt>
                    <dd class="break-words text-slate-50">{{ formatYmdDateOrDash(employee.contractOrProbationEndDate) }}</dd>
                  </div>
                  <div class="space-y-1">
                    <dt class="text-slate-400">Gender</dt>
                    <dd class="break-words text-slate-50">{{ employee.gender ?? '—' }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="space-y-4">
        <section class="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-black/30">
          <h2 class="text-sm font-semibold text-slate-200">Compensation</h2>
          <div class="mt-4 rounded-lg bg-slate-950/40 p-4 ring-1 ring-slate-800/60">
            <dl class="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">Currency</dt>
                <dd class="text-right text-slate-50">{{ compensation?.currency ?? '—' }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">Monthly Salary</dt>
                <dd class="text-right text-slate-50">{{ formatMoney(compensation?.monthlySalary, compensation?.currency) }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">Allowance</dt>
                <dd class="text-right text-slate-50">{{ formatMoney(compensation?.allowance, compensation?.currency) }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-400">Gross Salary</dt>
                <dd class="text-right text-slate-50">{{ formatMoney(compensation?.grossSalary, compensation?.currency) }}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section class="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-black/30">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-semibold text-slate-200">Employee Documents</h2>
            <button
              type="button"
              class="rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="attachmentsPending || uploading"
              @click="refreshAttachments"
            >
              Refresh
            </button>
          </div>

          <div class="mt-4 rounded-lg bg-slate-950/40 p-4 ring-1 ring-slate-800/60">
            <div v-if="attachmentsPending" class="text-sm text-slate-300">Loading documents…</div>
            <div v-else-if="attachmentsError" class="text-sm text-red-200">Could not load documents.</div>
            <div v-else-if="!attachments.length" class="text-sm text-slate-300">No documents uploaded yet.</div>
            <ul v-else class="max-h-96 divide-y divide-slate-800/80 overflow-auto pr-1">
              <li v-for="doc in attachments" :key="doc.id" class="flex items-center justify-between gap-3 py-2">
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium text-slate-50">{{ doc.name }}</div>
                  <div class="mt-0.5 flex flex-wrap gap-x-2 text-xs text-slate-400">
                    <span v-if="doc.mimetype">{{ doc.mimetype }}</span>
                    <span v-if="doc.fileSize != null">{{ formatBytes(doc.fileSize) }}</span>
                  </div>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <a
                    class="rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-900"
                    :href="`/api/odoo/employees/${employeeKey}/attachments/${doc.id}`"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    class="grid h-8 w-8 place-items-center rounded-md border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900 hover:text-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="uploading || deletingId === doc.id"
                    :aria-label="`Delete ${doc.name}`"
                    title="Delete"
                    @click="requestDeleteDoc(doc)"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M8.5 2.5a1 1 0 0 0-1 1V4H5.5a1 1 0 1 0 0 2h.47l.67 10.02A2 2 0 0 0 8.63 18h2.74a2 2 0 0 0 1.99-1.98L14.03 6h.47a1 1 0 1 0 0-2h-2v-.5a1 1 0 0 0-1-1h-3ZM9.5 4h1V3.5h-1V4Zm-1.5 4a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1Zm5 1a1 1 0 1 0-2 0v6a1 1 0 1 0 2 0V9Z"
                      />
                    </svg>
                  </button>
                </div>
              </li>
            </ul>

            <div v-if="uploadError" class="mt-3 rounded-md border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
              {{ uploadError }}
            </div>
          </div>
        </section>
      </div>

      <div
        v-if="pendingDeleteDoc"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        role="dialog"
        aria-modal="true"
        @click.self="closeDeleteModal"
      >
        <section class="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-xl shadow-black/50">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-base font-semibold text-slate-100">Delete document?</h3>
              <p class="mt-1 text-sm text-slate-300">
                This will permanently delete
                <span class="font-semibold text-slate-100">{{ pendingDeleteDoc.name }}</span>.
              </p>
            </div>
            <button
              type="button"
              class="grid h-8 w-8 place-items-center rounded-md border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900 hover:text-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isDeletingModalDoc"
              aria-label="Close"
              title="Close"
              @click="closeDeleteModal"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 0 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                />
              </svg>
            </button>
          </div>

          <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="h-9 rounded-md border border-slate-800 bg-slate-950 px-3 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isDeletingModalDoc"
              @click="closeDeleteModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="h-9 rounded-md border border-rose-900/60 bg-rose-950/30 px-3 text-sm font-semibold text-rose-200 hover:bg-rose-950/50 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isDeletingModalDoc"
              @click="confirmDeleteDoc"
            >
              {{ isDeletingModalDoc ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatYmdDateOrDash } from '~/utils/dates'
import { talentRatingStarsFromDisplay } from '~/utils/talentRatingDisplay'

type Employee = {
  employeeKey: string
  name: string
  department: string
  position: string
  startDate: string | null
  countryAssigned: string
  companyName?: string
  workAddress?: string
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

type EmployeeCompensation = {
  name: string
  monthlySalary: number | null
  allowance: number | null
  currency: string | null
  grossSalary: number | null
}

const compensationQuery = computed(() => ({ name: employee.value?.name || '' }))
const { data: compensationData } = await useFetch<EmployeeCompensation | null>('/api/compensation', {
  query: compensationQuery,
  watch: [compensationQuery],
  default: () => null
})
const compensation = computed(() => compensationData.value ?? null)

type EmployeeAttachment = {
  id: number
  name: string
  mimetype: string | null
  fileSize: number | null
  createdAt: string | null
  updatedAt: string | null
}

const {
  data: attachmentsData,
  pending: attachmentsPending,
  error: attachmentsError,
  refresh: refreshAttachments
} = await useFetch<EmployeeAttachment[]>(() => `/api/odoo/employees/${employeeKey.value}/attachments`, {
  default: () => []
})

const attachments = computed(() => attachmentsData.value ?? [])

const initials = computed(() => {
  const name = (employee.value?.name ?? '').trim()
  if (!name) return '—'
  const parts = name.split(/\s+/g).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (a + b).toUpperCase() || '—'
})

function formatMoney(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount == null || !Number.isFinite(amount)) return '—'
  const code = (currency || '').trim().toUpperCase()
  try {
    if (code && /^[A-Z]{3}$/.test(code)) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(amount)
    }
  } catch {}
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

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
  if (s === 'offboarding') return 'border-amber-400/30 bg-amber-500/10 text-amber-100'
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

const displayTalentRating = computed(() => {
  const r = employee.value?.talentRating?.trim()
  return r || '—'
})

const talentRatingStars = computed(() => talentRatingStarsFromDisplay(employee.value?.talentRating))

const uploadInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref<string | null>(null)
const deletingId = ref<number | null>(null)
const pendingDeleteDoc = ref<EmployeeAttachment | null>(null)

const isDeletingModalDoc = computed(() => {
  const docId = pendingDeleteDoc.value?.id
  return docId != null && deletingId.value === docId
})

function openUploadPicker() {
  uploadError.value = null
  uploadInput.value?.click()
}

function requestDeleteDoc(doc: EmployeeAttachment) {
  uploadError.value = null
  pendingDeleteDoc.value = doc
}

function closeDeleteModal() {
  if (isDeletingModalDoc.value) return
  pendingDeleteDoc.value = null
}

async function confirmDeleteDoc() {
  const doc = pendingDeleteDoc.value
  if (!doc) return
  uploadError.value = null

  deletingId.value = doc.id
  try {
    await $fetch(`/api/odoo/employees/${employeeKey.value}/attachments/${doc.id}`, { method: 'DELETE' })
    await refreshAttachments()
    pendingDeleteDoc.value = null
  } catch (err: any) {
    uploadError.value = err?.data?.message || err?.message || 'Delete failed.'
  } finally {
    deletingId.value = null
  }
}

async function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  input.value = ''
  if (!file) return

  uploading.value = true
  uploadError.value = null
  try {
    const form = new FormData()
    form.append('file', file, file.name)
    await $fetch(`/api/odoo/employees/${employeeKey.value}/attachments`, { method: 'POST', body: form })
    await refreshAttachments()
  } catch (err: any) {
    uploadError.value = err?.data?.message || err?.message || 'Upload failed.'
  } finally {
    uploading.value = false
  }
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let v = bytes
  let u = 0
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024
    u++
  }
  const rounded = u === 0 ? String(Math.round(v)) : v.toFixed(v >= 10 ? 1 : 2)
  return `${rounded} ${units[u]}`
}
</script>

