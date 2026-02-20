<template>
  <div class="space-y-3">
    <div
      v-if="upcomingGroups.length === 0 && pendingExpiryGroups.length === 0"
      class="rounded-md border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200"
    >
      No upcoming contract/probation end dates in the next 60 days.
    </div>

    <div v-else class="space-y-6">
      <div v-if="upcomingGroups.length > 0" class="space-y-4">
        <section v-for="group in upcomingGroups" :key="`upcoming__${group.countryKey}`" class="space-y-2">
          <h3 class="text-base font-semibold text-slate-200">
            {{ group.countryLabel }}
          </h3>

          <div class="overflow-x-auto overflow-y-visible rounded-md border border-slate-800 bg-slate-900">
            <table class="min-w-full text-left text-sm">
              <thead class="border-b border-slate-800 text-xs text-slate-400">
                <tr>
                  <th scope="col" class="px-4 py-3 font-medium">Name</th>
                  <th scope="col" class="px-4 py-3 font-medium">Department</th>
                  <th scope="col" class="px-4 py-3 font-medium">Position</th>
                  <th scope="col" class="px-4 py-3 font-medium">Reporting To</th>
                  <th scope="col" class="px-4 py-3 font-medium">End date</th>
                  <th scope="col" class="px-4 py-3 font-medium">Status</th>
                  <th scope="col" class="px-4 py-3 text-right font-medium">Days</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr
                  v-for="(row, rowIdx) in group.rows"
                  :key="row.key"
                  :class="upcomingRowClass(row, rowIdx, group.rows.length)"
                >
                  <td class="px-4 py-3 font-medium text-slate-100">
                    <div class="max-w-52 truncate" :title="row.name || ''">{{ row.name || '—' }}</div>
                  </td>
                  <td class="px-4 py-3 text-slate-300">
                    <div class="max-w-48 truncate" :title="row.department || ''">{{ row.department || '—' }}</div>
                  </td>
                  <td class="px-4 py-3 text-slate-300">
                    <div class="max-w-56 truncate" :title="row.position || ''">{{ row.position || '—' }}</div>
                  </td>
                  <td class="px-4 py-3 text-slate-300">
                    <div class="max-w-56 truncate" :title="row.reportingTo || ''">{{ row.reportingTo || '—' }}</div>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 tabular-nums text-slate-200">
                    {{ formatYmdDate(row.contractOrProbationEndDate) }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3">
                    <StatusBadgeSelect
                      :model-value="getStatusForRow(row)"
                      @update:model-value="(v) => setStatusForRow(row, v)"
                    />
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-100">{{ row.daysRemaining }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div v-if="pendingExpiryGroups.length > 0" class="space-y-4">
        <h3 class="text-base font-semibold text-slate-200">Pending Contract Expiries</h3>

        <section v-for="group in pendingExpiryGroups" :key="`pending__${group.countryKey}`" class="space-y-2">
          <h4 class="text-base font-semibold text-slate-200">
            {{ group.countryLabel }}
          </h4>

          <div class="overflow-x-auto overflow-y-visible rounded-md border border-slate-800 bg-slate-900">
            <table class="min-w-full text-left text-sm">
              <thead class="border-b border-slate-800 text-xs text-slate-400">
                <tr>
                  <th scope="col" class="px-4 py-3 font-medium">Name</th>
                  <th scope="col" class="px-4 py-3 font-medium">Department</th>
                  <th scope="col" class="px-4 py-3 font-medium">Position</th>
                  <th scope="col" class="px-4 py-3 font-medium">Reporting To</th>
                  <th scope="col" class="px-4 py-3 font-medium">End date</th>
                  <th scope="col" class="px-4 py-3 font-medium">No Action</th>
                  <th scope="col" class="px-4 py-3 text-right font-medium">Days</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr v-for="row in group.rows" :key="row.key" class="text-slate-200">
                  <td class="px-4 py-3 font-medium text-slate-100">
                    <div class="max-w-52 truncate" :title="row.name || ''">{{ row.name || '—' }}</div>
                  </td>
                  <td class="px-4 py-3 text-slate-300">
                    <div class="max-w-48 truncate" :title="row.department || ''">{{ row.department || '—' }}</div>
                  </td>
                  <td class="px-4 py-3 text-slate-300">
                    <div class="max-w-56 truncate" :title="row.position || ''">{{ row.position || '—' }}</div>
                  </td>
                  <td class="px-4 py-3 text-slate-300">
                    <div class="max-w-56 truncate" :title="row.reportingTo || ''">{{ row.reportingTo || '—' }}</div>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 tabular-nums text-slate-200">
                    {{ formatYmdDate(row.contractOrProbationEndDate) }}
                  </td>
                  <td class="whitespace-nowrap px-4 py-3">
                    <StatusBadgeSelect
                      :model-value="getStatusForRow(row)"
                      @update:model-value="(v) => setStatusForRow(row, v)"
                    />
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-100">{{ row.daysRemaining }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatYmdDate } from '~/utils/dates'
import StatusBadgeSelect from '~/components/StatusBadgeSelect.vue'

type Item = {
  employeeKey?: string
  name: string
  department: string
  position: string
  reportingTo: string
  countryAssigned: string
  contractOrProbationEndDate: string
  daysRemaining: number
}

const props = defineProps<{
  items: Item[]
}>()

type StatusKey = 'pending' | 'in_progress' | 'completed'

const STORAGE_KEY = 'hr-dashboard:upcoming-contracts-status:v1'
const EXPIRED_CACHE_KEY = 'hr-dashboard:upcoming-contracts-expired-cache:v1'

const statusByRowKey = ref<Record<string, StatusKey>>({})
const expiredCache = ref<Item[]>([])

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

function stableText(v: string) {
  return (v ?? '').trim()
}

function storageKeyForFields(input: {
  employeeKey?: string
  name: string
  department: string
  position: string
  reportingTo: string
  countryAssigned: string
  contractOrProbationEndDate: string
}) {
  const ek = stableText(input.employeeKey ?? '')
  const end = stableText(input.contractOrProbationEndDate)
  if (ek) return `emp:${ek}|end:${end}`
  const name = stableText(input.name)
  const country = stableText(input.countryAssigned)
  const pos = stableText(input.position)
  return `row:${name}|${country}|${pos}|end:${end}`
}

function safeParseArray(input: string | null) {
  if (!input) return null
  try {
    const v = JSON.parse(input) as unknown
    if (!Array.isArray(v)) return null
    return v as unknown[]
  } catch {
    return null
  }
}

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

function utcTodayMs() {
  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

const DAY_MS = 24 * 60 * 60 * 1000
function daysRemainingFromEndDate(endYmd: string) {
  const endMs = parseYmdUtcMs(endYmd)
  if (!endMs) return null
  const today = utcTodayMs()
  return Math.ceil((endMs - today) / DAY_MS)
}

onMounted(() => {
  const obj = safeParseObject(window.localStorage.getItem(STORAGE_KEY))
  if (!obj) return
  const next: Record<string, StatusKey> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof k !== 'string') continue
    if (v === 'pending' || v === 'in_progress' || v === 'completed') next[k] = v
    else if (v === '' || v === 'no_action') next[k] = 'pending'
    else if (v === 'done') next[k] = 'completed'
  }
  statusByRowKey.value = next
})

