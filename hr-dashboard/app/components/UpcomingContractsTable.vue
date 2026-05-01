<template>
  <div class="min-w-0 space-y-3">
    <div
      v-if="
        upcomingContractGroups.length === 0 &&
          upcomingProbationGroups.length === 0 &&
          completedContractRows.length === 0 &&
          completedProbationRows.length === 0
      "
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
      <div
        v-if="upcomingContractGroups.length > 0 || completedContractRows.length > 0"
        id="upcoming-contract-expiries"
        class="scroll-mt-32 pt-8"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-3">
          <h3 class="mb-0 flex items-center gap-2 text-lg font-semibold leading-none text-hr-navy">
            <svg class="h-3.5 w-3.5 shrink-0 text-hr-navy" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M2 1v10l8-5-8-5z" />
            </svg>
            Contract Expiries
          </h3>
          <button
            v-if="completedContractRows.length > 0"
            type="button"
            class="ml-auto inline-flex items-center gap-1.5 self-center rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800 hover:bg-teal-100"
            @click="completedContractsHistoryOpen = true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>Completed Reviews ({{ completedContractRows.length }})</span>
          </button>
        </div>

        <div v-if="upcomingContractGroups.length > 0" class="space-y-4">
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
        <div
          v-else
          class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-sm text-slate-800"
        >
          No active contract expiries to review.
        </div>
      </div>

      <hr
        v-if="
          (upcomingContractGroups.length > 0 || completedContractRows.length > 0) &&
            (upcomingProbationGroups.length > 0 || completedProbationRows.length > 0)
        "
      />

      <div
        v-if="upcomingProbationGroups.length > 0 || completedProbationRows.length > 0"
        id="upcoming-probations"
        class="scroll-mt-32"
      >
        <div class="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h3 class="mb-0 flex items-center gap-2 text-lg font-semibold leading-none text-hr-navy">
            <svg class="h-3.5 w-3.5 shrink-0 text-hr-navy" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M2 1v10l8-5-8-5z" />
            </svg>
            Probation Reviews
          </h3>
          <button
            v-if="completedProbationRows.length > 0"
            type="button"
            class="ml-auto inline-flex items-center gap-1.5 self-center rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800 hover:bg-teal-100"
            @click="completedProbationsHistoryOpen = true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>Completed Reviews ({{ completedProbationRows.length }})</span>
          </button>
        </div>

        <div v-if="upcomingProbationGroups.length > 0" class="space-y-4">
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
        <div
          v-else
          class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-sm text-slate-800"
        >
          No active probation reviews to review.
        </div>
      </div>

    </div>

    <Teleport to="body">
      <div
        v-if="completedContractsHistoryOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="completed-contracts-dialog-title"
      >
        <button
          type="button"
          class="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]"
          aria-label="Dismiss"
          @click="completedContractsHistoryOpen = false"
        />
        <div
          class="relative z-10 flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card"
          @click.stop
        >
          <div class="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div class="min-w-0">
              <h2 id="completed-contracts-dialog-title" class="text-base font-semibold text-slate-900">Completed Contract Reviews</h2>
              <p class="mt-0.5 text-xs text-slate-500">Contract expiries marked as Confirmed for Permanency, Contracted Extension, or Unsuccessful Probation.</p>
            </div>
            <button
              type="button"
              class="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
              @click="completedContractsHistoryOpen = false"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5" aria-hidden="true">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.21 4.21a.75.75 0 0 1 1.06 0L10 8.94l4.73-4.73a.75.75 0 1 1 1.06 1.06L11.06 10l4.73 4.73a.75.75 0 1 1-1.06 1.06L10 11.06l-4.73 4.73a.75.75 0 1 1-1.06-1.06L8.94 10 4.21 5.27a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </div>

          <div class="min-w-0 overflow-auto px-5 py-4">
            <div v-if="completedContractRows.length === 0" class="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-800">
              No completed reviews yet.
            </div>
            <div v-else class="rounded-md border border-slate-200 bg-white">
              <table class="w-full table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col style="width: 14%" />
                  <col style="width: 13%" />
                  <col style="width: 14%" />
                  <col style="width: 14%" />
                  <col style="width: 11%" />
                  <col style="width: 22%" />
                  <col style="width: 12%" />
                </colgroup>
                <thead class="bg-slate-100 text-slate-600">
                  <tr>
                    <th class="px-3 py-3 align-bottom font-medium">Name</th>
                    <th class="px-3 py-3 align-bottom font-medium">Department</th>
                    <th class="px-3 py-3 align-bottom font-medium">Position</th>
                    <th class="px-3 py-3 align-bottom font-medium">Reporting To</th>
                    <th class="px-3 py-3 align-bottom font-medium">End date</th>
                    <th class="px-3 py-3 align-bottom font-medium">Status</th>
                    <th class="px-3 py-3 text-right align-bottom font-medium">Time left</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in completedContractRows" :key="row.key" class="border-t border-hr-navy/25 align-top">
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
          </div>
        </div>
      </div>

      <div
        v-if="completedProbationsHistoryOpen"
        class="fixed inset-0 z-[200] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="completed-probations-dialog-title"
      >
        <button
          type="button"
          class="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]"
          aria-label="Dismiss"
          @click="completedProbationsHistoryOpen = false"
        />
        <div
          class="relative z-10 flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card"
          @click.stop
        >
          <div class="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div class="min-w-0">
              <h2 id="completed-probations-dialog-title" class="text-base font-semibold text-slate-900">Completed Probation Reviews</h2>
              <p class="mt-0.5 text-xs text-slate-500">Probation reviews marked as Confirmed for Permanency, Contracted Extension, or Unsuccessful Probation.</p>
            </div>
            <button
              type="button"
              class="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
              @click="completedProbationsHistoryOpen = false"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5" aria-hidden="true">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M4.21 4.21a.75.75 0 0 1 1.06 0L10 8.94l4.73-4.73a.75.75 0 1 1 1.06 1.06L11.06 10l4.73 4.73a.75.75 0 1 1-1.06 1.06L10 11.06l-4.73 4.73a.75.75 0 1 1-1.06-1.06L8.94 10 4.21 5.27a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </div>

          <div class="min-w-0 overflow-auto px-5 py-4">
            <div v-if="completedProbationRows.length === 0" class="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-800">
              No completed reviews yet.
            </div>
            <div v-else class="rounded-md border border-slate-200 bg-white">
              <table class="w-full table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col style="width: 14%" />
                  <col style="width: 13%" />
                  <col style="width: 14%" />
                  <col style="width: 14%" />
                  <col style="width: 11%" />
                  <col style="width: 22%" />
                  <col style="width: 12%" />
                </colgroup>
                <thead class="bg-slate-100 text-slate-600">
                  <tr>
                    <th class="px-3 py-3 align-bottom font-medium">Name</th>
                    <th class="px-3 py-3 align-bottom font-medium">Department</th>
                    <th class="px-3 py-3 align-bottom font-medium">Position</th>
                    <th class="px-3 py-3 align-bottom font-medium">Reporting To</th>
                    <th class="px-3 py-3 align-bottom font-medium">End date</th>
                    <th class="px-3 py-3 align-bottom font-medium">Status</th>
                    <th class="px-3 py-3 text-right align-bottom font-medium">Time left</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in completedProbationRows" :key="row.key" class="border-t border-hr-navy/25 align-top">
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
          </div>
        </div>
      </div>
    </Teleport>
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
}>()

