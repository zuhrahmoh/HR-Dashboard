<template>
  <div class="space-y-3">
    <div v-if="points.length === 0" class="text-sm" :class="isLight ? 'text-slate-600' : 'text-slate-300'">
      No headcount history found.
    </div>

    <div v-else class="space-y-3">
      <div v-if="showHeader" class="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div :class="isLight ? 'text-slate-700' : 'text-slate-300'">{{ title }}</div>
        <div class="flex items-center gap-2 tabular-nums" :class="isLight ? 'text-slate-900' : 'text-slate-50'">
          <span>Latest</span>
          <span class="font-semibold">{{ latestLabel }}</span>
        </div>
      </div>

      <div ref="wrapEl" class="relative">
        <div
          v-if="hover"
          class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border px-2 py-1 text-xs font-semibold shadow-lg"
          :class="
            isLight
              ? 'border-slate-200 bg-white text-slate-900 shadow-slate-300/40'
              : 'border-slate-700 bg-slate-950/95 text-slate-100 shadow-black/30'
          "
          :style="{ left: `${tooltipLeft}px`, top: `${tooltipTop}px` }"
        >
          {{ hover.label }}: {{ hover.value }}
        </div>

        <svg :viewBox="`0 0 ${W} ${H}`" class="h-44 w-full">
          <rect x="0" y="0" :width="W" :height="H" fill="transparent" />

          <g :transform="`translate(${padL},${padT})`">
            <path :d="areaPath" fill="rgb(244 63 94 / 0.10)" stroke="none" />
            <path
              :d="linePath"
              fill="none"
              stroke="rgb(244 63 94)"
              stroke-width="3"
              stroke-linejoin="round"
              stroke-linecap="round"
            />

            <template v-for="p in points" :key="p.month">
              <circle
                :cx="p.x"
                :cy="p.y"
                r="6"
                fill="transparent"
                @pointerenter="onPointEnter(p, $event)"
                @pointermove="onPointMove($event)"
                @pointerleave="onPointLeave"
              />
              <circle :cx="p.x" :cy="p.y" r="3.5" fill="rgb(244 63 94)" />
            </template>

            <line :x1="0" :y1="innerH" :x2="innerW" :y2="innerH" stroke="rgb(30 41 59)" stroke-width="2" />
            <line x1="0" y1="0" x2="0" :y2="innerH" stroke="rgb(30 41 59)" stroke-width="2" />

            <template v-for="t in xYearTicks" :key="t.label">
              <text
                :x="t.x"
                :y="innerH + 18"
                text-anchor="middle"
                font-size="12"
                fill="rgb(148 163 184)"
              >
                {{ t.label }}
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
  </div>
</template>

<script setup lang="ts">
type Item = { month: string; headcount: number }

const props = defineProps<{
  items: Item[]
  title?: string
  variant?: 'dark' | 'light'
  showHeader?: boolean
}>()

const title = computed(() => (props.title ?? 'Headcount trend (monthly)').trim() || 'Headcount trend (monthly)')
const isLight = computed(() => props.variant === 'light')
const showHeader = computed(() => props.showHeader !== false)

function safeInt(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
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

const W = 720
const H = 260
const padL = 50
const padR = 18
const padT = 14
const padB = 34
const innerW = W - padL - padR
const innerH = H - padT - padB

const minY = computed(() => 0)

const maxY = computed(() => {
  const vals = items.value.map((i) => i.headcount)
  const m = vals.length ? Math.max(...vals) : 0
  return m <= 0 ? 1 : m
})

function xScale(idx: number) {
  const n = Math.max(1, items.value.length - 1)
  return (idx / n) * innerW
}

function yScale(v: number) {
  const lo = minY.value
  const hi = maxY.value
  const span = Math.max(1, hi - lo)
  return innerH - ((v - lo) / span) * innerH
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

const xYearTicks = computed(() => {
  const pts = points.value
  if (pts.length === 0) return []

  const firstYear = pts[0].month.slice(0, 4)
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
  const span = Math.max(1, hi - lo)
  const step = span <= 10 ? 2 : Math.ceil(span / 4)
  const start = Math.floor(lo / step) * step
  const ticks: Array<{ value: number; y: number }> = []
  for (let v = start; v <= hi; v += step) ticks.push({ value: v, y: yScale(v) })
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
</script>

