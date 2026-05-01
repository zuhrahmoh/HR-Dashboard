<template>
  <div class="flex h-full flex-col">
    <div v-if="showFilter && isCompact && filterPlacement === 'corner'" class="flex items-center justify-end">
      <select
        v-model="selectedCountry"
        aria-label="Country"
        class="h-7 w-[8rem] rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 outline-none focus:border-slate-400"
      >
        <option value="">All</option>
        <option v-for="c in countries" :key="c.value" :value="c.value">{{ c.label }}</option>
      </select>
    </div>

    <div v-else-if="showFilter" class="flex items-center justify-between gap-3">
      <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Country</div>
      <select
        v-model="selectedCountry"
        :class="[
          'rounded-md border border-slate-200 bg-slate-50 px-2 outline-none focus:border-slate-400',
          isCompact ? 'h-7 w-[8rem] text-xs text-slate-800' : 'h-8 w-[10rem] text-sm text-slate-800'
        ]"
      >
        <option value="">All</option>
        <option v-for="c in countries" :key="c.value" :value="c.value">{{ c.label }}</option>
      </select>
    </div>

    <div
      v-if="isCompact"
      :class="[
        showFilter ? (filterPlacement === 'corner' ? 'mt-1' : 'mt-2') : 'mt-0',
        'flex min-h-0 flex-1 items-start justify-between gap-4'
      ]"
    >
      <div class="flex items-start justify-start">
        <div ref="rootEl" class="relative" :class="compactDonutSizeClass">
          <div
            v-if="hovered"
            class="pointer-events-none absolute z-20 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-lg shadow-slate-900/10"
            :style="{ left: `${hovered.x}px`, top: `${hovered.y}px`, transform: 'translate(-50%, -110%)' }"
          >
            <div class="font-semibold">{{ hovered.label }}</div>
            <div class="tabular-nums text-slate-800">{{ hovered.value }}</div>
          </div>

          <svg class="h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
            <template v-if="total <= 0">
              <circle cx="50" cy="50" r="42" fill="rgb(243 232 255)" opacity="0.65" />
            </template>
            <template v-else-if="isAllPermanent">
              <circle
                cx="50"
                cy="50"
                r="42"
                :fill="COLORS.permanent"
                class="cursor-pointer"
                @pointerenter="onEnter('permanent', $event)"
                @pointermove="onMove($event)"
                @pointerleave="onLeave"
              />
            </template>
            <template v-else-if="isAllContracted">
              <circle
                cx="50"
                cy="50"
                r="42"
                :fill="COLORS.contracted"
                class="cursor-pointer"
                @pointerenter="onEnter('contracted', $event)"
                @pointermove="onMove($event)"
                @pointerleave="onLeave"
              />
            </template>
            <template v-else>
              <path
                :d="permanentSlice.d"
                :fill="permanentSlice.fill"
                class="cursor-pointer"
                @pointerenter="onEnter('permanent', $event)"
                @pointermove="onMove($event)"
                @pointerleave="onLeave"
              />
              <path
                v-if="contractedSlice.d"
                :d="contractedSlice.d"
                :fill="contractedSlice.fill"
                class="cursor-pointer"
                @pointerenter="onEnter('contracted', $event)"
                @pointermove="onMove($event)"
                @pointerleave="onLeave"
              />
            </template>

            <circle cx="50" cy="50" r="20" fill="white" stroke="rgb(226 232 240)" stroke-width="1.5" />

            <template v-for="lbl in segmentLabels" :key="lbl.key">
              <text
                v-if="lbl.show"
                :x="lbl.x"
                :y="lbl.y"
                text-anchor="middle"
                dominant-baseline="middle"
                :fill="lbl.key === 'permanent' ? 'white' : 'rgb(30 58 138)'"
                font-size="6.2"
                font-weight="700"
              >
                <tspan :x="lbl.x" dy="2" font-size="6.2" font-weight="700">{{ lbl.pct }}%</tspan>
              </text>
            </template>
          </svg>

          <div class="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div class="text-[11px] font-medium text-slate-800">Headcount</div>
            <div class="text-2xl font-semibold tabular-nums text-hr-navy">{{ total }}</div>
            <div class="text-[11px] font-medium text-slate-600">{{ subtitle }}</div>
          </div>
        </div>
      </div>

      <div class="min-w-0 flex-1 space-y-2 text-xs">
        <div class="flex items-center justify-between gap-2">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Key</div>
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50/30 px-2 py-1">
            <div class="flex min-w-0 items-center gap-2 text-slate-800">
              <span class="h-2.5 w-2.5 rounded-sm" :style="{ backgroundColor: COLORS.permanent }" />
              <span class="truncate">Permanent</span>
            </div>
            <div class="shrink-0 tabular-nums text-slate-900">
              {{ permanent }} <span class="text-slate-400">({{ permanentPct }}%)</span>
            </div>
          </div>

          <div class="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50/30 px-2 py-1">
            <div class="flex min-w-0 items-center gap-2 text-slate-800">
              <span class="h-2.5 w-2.5 rounded-sm" :style="{ backgroundColor: COLORS.contracted }" />
              <span class="truncate">Contracted</span>
            </div>
            <div class="shrink-0 tabular-nums text-slate-900">
              {{ contractedWithInterns }} <span class="text-slate-400">({{ contractedPct }}%)</span>
            </div>
          </div>
        </div>

        <div class="text-[11px] text-slate-400">Contracted includes interns.</div>
        <div v-if="total <= 0" class="text-[11px] text-slate-600">No contract type data.</div>
      </div>
    </div>

    <template v-else>
      <div :class="[showFilter ? 'mt-2' : 'mt-0', 'flex min-h-0 flex-1 items-center justify-center']">
        <div class="relative h-40 w-40">
          <svg class="h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
            <template v-if="total <= 0">
              <circle cx="50" cy="50" r="42" fill="rgb(243 232 255)" opacity="0.65" />
            </template>
            <template v-else-if="isAllPermanent">
              <circle cx="50" cy="50" r="42" :fill="COLORS.permanent" />
            </template>
            <template v-else-if="isAllContracted">
              <circle cx="50" cy="50" r="42" :fill="COLORS.contracted" />
            </template>
            <template v-else>
              <path :d="permanentSlice.d" :fill="permanentSlice.fill" />
              <path v-if="contractedSlice.d" :d="contractedSlice.d" :fill="contractedSlice.fill" />
            </template>

            <circle cx="50" cy="50" r="20" fill="white" stroke="rgb(226 232 240)" stroke-width="1.5" />

            <template v-for="lbl in segmentLabels" :key="lbl.key">
              <text
                v-if="lbl.show"
                :x="lbl.x"
                :y="lbl.y"
                text-anchor="middle"
                dominant-baseline="middle"
                :fill="lbl.key === 'permanent' ? 'white' : 'rgb(30 58 138)'"
                font-size="6.5"
                font-weight="700"
              >
                <tspan :x="lbl.x" dy="-2">{{ lbl.label }}</tspan>
                <tspan :x="lbl.x" dy="8" font-size="6" font-weight="600">{{ lbl.pct }}%</tspan>
              </text>
            </template>
          </svg>

          <div class="absolute inset-0 grid place-items-center text-center">
            <div class="text-xs font-medium text-slate-800">Headcount</div>
            <div class="text-3xl font-semibold tabular-nums text-hr-navy">{{ total }}</div>
            <div class="text-xs font-medium text-slate-600">{{ subtitle }}</div>
          </div>
        </div>
      </div>

      <div class="mt-2 shrink-0 space-y-2">
        <div class="flex items-center justify-between gap-3">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Key</div>
          <div class="text-[11px] text-slate-400">Contracted includes interns</div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50/30 px-2 py-1">
            <div class="flex min-w-0 items-center gap-2 text-slate-800">
              <span class="h-2.5 w-2.5 rounded-sm" :style="{ backgroundColor: COLORS.permanent }" />
              <span class="truncate">Permanent</span>
            </div>
            <div class="shrink-0 tabular-nums text-slate-900">
              {{ permanent }} <span class="text-slate-400">({{ permanentPct }}%)</span>
            </div>
          </div>

          <div class="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50/30 px-2 py-1">
            <div class="flex min-w-0 items-center gap-2 text-slate-800">
              <span class="h-2.5 w-2.5 rounded-sm" :style="{ backgroundColor: COLORS.contracted }" />
              <span class="truncate">Contracted</span>
            </div>
            <div class="shrink-0 tabular-nums text-slate-900">
              {{ contractedWithInterns }} <span class="text-slate-400">({{ contractedPct }}%)</span>
            </div>
          </div>
        </div>

        <div v-if="total <= 0" class="text-xs text-slate-600">No contract type data.</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
