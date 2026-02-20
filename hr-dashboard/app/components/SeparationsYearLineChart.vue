<template>
  <div class="mt-2">
    <div v-if="items.length === 0" class="text-sm text-slate-300">No separations data.</div>

    <div v-else class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div class="text-slate-300">Yearly separations</div>
        <div class="flex flex-wrap items-center gap-3">
          <label v-if="hasTypeSeries" class="flex items-center gap-2 text-sm font-medium text-slate-300">
            <span class="whitespace-nowrap">Type</span>
            <select
              v-model="selectedType"
              class="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus:border-slate-600"
            >
              <option value="">All</option>
              <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </label>
          <div class="flex items-center gap-2 tabular-nums text-slate-50">
            <span>Total</span>
            <span class="font-semibold">{{ total }}</span>
            <template v-if="selectedType && overlayTotal !== null">
              <span class="text-slate-500">·</span>
              <span class="capitalize text-slate-300">{{ selectedType }}</span>
              <span class="font-semibold" :style="{ color: overlayStroke }">{{ overlayTotal }}</span>
            </template>
          </div>
        </div>
      </div>

      <svg viewBox="0 0 640 240" class="h-40 w-full">
        <rect x="0" y="0" width="640" height="240" fill="transparent" />

        <g :transform="`translate(${padL},${padT})`">
          <path
            :d="areaPath"
            fill="rgb(56 189 248 / 0.10)"
            stroke="none"
          />
          <path
            :d="linePath"
            fill="none"
            stroke="rgb(56 189 248)"
            stroke-width="3"
            stroke-linejoin="round"
            stroke-linecap="round"
          />

          <template v-for="p in points" :key="p.year">
            <circle :cx="p.x" :cy="p.y" r="4" fill="rgb(56 189 248)" />
          </template>

          <template v-if="overlayPoints.length > 0">
            <path
              :d="overlayLinePath"
              fill="none"
              :stroke="overlayStroke"
              stroke-width="3"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <template v-for="p in overlayPoints" :key="`o-${p.year}`">
              <circle :cx="p.x" :cy="p.y" r="4" :fill="overlayStroke" />
            </template>
          </template>

          <line :x1="0" :y1="innerH" :x2="innerW" :y2="innerH" stroke="rgb(30 41 59)" stroke-width="2" />
          <line x1="0" y1="0" x2="0" :y2="innerH" stroke="rgb(30 41 59)" stroke-width="2" />

          <template v-for="t in xTicks" :key="t.year">
            <text
              :x="t.x"
              :y="innerH + 18"
              text-anchor="middle"
              font-size="12"
              fill="rgb(148 163 184)"
            >
              {{ t.year }}
            </text>
          </template>

          <template v-for="t in yTicks" :key="t.value">
            <line :x1="0" :y1="t.y" :x2="innerW" :y2="t.y" stroke="rgb(30 41 59)" stroke-width="1" />
            <text
              :x="-10"
              :y="t.y + 4"
              text-anchor="end"
              font-size="12"
              fill="rgb(148 163 184)"
            >
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
type SeparationType = 'resigned' | 'retired' | 'fired' | 'separated'

const props = defineProps<{
  items: YearPoint[]
  byType?: Partial<Record<SeparationType, YearPoint[]>> | null
}>()

const items = computed(() =>
  (props.items ?? [])
    .filter((i) => Number.isFinite(i.year) && Number.isFinite(i.count))
    .map((i) => ({ year: Math.floor(i.year), count: Math.max(0, Math.floor(i.count)) }))
    .sort((a, b) => a.year - b.year)
)

const total = computed(() => items.value.reduce((acc, i) => acc + i.count, 0))

const typeOptions: Array<{ value: SeparationType; label: string }> = [
  { value: 'resigned', label: 'Resigned' },
  { value: 'retired', label: 'Retired' },
  { value: 'fired', label: 'Fired' },
  { value: 'separated', label: 'Separated' }
]

const selectedType = ref<'' | SeparationType>('')

const hasTypeSeries = computed(() => Boolean(props.byType && Object.keys(props.byType).length > 0))

function normalizeSeries(series: YearPoint[] | undefined | null) {
  return (series ?? [])
    .filter((i) => Number.isFinite(i.year) && Number.isFinite(i.count))
    .map((i) => ({ year: Math.floor(i.year), count: Math.max(0, Math.floor(i.count)) }))
}

const overlaySeriesMap = computed(() => {
  const series = selectedType.value ? normalizeSeries(props.byType?.[selectedType.value]) : []
  const map = new Map<number, number>()
  for (const p of series) map.set(p.year, p.count)
  return map
})

const W = 640
const H = 240
const padL = 44
const padR = 18
const padT = 12
const padB = 34
const innerW = W - padL - padR
const innerH = H - padT - padB

const maxY = computed(() => {
  const baseMax = Math.max(...items.value.map((i) => i.count), 0)
  const overlayMax =
    selectedType.value && hasTypeSeries.value ? Math.max(...Array.from(overlaySeriesMap.value.values()), 0) : 0
  const m = Math.max(baseMax, overlayMax)
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

const overlayPoints = computed(() => {
  if (!selectedType.value || !hasTypeSeries.value) return []
  return items.value.map((i, idx) => {
    const c = overlaySeriesMap.value.get(i.year) ?? 0
    return { year: i.year, count: c, x: xScale(idx), y: yScale(c) }
  })
})

function toPath(pts: Array<{ x: number; y: number }>) {
  if (pts.length === 0) return ''
  const [first, ...rest] = pts
  return ['M', first.x.toFixed(1), first.y.toFixed(1), ...rest.flatMap((p) => ['L', p.x.toFixed(1), p.y.toFixed(1)])].join(' ')
}

const linePath = computed(() => toPath(points.value))
const overlayLinePath = computed(() => toPath(overlayPoints.value))

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

const overlayStroke = computed(() => {
  const t = selectedType.value
  if (t === 'resigned') return 'rgb(251 191 36)'
  if (t === 'retired') return 'rgb(167 139 250)'
  if (t === 'fired') return 'rgb(248 113 113)'
  if (t === 'separated') return 'rgb(148 163 184)'
  return 'rgb(251 191 36)'
})

const overlayTotal = computed(() => {
  if (!selectedType.value || !hasTypeSeries.value) return null
  return overlayPoints.value.reduce((acc, p) => acc + p.count, 0)
})
</script>

