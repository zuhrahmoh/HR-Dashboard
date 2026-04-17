<template>
  <div class="flex h-full min-h-0 flex-col space-y-3 overflow-hidden">
    <div v-if="items.length === 0" class="text-base text-slate-600">No headcount data.</div>

    <div v-else class="flex min-h-0 flex-1 flex-col">
      <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden pt-1">
        <div
          v-for="row in rows"
          :key="row.key"
          class="grid min-w-0 grid-cols-[5.75rem_1fr_auto] items-center gap-3 sm:grid-cols-[7rem_1fr_auto]"
        >
          <div class="min-w-0 text-xs font-semibold tracking-tight text-slate-800" :title="row.fullLabel">
            <span class="block truncate">
              {{ row.shortLabel }}
            </span>
          </div>

          <div class="min-w-0">
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 sm:h-2">
              <div :class="['h-full min-w-[0.5rem] rounded-full', row.colorClass]" :style="{ width: row.widthPct }" />
            </div>
          </div>

          <div class="text-xs font-semibold tabular-nums text-slate-800">
            {{ row.headcount }}
          </div>
        </div>
      </div>

      <div v-if="showLegend" class="mt-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Key</div>
        <div class="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          <div v-for="row in rows" :key="`${row.key}__legend`" class="flex min-w-0 items-start gap-2">
            <div class="h-2.5 w-2.5 shrink-0 rounded-sm" :class="row.colorClass" />
            <div class="min-w-0 text-xs leading-snug text-slate-800">
              <span class="font-semibold">{{ row.shortLabel }}</span>
              <span class="text-slate-400"> — </span>
              <span class="text-slate-600">{{ row.fullLabel }}</span>
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

/** Mint, royal blue, golden yellow, navy — cycle in display order (reference palette). */
const BAR_COLOR_CLASSES = ['bg-[#50c878]', 'bg-[#2b4593]', 'bg-[#ffc154]', 'bg-[#0d1b3e]'] as const

const rows = computed(() =>
  props.items.map((i, index) => {
    const fullLabel = i.country ? i.country : '—'
    const shortLabel = abbrev(fullLabel)
    const widthPct = max.value > 0 ? `${Math.max(0, Math.min(100, (i.headcount / max.value) * 100))}%` : '0%'
    const colorClass = BAR_COLOR_CLASSES[index % BAR_COLOR_CLASSES.length]
    return {
      key: `${fullLabel}__${i.headcount}`,
      fullLabel,
      shortLabel,
      headcount: i.headcount,
      widthPct,
      colorClass
    }
  })
)
</script>

