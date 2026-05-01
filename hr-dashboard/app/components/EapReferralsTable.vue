<template>
  <section id="eap-referrals" class="surface-tint-hero scroll-mt-32 min-w-0 space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
    <div class="flex min-w-0 flex-wrap items-start justify-between gap-4">
      <div class="flex min-w-0 items-start gap-3">
        <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
        <div class="min-w-0 space-y-0.5">
          <h2 class="text-gradient-brand text-xl font-bold tracking-tight">Employee Assistance Program Referrals</h2>
          <p class="text-xs text-slate-500">Read-only: sourced from Odoo (employee profile → Benefits).</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="shrink-0 text-xs text-slate-400">Count: {{ items.length }}</div>
      </div>
    </div>

    <div v-if="pending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">Loading…</div>
    <div v-else-if="error" class="rounded-md border border-pink-200 bg-pink-50 p-4 text-pink-800">
      Failed to load EAP referrals.
      <div v-if="errorMessage" class="mt-2 text-xs text-pink-700/80">{{ errorMessage }}</div>
    </div>

    <div v-else class="rounded-md border border-slate-200 bg-white shadow-card">
      <table class="w-full table-fixed border-collapse text-left text-sm">
        <colgroup>
          <col style="width: 10%" />
          <col style="width: 8%" />
          <col style="width: 9%" />
          <col style="width: 8%" />
          <col style="width: 10%" />
          <col style="width: 17%" />
          <col style="width: 9%" />
          <col style="width: 14%" />
          <col style="width: 8%" />
          <col style="width: 7%" />
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
            <th class="px-3 py-3 align-bottom font-medium">Why closed</th>
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
            <td class="min-w-0 break-words px-3 py-3 align-top text-slate-800">{{ row.closedReason || '—' }}</td>
          </tr>

          <tr v-if="items.length === 0" class="border-t border-hr-navy/25">
            <td colspan="10" class="px-3 py-6 text-center text-slate-600">No referrals yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { tableDataBadgeClass } from '~/utils/tableBadge'

type EapReferral = {
  id: string
  employeeName: string
  country: string
  referralSource?: string
  referralDate: string
  reasonCategory: string
  reasonDetails?: string
  programStatus: string
  outcomeNotes?: string
  closeDate?: string
  closedReason?: string
  createdAt: string
  updatedAt: string
}

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
  if (v === 'stress management' || v === 'stress') return 'border-teal-200 bg-teal-50 text-teal-900'
  if (v === 'underperformance' || v === 'under performance' || v === 'performance' || v === 'drop in performance' || v === 'drop-in performance')
    return 'border-pink-200 bg-pink-50 text-pink-900'
  if (v === 'leadership issues' || v === 'leadership issue' || v === 'leadership') return 'border-indigo-200 bg-indigo-50 text-indigo-900'
  if (v === 'personal struggles' || v === 'personal struggle' || v === 'personal') return 'border-orange-200 bg-orange-50 text-orange-900'
  return 'border-lime-200 bg-lime-50 text-lime-900'
}

function normalizeForMatch(value: string) {
  return (value ?? '').trim().toLowerCase()
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

const { data, pending, error } = useFetch<EapReferral[]>('/api/odoo/eap-referrals')

const items = computed(() => data.value ?? [])
const errorMessage = computed(() => getErrorMessage(error.value))
</script>
