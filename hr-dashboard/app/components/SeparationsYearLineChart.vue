<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div v-if="items.length === 0" class="text-sm text-slate-600">No separations data.</div>

    <div v-else class="flex min-h-0 flex-1 flex-col" :class="compact ? 'gap-1.5' : 'gap-3'">
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h3 class="font-semibold text-hr-navy" :class="compact ? 'text-sm' : 'text-lg'">{{ heading }}</h3>
        <label v-if="hasTypeSeries" class="flex items-center gap-2 font-medium text-slate-600" :class="compact ? 'gap-1 text-xs' : 'gap-2 text-sm'">
          <span class="whitespace-nowrap">Type</span>
          <select
            v-model="selectedType"
            class="rounded-md border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-slate-400"
            :class="compact ? 'h-7 px-1.5 text-xs' : 'h-8 px-2 text-sm'"
          >
            <option value="">All</option>
            <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>
      </div>

      <div ref="wrapEl" class="relative min-h-0 flex-1">
        <div
          v-if="hover"
          class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-hr-navy shadow-lg shadow-slate-900/10"
          :style="{ left: `${tooltipLeft}px`, top: `${tooltipTop}px` }"
        >
          {{ hover.label }}: {{ hover.value }}
        </div>

        <svg
          :viewBox="`0 0 ${dims.W} ${dims.H}`"
          class="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="separations-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="rgb(236 72 153)" stop-opacity="0.22" />
              <stop offset="100%" stop-color="rgb(236 72 153)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" :width="dims.W" :height="dims.H" fill="transparent" />

          <g :transform="`translate(${dims.padL},${dims.padT})`">
            <template v-for="t in yTicks" :key="`g-${t.value}`">
              <line
                :x1="0"
                :y1="t.y"
                :x2="innerW"
                :y2="t.y"
                stroke="rgb(226 232 240)"
                stroke-width="1"
                stroke-dasharray="3 3"
              />
            </template>

            <line :x1="0" :y1="innerH" :x2="innerW" :y2="innerH" stroke="rgb(203 213 225)" stroke-width="1" />

            <path :d="areaPath" fill="url(#separations-area)" stroke="none" />
            <path
              :d="linePath"
              fill="none"
              stroke="rgb(236 72 153)"
              :stroke-width="compact ? 2.25 : 3"
              stroke-linejoin="round"
              stroke-linecap="round"
            />

            <template v-for="(p, idx) in points" :key="p.year">
              <circle
                :cx="p.x"
                :cy="p.y"
                r="9"
                fill="transparent"
                @pointerenter="onBasePointEnter(p, $event)"
                @pointermove="onPointMove($event)"
                @pointerleave="onPointLeave"
              />
              <circle
                v-if="idx === points.length - 1"
                :cx="p.x"
                :cy="p.y"
                :r="compact ? 6 : 8"
                fill="rgb(236 72 153)"
                fill-opacity="0.18"
              />
              <circle
                :cx="p.x"
                :cy="p.y"
                :r="compact ? 3 : 4"
                fill="white"
                stroke="rgb(236 72 153)"
                :stroke-width="compact ? 1.75 : 2"
              />
            </template>

            <template v-if="overlayPoints.length > 0">
              <path
                :d="overlayLinePath"
                fill="none"
                :stroke="overlayStroke"
                :stroke-width="compact ? 2.25 : 3"
                stroke-linejoin="round"
                stroke-linecap="round"
                stroke-dasharray="5 4"
              />
              <template v-for="p in overlayPoints" :key="`o-${p.year}`">
                <circle
                  :cx="p.x"
                  :cy="p.y"
                  r="9"
                  fill="transparent"
                  @pointerenter="onOverlayPointEnter(p, $event)"
                  @pointermove="onPointMove($event)"
                  @pointerleave="onPointLeave"
                />
                <circle
                  :cx="p.x"
                  :cy="p.y"
                  :r="compact ? 3 : 4"
                  fill="white"
                  :stroke="overlayStroke"
                  :stroke-width="compact ? 1.75 : 2"
                />
              </template>
            </template>

            <template v-for="t in xTicks" :key="t.year">
              <text
                :x="t.x"
                :y="innerH + (compact ? 16 : 22)"
                text-anchor="middle"
                :font-size="compact ? 11 : 15"
                font-weight="500"
                fill="rgb(100 116 139)"
              >
                {{ t.year }}
              </text>
            </template>

            <template v-for="t in yTicks" :key="t.value">
              <text
                :x="-8"
                :y="t.y"
                text-anchor="end"
                dominant-baseline="middle"
                :font-size="compact ? 11 : 15"
                font-weight="500"
                fill="rgb(100 116 139)"
              >
                {{ t.value }}
              </text>
            </template>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type YearPoint = { year: number; count: number }
type SeparationType =
  | 'resigned'
  | 'retired'
  | 'fired'
  | 'vsep'
  | 'end_of_contract'
  | 'probation_failure'
  | 'retrenchment'
  | 'separated'

