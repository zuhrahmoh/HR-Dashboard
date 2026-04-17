<template>
  <div class="space-y-3">
    <div class="space-y-0.5">
      <h3 class="text-base font-semibold text-hr-navy">Average age by country (grouped bars)</h3>
      <p class="text-sm text-slate-500">Male and Female average age side-by-side per country (all countries from the data source).</p>
    </div>

    <div v-if="columns.length === 0" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-sm text-slate-800">
      No age data available.
    </div>

    <div v-else class="rounded-md border border-slate-200 bg-white shadow-card p-4">
      <div class="mt-3">
        <!-- Plot area (gridlines + axis apply ONLY here) -->
        <div class="relative pt-6">
          <div class="relative h-56">
            <!-- shared gridlines across axis + plot -->
            <div class="pointer-events-none absolute inset-x-0 top-0 border-t border-hr-navy/25" />
            <div class="pointer-events-none absolute inset-x-0 top-1/2 border-t border-hr-navy/25" />
            <div class="pointer-events-none absolute inset-x-0 bottom-0 border-t border-hr-navy/25" />

            <div class="grid grid-cols-[3.25rem_1fr] items-end gap-2">
              <!-- Y axis -->
              <div class="relative h-56">
                <div class="absolute left-0 top-0 -translate-y-1/2 text-xs font-semibold tabular-nums text-slate-800">{{ maxLabel }}</div>
                <div class="absolute left-0 top-1/2 -translate-y-1/2 text-xs font-semibold tabular-nums text-slate-800">{{ midLabel }}</div>
                <div class="absolute left-0 bottom-0 translate-y-1/2 text-xs font-semibold tabular-nums text-slate-800">0</div>
                <div class="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 origin-left text-xs font-semibold text-slate-500">
                  Avg age (years)
                </div>
              </div>

              <!-- Plot: labels sit above bars (absolute), bars use full h-56 -->
              <div class="min-w-0">
                <div class="grid h-56 gap-1" :style="countriesGridStyle">
                  <div v-for="c in columns" :key="c.key" class="min-w-0">
                    <div class="flex h-56 items-end justify-center gap-0.5">
                      <div class="relative h-56 w-8 shrink-0">
                        <div
                          class="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 text-xs font-semibold tabular-nums text-slate-800"
                          :title="`Avg: ${c.maleAvgLabel}`"
                          :style="{ bottom: `calc(${c.maleHeightPct} + 0.25rem)` }"
                        >
                          {{ c.maleAvgLabel }}
                        </div>
                        <div
                          class="absolute bottom-0 left-1/2 w-[10px] -translate-x-1/2 rounded-sm bg-sky-300"
                          :style="{ height: c.maleHeightPct }"
                          :title="c.maleTitle"
                        />
                      </div>
                      <div class="relative h-56 w-8 shrink-0">
                        <div
                          class="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 text-xs font-semibold tabular-nums text-slate-800"
                          :title="`Avg: ${c.femaleAvgLabel}`"
                          :style="{ bottom: `calc(${c.femaleHeightPct} + 0.25rem)` }"
                        >
                          {{ c.femaleAvgLabel }}
                        </div>
                        <div
                          class="absolute bottom-0 left-1/2 w-[10px] -translate-x-1/2 rounded-sm bg-pink-300"
                          :style="{ height: c.femaleHeightPct }"
                          :title="c.femaleTitle"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- X axis labels (below baseline, so bars don't "float") -->
        <div class="mt-2 grid grid-cols-[3.25rem_1fr] items-start gap-2">
          <div />
          <div class="min-w-0">
            <div class="grid gap-1" :style="countriesGridStyle">
              <div
                v-for="c in columns"
                :key="`label__${c.key}`"
                class="min-w-0 truncate text-center text-xs font-semibold text-hr-navy"
                :title="c.countryLabel"
              >
                {{ c.countryShortLabel }}
              </div>
            </div>

            <div class="mt-2 text-center text-xs font-semibold text-slate-400">
              Country
            </div>
          </div>
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

function clampPct(v: number) {
  return `${Math.max(0, Math.min(100, v))}%`
}

function labelCountry(country: string) {
  const v = (country ?? '').trim()
  return v || '—'
}

function fmtAge(avg: number | null) {
  if (avg === null || !Number.isFinite(avg)) return '—'
  return avg.toFixed(1)
}

function safeCount(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

const maxAvg = computed(() => {
  let m = 0
  for (const i of props.items ?? []) {
    if (i.maleAvgAge != null && Number.isFinite(i.maleAvgAge)) m = Math.max(m, i.maleAvgAge)
    if (i.femaleAvgAge != null && Number.isFinite(i.femaleAvgAge)) m = Math.max(m, i.femaleAvgAge)
  }
  return m
})

const maxLabel = computed(() => (maxAvg.value > 0 ? maxAvg.value.toFixed(0) : '0'))
const midLabel = computed(() => (maxAvg.value > 0 ? (maxAvg.value / 2).toFixed(0) : '0'))

const countriesGridStyle = computed(() => {
  const n = columns.value.length
  if (n <= 0) return {}
  return {
    gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`
  } as Record<string, string>
})

function shortCountryLabel(input: string) {
  const s = (input ?? '').trim()
  if (!s) return '—'
  if (s === 'Trinidad and Tobago') return 'TT'
  if (s === 'Guyana') return 'GUY'
  if (s === 'USA') return 'USA'
  if (s === 'Suriname') return 'SUR'
  if (s === 'El Dorado Offshore GY') return 'EDO GUY'
  if (s === 'El Dorado Offshore TT') return 'EDO TT'
  if (s === 'Mexico') return 'MEX'
  if (s === 'Colombia') return 'COL'
  if (s.length <= 10) return s
  // Prefer "X&Y" when the name contains '&' (e.g., "Trinidad & Tobago" -> "T&T").
  if (s.includes('&')) {
    const [left, right] = s.split('&').map((p) => p.trim())
    const l = left?.[0]?.toUpperCase()
    const r = right?.[0]?.toUpperCase()
    if (l && r) return `${l}&${r}`
  }

  const stop = new Set(['and'])
  const parts = s
    .split(/[^A-Za-z0-9]+/g)
    .map((p) => p.trim())
    .filter((p) => p && !stop.has(p.toLowerCase()))
  if (parts.length <= 1) return s.slice(0, 10)
  const initials = parts.slice(0, 3).map((p) => p[0]?.toUpperCase()).filter(Boolean)
  return initials.join('')
}

const BRANCH_ORDER = [
  'Trinidad and Tobago',
  'Guyana',
  'USA',
  'Suriname',
  'El Dorado Offshore GY',
  'El Dorado Offshore TT',
  'Mexico',
  'Colombia'
] as const

function branchIndex(label: string) {
  return BRANCH_ORDER.indexOf((label ?? '').trim() as any)
}

const columns = computed(() => {
  const denom = maxAvg.value > 0 ? maxAvg.value : 1
  const base = (props.items ?? [])
    .map((i) => {
      const countryLabel = labelCountry(i.country)
      const male = i.maleAvgAge
      const female = i.femaleAvgAge
      const maleHeightPct = clampPct(male != null && Number.isFinite(male) ? (male / denom) * 100 : 0)
      const femaleHeightPct = clampPct(female != null && Number.isFinite(female) ? (female / denom) * 100 : 0)
      return {
        key: `${i.country}__${i.maleCount}__${i.femaleCount}`,
        countryLabel,
        maleHeightPct,
        femaleHeightPct,
        maleCount: safeCount(i.maleCount),
        femaleCount: safeCount(i.femaleCount),
        totalCount: safeCount(i.maleCount) + safeCount(i.femaleCount),
        countryShortLabel: shortCountryLabel(countryLabel),
        maleAvgLabel: fmtAge(male),
        femaleAvgLabel: fmtAge(female),
        maleTitle: `Male Avg: ${fmtAge(male)} | Count: ${Number.isFinite(i.maleCount) ? i.maleCount : 0}`,
        femaleTitle: `Female Avg: ${fmtAge(female)} | Count: ${Number.isFinite(i.femaleCount) ? i.femaleCount : 0}`
      }
    })

  const isBranchOnly = base.length > 0 && base.every((c) => branchIndex(c.countryLabel) >= 0)
  if (isBranchOnly) return base.slice().sort((a, b) => branchIndex(a.countryLabel) - branchIndex(b.countryLabel))

  return base.slice().sort((a, b) => b.totalCount - a.totalCount || a.countryLabel.localeCompare(b.countryLabel))
})
</script>

