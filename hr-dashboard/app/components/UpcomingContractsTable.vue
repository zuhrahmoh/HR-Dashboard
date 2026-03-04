<template>
  <div class="space-y-3">
    <div class="flex items-center justify-end">
      <div class="inline-flex overflow-hidden rounded-md border border-slate-700 bg-slate-900">
        <button
          type="button"
          :class="unitButtonClass('days')"
          @click="unitMode = 'days'"
        >
          Days
        </button>
        <button
          type="button"
          :class="unitButtonClass('weeks')"
          @click="unitMode = 'weeks'"
        >
          Weeks
        </button>
        <button
          type="button"
          :class="unitButtonClass('both')"
          @click="unitMode = 'both'"
        >
          Days+Weeks
        </button>
      </div>
    </div>

    <div
      v-if="upcomingContractGroups.length === 0 && upcomingProbationGroups.length === 0 && pendingExpiryGroups.length === 0"
      class="rounded-md border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200"
    >
      No contract/probation end dates to review.
    </div>

    <div v-else class="space-y-6">
      <div v-if="upcomingContractGroups.length > 0" class="space-y-4">
        <h3 class="text-lg font-semibold text-slate-100">Upcoming contract expiries</h3>

        <section v-for="group in upcomingContractGroups" :key="`upcoming_contract__${group.countryKey}`" class="space-y-2">
          <h4 class="text-base font-semibold text-slate-200">{{ group.countryLabel }}</h4>

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
                  <th scope="col" class="px-4 py-3 text-right font-medium">Time remaining</th>
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
                  <td class="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-100">
                    {{ formatRemaining(row.daysRemaining) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <hr
        v-if="upcomingContractGroups.length > 0 && (upcomingProbationGroups.length > 0 || pendingExpiryGroups.length > 0)"
        class="border-slate-800"
      />

      <div v-if="upcomingProbationGroups.length > 0" class="space-y-4">
        <h3 class="text-lg font-semibold text-slate-100">Upcoming probations</h3>

        <section v-for="group in upcomingProbationGroups" :key="`upcoming_probation__${group.countryKey}`" class="space-y-2">
          <h4 class="text-base font-semibold text-slate-200">{{ group.countryLabel }}</h4>

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
                  <th scope="col" class="px-4 py-3 text-right font-medium">Time remaining</th>
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
                    <StatusBadgeSelect :model-value="getStatusForRow(row)" @update:model-value="(v) => setStatusForRow(row, v)" />
                  </td>
                  <td class="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-100">
                    {{ formatRemaining(row.daysRemaining) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <hr v-if="upcomingProbationGroups.length > 0 && pendingExpiryGroups.length > 0" class="border-slate-800" />

      <div v-if="pendingExpiryGroups.length > 0" class="space-y-4">
        <h3 class="text-lg font-semibold text-slate-100">Pending Contract Expiries</h3>

        <section v-for="group in pendingExpiryGroups" :key="`pending__${group.countryKey}`" class="space-y-2">
          <h4 class="text-base font-semibold text-slate-200">{{ group.countryLabel }}</h4>

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
                  <th scope="col" class="px-4 py-3 text-right font-medium">Time remaining</th>
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
                  <td class="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-100">
                    {{ formatRemaining(row.daysRemaining) }}
                  </td>
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
  upcomingContractItems: Item[]
  upcomingProbationItems: Item[]
  expiredContractItems: Item[]
}>()

type StatusKey =
  | 'not_started'
  | 'discussion_in_progress'
  | 'confirmed_for_permanency'
  | 'contracted_extension'
  | 'unsuccessful_probation'

const STORAGE_KEY = 'hr-dashboard:upcoming-contracts-status:v2'

const statusByRowKey = ref<Record<string, StatusKey>>({})

type UnitMode = 'days' | 'weeks' | 'both'
const unitMode = ref<UnitMode>('both')

function unitButtonClass(mode: UnitMode) {
  const active = unitMode.value === mode
  return [
    'px-3 py-1.5 text-xs font-semibold',
    active ? 'bg-slate-800 text-slate-50' : 'text-slate-200 hover:bg-slate-800/60'
  ]
}

function weeksFromDaysCeil(days: number) {
  const d = Number(days)
  if (!Number.isFinite(d) || d === 0) return 0
  const sign = d < 0 ? -1 : 1
  return sign * Math.ceil(Math.abs(d) / 7)
}

function formatRemaining(daysRemaining: number) {
  const d = Number(daysRemaining)
  if (!Number.isFinite(d)) return '—'
  if (unitMode.value === 'days') return String(d)
  const w = weeksFromDaysCeil(d)
  if (unitMode.value === 'weeks') return `${w}w`
  return `${d}d (${w}w)`
}

function stableText(v: string) {
  return (v ?? '').trim()
}

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

onMounted(() => {
  const obj = safeParseObject(window.localStorage.getItem(STORAGE_KEY))
  if (!obj) return
  const next: Record<string, StatusKey> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof k !== 'string') continue
    if (
      v === 'not_started' ||
      v === 'discussion_in_progress' ||
      v === 'confirmed_for_permanency' ||
      v === 'contracted_extension' ||
      v === 'unsuccessful_probation'
    ) {
      next[k] = v
      continue
    }

    // Migrate legacy values from earlier iterations.
    if (v === '' || v === 'no_action' || v === 'pending') next[k] = 'not_started'
    else if (v === 'in_progress') next[k] = 'discussion_in_progress'
    else if (v === 'completed' || v === 'done') next[k] = 'confirmed_for_permanency'
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

function normalizeCountry(country: string) {
  const trimmed = (country ?? '').trim()
  return trimmed || '—'
}

function toRow(i: Item) {
  return {
    key: `${i.employeeKey ?? ''}__${i.name}__${i.contractOrProbationEndDate}`,
    countryKey: normalizeCountry(i.countryAssigned),
    countryLabel: normalizeCountry(i.countryAssigned),
    ...i
  }
}

const upcomingContractRows = computed(() => props.upcomingContractItems.map(toRow))
const upcomingProbationRows = computed(() => props.upcomingProbationItems.map(toRow))
const expiredRows = computed(() => props.expiredContractItems.map(toRow))

type Row = ReturnType<typeof toRow>

function storageKeyForRow(row: Row) {
  return storageKeyForFields(row)
}

function getStatusForRow(row: Row): StatusKey {
  const k = storageKeyForRow(row)
  return statusByRowKey.value[k] ?? 'not_started'
}

function setStatusForRow(row: Row, status: StatusKey) {
  const k = storageKeyForRow(row)
  statusByRowKey.value = { ...statusByRowKey.value, [k]: status }
}

function countrySortRank(country: string) {
  const v = (country ?? '').trim().toLowerCase()
  if (!v || v === '—') return 999
  if (v === 'tt' || v === 'trinidad' || v === 'trinidad & tobago' || v === 'trinidad and tobago') return 0
  if (v === 'guy' || v === 'guyana') return 1
  if (v === 'sur' || v === 'suriname') return 2
  return 100
}

function compareCountry(a: string, b: string) {
  const ar = countrySortRank(a)
  const br = countrySortRank(b)
  if (ar !== br) return ar - br
  return a.localeCompare(b)
}

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

const upcomingContractGroups = computed(() => {
  return groupByCountry(upcomingContractRows.value)
})

const upcomingProbationGroups = computed(() => {
  return groupByCountry(upcomingProbationRows.value)
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
  return groupByCountry(expiredRows.value)
})
</script>

