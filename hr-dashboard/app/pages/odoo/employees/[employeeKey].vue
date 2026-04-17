<template>
  <div class="space-y-5">
    <div v-if="pending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">
      Loading employee…
    </div>
    <div v-else-if="error" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
      Employee not found.
    </div>

    <div v-else-if="employee" class="space-y-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1">
          <NuxtLink to="/odoo/employees" class="text-sm text-slate-600 hover:text-slate-900">← Back to Employees</NuxtLink>
          <h1 class="text-3xl font-semibold tracking-tight">Employee Profile</h1>
        </div>

        <div class="flex flex-col items-end gap-2">
          <a
            v-if="employeeKey"
            :href="`/api/odoo/employees/${employeeKey}/pdf`"
            class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 hover:bg-slate-100"
          >
            Download PDF
          </a>

          <button
            type="button"
            class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!employeeKey || uploading"
            @click="openUploadPicker"
          >
            {{ uploading ? 'Uploading…' : 'Upload Document' }}
          </button>
          <input ref="uploadInput" type="file" class="hidden" @change="onFilePicked" />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section class="flex flex-col rounded-xl border border-slate-200 bg-white shadow-card p-4 shadow-lg shadow-slate-900/10">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex items-center gap-3">
              <div class="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-50 ring-1 ring-slate-200/60">
                <div class="grid h-full w-full place-items-center text-base font-semibold text-slate-600">{{ initials }}</div>
              </div>
              <div class="min-w-0">
                <div class="truncate text-lg font-semibold text-hr-navy">{{ employee.name }}</div>
                <div class="mt-0.5 truncate text-sm text-slate-600">{{ employee.position || '—' }}</div>
              </div>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold text-hr-navy" :class="statusPillClass">
              {{ employee.employeeStatus || '—' }}
            </span>
            <span
              v-if="employee.employeeType"
              class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold text-hr-navy"
              :class="employmentTypePillClass"
            >
              {{ toTitleCase(employee.employeeType) }}
            </span>
          </div>
          <div class="mt-4 flex-1 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200/80">
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Department</dt>
                <dd class="text-right text-slate-900">{{ employee.department || '—' }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Company</dt>
                <dd class="text-right text-slate-900">{{ employee.companyName || '—' }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Country</dt>
                <dd class="text-right text-slate-900">{{ employee.countryAssigned || '—' }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Reporting To</dt>
                <dd class="text-right text-slate-900">{{ employee.reportingTo ?? '—' }}</dd>
              </div>
              <div v-if="(employee.manager ?? '').trim()" class="flex justify-between gap-4">
                <dt class="text-slate-500">Manager</dt>
                <dd class="text-right text-slate-900">{{ employee.manager }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">ELT</dt>
                <dd class="text-right text-slate-900">{{ (employee.elt ?? '').trim() || '—' }}</dd>
              </div>
              <template v-if="SHOW_TALENT_RATING_ON_PROFILE">
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500">Talent Rating</dt>
                  <dd class="text-right text-slate-900">
                    <div class="flex flex-col items-end gap-1.5">
                      <span class="text-slate-900">{{ displayTalentRating }}</span>
                      <div class="flex justify-end gap-1" aria-hidden="true">
                        <template v-for="n in 5" :key="n">
                          <div
                            class="grid h-5 w-5 shrink-0 place-items-center rounded-full border"
                            :class="
                              n <= talentRatingStars
                                ? 'border-yellow-400/70 bg-yellow-400/10 text-yellow-400'
                                : 'border-slate-300 bg-slate-200 text-slate-500'
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
                  <dt class="text-slate-500">Talent Rating Score</dt>
                  <dd class="text-right text-slate-900">0-25</dd>
                </div>
              </template>
            </dl>
          </div>
        </section>

        <section class="flex flex-col rounded-xl border border-slate-200 bg-white shadow-card p-5 shadow-lg shadow-slate-900/10">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <h2 class="text-sm font-semibold text-hr-navy">Contact</h2>
            <h2 class="text-sm font-semibold text-hr-navy">Employment</h2>
          </div>

          <div class="mt-4 flex-1 overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-200/80">
            <div class="grid h-full grid-cols-1 divide-y divide-hr-navy/25 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div class="h-full p-4">
                <dl class="space-y-3 text-sm">
                  <div class="space-y-1">
                    <dt class="text-slate-500">Work Email</dt>
                    <dd class="break-words text-slate-900">{{ employee.workEmail ?? '—' }}</dd>
                  </div>
                  <div class="space-y-1">
                    <dt class="text-slate-500">Work Phone</dt>
                    <dd class="break-words text-slate-900">{{ employee.workPhone ?? '—' }}</dd>
                  </div>
                  <div class="space-y-1">
                    <dt class="text-slate-500">Personal Phone</dt>
                    <dd class="break-words text-slate-900">{{ employee.personalPhone ?? '—' }}</dd>
                  </div>
                  <div class="space-y-1">
                    <dt class="text-slate-500">Gender</dt>
                    <dd class="break-words text-slate-900">{{ employee.gender ?? '—' }}</dd>
                  </div>
                </dl>
              </div>

              <div class="h-full p-4">
                <dl class="space-y-3 text-sm">
                  <div class="space-y-1">
                    <dt class="text-slate-500">Start Date</dt>
                    <dd class="break-words text-slate-900">{{ formatYmdDateOrDash(employee.startDate) }}</dd>
                  </div>
                  <div class="space-y-1">
                    <dt class="text-slate-500">Tenure</dt>
                    <dd class="break-words text-slate-900">{{ employee.tenure ?? '—' }}</dd>
                  </div>
                  <div v-if="probationEndProfile" class="space-y-1">
                    <dt class="text-slate-500">Probation End</dt>
                    <dd class="break-words text-slate-900">{{ probationEndProfile }}</dd>
                  </div>
                  <div v-if="contractStartProfile" class="space-y-1">
                    <dt class="text-slate-500">Contract Start</dt>
                    <dd class="break-words text-slate-900">{{ contractStartProfile }}</dd>
                  </div>
                  <div v-if="contractEndProfile" class="space-y-1">
                    <dt class="text-slate-500">Contract End</dt>
                    <dd class="break-words text-slate-900">{{ contractEndProfile }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="space-y-4">
        <section class="rounded-xl border border-slate-200 bg-white shadow-card p-5 shadow-lg shadow-slate-900/10">
          <h2 class="text-sm font-semibold text-hr-navy">Compensation</h2>
          <div class="mt-4 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200/80">
            <dl class="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Currency</dt>
                <dd class="text-right text-slate-900">{{ compensation?.currency ?? '—' }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Monthly Salary</dt>
                <dd class="text-right text-slate-900">{{ formatMoney(compensation?.monthlySalary, compensation?.currency) }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Allowance</dt>
                <dd class="text-right text-slate-900">{{ formatMoney(compensation?.allowance, compensation?.currency) }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Gross Salary</dt>
                <dd class="text-right text-slate-900">{{ formatMoney(compensation?.grossSalary, compensation?.currency) }}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white shadow-card p-5 shadow-lg shadow-slate-900/10">
          <h2 class="text-sm font-semibold text-hr-navy">Disciplinary cases</h2>
          <div class="mt-4 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200/80">
            <div v-if="disciplinaryPending" class="text-sm text-slate-600">Loading disciplinary cases…</div>
            <div v-else-if="disciplinaryError" class="text-sm text-red-800">Could not load disciplinary cases.</div>
            <div v-else-if="!disciplinaryCases.length" class="text-sm text-slate-600">No disciplinary cases logged.</div>
            <div v-else class="overflow-x-auto rounded-md border border-slate-200">
              <table class="min-w-full text-left text-sm">
                <thead class="bg-slate-100/80 text-slate-700">
                  <tr>
                    <th class="px-3 py-2 font-semibold">Summary</th>
                    <th class="px-3 py-2 font-semibold">Status</th>
                    <th class="whitespace-nowrap px-3 py-2 font-semibold">Logged</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in disciplinaryCases" :key="c.id" class="border-t border-hr-navy/20 align-top">
                    <td class="px-3 py-2 text-slate-900">{{ c.summary }}</td>
                    <td class="px-3 py-2">
                      <span :class="[tableDataBadgeClass, disciplinaryStatusClass(c.status)]">{{ c.status }}</span>
                    </td>
                    <td class="whitespace-nowrap px-3 py-2 text-slate-700">{{ formatDisciplinaryLoggedDate(c.createdAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="rounded-xl border border-slate-200 bg-white shadow-card p-5 shadow-lg shadow-slate-900/10">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-semibold text-hr-navy">Employee Documents</h2>
            <button
              type="button"
              class="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-hr-navy hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="attachmentsPending || uploading"
              @click="refreshAttachments"
            >
              Refresh
            </button>
          </div>

          <div class="mt-4 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200/80">
            <div v-if="attachmentsPending" class="text-sm text-slate-600">Loading documents…</div>
            <div v-else-if="attachmentsError" class="text-sm text-red-200">Could not load documents.</div>
            <div v-else-if="!attachments.length" class="text-sm text-slate-600">No documents uploaded yet.</div>
            <ul v-else class="max-h-96 divide-y divide-hr-navy/25 overflow-auto pr-1">
              <li v-for="doc in attachments" :key="doc.id" class="flex items-center justify-between gap-3 py-2">
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium text-slate-900">{{ doc.name }}</div>
                  <div class="mt-0.5 flex flex-wrap gap-x-2 text-xs text-slate-500">
                    <span v-if="doc.mimetype">{{ doc.mimetype }}</span>
                    <span v-if="doc.fileSize != null">{{ formatBytes(doc.fileSize) }}</span>
                  </div>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                  <a
                    class="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-hr-navy hover:bg-slate-100"
                    :href="`/api/odoo/employees/${employeeKey}/attachments/${doc.id}`"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    class="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
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
        <section class="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-card p-4 shadow-xl shadow-slate-900/12">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-base font-semibold text-hr-navy">Delete document?</h3>
              <p class="mt-1 text-sm text-slate-600">
                This will permanently delete
                <span class="font-semibold text-hr-navy">{{ pendingDeleteDoc.name }}</span>.
              </p>
            </div>
            <button
              type="button"
              class="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
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
              class="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-hr-navy hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
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
import { formatYmdDate, formatYmdDateOrDash } from '~/utils/dates'
import { tableDataBadgeClass } from '~/utils/tableBadge'
import { talentRatingStarsFromDisplay } from '~/utils/talentRatingDisplay'

/** Talent rating UI (Odoo field still returned by API). Set true to show again. */
const SHOW_TALENT_RATING_ON_PROFILE = false

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
  manager?: string
  elt?: string
  workEmail?: string
  personalEmail?: string
  workPhone?: string
  personalPhone?: string
  tenure?: string
  contractStartDate?: string | null
  contractEndDate?: string | null
  probationEndDate?: string | null
  contractOrProbationEndDate?: string | null
  talentRating?: string
}

const route = useRoute()
const employeeKey = computed(() => String(route.params.employeeKey || ''))

type DisciplinaryCaseRow = {
  id: string
  summary: string
  status: string
  createdAt: string
}

type EmployeeAttachment = {
  id: number
  name: string
  mimetype: string | null
  fileSize: number | null
  createdAt: string | null
  updatedAt: string | null
}

const [employeeRes, disciplinaryRes, attachmentsRes] = await Promise.all([
  useFetch<Employee>(() => `/api/odoo/employees/${employeeKey.value}`),
  useFetch<DisciplinaryCaseRow[]>(() => `/api/odoo/employees/${employeeKey.value}/disciplinary-cases`, {
    default: () => []
  }),
  useFetch<EmployeeAttachment[]>(() => `/api/odoo/employees/${employeeKey.value}/attachments`, {
    default: () => []
  })
])

const { data, pending, error } = employeeRes
const {
  data: disciplinaryCasesData,
  pending: disciplinaryPending,
  error: disciplinaryError
} = disciplinaryRes
const {
  data: attachmentsData,
  pending: attachmentsPending,
  error: attachmentsError,
  refresh: refreshAttachments
} = attachmentsRes

const employee = computed(() => data.value ?? null)

function formatYmdWhenPresent(value: string | null | undefined): string | null {
  const s = (value ?? '').trim()
  if (!s) return null
  return formatYmdDate(s)
}

const probationEndProfile = computed(() => formatYmdWhenPresent(employee.value?.probationEndDate))
const contractStartProfile = computed(() => formatYmdWhenPresent(employee.value?.contractStartDate))
const contractEndProfile = computed(() => formatYmdWhenPresent(employee.value?.contractEndDate))

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

const disciplinaryCases = computed(() => disciplinaryCasesData.value ?? [])

function formatDisciplinaryLoggedDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function disciplinaryStatusClass(status: string) {
  const v = (status || '').trim().toLowerCase()
  if (v === 'investigation') return 'border-sky-200 bg-sky-50 text-sky-800'
  if (v === 'disciplinary meeting') return 'border-amber-200 bg-amber-50 text-amber-900'
  if (v === 'conciliation') return 'border-blue-200 bg-blue-50 text-blue-800'
  if (v === 'outcome to be communicated') return 'border-indigo-200 bg-indigo-50 text-indigo-800'
  if (v === 'finalize outcome') return 'border-violet-200 bg-violet-50 text-violet-800'
  if (v === 'closed' || v === 'resolved') return 'border-emerald-200 bg-emerald-50 text-emerald-900'
  return 'border-slate-200 bg-slate-50 text-slate-800'
}

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
  if (s === 'active') return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-800'
  if (s === 'offboarding') return 'border-amber-400/40 bg-amber-500/10 text-amber-800'
  if (s === 'resigned' || s === 'fired' || s === 'retired' || s === 'separated') return 'border-slate-300 bg-slate-100 text-slate-800'
  return 'border-slate-300 bg-slate-100 text-slate-800'
})

const employmentTypePillClass = computed(() => {
  const t = normalizeEmployeeType(employee.value?.employeeType ?? '')
  if (t.includes('contract')) return 'border-violet-400/40 bg-violet-500/10 text-violet-800'
  if (t.includes('permanent')) return 'border-pink-400/40 bg-pink-500/10 text-pink-800'
  if (t.includes('intern')) return 'border-teal-400/40 bg-teal-500/10 text-teal-800'
  return 'border-slate-300 bg-slate-100 text-slate-800'
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

