<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-0.5">
        <h3 class="text-base font-semibold text-hr-navy">Average age by country (gender)</h3>
        <p class="text-sm text-slate-400">Excludes resigned employees. Uses only employees with a date of birth.</p>
      </div>

      <div class="text-right">
        <div class="text-sm font-medium text-slate-400">Company-wide average age</div>
        <div class="text-lg font-semibold tabular-nums text-hr-navy">{{ companyAvgLabel }}</div>
      </div>

      <div class="flex items-center gap-3 text-sm text-slate-600">
        <div class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-sm bg-sky-300" />
          <span>Male</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-sm bg-pink-300" />
          <span>Female</span>
        </div>
      </div>
    </div>

    <div v-if="rows.length === 0" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-sm text-slate-800">
      No age data available. This requires a populated date of birth per employee (CSV source typically doesn’t include DOB; Odoo uses the employee “Birthday” field).
    </div>

    <div v-else class="space-y-3">
      <div class="grid grid-cols-[7.25rem_1fr_6.5rem_1fr_7.25rem] gap-2 text-sm text-slate-400">
        <div class="text-right">Male</div>
        <div class="text-right">Avg age</div>
        <div class="text-center">Country</div>
        <div>Avg age</div>
        <div>Female</div>
      </div>

      <div
        v-for="row in rows"
        :key="row.countryKey"
        class="grid grid-cols-[7.25rem_1fr_6.5rem_1fr_7.25rem] items-center gap-2 py-1.5"
      >
        <div class="min-w-0 text-right text-sm font-semibold tabular-nums text-slate-800">
          <div class="truncate" :title="`Avg: ${row.maleAgeLabel}`">Avg: {{ row.maleAgeLabel }}</div>
          <div class="truncate text-xs text-slate-400" :title="`Count: ${row.maleCount}`">Count: {{ row.maleCount }}</div>
        </div>

        <div class="min-w-0">
          <div class="relative h-2 w-full overflow-hidden rounded bg-slate-200">
            <div class="absolute inset-y-0 right-0 rounded bg-sky-300" :style="{ width: row.maleWidthPct }" />
          </div>
        </div>

        <div class="min-w-0 truncate text-center text-base text-slate-800" :title="row.countryLabel">
          {{ row.countryLabel }}
        </div>

        <div class="min-w-0">
          <div class="relative h-2 w-full overflow-hidden rounded bg-slate-200">
            <div class="absolute inset-y-0 left-0 rounded bg-pink-300" :style="{ width: row.femaleWidthPct }" />
          </div>
        </div>

        <div class="min-w-0 text-sm font-semibold tabular-nums text-slate-800">
          <div class="truncate" :title="`Avg: ${row.femaleAgeLabel}`">Avg: {{ row.femaleAgeLabel }}</div>
          <div class="truncate text-xs text-slate-400" :title="`Count: ${row.femaleCount}`">Count: {{ row.femaleCount }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Item = {
  country: string
  maleAvgAge: number | null
  femaleAvgAge: number | null
  maleCount: number
  femaleCount: number
}

const props = defineProps<{ items: Item[] }>()

function clampPct(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`
}

function labelCountry(country: string) {
  const v = (country ?? '').trim()
  return v || '—'
}

function fmtAge(avg: number | null) {
  if (avg === null || !Number.isFinite(avg)) return '—'
  return `${avg.toFixed(1)}`
}

const companyAvg = computed(() => {
  let sum = 0
  let count = 0
  for (const i of props.items ?? []) {
    if (i.maleAvgAge != null && Number.isFinite(i.maleAvgAge) && Number.isFinite(i.maleCount) && i.maleCount > 0) {
      sum += i.maleAvgAge * i.maleCount
      count += i.maleCount
    }
    if (i.femaleAvgAge != null && Number.isFinite(i.femaleAvgAge) && Number.isFinite(i.femaleCount) && i.femaleCount > 0) {
      sum += i.femaleAvgAge * i.femaleCount
      count += i.femaleCount
    }
  }
  if (count <= 0) return null
  return sum / count
})

const companyAvgLabel = computed(() => (companyAvg.value != null && Number.isFinite(companyAvg.value) ? companyAvg.value.toFixed(1) : '—'))

const maxAvg = computed(() => {
  let m = 0
  for (const i of props.items) {
    if (i.maleAvgAge != null && Number.isFinite(i.maleAvgAge)) m = Math.max(m, i.maleAvgAge)
    if (i.femaleAvgAge != null && Number.isFinite(i.femaleAvgAge)) m = Math.max(m, i.femaleAvgAge)
  }
  return m
})

const maxAvgLabel = computed(() => (maxAvg.value > 0 ? maxAvg.value.toFixed(0) : '0'))

const rows = computed(() => {
  return (props.items ?? [])
    .map((i) => {
      const male = i.maleAvgAge
      const female = i.femaleAvgAge
      const denom = maxAvg.value > 0 ? maxAvg.value : 1
      return {
        countryKey: `${i.country}__${i.maleCount}__${i.femaleCount}`,
        countryLabel: labelCountry(i.country),
        maleAgeLabel: fmtAge(male),
        femaleAgeLabel: fmtAge(female),
        maleCount: Number.isFinite(i.maleCount) ? i.maleCount : 0,
        femaleCount: Number.isFinite(i.femaleCount) ? i.femaleCount : 0,
        maleAvgAge: male,
        femaleAvgAge: female,
        maleWidthPct: clampPct(male != null && Number.isFinite(male) ? (male / denom) * 100 : 0),
        femaleWidthPct: clampPct(female != null && Number.isFinite(female) ? (female / denom) * 100 : 0),
        totalCount: (Number.isFinite(i.maleCount) ? i.maleCount : 0) + (Number.isFinite(i.femaleCount) ? i.femaleCount : 0)
      }
    })
    .sort((a, b) => b.totalCount - a.totalCount || a.countryLabel.localeCompare(b.countryLabel))
})
</script>

