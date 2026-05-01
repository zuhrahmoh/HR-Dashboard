<template>
  <div class="flex h-full min-h-0 min-w-0 flex-col">
    <div v-if="items.length === 0" class="text-base text-slate-600">No headcount data.</div>

    <div v-else-if="layout === 'vertical'" class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div class="flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch]">
        <div
          :class="[
            'relative flex flex-1 items-end justify-between border-b-2 border-slate-400 px-1',
            compactVertical
              ? 'min-h-[11rem] gap-3 rounded-md border border-slate-200/90 bg-slate-50/35 bg-[linear-gradient(to_top,rgb(226_232_240)_1px,transparent_1px)] bg-[length:100%_25%] pb-px pt-2 sm:min-h-[12rem] sm:gap-4 lg:gap-5'
              : 'min-h-[13rem] gap-4 pb-0.5 pt-1 sm:gap-6 lg:gap-10'
          ]"
        >
          <div
            v-for="row in rows"
            :key="row.key"
            :class="[
              'flex flex-1 flex-col items-center justify-end',
              compactVertical ? 'min-w-[2.5rem] sm:min-w-[2.75rem]' : 'min-w-[2.75rem] sm:min-w-[3.25rem]'
            ]"
          >
            <div
              :class="[
                'font-semibold tabular-nums text-slate-800',
                compactVertical ? 'mb-0.5 text-[11px]' : 'mb-1 text-xs'
              ]"
            >
              {{ row.headcount }}
            </div>
            <div
              :class="[
                'flex w-full flex-col justify-end',
                compactVertical ? 'h-36 max-w-[2.5rem] sm:h-40 sm:max-w-[2.75rem]' : 'h-52 max-w-[2.75rem] sm:h-56 sm:max-w-[3.25rem]'
              ]"
            >
              <div
                class="min-h-[3px] w-full rounded-t-[3px]"
                :class="row.colorClass"
                :style="{ height: row.verticalBarHeight }"
              />
            </div>
            <div
              :class="[
                'max-w-[4.5rem] truncate text-center font-semibold leading-tight text-slate-800 sm:max-w-[6rem]',
                compactVertical ? 'mt-1.5 text-[10px] sm:text-[11px]' : 'mt-2 text-[10px] sm:text-xs'
              ]"
              :title="row.fullLabel"
            >
              {{ row.shortLabel }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="showLegend" class="mt-4 shrink-0">
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

    <div v-else class="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        :class="[
          'flex min-h-0 min-w-0 flex-1 flex-col pt-0.5',
          compactHorizontal ? 'gap-1' : 'gap-2'
        ]"
      >
        <div
          v-for="row in rows"
          :key="row.key"
          :class="[
            'grid min-w-0 items-center border-b border-slate-100 pb-1.5 last:border-b-0 last:pb-0',
            compactHorizontal
              ? 'grid-cols-[4.5rem_1fr_auto] gap-2 sm:grid-cols-[5.5rem_1fr_auto]'
              : 'grid-cols-[5.75rem_1fr_auto] gap-3 sm:grid-cols-[7rem_1fr_auto]'
          ]"
        >
          <div
            :class="[
              'min-w-0 font-semibold tracking-tight text-slate-800',
              compactHorizontal ? 'text-[10px] leading-tight' : 'text-xs'
            ]"
            :title="row.fullLabel"
          >
            <span class="block truncate">
              {{ row.shortLabel }}
            </span>
          </div>

          <div class="min-w-0">
            <div
              :class="[
                'w-full overflow-hidden rounded-full bg-slate-200',
                compactHorizontal ? 'h-1' : 'h-1.5 sm:h-2'
              ]"
            >
              <div :class="['h-full min-w-[0.25rem] rounded-full', row.colorClass]" :style="{ width: row.widthPct }" />
            </div>
          </div>

          <div
            :class="[
              'shrink-0 font-semibold tabular-nums text-slate-800',
              compactHorizontal ? 'text-[10px]' : 'text-xs'
            ]"
          >
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
    layout?: 'horizontal' | 'vertical'
    /** Tighter vertical chart with baseline and light grid (home dashboard secondary card). */
    compactVertical?: boolean
    /** Tighter horizontal rows for narrow cards. */
    compactHorizontal?: boolean
    /** Sort order for horizontal bars (vertical uses source order). */
    sortBy?: 'none' | 'headcount-desc'
  }>(),
  { showLegend: false, layout: 'horizontal', compactVertical: false, compactHorizontal: false, sortBy: 'none' }
)

const rowSource = computed(() => {
  const list = [...(props.items ?? [])]
  if (props.layout === 'horizontal' && props.sortBy === 'headcount-desc') {
    return list.sort((a, b) => b.headcount - a.headcount)
  }
  return list
})

const max = computed(() => (props.items ?? []).reduce((m, i) => Math.max(m, i.headcount), 0))

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
const BAR_COLOR_CLASSES = ['bg-brand-blue', 'bg-teal-500', 'bg-brand-purple', 'bg-brand-pink'] as const

const rows = computed(() =>
  rowSource.value.map((i, index) => {
    const fullLabel = i.country ? i.country : '—'
    const shortLabel = abbrev(fullLabel)
    const pct = max.value > 0 ? Math.max(0, Math.min(100, (i.headcount / max.value) * 100)) : 0
    const widthPct = `${pct}%`
    const verticalBarHeight = `${pct}%`
    const colorClass = BAR_COLOR_CLASSES[index % BAR_COLOR_CLASSES.length]
    return {
      key: `${fullLabel}__${i.headcount}`,
      fullLabel,
      shortLabel,
      headcount: i.headcount,
      widthPct,
      verticalBarHeight,
      colorClass
    }
  })
)
</script>

