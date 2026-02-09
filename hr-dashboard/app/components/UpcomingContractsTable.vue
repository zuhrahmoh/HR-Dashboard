<template>
  <div class="space-y-3">
    <div
      v-if="upcomingGroups.length === 0 && pendingExpiryGroups.length === 0"
      class="rounded-md border border-slate-800 bg-slate-900 p-4 text-base text-slate-200"
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
            <table class="min-w-full text-left text-base">
              <thead class="border-b border-slate-800 text-sm text-slate-400">
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
                <tr v-for="row in group.rows" :key="row.key" class="text-slate-200">
                  <td class="whitespace-nowrap px-4 py-3 font-medium text-slate-100">{{ row.name || '—' }}</td>
                  <td class="whitespace-nowrap px-4 py-3 text-slate-300">{{ row.department || '—' }}</td>
                  <td class="whitespace-nowrap px-4 py-3 text-slate-300">{{ row.position || '—' }}</td>
                  <td class="whitespace-nowrap px-4 py-3 text-slate-300">{{ row.reportingTo || '—' }}</td>
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
            <table class="min-w-full text-left text-base">
              <thead class="border-b border-slate-800 text-sm text-slate-400">
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
                  <td class="whitespace-nowrap px-4 py-3 font-medium text-slate-100">{{ row.name || '—' }}</td>
                  <td class="whitespace-nowrap px-4 py-3 text-slate-300">{{ row.department || '—' }}</td>
                  <td class="whitespace-nowrap px-4 py-3 text-slate-300">{{ row.position || '—' }}</td>
                  <td class="whitespace-nowrap px-4 py-3 text-slate-300">{{ row.reportingTo || '—' }}</td>
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
    if (v === 'pending' || v === 'in_progress' || v === 'completed') next[k] = v
    else if (v === '' || v === 'no_action') next[k] = 'pending'
    else if (v === 'done') next[k] = 'completed'
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

const rows = computed(() =>
  props.items.map((i) => ({
    key: `${i.employeeKey ?? ''}__${i.name}__${i.contractOrProbationEndDate}__${i.daysRemaining}`,
    countryKey: normalizeCountry(i.countryAssigned),
    countryLabel: normalizeCountry(i.countryAssigned),
    ...i
  }))
)

type Row = (typeof rows.value)[number]

function storageKeyForRow(row: Row) {
  const ek = (row.employeeKey ?? '').trim()
  if (ek) return `emp:${ek}|end:${row.contractOrProbationEndDate}`
  return `row:${row.key}`
}

function getStatusForRow(row: Row): StatusKey {
  return statusByRowKey.value[storageKeyForRow(row)] ?? 'pending'
}

function setStatusForRow(row: Row, status: StatusKey) {
  const k = storageKeyForRow(row)
  statusByRowKey.value = { ...statusByRowKey.value, [k]: status }
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

const upcomingGroups = computed(() => {
  const list = rows.value.filter((r) => r.daysRemaining > 0 || getStatusForRow(r) === 'completed')
  return groupByCountry(list)
})

const pendingExpiryGroups = computed(() => {
  const list = rows.value.filter((r) => r.daysRemaining <= 0 && getStatusForRow(r) !== 'completed')
  return groupByCountry(list)
})
</script>

