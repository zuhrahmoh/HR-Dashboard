<template>
  <div :class="fillHeight ? 'flex h-full min-h-0 flex-col' : 'space-y-3'">
    <div v-if="points.length === 0" class="text-sm" :class="isLight ? 'text-slate-600' : 'text-slate-600'">
      No headcount history found.
    </div>

    <div v-else :class="fillHeight ? 'flex min-h-0 flex-1 flex-col' : 'space-y-3'">
      <div v-if="showHeader" class="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div :class="isLight ? 'text-slate-700' : 'text-slate-600'">{{ title }}</div>
        <div class="flex items-center gap-2 tabular-nums text-slate-900">
          <span>Latest</span>
          <span class="font-semibold">{{ latestLabel }}</span>
        </div>
      </div>

      <div ref="wrapEl" :class="fillHeight ? 'relative min-h-0 flex-1' : 'relative'">
        <div
          v-if="hover"
          class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border px-2 py-1 text-xs font-semibold shadow-lg"
          :class="
            isLight
              ? 'border-slate-200 bg-white text-slate-900 shadow-slate-300/40'
              : 'border-slate-200 bg-white text-slate-900 shadow-lg shadow-slate-900/10'
          "
          :style="{ left: `${tooltipLeft}px`, top: `${tooltipTop}px` }"
        >
          {{ hover.label }}: {{ hover.value }}
        </div>

        <svg
          :viewBox="`0 0 ${dims.W} ${dims.H}`"
          :class="fillHeight ? 'absolute inset-0 h-full w-full' : compact ? 'h-32 w-full' : 'h-44 w-full'"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="headcount-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="rgb(30 58 138)" stop-opacity="0.28" />
              <stop offset="100%" stop-color="rgb(30 58 138)" stop-opacity="0" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" :width="dims.W" :height="dims.H" fill="transparent" />

          <g :transform="`translate(${dims.padL},${dims.padT})`">
            <template v-for="t in yGridTicks" :key="`g-${t.value}`">
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

            <path :d="areaPath" fill="url(#headcount-area)" stroke="none" />
            <path
              :d="linePath"
              fill="none"
              :stroke="LINE_STROKE"
              :stroke-width="compact ? 2.25 : 3"
              stroke-linejoin="round"
              stroke-linecap="round"
            />

            <template v-for="t in yTicks" :key="`y-${t.value}`">
              <text
                :x="-10"
                :y="t.y"
                text-anchor="end"
                dominant-baseline="middle"
                :font-size="compact ? 10 : 12"
                fill="rgb(100 116 139)"
              >
                {{ formatHeadcountTick(t.value) }}
              </text>
            </template>

            <template v-for="t in xYearTicks" :key="t.label">
              <text
                :x="t.x"
                :y="innerH + (compact ? 14 : 18)"
                text-anchor="middle"
                dominant-baseline="hanging"
                :font-size="compact ? 10 : 12"
                fill="rgb(100 116 139)"
              >
                {{ t.label }}
              </text>
            </template>

            <template v-for="(p, idx) in points" :key="p.month">
              <circle
                :cx="p.x"
                :cy="p.y"
                r="7"
                fill="transparent"
                @pointerenter="onPointEnter(p, $event)"
                @pointermove="onPointMove($event)"
                @pointerleave="onPointLeave"
              />
              <circle
                v-if="idx === points.length - 1"
                :cx="p.x"
                :cy="p.y"
                :r="compact ? 5 : 6"
                :fill="LINE_STROKE"
                fill-opacity="0.18"
              />
              <circle
                v-if="idx === points.length - 1"
                :cx="p.x"
                :cy="p.y"
                :r="compact ? 2.75 : 3.5"
                fill="white"
                :stroke="LINE_STROKE"
                :stroke-width="compact ? 1.75 : 2"
              />
            </template>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type Item = { month: string; headcount: number }

const props = withDefaults(
  defineProps<{
    items: Item[]
    title?: string
    variant?: 'dark' | 'light'
    showHeader?: boolean
    fillHeight?: boolean
    trimYAxis?: boolean
    compact?: boolean
    yMin?: number
  }>(),
  { trimYAxis: false, compact: false }
)

/** Softer navy than sidebar — pairs with stacked-bar contracted blue (#2b4593). */
const LINE_STROKE = 'rgb(30 58 138)'
const AREA_FILL_COMPACT = 'rgb(30 58 138 / 0.13)'
const AREA_FILL = 'rgb(30 58 138 / 0.21)'

const fillHeight = computed(() => props.fillHeight === true)
const trimYAxis = computed(() => props.trimYAxis === true)
const compact = computed(() => props.compact === true)

const dims = computed(() => {
  if (compact.value) {
    return { W: 720, H: 168, padL: 48, padR: 18, padT: 14, padB: 28 }
  }
  return { W: 720, H: 260, padL: 58, padR: 24, padT: 22, padB: 42 }
})

const innerW = computed(() => dims.value.W - dims.value.padL - dims.value.padR)
const innerH = computed(() => dims.value.H - dims.value.padT - dims.value.padB)

