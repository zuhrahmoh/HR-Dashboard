<template>
  <div class="space-y-3">
    <div v-if="items.length === 0" class="text-base text-slate-300">No headcount data.</div>

    <div v-else class="space-y-2">
      <div class="text-center text-base font-semibold tabular-nums text-slate-50">Total headcount: {{ total }}</div>
      <div v-for="row in rows" :key="row.key" class="grid grid-cols-12 items-center gap-3">
        <div class="col-span-4 truncate text-base text-slate-200" :title="row.label">
          {{ row.label }}
        </div>

        <div class="col-span-6">
          <div class="h-2 w-full overflow-hidden rounded bg-slate-800">
            <div :class="['h-full rounded', row.colorClass]" :style="{ width: row.widthPct }" />
          </div>
        </div>

        <div class="col-span-2 text-right text-base tabular-nums text-slate-200">
          {{ row.headcount }}
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
const total = computed(() => props.items.reduce((acc, i) => acc + (Number.isFinite(i.headcount) ? i.headcount : 0), 0))

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
    const label = i.country ? i.country : '—'
    const widthPct = max.value > 0 ? `${Math.max(0, Math.min(100, (i.headcount / max.value) * 100))}%` : '0%'
    return {
      key: `${i.country}__${i.headcount}`,
      label,
      headcount: i.headcount,
      widthPct,
      colorClass: colorClassForLabel(label, usedIndexes)
    }
  })
})
</script>

