<template>
  <div class="mt-2">
    <div v-if="items.length === 0" class="text-sm text-slate-300">No additions data.</div>

    <div v-else class="space-y-3">
      <div class="flex items-center justify-between text-sm">
        <div class="text-slate-300">Yearly additions</div>
        <div class="tabular-nums text-slate-50">{{ total }}</div>
      </div>

      <svg viewBox="0 0 640 240" class="h-40 w-full">
        <rect x="0" y="0" width="640" height="240" fill="transparent" />

        <g :transform="`translate(${padL},${padT})`">
          <path :d="areaPath" fill="rgb(236 72 153 / 0.12)" stroke="none" />
          <path
            :d="linePath"
            fill="none"
            stroke="rgb(236 72 153)"
            stroke-width="3"
            stroke-linejoin="round"
            stroke-linecap="round"
          />

          <template v-for="p in points" :key="p.year">
            <circle :cx="p.x" :cy="p.y" r="4" fill="rgb(236 72 153)" />
          </template>

          <line :x1="0" :y1="innerH" :x2="innerW" :y2="innerH" stroke="rgb(30 41 59)" stroke-width="2" />
          <line x1="0" y1="0" x2="0" :y2="innerH" stroke="rgb(30 41 59)" stroke-width="2" />

          <template v-for="t in xTicks" :key="t.year">
            <text :x="t.x" :y="innerH + 18" text-anchor="middle" font-size="12" fill="rgb(148 163 184)">
              {{ t.year }}
            </text>
          </template>

          <template v-for="t in yTicks" :key="t.value">
            <line :x1="0" :y1="t.y" :x2="innerW" :y2="t.y" stroke="rgb(30 41 59)" stroke-width="1" />
            <text :x="-10" :y="t.y + 4" text-anchor="end" font-size="12" fill="rgb(148 163 184)">
              {{ t.value }}
            </text>
          </template>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
type YearPoint = { year: number; count: number }

const props = defineProps<{
  items: YearPoint[]
}>()

const items = computed(() =>
  (props.items ?? [])
    .filter((i) => Number.isFinite(i.year) && Number.isFinite(i.count))
    .map((i) => ({ year: Math.floor(i.year), count: Math.max(0, Math.floor(i.count)) }))
    .sort((a, b) => a.year - b.year)
)

const total = computed(() => items.value.reduce((acc, i) => acc + i.count, 0))

const W = 640
const H = 240
const padL = 44
const padR = 18
const padT = 12
const padB = 34
const innerW = W - padL - padR
const innerH = H - padT - padB

const maxY = computed(() => {
  const m = Math.max(...items.value.map((i) => i.count), 0)
  return m <= 0 ? 1 : m
})

function xScale(idx: number) {
  const n = Math.max(1, items.value.length - 1)
  return (idx / n) * innerW
}

function yScale(v: number) {
  const m = maxY.value
  return innerH - (v / m) * innerH
}

const points = computed(() =>
  items.value.map((i, idx) => ({
    year: i.year,
    count: i.count,
    x: xScale(idx),
    y: yScale(i.count)
  }))
)

function toPath(pts: Array<{ x: number; y: number }>) {
  if (pts.length === 0) return ''
  const [first, ...rest] = pts
  return ['M', first.x.toFixed(1), first.y.toFixed(1), ...rest.flatMap((p) => ['L', p.x.toFixed(1), p.y.toFixed(1)])].join(' ')
}

const linePath = computed(() => toPath(points.value))

const areaPath = computed(() => {
  const pts = points.value
  if (pts.length === 0) return ''
  const d = toPath(pts)
  const last = pts[pts.length - 1]
  return `${d} L ${last.x.toFixed(1)} ${innerH.toFixed(1)} L 0 ${innerH.toFixed(1)} Z`
})

const xTicks = computed(() => points.value.map((p) => ({ year: p.year, x: p.x })))

const yTicks = computed(() => {
  const m = maxY.value
  const step = m <= 4 ? 1 : Math.ceil(m / 4)
  const ticks: Array<{ value: number; y: number }> = []
  for (let v = 0; v <= m; v += step) ticks.push({ value: v, y: yScale(v) })
  if (ticks[ticks.length - 1]?.value !== m) ticks.push({ value: m, y: yScale(m) })
  return ticks
})
</script>

