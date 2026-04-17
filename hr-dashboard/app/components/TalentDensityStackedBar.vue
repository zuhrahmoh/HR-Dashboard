<template>
  <div class="space-y-3">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h3 class="truncate text-base font-semibold text-hr-navy" :title="title">{{ title }}</h3>
        <p class="text-sm text-slate-500">Total: {{ total }}</p>
      </div>
    </div>

    <div v-if="total === 0" class="text-base text-slate-600">No rating data.</div>

    <div v-else class="space-y-2">
      <div v-for="row in rows" :key="row.bucket" class="grid grid-cols-12 items-center gap-3">
        <div class="col-span-4 truncate text-base text-slate-800" :title="row.bucket">
          {{ row.bucket }}
        </div>

        <div class="col-span-6">
          <div class="h-2 w-full overflow-hidden rounded bg-slate-200">
            <div :class="['h-full rounded', row.colorClass]" :style="{ width: row.widthPct }" />
          </div>
        </div>

        <div class="col-span-2 text-right text-base tabular-nums text-slate-800">
          {{ row.count }} <span class="text-sm text-slate-500 tabular-nums">({{ row.pctLabel }})</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Segment = { bucket: string; count: number }

const props = defineProps<{
  title: string
  segments: Segment[]
}>()

function colorForBucket(bucket: string) {
  const b = bucket.trim().toUpperCase()
  if (b === 'A') return 'bg-hr-chart-mint'
  if (b === 'B+') return 'bg-hr-chart-blue'
  if (b === 'B') return 'bg-hr-chart-amber'
  if (b === 'B-') return 'bg-rose-600'
  if (b === 'C') return 'bg-slate-600'
  return 'bg-slate-400'
}

const total = computed(() => props.segments.reduce((acc, s) => acc + (Number.isFinite(s.count) ? s.count : 0), 0))

const legendSegments = computed(() =>
  props.segments.map((s) => ({
    bucket: s.bucket,
    count: Number.isFinite(s.count) ? s.count : 0,
    colorClass: colorForBucket(s.bucket)
  }))
)

const max = computed(() => legendSegments.value.reduce((m, s) => Math.max(m, s.count), 0))

const rows = computed(() => {
  return legendSegments.value.map((s) => ({
    bucket: s.bucket,
    count: s.count,
    colorClass: s.colorClass,
    widthPct: max.value > 0 ? `${Math.max(0, Math.min(100, (s.count / max.value) * 100))}%` : '0%',
    pctLabel: total.value > 0 ? `${Math.round((s.count / total.value) * 100)}%` : '0%'
  }))
})

const title = computed(() => props.title)
</script>

