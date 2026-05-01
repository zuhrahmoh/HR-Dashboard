<template>
  <div class="min-w-0 space-y-3">
    <div v-if="rows.length === 0" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-sm text-slate-800">
      No check-ins approaching.
    </div>

    <div v-else class="rounded-md border border-slate-200 bg-white shadow-card">
      <table class="w-full table-fixed border-collapse text-center text-sm">
        <colgroup>
          <col style="width: 17%" />
          <col style="width: 21%" />
          <col style="width: 14%" />
          <col style="width: 11%" />
          <col style="width: 9%" />
          <col style="width: 11%" />
          <col style="width: 6%" />
          <col style="width: 11%" />
        </colgroup>
        <thead class="bg-slate-100 text-slate-600">
          <tr>
            <th class="px-3 py-3 align-bottom font-medium">Name</th>
            <th class="px-3 py-3 align-bottom font-medium">Position</th>
            <th class="px-3 py-3 align-bottom font-medium">Country</th>
            <th class="px-3 py-3 align-bottom font-medium">Start</th>
            <th class="px-3 py-3 align-bottom font-medium">Tenure</th>
            <th class="px-3 py-3 align-bottom font-medium">Milestone</th>
            <th class="px-3 py-3 align-bottom font-medium">Days</th>
            <th class="px-3 py-3 align-bottom font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.key" class="border-t border-hr-navy/25">
            <td class="min-w-0 px-3 py-3 align-top font-medium break-words text-slate-900">{{ r.name }}</td>
            <td class="min-w-0 px-3 py-3 align-top break-words text-slate-800">{{ r.position }}</td>
            <td class="min-w-0 px-3 py-3 align-top break-words text-slate-800">{{ r.countryAssigned }}</td>
            <td class="min-w-0 whitespace-nowrap px-3 py-3 align-top text-slate-800">{{ formatYmdDateOrDash(r.startDate) }}</td>
            <td class="min-w-0 px-3 py-3 align-top tabular-nums text-slate-800">{{ formatTenureReadable(r.tenure) }}</td>
            <td class="min-w-0 px-3 py-3 align-top">
              <span :class="[tableDataBadgeClass, checkinBadgeClass(r.months)]">
                {{ checkinLabel(r.months) }}
              </span>
            </td>
            <td class="whitespace-nowrap px-3 py-3 align-top font-bold tabular-nums text-hr-navy">{{ r.daysUntil }}</td>
            <td class="min-w-0 px-3 py-3 align-top">
              <CheckinStatusSelect :model-value="getStatusForRow(r)" @update:model-value="(v) => void setStatusForRow(r, v)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div
        v-if="historyOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="completed-checkins-dialog-title"
      >
        <button
          type="button"
          class="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]"
          aria-label="Dismiss"
          @click="historyOpen = false"
        />
        <div
          class="relative z-10 flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card"
          @click.stop
        >
          <div class="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div class="min-w-0">
              <h2 id="completed-checkins-dialog-title" class="text-base font-semibold text-slate-900">Completed check-ins</h2>
              <p class="mt-0.5 text-xs text-slate-500">History of onboarding check-ins marked as completed.</p>
            </div>
            <button
              type="button"
              class="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
              @click="historyOpen = false"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5" aria-hidden="true">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.21 4.21a.75.75 0 0 1 1.06 0L10 8.94l4.73-4.73a.75.75 0 1 1 1.06 1.06L11.06 10l4.73 4.73a.75.75 0 1 1-1.06 1.06L10 11.06l-4.73 4.73a.75.75 0 1 1-1.06-1.06L8.94 10 4.21 5.27a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </div>

          <div class="min-w-0 overflow-auto px-5 py-4">
            <div v-if="completedRows.length === 0" class="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-800">
              No completed check-ins yet.
            </div>
            <div v-else class="rounded-md border border-slate-200 bg-white">
              <table class="w-full table-fixed border-collapse text-center text-sm">
                <colgroup>
                  <col style="width: 16%" />
                  <col style="width: 18%" />
                  <col style="width: 12%" />
                  <col style="width: 10%" />
                  <col style="width: 9%" />
                  <col style="width: 10%" />
                  <col style="width: 7%" />
                  <col style="width: 18%" />
                </colgroup>
                <thead class="bg-slate-100 text-slate-600">
                  <tr>
                    <th class="px-3 py-3 align-bottom font-medium">Name</th>
                    <th class="px-3 py-3 align-bottom font-medium">Position</th>
                    <th class="px-3 py-3 align-bottom font-medium">Country</th>
                    <th class="px-3 py-3 align-bottom font-medium">Start</th>
                    <th class="px-3 py-3 align-bottom font-medium">Tenure</th>
                    <th class="px-3 py-3 align-bottom font-medium">Milestone</th>
                    <th class="px-3 py-3 align-bottom font-medium">Days</th>
                    <th class="px-3 py-3 align-bottom font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in completedRows" :key="r.key" class="border-t border-hr-navy/25">
                    <td class="min-w-0 px-3 py-3 align-top font-medium break-words text-slate-900">{{ r.name }}</td>
                    <td class="min-w-0 px-3 py-3 align-top break-words text-slate-800">{{ r.position }}</td>
                    <td class="min-w-0 px-3 py-3 align-top break-words text-slate-800">{{ r.countryAssigned }}</td>
                    <td class="min-w-0 whitespace-nowrap px-3 py-3 align-top text-slate-800">{{ formatYmdDateOrDash(r.startDate) }}</td>
                    <td class="min-w-0 px-3 py-3 align-top tabular-nums text-slate-800">{{ formatTenureReadable(r.tenure) }}</td>
                    <td class="min-w-0 px-3 py-3 align-top">
                      <span :class="[tableDataBadgeClass, checkinBadgeClass(r.months)]">
                        {{ checkinLabel(r.months) }}
                      </span>
                    </td>
                    <td class="whitespace-nowrap px-3 py-3 align-top font-bold tabular-nums text-hr-navy">{{ r.daysUntil }}</td>
                    <td class="min-w-0 px-3 py-3 align-top">
                      <CheckinStatusSelect :model-value="getStatusForRow(r)" @update:model-value="(v) => void setStatusForRow(r, v)" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { formatYmdDateOrDash } from '~/utils/dates'