const windowDays = defineModel<'30' | '60' | '90'>('windowDays', { required: true })

type StatusKey =
  | 'not_started'
  | 'discussion_in_progress'
  | 'confirmed_for_permanency'
  | 'contracted_extension'
  | 'unsuccessful_probation'

const COMPLETED_STATUSES: ReadonlySet<StatusKey> = new Set([
  'confirmed_for_permanency',
  'contracted_extension',
  'unsuccessful_probation'
])

function isCompletedStatus(status: StatusKey) {
  return COMPLETED_STATUSES.has(status)
}

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
  const active = upcomingContractRows.value.filter((r) => !isCompletedStatus(getStatusForRow(r)))
  return groupByCountry(active)
})

const upcomingProbationGroups = computed(() => {
  const active = upcomingProbationRows.value.filter((r) => !isCompletedStatus(getStatusForRow(r)))
  return groupByCountry(active)
})

const completedContractRows = computed(() =>
  upcomingContractRows.value
    .filter((r) => isCompletedStatus(getStatusForRow(r)))
    .slice()
    .sort(
      (a, b) =>
        compareCountry(a.countryKey, b.countryKey) ||
        a.contractOrProbationEndDate.localeCompare(b.contractOrProbationEndDate) ||
        a.name.localeCompare(b.name)
    )
)

const completedProbationRows = computed(() =>
  upcomingProbationRows.value
    .filter((r) => isCompletedStatus(getStatusForRow(r)))
    .slice()
    .sort(
      (a, b) =>
        compareCountry(a.countryKey, b.countryKey) ||
        a.contractOrProbationEndDate.localeCompare(b.contractOrProbationEndDate) ||
        a.name.localeCompare(b.name)
    )
)

const completedContractsHistoryOpen = ref(false)
const completedProbationsHistoryOpen = ref(false)

function upcomingRowClass(row: Row, rowIdx: number, rowCount: number) {
  const shouldHighlight = row.daysRemaining < 0
  const bottomEdge =
    shouldHighlight && rowIdx === rowCount - 1 ? 'shadow-[inset_0_-1px_0_rgba(244,114,182,0.4)]' : ''
  return [
    'text-slate-800',
    shouldHighlight ? 'bg-pink-100 ring-1 ring-inset ring-pink-200/90' : '',
    bottomEdge,
  ]
}

const filtersAnchorSection = computed(() => {
  if (upcomingContractGroups.value.length > 0) return 'contracts' as const
  if (upcomingProbationGroups.value.length > 0) return 'probations' as const
  return null
})
</script>