const title = computed(() => (props.title ?? 'Headcount trend (monthly)').trim() || 'Headcount trend (monthly)')
const isLight = computed(() => props.variant === 'light')
const showHeader = computed(() => props.showHeader !== false)

function safeInt(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

function formatHeadcountTick(v: number) {
  return String(Math.round(v))
}

function isYyyyMm(v: string) {
  return /^\d{4}-\d{2}$/.test((v ?? '').trim())
}

const items = computed(() =>
  (props.items ?? [])
    .filter((i) => isYyyyMm(i.month))
    .map((i) => ({ month: i.month.trim(), headcount: safeInt(i.headcount) }))
    .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0))
)

const latestLabel = computed(() => {
  const last = items.value[items.value.length - 1]
  if (!last) return '—'
  return `${last.month}: ${last.headcount}`
})

const minY = computed(() => {
  if (Number.isFinite(props.yMin)) return Math.max(0, Math.floor(props.yMin as number))
  if (!trimYAxis.value) return 0
  const vals = items.value.map((i) => i.headcount)
  if (vals.length === 0) return 0
  const rawMin = Math.min(...vals)
  const rawMax = Math.max(...vals)
  const span = rawMax - rawMin
  const pad = span === 0 ? Math.max(1, Math.abs(rawMax) * 0.06) : span * 0.06
  return Math.max(0, Math.floor(rawMin - pad))
})

const maxY = computed(() => {
  const vals = items.value.map((i) => i.headcount)
  if (vals.length === 0) return 1
  const rawMax = Math.max(...vals)
  if (!trimYAxis.value) {
    return rawMax <= 0 ? 1 : rawMax
  }
  const rawMin = Math.min(...vals)
  const span = rawMax - rawMin
  const pad = span === 0 ? Math.max(1, Math.abs(rawMax) * 0.06) : span * 0.06
  const hi = rawMax + pad
  const top = hi <= 0 ? 1 : hi
  return Math.ceil(top)
})

function xScale(idx: number) {
  const n = Math.max(1, items.value.length - 1)
  return (idx / n) * innerW.value
}

function yScale(v: number) {
  const lo = minY.value
  const hi = maxY.value
  const span = Math.max(1e-9, hi - lo)
  return innerH.value - ((v - lo) / span) * innerH.value
}

const points = computed(() =>
  items.value.map((i, idx) => ({
    month: i.month,
    headcount: i.headcount,
    x: xScale(idx),
    y: yScale(i.headcount)
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
  return clamp(h.x, 62, Math.max(62, h.w - 62))
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

function onPointEnter(p: { month: string; headcount: number }, ev: PointerEvent) {
  setHover(p.month, p.headcount, ev)
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

function toPath(pts: Array<{ x: number; y: number }>) {
  if (pts.length === 0) return ''
  const first = pts[0]
  const rest = pts.slice(1)
  if (!first) return ''
  return ['M', first.x.toFixed(1), first.y.toFixed(1), ...rest.flatMap((p) => ['L', p.x.toFixed(1), p.y.toFixed(1)])].join(' ')
}

const linePath = computed(() => toPath(points.value))

const areaPath = computed(() => {
  const pts = points.value
  if (pts.length === 0) return ''
  const d = toPath(pts)
  const last = pts[pts.length - 1]
  if (!last) return ''
  const ih = innerH.value
  return `${d} L ${last.x.toFixed(1)} ${ih.toFixed(1)} L 0 ${ih.toFixed(1)} Z`
})

const xYearTicks = computed(() => {
  const pts = points.value
  if (pts.length === 0) return []

  const head = pts[0]
  if (!head) return []

  const firstYear = head.month.slice(0, 4)
  const out: Array<{ label: string; x: number }> = [{ label: firstYear, x: 0 }]
  const seen = new Set<string>([firstYear])

  for (const p of pts) {
    const y = p.month.slice(0, 4)
    if (!y || seen.has(y)) continue
    if (p.month.endsWith('-01')) {
      out.push({ label: y, x: p.x })
      seen.add(y)
    }
  }
  return out
})

const yTicks = computed(() => {
  const lo = minY.value
  const hi = maxY.value
  const span = Math.max(1e-9, hi - lo)
  let step = span <= 10 ? 2 : Math.ceil(span / 4)
  step = Math.max(1, Math.round(step))
  const start = Math.floor(lo / step) * step
  const ticks: Array<{ value: number; y: number }> = []
  for (let value = Math.round(start); value <= hi; value += step) {
    ticks.push({ value, y: yScale(value) })
  }
  if (ticks.length === 0) ticks.push({ value: hi, y: yScale(hi) })

  const last = ticks[ticks.length - 1]
  if (!last || last.value !== hi) ticks.push({ value: hi, y: yScale(hi) })

  const seen = new Set<number>()
  return ticks.filter((t) => {
    if (seen.has(t.value)) return false
    seen.add(t.value)
    return true
  })
})

/** Horizontal guides only between axes so grid lines do not sit on the x-axis / top edge. */
const yGridTicks = computed(() => {
  const ih = innerH.value
  const eps = 1.5
  return yTicks.value.filter((t) => t.y > eps && t.y < ih - eps)
})
</script>

