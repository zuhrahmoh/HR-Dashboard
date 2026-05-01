<template>
  <div class="space-y-3">
    <div v-if="!hideHeading" class="space-y-0.5">
      <h3 class="text-base font-semibold text-hr-navy">Average age by country (grouped bars)</h3>
      <p class="text-sm text-slate-500">Male and Female average age side-by-side per country (all countries from the data source).</p>
    </div>

    <div v-if="columns.length === 0" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-sm text-slate-800">
      No age data available.
    </div>

    <div
      v-else
      class="bg-white"
      :class="embedded ? '' : ['rounded-md border border-slate-200 shadow-card', compact ? 'p-3' : 'p-4']"
    >
      <div :class="compact ? 'mt-2' : 'mt-3'">
        <!-- Plot area (gridlines + axis apply ONLY here) -->
        <div class="relative" :class="compact ? 'pt-4' : 'pt-6'">
          <div class="relative" :class="compact ? 'h-40' : 'h-56'">
            <!-- shared gridlines across axis + plot -->
            <div class="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-slate-200" />
            <div class="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200" />
            <div class="pointer-events-none absolute inset-x-0 bottom-0 border-t border-slate-300" />

            <div class="grid grid-cols-[4.25rem_1fr] items-end gap-2">
              <!-- Y axis: ticks right-aligned toward plot; title on far left -->
              <div class="relative overflow-visible" :class="compact ? 'h-40' : 'h-56'">
                <div class="absolute right-0 top-0 z-[1] -translate-y-1/2 text-right text-[11px] font-semibold tabular-nums text-slate-500">
                  {{ maxLabel }}
                </div>
                <div class="absolute right-0 top-1/2 z-[1] -translate-y-1/2 text-right text-[11px] font-semibold tabular-nums text-slate-500">
                  {{ midLabel }}
                </div>
                <div class="absolute right-0 bottom-0 z-[1] translate-y-1/2 text-right text-[11px] font-semibold tabular-nums text-slate-500">
                  0
                </div>
                <div
                  class="pointer-events-none absolute inset-y-0 left-0 z-0 flex w-7 items-center justify-center overflow-visible"
                >
                  <span class="-rotate-90 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide leading-tight text-slate-400">
                    Avg age (years)
                  </span>
                </div>
              </div>

              <!-- Plot: labels sit above bars (absolute), bars use full h-56 -->
              <div class="min-w-0">
                <div class="grid gap-2.5" :class="compact ? 'h-40' : 'h-56'" :style="countriesGridStyle">
                  <div v-for="c in columns" :key="c.key" class="min-w-0">
                    <div class="flex items-end justify-center gap-0" :class="compact ? 'h-40' : 'h-56'">
                      <div class="relative w-8 shrink-0" :class="compact ? 'h-40' : 'h-56'">
                        <div class="absolute inset-x-0 bottom-0 mx-auto w-[10px] rounded-t-sm bg-slate-100/80" style="height:100%" />
                        <div
                          class="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 text-[11px] font-semibold tabular-nums text-slate-700"
                          :title="`Avg: ${c.maleAvgLabel}`"
                          :style="{ bottom: `calc(${c.maleHeightPct} + 0.25rem)` }"
                        >
                          {{ c.maleAvgLabel }}
                        </div>
                        <div
                          class="absolute bottom-0 left-1/2 w-[10px] -translate-x-1/2 rounded-t-md bg-gradient-to-t from-blue-900 to-blue-700 shadow-[inset_0_-1px_0_rgba(30,58,138,0.18)] transition-[filter] hover:brightness-110"
                          :style="{ height: c.maleHeightPct }"
                          :title="c.maleTitle"
                        />
                      </div>
                      <div class="relative w-8 shrink-0" :class="compact ? 'h-40' : 'h-56'">
                        <div class="absolute inset-x-0 bottom-0 mx-auto w-[10px] rounded-t-sm bg-slate-100/80" style="height:100%" />
                        <div
                          class="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 text-[11px] font-semibold tabular-nums text-slate-700"
                          :title="`Avg: ${c.femaleAvgLabel}`"
                          :style="{ bottom: `calc(${c.femaleHeightPct} + 0.25rem)` }"
                        >
                          {{ c.femaleAvgLabel }}
                        </div>
                        <div
                          class="absolute bottom-0 left-1/2 w-[10px] -translate-x-1/2 rounded-t-md bg-gradient-to-t from-pink-500 to-pink-400 shadow-[inset_0_-1px_0_rgba(190,24,93,0.16)] transition-[filter] hover:brightness-110"
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
        <div class="mt-2 grid grid-cols-[4.25rem_1fr] items-start gap-2">
          <div />
          <div class="min-w-0">
            <div class="grid gap-2.5" :style="countriesGridStyle">
              <div
                v-for="c in columns"
                :key="`label__${c.key}`"
                class="min-w-0 truncate text-center text-[11px] font-semibold tracking-wide text-slate-600"
                :title="c.countryLabel"
              >
                {{ c.countryShortLabel }}
              </div>
            </div>

            <div class="mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
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

const props = withDefaults(
  defineProps<{ items: Item[]; hideHeading?: boolean; compact?: boolean; embedded?: boolean }>(),
  { hideHeading: false, compact: false, embedded: false }
)

const compact = computed(() => props.compact === true)
const embedded = computed(() => props.embedded === true)

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