type Counts = { permanent: number; contracted: number; interns?: number; total: number }
type ByCountry = { country: string; permanent: number; contracted: number; interns?: number; total: number }

const props = defineProps<{
  overall: Counts
  byCountry: ByCountry[]
  compact?: boolean
  showFilter?: boolean
  filterPlacement?: 'row' | 'corner'
  compactSize?: 'md' | 'lg'
}>()

const COLORS = {
  permanent: 'rgb(30 58 138)', // brand navy
  contracted: 'rgb(20 184 166)' // brand teal
} as const

const isCompact = computed(() => props.compact === true)
const showFilter = computed(() => props.showFilter !== false)
const filterPlacement = computed(() => props.filterPlacement ?? 'row')
const compactDonutSizeClass = computed(() => {
  const size = props.compactSize ?? 'md'
  if (size === 'lg') return 'h-40 w-40'
  return 'h-32 w-32'
})

const rootEl = ref<HTMLElement | null>(null)
type HoverKey = 'permanent' | 'contracted'
const hovered = ref<null | { key: HoverKey; x: number; y: number; label: string; value: string }>(null)

function tooltipForKey(key: HoverKey) {
  if (key === 'permanent') return { label: 'Permanent', value: `${permanent.value} (${permanentPct.value}%)` }
  return { label: 'Contracted', value: `${contractedWithInterns.value} (${contractedPct.value}%)` }
}