import { formatTenureReadable } from '~/utils/tenure'
import { tableDataBadgeClass } from '~/utils/tableBadge'
import CheckinStatusSelect from '~/components/CheckinStatusSelect.vue'

type NewHire = {
  employeeKey: string
  name: string
  position: string
  department: string
  countryAssigned: string
  startDate: string | null
  tenure?: string
}

type StatusKey = 'no_action' | 'in_progress' | 'completed'

const props = defineProps<{
  items: NewHire[]
  checkinFilter?: 'all' | '1' | '2-3' | '4-6'
}>()

const emit = defineEmits<{
  (e: 'update:completedCount', value: number): void
}>()

const historyOpen = defineModel<boolean>('historyOpen', { default: false })

const statusByRowKey = ref<Record<string, StatusKey>>({})

const { data: checkinStatusesPayload, refresh: refreshCheckinStatuses } = useFetch<{ statuses: Record<string, string> }>(
  '/api/new-hire-checkin-statuses'
)

function normalizeStatusValue(raw: unknown): StatusKey | null {
  if (raw === 'no_action' || raw === 'in_progress' || raw === 'completed') return raw
  if (raw === 'pending') return 'no_action'
  return null
}

watch(
  checkinStatusesPayload,
  (p) => {
    if (!p?.statuses) return
    const next: Record<string, StatusKey> = {}
    for (const [k, raw] of Object.entries(p.statuses)) {
      if (typeof k !== 'string') continue
      const v = normalizeStatusValue(raw)
      if (v && v !== 'no_action') next[k] = v
    }
    statusByRowKey.value = next
  },
  { immediate: true }
)

function parseYmdUtcMs(ymd: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const ms = Date.UTC(y, mo - 1, d)
  const dt = new Date(ms)
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
  return ms
}

function addMonthsClampedUtcMs(startUtcMs: number, months: number) {
  const dt = new Date(startUtcMs)
  const y = dt.getUTCFullYear()
  const m0 = dt.getUTCMonth()
  const d = dt.getUTCDate()
  const target = new Date(Date.UTC(y, m0 + months, 1))
  const ty = target.getUTCFullYear()
  const tm0 = target.getUTCMonth()
  const lastDay = new Date(Date.UTC(ty, tm0 + 1, 0)).getUTCDate()
  const td = Math.min(d, lastDay)
  return Date.UTC(ty, tm0, td)
}