onMounted(() => {
  const raw = safeParseArray(window.localStorage.getItem(EXPIRED_CACHE_KEY))
  if (!raw) return
  const next: Item[] = []
  for (const v of raw) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) continue
    const o = v as Record<string, unknown>
    const end = typeof o.contractOrProbationEndDate === 'string' ? o.contractOrProbationEndDate.trim() : ''
    if (!end) continue
    next.push({
      employeeKey: typeof o.employeeKey === 'string' ? o.employeeKey : undefined,
      name: typeof o.name === 'string' ? o.name : '',
      department: typeof o.department === 'string' ? o.department : '',
      position: typeof o.position === 'string' ? o.position : '',
      reportingTo: typeof o.reportingTo === 'string' ? o.reportingTo : '',
      countryAssigned: typeof o.countryAssigned === 'string' ? o.countryAssigned : '',
      contractOrProbationEndDate: end,
      daysRemaining: Number.isFinite(o.daysRemaining) ? (o.daysRemaining as number) : 0
    })
  }
  expiredCache.value = next
})

watch(
  statusByRowKey,
  (v) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
  },
  { deep: true }
)

watch(
  expiredCache,
  (v) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(EXPIRED_CACHE_KEY, JSON.stringify(v))
  },
  { deep: true }
)

function normalizeCountry(country: string) {
  const trimmed = (country ?? '').trim()
  return trimmed || '—'
}

const liveRows = computed(() =>
  props.items.map((i) => ({
    key: `${i.employeeKey ?? ''}__${i.name}__${i.contractOrProbationEndDate}`,
    countryKey: normalizeCountry(i.countryAssigned),
    countryLabel: normalizeCountry(i.countryAssigned),
    ...i
  }))
)