function setHover(key: HoverKey, e: PointerEvent) {
  const root = rootEl.value
  if (!root) return
  const rect = root.getBoundingClientRect()
  const t = tooltipForKey(key)
  hovered.value = { key, x: e.clientX - rect.left, y: e.clientY - rect.top, label: t.label, value: t.value }
}

function onEnter(key: HoverKey, e: PointerEvent) {
  setHover(key, e)
}

function onMove(e: PointerEvent) {
  const cur = hovered.value
  if (!cur) return
  setHover(cur.key, e)
}

function onLeave() {
  hovered.value = null
}

const selectedCountry = ref<string>('')

const countries = computed(() => {
  return props.byCountry
    .map((c) => {
      const raw = (c.country ?? '').trim()
      return { value: raw, label: raw || '—' }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
})

const selected = computed<Counts>(() => {
  if (!showFilter.value) return props.overall
  const key = selectedCountry.value.trim()
  if (!key) return props.overall
  const match = props.byCountry.find((c) => (c.country ?? '').trim() === key)
  return match
    ? {
        permanent: match.permanent,
        contracted: match.contracted,
        interns: match.interns ?? 0,
        total: match.total
      }
    : props.overall
})

const permanent = computed(() => (Number.isFinite(selected.value.permanent) ? selected.value.permanent : 0))
const interns = computed(() => (Number.isFinite(selected.value.interns) ? (selected.value.interns ?? 0) : 0))
const contracted = computed(() => (Number.isFinite(selected.value.contracted) ? selected.value.contracted : 0))
const contractedWithInterns = computed(() => contracted.value + interns.value)
const total = computed(() =>
  Number.isFinite(selected.value.total)
    ? selected.value.total
    : permanent.value + contracted.value + interns.value
)

const subtitle = computed(() => {
  if (!showFilter.value) return 'Company-wide'
  const key = selectedCountry.value.trim()
  return key ? (key || '—') : 'Company-wide'
})

function pct(part: number, whole: number) {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return 0
  return Math.round((part / whole) * 100)
}

const permanentPct = computed(() => pct(permanent.value, total.value))
const contractedPct = computed(() => pct(contractedWithInterns.value, total.value))

const isAllPermanent = computed(() => total.value > 0 && permanent.value === total.value)
const isAllContracted = computed(() => total.value > 0 && contractedWithInterns.value === total.value)

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (Math.PI / 180) * angleDeg
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const delta = ((endAngle - startAngle) % 360 + 360) % 360
  const largeArc = delta > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
}

function midPointForArc(startAngle: number, endAngle: number, r: number) {
  const delta = ((endAngle - startAngle) % 360 + 360) % 360
  const mid = delta >= 359.999 ? startAngle + 180 : startAngle + delta / 2
  const p = polarToCartesian(50, 50, r, mid)
  return { x: p.x, y: p.y, delta }
}

const permanentSlice = computed(() => {
  const frac = total.value > 0 ? Math.max(0, Math.min(1, permanent.value / total.value)) : 0
  const start = -90
  const end = start + frac * 360
  return { d: arcPath(50, 50, 42, start, end), fill: COLORS.permanent }
})

const contractedSlice = computed(() => {
  const permFrac = total.value > 0 ? Math.max(0, Math.min(1, permanent.value / total.value)) : 0
  const frac = total.value > 0 ? Math.max(0, Math.min(1, contractedWithInterns.value / total.value)) : 0
  const start = -90 + permFrac * 360
  const end = start + frac * 360
  return { d: frac <= 0 ? '' : arcPath(50, 50, 42, start, end), fill: COLORS.contracted }
})

const segmentLabels = computed(() => {
  const t = total.value
  if (t <= 0) return []

  const permFrac = Math.max(0, Math.min(1, permanent.value / t))
  const contFrac = Math.max(0, Math.min(1, contractedWithInterns.value / t))

  const start = -90
  const permStart = start
  const permEnd = start + permFrac * 360
  const contStart = permEnd
  const contEnd = contStart + contFrac * 360

  const labelR = 31
  const MIN_ARC_DEG = 34

  const pMid = midPointForArc(permStart, permEnd, labelR)
  const cMid = midPointForArc(contStart, contEnd, labelR)

  return [
    {
      key: 'permanent' as const,
      label: 'Permanent',
      x: pMid.x,
      y: pMid.y,
      pct: permanentPct.value,
      show: permanent.value > 0 && pMid.delta >= MIN_ARC_DEG
    },
    {
      key: 'contracted' as const,
      label: 'Contracted',
      x: cMid.x,
      y: cMid.y,
      pct: contractedPct.value,
      show: contractedWithInterns.value > 0 && cMid.delta >= MIN_ARC_DEG
    }
  ]
})
</script>

