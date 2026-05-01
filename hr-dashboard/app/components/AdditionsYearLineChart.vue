<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div v-if="items.length === 0" class="text-sm text-slate-600">No additions data.</div>

    <div v-else class="flex min-h-0 flex-1 flex-col" :class="compact ? 'gap-1.5' : 'gap-3'">
      <h3 class="shrink-0 font-semibold text-hr-navy" :class="compact ? 'text-sm' : 'text-lg'">{{ heading }}</h3>

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
            <linearGradient id="additions-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="rgb(20 184 166)" stop-opacity="0.28" />
              <stop offset="100%" stop-color="rgb(20 184 166)" stop-opacity="0" />
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

            <path :d="areaPath" fill="url(#additions-area)" stroke="none" />
            <path
              :d="linePath"
              fill="none"
              stroke="rgb(13 148 136)"
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
                @pointerenter="onPointEnter(p, $event)"
                @pointermove="onPointMove($event)"
                @pointerleave="onPointLeave"
              />
              <circle
                v-if="idx === points.length - 1"
                :cx="p.x"
                :cy="p.y"
                :r="compact ? 6 : 8"
                fill="rgb(13 148 136)"
                fill-opacity="0.18"
              />
              <circle
                :cx="p.x"
                :cy="p.y"
                :r="compact ? 3 : 4"
                fill="white"
                stroke="rgb(13 148 136)"
                :stroke-width="compact ? 1.75 : 2"
              />
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

const props = withDefaults(
  defineProps<{
    items: YearPoint[]
    heading?: string
    compact?: boolean
  }>(),
  { heading: 'Employee Additions Over Time', compact: false }
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

const maxY = computed(() => {
  const m = Math.max(...items.value.map((i) => i.count), 0)
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

function onPointEnter(p: { year: number; count: number }, ev: PointerEvent) {
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
</script>