type Row = (typeof liveRows.value)[number]

function storageKeyForRow(row: Row) {
  return storageKeyForFields(row)
}

function getStatusForRow(row: Row): StatusKey {
  const k = storageKeyForRow(row)
  return statusByRowKey.value[k] ?? 'pending'
}

function setStatusForRow(row: Row, status: StatusKey) {
  const k = storageKeyForRow(row)
  statusByRowKey.value = { ...statusByRowKey.value, [k]: status }
  if (status === 'completed') {
    expiredCache.value = expiredCache.value.filter((i) => storageKeyForFields(i) !== k)
  }
}

function compareCountry(a: string, b: string) {
  const aa = a.trim().toUpperCase()
  const bb = b.trim().toUpperCase()
  const aIsTt = aa === 'TT'
  const bIsTt = bb === 'TT'
  if (aIsTt !== bIsTt) return aIsTt ? -1 : 1
  if (aa === '—' && bb !== '—') return 1
  if (bb === '—' && aa !== '—') return -1
  return a.localeCompare(b)
}

const items = computed(() => props.items)

function groupByCountry(inputRows: Row[]) {
  const map = new Map<string, Row[]>()
  for (const r of inputRows) {
    const key = r.countryKey
    const list = map.get(key)
    if (list) list.push(r)
    else map.set(key, [r])
  }
  const countries = Array.from(map.keys()).sort(compareCountry)
  return countries.map((countryKey) => ({
    countryKey,
    countryLabel: countryKey,
    rows: (map.get(countryKey) ?? []).slice().sort((a, b) => {
      return (
        a.contractOrProbationEndDate.localeCompare(b.contractOrProbationEndDate) ||
        a.name.localeCompare(b.name) ||
        a.daysRemaining - b.daysRemaining
      )
    })
  }))
}

const rows = computed<Row[]>(() => {
  const map = new Map<string, Row>()
  for (const r of liveRows.value) {
    map.set(storageKeyForRow(r), r)
  }

  for (const i of expiredCache.value) {
    const computedDays = daysRemainingFromEndDate(i.contractOrProbationEndDate)
    const daysRemaining = computedDays ?? i.daysRemaining
    const row: Row = {
      key: `${i.employeeKey ?? ''}__${i.name}__${i.contractOrProbationEndDate}`,
      countryKey: normalizeCountry(i.countryAssigned),
      countryLabel: normalizeCountry(i.countryAssigned),
      ...i,
      daysRemaining
    }
    const k = storageKeyForRow(row)
    if (!map.has(k)) map.set(k, row)
  }

  return Array.from(map.values())
})

const upcomingGroups = computed(() => {
  const list = rows.value.filter((r) => r.daysRemaining > 0 || getStatusForRow(r) === 'completed')
  return groupByCountry(list)
})

const SIX_WEEKS_DAYS = 42
function upcomingRowClass(row: Row, rowIdx: number, rowCount: number) {
  const shouldHighlight = row.daysRemaining > 0 && row.daysRemaining <= SIX_WEEKS_DAYS
  const bottomEdge =
    shouldHighlight && rowIdx === rowCount - 1 ? 'shadow-[inset_0_-1px_0_rgba(216,180,254,0.45)]' : ''
  return [
    'text-slate-200',
    shouldHighlight ? 'bg-[#190030] ring-1 ring-inset ring-purple-300/40' : '',
    bottomEdge,
  ]
}

const pendingExpiryGroups = computed(() => {
  const list = rows.value.filter((r) => r.daysRemaining <= 0 && getStatusForRow(r) !== 'completed')
  return groupByCountry(list)
})

watchEffect(() => {
  const next = expiredCache.value.slice()
  const existingKeys = new Set(next.map((i) => storageKeyForFields(i)))

  for (const r of liveRows.value) {
    if (r.daysRemaining > 0) continue
    if (getStatusForRow(r) === 'completed') continue
    const k = storageKeyForRow(r)
    if (existingKeys.has(k)) continue
    next.push({
      employeeKey: r.employeeKey,
      name: r.name,
      department: r.department,
      position: r.position,
      reportingTo: r.reportingTo,
      countryAssigned: r.countryAssigned,
      contractOrProbationEndDate: r.contractOrProbationEndDate,
      daysRemaining: r.daysRemaining
    })
    existingKeys.add(k)
  }

  expiredCache.value = next
})
</script>