const props = withDefaults(
  defineProps<{
    items: YearPoint[]
    byType?: Partial<Record<SeparationType, YearPoint[]>> | null
    heading?: string
    compact?: boolean
  }>(),
  { heading: 'Employee Separations Over Time', compact: false }
)

const compact = computed(() => props.compact === true)

const dims = computed(() =>
  compact.value
    ? { W: 560, H: 148, padL: 42, padR: 12, padT: 10, padB: 26 }
    : { W: 640, H: 240, padL: 54, padR: 18, padT: 16, padB: 42 }
)

const innerW = computed(() => dims.value.W - dims.value.padL - dims.value.padR)
const innerH = computed(() => dims.value.H - dims.value.padT - dims.value.padB)

const items = computed(() =>
  (props.items ?? [])
    .filter((i) => Number.isFinite(i.year) && Number.isFinite(i.count))
    .map((i) => ({ year: Math.floor(i.year), count: Math.max(0, Math.floor(i.count)) }))
    .sort((a, b) => a.year - b.year)
)

const typeOptions: Array<{ value: SeparationType; label: string }> = [
  { value: 'resigned', label: 'Resigned' },
  { value: 'retired', label: 'Retired' },
  { value: 'fired', label: 'Fired' },
  { value: 'vsep', label: 'VSEP' },
  { value: 'end_of_contract', label: 'End of Contract' },
  { value: 'probation_failure', label: 'Probation Failure' },
  { value: 'retrenchment', label: 'Retrenchment' },
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

const maxY = computed(() => {
  const baseMax = Math.max(...items.value.map((i) => i.count), 0)
  const overlayMax =
    selectedType.value && hasTypeSeries.value ? Math.max(...Array.from(overlaySeriesMap.value.values()), 0) : 0
  const m = Math.max(baseMax, overlayMax)
  return m <= 0 ? 1 : m
})

function xScale(idx: number) {
  const n = Math.max(1, items.value.length - 1)
  return (idx / n) * innerW.value
}

function yScale(v: number) {
  const m = maxY.value
  return innerH.value - (v / m) * innerH.value
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

type HoverState = { label: string; value: number; x: number; y: number; w: number; h: number }
const wrapEl = ref<HTMLElement | null>(null)
const hover = ref<HoverState | null>(null)

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

const tooltipLeft = computed(() => {
  const h = hover.value
  if (!h) return 0
  return clamp(h.x, 56, Math.max(56, h.w - 56))
})
const tooltipTop = computed(() => {
  const h = hover.value
  if (!h) return 0
  return clamp(h.y, 18, Math.max(18, h.h - 10))
})

function setHover(label: string, value: number, ev: PointerEvent) {
  const el = wrapEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  hover.value = { label, value, x: ev.clientX - r.left, y: ev.clientY - r.top, w: r.width, h: r.height }
}

function onBasePointEnter(p: { year: number; count: number }, ev: PointerEvent) {
  if (selectedType.value && hasTypeSeries.value) {
    setHover(String(p.year), overlaySeriesMap.value.get(p.year) ?? 0, ev)
    return
  }
  setHover(String(p.year), p.count, ev)
}

function onOverlayPointEnter(p: { year: number; count: number }, ev: PointerEvent) {
  setHover(String(p.year), p.count, ev)
}

function onPointMove(ev: PointerEvent) {
  const h = hover.value
  if (!h) return
  const el = wrapEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  hover.value = { ...h, x: ev.clientX - r.left, y: ev.clientY - r.top, w: r.width, h: r.height }
}

function onPointLeave() {
  hover.value = null
}

function toSmoothPath(pts: Array<{ x: number; y: number }>) {
  if (pts.length === 0) return ''
  const first = pts[0]
  if (!first) return ''
  if (pts.length === 1) return `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
  let d = `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`
  const tension = 0.35
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

const linePath = computed(() => toSmoothPath(points.value))
const overlayLinePath = computed(() => toSmoothPath(overlayPoints.value))

const areaPath = computed(() => {
  const pts = points.value
  if (pts.length === 0) return ''
  const d = toSmoothPath(pts)
  const last = pts[pts.length - 1]
  if (!last) return ''
  const ih = innerH.value
  return `${d} L ${last.x.toFixed(1)} ${ih.toFixed(1)} L 0 ${ih.toFixed(1)} Z`
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
  if (t === 'resigned') return 'rgb(20 184 166)'
  if (t === 'retired') return 'rgb(168 85 247)'
  if (t === 'fired') return 'rgb(236 72 153)'
  if (t === 'vsep') return 'rgb(59 130 246)'
  if (t === 'end_of_contract') return 'rgb(99 102 241)'
  if (t === 'probation_failure') return 'rgb(244 63 94)'
  if (t === 'retrenchment') return 'rgb(217 70 239)'
  if (t === 'separated') return 'rgb(30 58 138)'
  return 'rgb(20 184 166)'
})
</script>
