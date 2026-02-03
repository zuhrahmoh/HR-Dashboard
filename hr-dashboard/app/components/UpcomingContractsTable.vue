<template>
  <div class="space-y-3">
    <div v-if="items.length === 0" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">
      No upcoming contract/probation end dates in the next 60 days.
    </div>

    <div v-else class="space-y-4">
      <section v-for="group in groupedRows" :key="group.countryKey" class="space-y-2">
        <h3 class="text-sm font-semibold text-slate-200">
          {{ group.countryLabel }}
        </h3>

        <div class="overflow-x-auto rounded-md border border-slate-800 bg-slate-900">
          <table class="min-w-full text-left text-sm">
            <thead class="border-b border-slate-800 text-xs text-slate-400">
              <tr>
                <th scope="col" class="px-4 py-3 font-medium">Name</th>
                <th scope="col" class="px-4 py-3 font-medium">Department</th>
                <th scope="col" class="px-4 py-3 font-medium">Position</th>
                <th scope="col" class="px-4 py-3 font-medium">Reporting To</th>
                <th scope="col" class="px-4 py-3 font-medium">End date</th>
                <th scope="col" class="px-4 py-3 text-right font-medium">Days</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr v-for="row in group.rows" :key="row.key" class="text-slate-200">
                <td class="whitespace-nowrap px-4 py-3 font-medium text-slate-100">{{ row.name || '—' }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-slate-300">{{ row.department || '—' }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-slate-300">{{ row.position || '—' }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-slate-300">{{ row.reportingTo || '—' }}</td>
                <td class="whitespace-nowrap px-4 py-3 tabular-nums text-slate-200">{{ row.contractOrProbationEndDate }}</td>
                <td class="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-slate-100">{{ row.daysRemaining }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
type Item = {
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

function normalizeCountry(country: string) {
  const trimmed = (country ?? '').trim()
  return trimmed || '—'
}

const rows = computed(() =>
  props.items.map((i) => ({
    key: `${i.name}__${i.contractOrProbationEndDate}__${i.daysRemaining}`,
    countryKey: normalizeCountry(i.countryAssigned),
    countryLabel: normalizeCountry(i.countryAssigned),
    ...i
  }))
)

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

const groupedRows = computed(() => {
  const map = new Map<string, typeof rows.value>()
  for (const r of rows.value) {
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
})

const items = computed(() => props.items)
</script>