function utcTodayMs() {
  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

const DAY_MS = 24 * 60 * 60 * 1000
const APPROACH_WINDOW_DAYS = 14
const CHECKIN_MONTHS = [1, 2, 3, 4, 5, 6] as const

type Row = {
  key: string
  employeeKey: string
  name: string
  position: string
  countryAssigned: string
  startDate: string
  tenure?: string
  months: (typeof CHECKIN_MONTHS)[number]
  daysUntil: number
}

function monthAllowed(months: Row['months']) {
  const f = props.checkinFilter ?? 'all'
  if (f === '1') return months === 1
  if (f === '2-3') return months === 2 || months === 3
  if (f === '4-6') return months === 4 || months === 5 || months === 6
  return true
}

function storageKeyForRow(row: Row) {
  const ek = (row.employeeKey ?? '').trim()
  if (ek) return `emp:${ek}|start:${row.startDate}|checkin:${row.months}`
  return `row:${row.name}|${row.countryAssigned}|${row.startDate}|${row.months}`
}

function getStatusForRow(row: Row): StatusKey {
  return statusByRowKey.value[storageKeyForRow(row)] ?? 'no_action'
}

async function setStatusForRow(row: Row, status: StatusKey) {
  const k = storageKeyForRow(row)
  const prev = { ...statusByRowKey.value }
  const next = { ...statusByRowKey.value }
  if (status === 'no_action') delete next[k]
  else next[k] = status
  statusByRowKey.value = next
  try {
    await $fetch('/api/new-hire-checkin-statuses', { method: 'PUT', body: { rowKey: k, status } })
    await refreshCheckinStatuses()
  } catch {
    statusByRowKey.value = prev
  }
}

function checkinLabel(months: number) {
  return months === 1 ? '1 month' : `${months} months`
}

function checkinBadgeClass(months: number) {
  if (months === 1) return 'border-blue-200 bg-blue-50 text-blue-900'
  if (months === 2) return 'border-pink-200 bg-pink-50 text-pink-800'
  if (months === 3) return 'border-purple-200 bg-purple-50 text-brand-purple'
  if (months === 4) return 'border-teal-200 bg-teal-50 text-teal-800'
  if (months === 5) return 'border-pink-200 bg-pink-50 text-pink-800'
  return 'border-purple-200 bg-purple-50 text-brand-purple'
}

const rows = computed<Row[]>(() => {
  const today = utcTodayMs()
  const out: Row[] = []
  for (const i of props.items) {
    const start = (i.startDate ?? '').trim()
    const startMs = start ? parseYmdUtcMs(start) : null
    if (!startMs) continue
    const probationEnd = addMonthsClampedUtcMs(startMs, 6)
    if (today >= probationEnd) continue
    for (const months of CHECKIN_MONTHS) {
      if (!monthAllowed(months)) continue
      const dueMs = addMonthsClampedUtcMs(startMs, months)
      const daysUntil = Math.ceil((dueMs - today) / DAY_MS)
      const shouldShow = daysUntil >= 0 && daysUntil <= APPROACH_WINDOW_DAYS
      const key = `emp:${i.employeeKey}|start:${start}|checkin:${months}`
      const status = statusByRowKey.value[key] ?? 'no_action'
      if (!shouldShow || status === 'completed') continue
      out.push({
        key,
        employeeKey: i.employeeKey,
        name: i.name,
        position: i.position,
        countryAssigned: i.countryAssigned,
        startDate: start,
        tenure: i.tenure,
        months,
        daysUntil
      })
    }
  }
  return out.sort((a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name) || a.employeeKey.localeCompare(b.employeeKey))
})

const completedRows = computed<Row[]>(() => {
  const today = utcTodayMs()
  const out: Row[] = []
  for (const i of props.items) {
    const start = (i.startDate ?? '').trim()
    const startMs = start ? parseYmdUtcMs(start) : null
    if (!startMs) continue
    for (const months of CHECKIN_MONTHS) {
      if (!monthAllowed(months)) continue
      const key = `emp:${i.employeeKey}|start:${start}|checkin:${months}`
      const status = statusByRowKey.value[key] ?? 'no_action'
      if (status !== 'completed') continue
      const dueMs = addMonthsClampedUtcMs(startMs, months)
      const daysUntil = Math.ceil((dueMs - today) / DAY_MS)
      out.push({
        key,
        employeeKey: i.employeeKey,
        name: i.name,
        position: i.position,
        countryAssigned: i.countryAssigned,
        startDate: start,
        tenure: i.tenure,
        months,
        daysUntil
      })
    }
  }
  return out.sort((a, b) => b.daysUntil - a.daysUntil || a.name.localeCompare(b.name) || a.employeeKey.localeCompare(b.employeeKey))
})

watch(
  () => completedRows.value.length,
  (n) => emit('update:completedCount', n),
  { immediate: true }
)
</script>

