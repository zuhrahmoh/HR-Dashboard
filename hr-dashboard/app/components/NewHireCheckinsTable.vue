<template>
  <div class="space-y-3">
    <div v-if="rows.length === 0" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">
      No check-ins approaching.
    </div>

    <div v-else class="overflow-hidden rounded-md border border-slate-800 bg-slate-900">
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-950 text-slate-300">
            <tr>
              <th class="px-4 py-3 font-medium">Name</th>
              <th class="px-4 py-3 font-medium">Position</th>
              <th class="px-4 py-3 font-medium">Country</th>
              <th class="px-4 py-3 font-medium">Start Date</th>
              <th class="px-4 py-3 font-medium">Tenure</th>
              <th class="px-4 py-3 font-medium">Check-In Approaching</th>
              <th class="px-4 py-3 text-right font-medium">Days</th>
              <th class="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.key" class="border-t border-slate-800">
              <td class="whitespace-nowrap px-4 py-3 font-medium text-slate-50">{{ r.name }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-slate-200">{{ r.position }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-slate-200">{{ r.countryAssigned }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-slate-200">{{ formatYmdDateOrDash(r.startDate) }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-slate-200">{{ r.tenure || '—' }}</td>
              <td class="whitespace-nowrap px-4 py-3">
                <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold" :class="checkinBadgeClass(r.months)">
                  {{ checkinLabel(r.months) }}
                </span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-100">{{ r.daysUntil }}</td>
              <td class="whitespace-nowrap px-4 py-3">
                <CheckinStatusSelect :model-value="getStatusForRow(r)" @update:model-value="(v) => setStatusForRow(r, v)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatYmdDateOrDash } from '~/utils/dates'
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

const STORAGE_KEY = 'hr-dashboard:new-hire-checkins-status:v1'
const statusByRowKey = ref<Record<string, StatusKey>>({})

function safeParseObject(input: string | null) {
  if (!input) return null
  try {
    const v = JSON.parse(input) as unknown
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null
    return v as Record<string, unknown>
  } catch {
    return null
  }
}

onMounted(() => {
  const obj = safeParseObject(window.localStorage.getItem(STORAGE_KEY))
  if (!obj) return
  const next: Record<string, StatusKey> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof k !== 'string') continue
    if (v === 'no_action' || v === 'in_progress' || v === 'completed') next[k] = v
    else if (v === 'pending') next[k] = 'no_action'
  }
  statusByRowKey.value = next
})

watch(
  statusByRowKey,
  (v) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
  },
  { deep: true }
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

function setStatusForRow(row: Row, status: StatusKey) {
  const k = storageKeyForRow(row)
  statusByRowKey.value = { ...statusByRowKey.value, [k]: status }
}

function checkinLabel(months: number) {
  return `${months} month${months === 1 ? '' : 's'}`
}

function checkinBadgeClass(months: number) {
  if (months === 1) return 'border-sky-400/30 bg-sky-500/10 text-sky-200'
  if (months === 2) return 'border-amber-400/30 bg-amber-500/10 text-amber-200'
  if (months === 3) return 'border-violet-400/30 bg-violet-500/10 text-violet-200'
  if (months === 4) return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
  if (months === 5) return 'border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200'
  return 'border-rose-400/30 bg-rose-500/10 text-rose-200'
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
      if (!shouldShow) continue
      // if (!shouldShow || status === 'completed') continue
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
</script>

