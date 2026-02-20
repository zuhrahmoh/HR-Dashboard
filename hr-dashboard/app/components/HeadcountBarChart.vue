<template>
  <div class="flex h-full flex-col space-y-3">
    <div v-if="items.length === 0" class="text-base text-slate-300">No headcount data.</div>

    <div v-else class="flex min-h-0 flex-1 flex-col">
      <div class="flex min-h-0 flex-1 flex-col justify-between gap-2">
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
    </div>
  </div>
</template>

<script setup lang="ts">
type Item = { country: string; headcount: number }

const props = defineProps<{
  items: Item[]
}>()

const max = computed(() => props.items.reduce((m, i) => Math.max(m, i.headcount), 0))

const BRANCH_ABBREV: Record<string, string> = {
  'Trinidad and Tobago': 'TT',
  Guyana: 'GUY',
  Houston: 'HOU',
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
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-green-500',
  'bg-teal-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-lime-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-fuchsia-500'
] as const

function hashString(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  return hash
}

function colorClassForLabel(label: string, usedIndexes: Set<number>) {
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

