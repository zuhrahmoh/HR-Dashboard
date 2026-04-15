<template>
  <div class="flex h-full min-h-0 flex-col space-y-3 overflow-hidden">
    <div v-if="items.length === 0" class="text-base text-slate-300">No headcount data.</div>

    <div v-else class="flex min-h-0 flex-1 flex-col">
      <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        <div
          v-for="row in rows"
          :key="row.key"
          class="grid min-w-0 grid-cols-[5.75rem_1fr_auto] items-center gap-3 sm:grid-cols-[7rem_1fr_auto]"
        >
          <div class="min-w-0 text-xs font-semibold tracking-tight text-slate-200" :title="row.fullLabel">
            <span class="block truncate">
              {{ row.shortLabel }}
            </span>
          </div>

          <div class="min-w-0">
            <div class="h-1.5 w-full overflow-hidden rounded bg-slate-800 sm:h-2">
              <div :class="['h-full rounded', row.colorClass]" :style="{ width: row.widthPct }" />
            </div>
          </div>

          <div class="text-xs font-semibold tabular-nums text-slate-200">
            {{ row.headcount }}
          </div>
        </div>
      </div>

      <div v-if="showLegend" class="mt-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Key</div>
        <div class="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          <div v-for="row in rows" :key="`${row.key}__legend`" class="flex min-w-0 items-start gap-2">
            <div class="h-2.5 w-2.5 shrink-0 rounded-sm" :class="row.colorClass" />
            <div class="min-w-0 text-xs leading-snug text-slate-200">
              <span class="font-semibold">{{ row.shortLabel }}</span>
              <span class="text-slate-400"> — </span>
              <span class="text-slate-300">{{ row.fullLabel }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Item = { country: string; headcount: number }

const props = withDefaults(
  defineProps<{
  items: Item[]
  showLegend?: boolean
  }>(),
  { showLegend: false }
)

const max = computed(() => props.items.reduce((m, i) => Math.max(m, i.headcount), 0))

const BRANCH_ABBREV: Record<string, string> = {
  'Trinidad and Tobago': 'TT',
  Guyana: 'GUY',
  USA: 'USA',
  Suriname: 'SUR',
  'El Dorado Offshore GY': 'EDO GUY',
  'El Dorado Offshore TT': 'EDO TT',
  Mexico: 'MEX',
  Colombia: 'COL'
}

function abbrev(label: string) {
  const v = (label ?? '').trim()
  return BRANCH_ABBREV[v] || v || '—'
}

const BAR_COLOR_CLASSES = [
  // Discrete stops inspired by the reference gradient (purple → magenta → red → peach).
  // Hexes are used to keep the palette cohesive and avoid Tailwind’s default blues/greens.
  // Brighter purples for visibility on dark background.
  'bg-[#5B21B6]', // purple
  'bg-[#6D28D9]',
  'bg-[#7C3AED]',
  'bg-[#8B5CF6]', // bright violet
  'bg-[#A78BFA]', // light violet

  // Magenta → pink → rose (spaced to avoid looking too similar).
  'bg-[#D946EF]', // fuchsia
  'bg-[#C026D3]',
  'bg-[#EC4899]', // hot pink
  'bg-[#F43F5E]', // rose-red
  'bg-[#E11D48]', // red

  // Peach/orange (more separated from pinks).
  'bg-[#F97316]', // orange
  'bg-[#FB923C]', // light orange
  'bg-[#FDBA74]', // peach
  'bg-[#FED7AA]', // pale peach

  // Light yellow accents (like the reference).
  'bg-[#FBBF24]', // amber
  'bg-[#FDE047]', // yellow
  'bg-[#FEF08A]'  // light yellow
] as const

const OVERRIDE_BAR_COLOR_BY_LABEL: Record<string, (typeof BAR_COLOR_CLASSES)[number]> = {
  Guyana: 'bg-[#EC4899]',
  GUY: 'bg-[#EC4899]'
}

function hashString(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  return hash
}

function colorClassForLabel(label: string, usedIndexes: Set<number>) {
  const override = OVERRIDE_BAR_COLOR_BY_LABEL[label]
  if (override) {
    const idx = BAR_COLOR_CLASSES.indexOf(override)
    if (idx >= 0) usedIndexes.add(idx)
    return override
  }

  const len = BAR_COLOR_CLASSES.length
  let idx = hashString(label) % len
  while (usedIndexes.size < len && usedIndexes.has(idx)) idx = (idx + 1) % len
  usedIndexes.add(idx)
  return BAR_COLOR_CLASSES[idx]
}

const rows = computed(() => {
  const usedIndexes = new Set<number>()
  return props.items.map((i) => {
    const fullLabel = i.country ? i.country : '—'
    const shortLabel = abbrev(fullLabel)
    const widthPct = max.value > 0 ? `${Math.max(0, Math.min(100, (i.headcount / max.value) * 100))}%` : '0%'
    return {
      key: `${fullLabel}__${i.headcount}`,
      fullLabel,
      shortLabel,
      headcount: i.headcount,
      widthPct,
      colorClass: colorClassForLabel(fullLabel, usedIndexes)
    }
  })
})
</script>

