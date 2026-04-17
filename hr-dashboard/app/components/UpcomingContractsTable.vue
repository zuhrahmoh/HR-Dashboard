<template>
  <div class="min-w-0 space-y-3">
    <div
      v-if="upcomingContractGroups.length === 0 && upcomingProbationGroups.length === 0 && pendingExpiryGroups.length === 0"
      class="space-y-3"
    >
      <div class="flex justify-end">
        <UpcomingContractsFilterBar v-model:window-days="windowDays" v-model:unit-mode="unitMode" />
      </div>
      <div class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-sm text-slate-800">
        No contract/probation end dates to review.
      </div>
    </div>

    <div v-else class="space-y-6">
      <div v-if="upcomingContractGroups.length > 0" class="pt-8">
        <h3 class="mb-0 flex items-center gap-2 text-lg font-semibold leading-none text-hr-navy">
          <svg class="h-3.5 w-3.5 shrink-0 text-hr-navy" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M2 1v10l8-5-8-5z" />
          </svg>
          Upcoming contract expiries
        </h3>

        <div class="space-y-4">
          <section
            v-for="(group, idx) in upcomingContractGroups"
            :key="`upcoming_contract__${group.countryKey}`"
            class="space-y-1"
          >
          <div
            v-if="filtersAnchorSection === 'contracts' && idx === 0"
            class="flex min-w-0 flex-nowrap items-end justify-between gap-3"
          >
            <h4 class="min-w-0 shrink text-base font-semibold text-hr-navy">{{ group.countryLabel }}</h4>
            <UpcomingContractsFilterBar v-model:window-days="windowDays" v-model:unit-mode="unitMode" />
          </div>
          <h4 v-else class="text-base font-semibold text-hr-navy">{{ group.countryLabel }}</h4>

          <div class="rounded-md border border-slate-200 bg-white shadow-card">
            <table class="w-full table-fixed border-collapse text-left text-sm">
              <colgroup>
                <col style="width: 15%" />
                <col style="width: 15%" />
                <col style="width: 16%" />
                <col style="width: 16%" />
                <col style="width: 12%" />
                <col style="width: 14%" />
                <col style="width: 12%" />
              </colgroup>
              <thead class="border-b border-hr-navy/25 text-xs text-slate-400">
                <tr>
                  <th scope="col" class="px-3 py-3 align-bottom font-medium">Name</th>
                  <th scope="col" class="px-3 py-3 align-bottom font-medium">Department</th>
                  <th scope="col" class="px-3 py-3 align-bottom font-medium">Position</th>
                  <th scope="col" class="px-3 py-3 align-bottom font-medium">Reporting To</th>
                  <th scope="col" class="px-3 py-3 align-bottom font-medium">End date</th>
                  <th scope="col" class="px-3 py-3 align-bottom font-medium">Status</th>
                  <th scope="col" class="px-3 py-3 text-right align-bottom font-medium">Time left</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-hr-navy/35">
                <tr
                  v-for="(row, rowIdx) in group.rows"
                  :key="row.key"
                  :class="upcomingRowClass(row, rowIdx, group.rows.length)"
                >
                  <td class="min-w-0 px-3 py-3 align-top font-medium break-words text-slate-900">{{ row.name || '—' }}</td>
                  <td class="min-w-0 px-3 py-3 align-top break-words text-slate-600">{{ row.department || '—' }}</td>
                  <td class="min-w-0 px-3 py-3 align-top break-words text-slate-600">{{ row.position || '—' }}</td>
                  <td class="min-w-0 px-3 py-3 align-top break-words text-slate-600">{{ row.reportingTo || '—' }}</td>
                  <td class="min-w-0 whitespace-nowrap px-3 py-3 align-top tabular-nums text-slate-800">
                    {{ formatYmdDate(row.contractOrProbationEndDate) }}
                  </td>
                  <td class="min-w-0 px-3 py-3 align-top">
                    <StatusBadgeSelect
                      :model-value="getStatusForRow(row)"
                      @update:model-value="(v) => void setStatusForRow(row, v)"
                    />
                  </td>
                  <td class="min-w-0 whitespace-nowrap px-3 py-3 text-right align-top font-bold tabular-nums text-hr-navy">
                    {{ formatRemaining(row.daysRemaining) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </section>
        </div>
      </div>

      <hr v-if="upcomingContractGroups.length > 0 && (upcomingProbationGroups.length > 0 || pendingExpiryGroups.length > 0)" />

      <div v-if="upcomingProbationGroups.length > 0">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold leading-none text-hr-navy">
          <svg class="h-3.5 w-3.5 shrink-0 text-hr-navy" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M2 1v10l8-5-8-5z" />
          </svg>
          Upcoming probations
        </h3>

        <div class="space-y-4">
          <section
            v-for="(group, idx) in upcomingProbationGroups"
            :key="`upcoming_probation__${group.countryKey}`"
            class="space-y-1"
          >
            <div
              v-if="filtersAnchorSection === 'probations' && idx === 0"
              class="flex min-w-0 flex-nowrap items-end justify-between gap-3"
            >
              <h4 class="min-w-0 shrink text-base font-semibold text-hr-navy">{{ group.countryLabel }}</h4>
              <UpcomingContractsFilterBar v-model:window-days="windowDays" v-model:unit-mode="unitMode" />
            </div>
            <h4 v-else class="text-base font-semibold text-hr-navy">{{ group.countryLabel }}</h4>

            <div class="rounded-md border border-slate-200 bg-white shadow-card">
              <table class="w-full table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col style="width: 15%" />
                  <col style="width: 15%" />
                  <col style="width: 16%" />
                  <col style="width: 16%" />
                  <col style="width: 12%" />
                  <col style="width: 14%" />
                  <col style="width: 12%" />
                </colgroup>
                <thead class="border-b border-hr-navy/25 text-xs text-slate-400">
                  <tr>
                    <th scope="col" class="px-3 py-3 align-bottom font-medium">Name</th>
                    <th scope="col" class="px-3 py-3 align-bottom font-medium">Department</th>
                    <th scope="col" class="px-3 py-3 align-bottom font-medium">Position</th>
                    <th scope="col" class="px-3 py-3 align-bottom font-medium">Reporting To</th>
                    <th scope="col" class="px-3 py-3 align-bottom font-medium">End date</th>
                    <th scope="col" class="px-3 py-3 align-bottom font-medium">Status</th>
                    <th scope="col" class="px-3 py-3 text-right align-bottom font-medium">Time left</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-hr-navy/35">
                  <tr
                    v-for="(row, rowIdx) in group.rows"
                    :key="row.key"
                    :class="upcomingRowClass(row, rowIdx, group.rows.length)"
                  >
                    <td class="min-w-0 px-3 py-3 align-top font-medium break-words text-slate-900">{{ row.name || '—' }}</td>
                    <td class="min-w-0 px-3 py-3 align-top break-words text-slate-600">{{ row.department || '—' }}</td>
                    <td class="min-w-0 px-3 py-3 align-top break-words text-slate-600">{{ row.position || '—' }}</td>
                    <td class="min-w-0 px-3 py-3 align-top break-words text-slate-600">{{ row.reportingTo || '—' }}</td>
                    <td class="min-w-0 whitespace-nowrap px-3 py-3 align-top tabular-nums text-slate-800">
                      {{ formatYmdDate(row.contractOrProbationEndDate) }}
                    </td>
                    <td class="min-w-0 px-3 py-3 align-top">
                      <StatusBadgeSelect :model-value="getStatusForRow(row)" @update:model-value="(v) => void setStatusForRow(row, v)" />
                    </td>
                    <td class="min-w-0 whitespace-nowrap px-3 py-3 text-right align-top font-bold tabular-nums text-hr-navy">
                      {{ formatRemaining(row.daysRemaining) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <hr v-if="upcomingProbationGroups.length > 0 && pendingExpiryGroups.length > 0" />

      <div v-if="pendingExpiryGroups.length > 0">
        <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold leading-none text-hr-navy">
          <svg class="h-3.5 w-3.5 shrink-0 text-hr-navy" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M2 1v10l8-5-8-5z" />
          </svg>
          Pending Contract Expiries
        </h3>

        <div class="space-y-4">
          <section v-for="(group, idx) in pendingExpiryGroups" :key="`pending__${group.countryKey}`" class="space-y-1">
            <div
              v-if="filtersAnchorSection === 'pending' && idx === 0"
              class="flex min-w-0 flex-nowrap items-end justify-between gap-3"
            >
              <h4 class="min-w-0 shrink text-base font-semibold text-hr-navy">{{ group.countryLabel }}</h4>
              <UpcomingContractsFilterBar v-model:window-days="windowDays" v-model:unit-mode="unitMode" />
            </div>
            <h4 v-else class="text-base font-semibold text-hr-navy">{{ group.countryLabel }}</h4>

            <div class="rounded-md border border-slate-200 bg-white shadow-card">
              <table class="w-full table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col style="width: 15%" />
                  <col style="width: 15%" />
                  <col style="width: 16%" />
                  <col style="width: 16%" />
                  <col style="width: 12%" />
                  <col style="width: 14%" />
                  <col style="width: 12%" />
                </colgroup>
                <thead class="border-b border-hr-navy/25 text-xs text-slate-400">
                  <tr>
                    <th scope="col" class="px-3 py-3 align-bottom font-medium">Name</th>
                    <th scope="col" class="px-3 py-3 align-bottom font-medium">Department</th>
                    <th scope="col" class="px-3 py-3 align-bottom font-medium">Position</th>
                    <th scope="col" class="px-3 py-3 align-bottom font-medium">Reporting To</th>
                    <th scope="col" class="px-3 py-3 align-bottom font-medium">End date</th>
                    <th scope="col" class="px-3 py-3 align-bottom font-medium">Status</th>
                    <th scope="col" class="px-3 py-3 text-right align-bottom font-medium">Time left</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-hr-navy/35">
                  <tr v-for="row in group.rows" :key="row.key" class="text-slate-800">
                    <td class="min-w-0 px-3 py-3 align-top font-medium break-words text-slate-900">{{ row.name || '—' }}</td>
                    <td class="min-w-0 px-3 py-3 align-top break-words text-slate-600">{{ row.department || '—' }}</td>
                    <td class="min-w-0 px-3 py-3 align-top break-words text-slate-600">{{ row.position || '—' }}</td>
                    <td class="min-w-0 px-3 py-3 align-top break-words text-slate-600">{{ row.reportingTo || '—' }}</td>
                    <td class="min-w-0 whitespace-nowrap px-3 py-3 align-top tabular-nums text-slate-800">
                      {{ formatYmdDate(row.contractOrProbationEndDate) }}
                    </td>
                    <td class="min-w-0 px-3 py-3 align-top">
                      <StatusBadgeSelect
                        :model-value="getStatusForRow(row)"
                        @update:model-value="(v) => void setStatusForRow(row, v)"
                      />
                    </td>
                    <td class="min-w-0 whitespace-nowrap px-3 py-3 text-right align-top font-bold tabular-nums text-hr-navy">
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

const windowDays = defineModel<'30' | '60' | '90'>('windowDays', { required: true })

type StatusKey =
  | 'not_started'
  | 'discussion_in_progress'
  | 'confirmed_for_permanency'
  | 'contracted_extension'
  | 'unsuccessful_probation'

const LEGACY_STORAGE_KEY = 'hr-dashboard:upcoming-contracts-status:v2'

const statusByRowKey = ref<Record<string, StatusKey>>({})

const { data: statusesPayload, refresh: refreshStatuses } = useFetch<{ statuses: Record<string, string> }>(
  '/api/upcoming-contract-expiry-statuses'
)

function normalizeLegacyStatusValue(value: unknown): StatusKey {
  if (value === 'not_started') return 'not_started'
  if (value === 'discussion_in_progress') return 'discussion_in_progress'
  if (value === 'confirmed_for_permanency') return 'confirmed_for_permanency'
  if (value === 'contracted_extension') return 'contracted_extension'
  if (value === 'unsuccessful_probation') return 'unsuccessful_probation'
  if (value === '' || value === 'no_action' || value === 'pending') return 'not_started'
  if (value === 'in_progress') return 'discussion_in_progress'
  if (value === 'completed' || value === 'done') return 'confirmed_for_permanency'
  return 'not_started'
}

watch(
  statusesPayload,
  (p) => {
    if (!p?.statuses) return
    const next: Record<string, StatusKey> = {}
    for (const [k, raw] of Object.entries(p.statuses)) {
      const v = normalizeLegacyStatusValue(raw)
      if (v !== 'not_started') next[k] = v
    }
    statusByRowKey.value = next
  },
  { immediate: true }
)

type UnitMode = 'days' | 'weeks' | 'both'
const unitMode = ref<UnitMode>('both')

function weeksFromDaysCeil(days: number) {
  const d = Number(days)
  if (!Number.isFinite(d) || d === 0) return 0
  const sign = d < 0 ? -1 : 1
  return sign * Math.ceil(Math.abs(d) / 7)
}

function formatRemaining(daysRemaining: number) {
  const d = Number(daysRemaining)
  if (!Number.isFinite(d)) return '—'
  if (unitMode.value === 'days') return `${d}d`
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

onMounted(async () => {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY)
  if (!raw) return
  const obj = safeParseObject(raw)
  if (!obj) return
  try {
    for (const [k, rawVal] of Object.entries(obj)) {
      if (typeof k !== 'string') continue
      const status = normalizeLegacyStatusValue(rawVal)
      await $fetch('/api/upcoming-contract-expiry-statuses', { method: 'PUT', body: { rowKey: k, status } })
    }
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    await refreshStatuses()
  } catch {
    // Leave legacy localStorage if migration fails (e.g. offline).
  }
})

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

async function setStatusForRow(row: Row, status: StatusKey) {
  const k = storageKeyForRow(row)
  const prev = { ...statusByRowKey.value }
  const next = { ...statusByRowKey.value }
  if (status === 'not_started') delete next[k]
  else next[k] = status
  statusByRowKey.value = next
  try {
    await $fetch('/api/upcoming-contract-expiry-statuses', { method: 'PUT', body: { rowKey: k, status } })
    await refreshStatuses()
  } catch {
    statusByRowKey.value = prev
  }
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
    shouldHighlight && rowIdx === rowCount - 1 ? 'shadow-[inset_0_-1px_0_rgba(244,114,182,0.4)]' : ''
  return [
    'text-slate-800',
    shouldHighlight ? 'bg-pink-100 ring-1 ring-inset ring-pink-200/90' : '',
    bottomEdge,
  ]
}

const pendingExpiryGroups = computed(() => {
  return groupByCountry(expiredRows.value)
})

const filtersAnchorSection = computed(() => {
  if (upcomingContractGroups.value.length > 0) return 'contracts' as const
  if (upcomingProbationGroups.value.length > 0) return 'probations' as const
  if (pendingExpiryGroups.value.length > 0) return 'pending' as const
  return null
})
</script>

