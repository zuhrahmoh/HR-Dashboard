<template>
  <div class="space-y-4">
    <div v-if="isCompact && filterPlacement === 'corner'" class="flex items-center justify-end">
      <select
        v-model="selectedCountry"
        aria-label="Country"
        class="h-7 w-[8rem] rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-slate-200 outline-none focus:border-slate-600"
      >
        <option value="">All</option>
        <option v-for="c in countries" :key="c.value" :value="c.value">{{ c.label }}</option>
      </select>
    </div>

    <div v-else class="flex flex-wrap items-center justify-between gap-3">
      <div v-if="!hideTitle" class="text-base font-semibold text-slate-200">Gender breakdown</div>

      <label class="flex items-center gap-2 text-sm text-slate-300">
        <span class="whitespace-nowrap">Country</span>
        <select
          v-model="selectedCountry"
          :class="[
            'rounded-md border border-slate-800 bg-slate-950 px-2 outline-none focus:border-slate-600',
            isCompact ? 'h-7 w-[8rem] py-0.5 text-xs text-slate-200' : 'py-1 text-sm text-slate-200'
          ]"
        >
          <option value="">All</option>
          <option v-for="c in countries" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </label>
    </div>

    <div v-if="total <= 0" class="text-sm text-slate-300">No gender data.</div>

    <div v-else class="w-full">
      <div
        v-if="isCompact"
        :class="[showHeaderRow ? 'mt-2' : 'mt-1', 'flex items-start justify-between gap-4']"
      >
        <div class="flex items-start justify-start">
          <div ref="rootEl" class="relative" :class="compactDonutSizeClass">
            <div
              v-if="hovered"
              class="pointer-events-none absolute z-20 rounded-md border border-slate-700 bg-slate-950/95 px-2.5 py-1.5 text-xs text-slate-100 shadow-lg shadow-black/30"
              :style="{ left: `${hovered.x}px`, top: `${hovered.y}px`, transform: 'translate(-50%, -110%)' }"
            >
              <div class="font-semibold">{{ hovered.label }}</div>
              <div class="tabular-nums text-slate-200">{{ hovered.value }}</div>
            </div>

            <svg class="h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
              <circle
                v-if="isAllFemale"
                cx="50"
                cy="50"
                r="42"
                fill="rgb(244 114 182)"
                @pointerenter="onEnter('female', $event)"
                @pointermove="onMove($event)"
                @pointerleave="onLeave"
              />
              <circle
                v-else-if="isAllMale"
                cx="50"
                cy="50"
                r="42"
                fill="rgb(56 189 248)"
                @pointerenter="onEnter('male', $event)"
                @pointermove="onMove($event)"
                @pointerleave="onLeave"
              />
              <template v-else>
                <path
                  :d="femaleSlice.d"
                  :fill="femaleSlice.fill"
                  @pointerenter="onEnter('female', $event)"
                  @pointermove="onMove($event)"
                  @pointerleave="onLeave"
                />
                <path
                  v-if="maleSlice.d"
                  :d="maleSlice.d"
                  :fill="maleSlice.fill"
                  @pointerenter="onEnter('male', $event)"
                  @pointermove="onMove($event)"
                  @pointerleave="onLeave"
                />
              </template>

              <circle cx="50" cy="50" r="20" fill="rgb(15 23 42)" stroke="rgb(30 41 59)" stroke-width="1.5" />

              <template v-for="lbl in segmentLabels" :key="lbl.key">
                <text
                  v-if="lbl.show"
                  :x="lbl.x"
                  :y="lbl.y"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  fill="rgb(30 58 138)"
                  font-size="6.2"
                  font-weight="700"
                >
                  <tspan :x="lbl.x" dy="-2">{{ lbl.pct }}%</tspan>
                </text>
              </template>
            </svg>

            <div class="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div class="text-[11px] font-medium text-slate-200">Headcount</div>
              <div class="text-2xl font-semibold tabular-nums text-slate-50">{{ total }}</div>
              <div class="text-[11px] font-medium text-slate-300">{{ subtitle }}</div>
            </div>
          </div>
        </div>

        <div class="min-w-0 flex-1 space-y-2 text-xs">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Key</div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-950/30 px-2 py-1">
              <div class="flex min-w-0 items-center gap-2 text-slate-200">
                <span class="h-2.5 w-2.5 rounded-sm bg-pink-400" />
                <span class="truncate">Female</span>
              </div>
              <div class="shrink-0 tabular-nums text-slate-50">
                {{ female }} <span class="text-slate-400">({{ femalePct }}%)</span>
              </div>
            </div>
            <div class="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-950/30 px-2 py-1">
              <div class="flex min-w-0 items-center gap-2 text-slate-200">
                <span class="h-2.5 w-2.5 rounded-sm bg-sky-400" />
                <span class="truncate">Male</span>
              </div>
              <div class="shrink-0 tabular-nums text-slate-50">
                {{ male }} <span class="text-slate-400">({{ malePct }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="mx-auto flex w-full flex-col items-center justify-center" :class="containerClass">
        <div class="relative" :class="donutSizeClass">
          <svg class="h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
            <circle v-if="isAllFemale" cx="50" cy="50" r="42" fill="rgb(244 114 182)" />
            <circle v-else-if="isAllMale" cx="50" cy="50" r="42" fill="rgb(56 189 248)" />
            <template v-else>
              <path :d="femaleSlice.d" :fill="femaleSlice.fill" />
              <path v-if="maleSlice.d" :d="maleSlice.d" :fill="maleSlice.fill" />
            </template>

            <circle cx="50" cy="50" r="20" fill="rgb(15 23 42)" stroke="rgb(30 41 59)" stroke-width="1.5" />

            <template v-for="lbl in segmentLabels" :key="lbl.key">
              <text
                v-if="lbl.show"
                :x="lbl.x"
                :y="lbl.y"
                text-anchor="middle"
                dominant-baseline="middle"
                fill="rgb(2 6 23)"
                font-size="7"
                font-weight="600"
              >
                <tspan :x="lbl.x" dy="-2">{{ lbl.count }}</tspan>
                <tspan :x="lbl.x" dy="8" font-size="6" font-weight="500">{{ lbl.pct }}%</tspan>
              </text>
            </template>
          </svg>

          <div class="absolute inset-0 grid place-items-center text-center">
            <div class="text-sm font-medium text-slate-200">Headcount</div>
            <div class="text-3xl font-semibold tabular-nums text-slate-50">{{ total }}</div>
            <div class="text-sm font-medium text-slate-300">{{ subtitle }}</div>
          </div>
      </div>

        <div class="w-full" :class="legendClass">
          <div class="flex items-center justify-between gap-6">
            <div class="flex items-center gap-2 text-slate-300">
              <span class="h-2.5 w-2.5 rounded-sm bg-pink-400" />
              <span>Female</span>
            </div>
            <div class="tabular-nums text-slate-50">
              {{ female }} <span class="text-slate-400">({{ femalePct }}%)</span>
            </div>
          </div>
          <div class="flex items-center justify-between gap-6">
            <div class="flex items-center gap-2 text-slate-300">
              <span class="h-2.5 w-2.5 rounded-sm bg-sky-400" />
              <span>Male</span>
            </div>
            <div class="tabular-nums text-slate-50">
              {{ male }} <span class="text-slate-400">({{ malePct }}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type GenderCounts = { male: number; female: number; total: number }
type ByCountry = { country: string; male: number; female: number; total: number }

const props = defineProps<{
  overall: GenderCounts
  byCountry: ByCountry[]
  hideTitle?: boolean
  compact?: boolean
  filterPlacement?: 'row' | 'corner'
  compactSize?: 'md' | 'lg'
}>()

const isCompact = computed(() => props.compact === true)
const filterPlacement = computed(() => props.filterPlacement ?? 'row')
const showHeaderRow = computed(() => !(isCompact.value && filterPlacement.value === 'corner'))
const donutSizeClass = computed(() => (isCompact.value ? 'h-32 w-32' : 'h-56 w-56 md:h-60 md:w-60'))
const compactDonutSizeClass = computed(() => {
  const size = props.compactSize ?? 'md'
  if (size === 'lg') return 'h-40 w-40'
  return 'h-32 w-32'
})
const containerClass = computed(() => (isCompact.value ? 'max-w-xs pt-1' : 'max-w-sm pt-4'))
const legendClass = computed(() => (isCompact.value ? 'mt-3 max-w-xs space-y-2 text-sm' : 'mt-5 max-w-xs space-y-2 text-base'))

const selectedCountry = ref<string>('')

const countries = computed(() => {
  return props.byCountry
    .map((c) => {
      const raw = (c.country ?? '').trim()
      return { value: raw, label: raw || '—' }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
})

const selected = computed<GenderCounts>(() => {
  const key = selectedCountry.value.trim()
  if (!key) return props.overall
  const match = props.byCountry.find((c) => (c.country ?? '').trim() === key)
  return match ? { male: match.male, female: match.female, total: match.total } : props.overall
})

const male = computed(() => (Number.isFinite(selected.value.male) ? selected.value.male : 0))
const female = computed(() => (Number.isFinite(selected.value.female) ? selected.value.female : 0))
const total = computed(() => (Number.isFinite(selected.value.total) ? selected.value.total : male.value + female.value))

const subtitle = computed(() => {
  const key = selectedCountry.value.trim()
  return key ? (key || '—') : 'Company-wide'
})

function pct(part: number, whole: number) {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return 0
  return Math.round((part / whole) * 100)
}

const femalePct = computed(() => pct(female.value, total.value))
const malePct = computed(() => pct(male.value, total.value))

const isAllFemale = computed(() => total.value > 0 && female.value === total.value)
const isAllMale = computed(() => total.value > 0 && male.value === total.value)

const rootEl = ref<HTMLElement | null>(null)
type HoverKey = 'female' | 'male'
const hovered = ref<null | { key: HoverKey; x: number; y: number; label: string; value: string }>(null)

function tooltipForKey(key: HoverKey) {
  if (key === 'female') return { label: 'Female', value: `${female.value} (${femalePct.value}%)` }
  return { label: 'Male', value: `${male.value} (${malePct.value}%)` }
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

const femaleSlice = computed(() => {
  const frac = total.value > 0 ? Math.max(0, Math.min(1, female.value / total.value)) : 0
  const start = -90
  const end = start + frac * 360
  const d = arcPath(50, 50, 42, start, end)
  return { d, fill: 'rgb(244 114 182)' } // pink-400
})

const maleSlice = computed(() => {
  const frac = total.value > 0 ? Math.max(0, Math.min(1, male.value / total.value)) : 0
  const start = -90 + (total.value > 0 ? Math.max(0, Math.min(1, female.value / total.value)) : 0) * 360
  const end = start + frac * 360
  const d = frac <= 0 ? '' : arcPath(50, 50, 42, start, end)
  return { d, fill: 'rgb(56 189 248)' } // sky-400
})

const segmentLabels = computed(() => {
  const t = total.value
  if (t <= 0) return []

  const femaleFrac = Math.max(0, Math.min(1, female.value / t))
  const maleFrac = Math.max(0, Math.min(1, male.value / t))

  const start = -90
  const femaleStart = start
  const femaleEnd = start + femaleFrac * 360
  const maleStart = femaleEnd
  const maleEnd = maleStart + maleFrac * 360

  const donutLabelR = 31
  const MIN_ARC_DEG = 30

  const fMid = midPointForArc(femaleStart, femaleEnd, donutLabelR)
  const mMid = midPointForArc(maleStart, maleEnd, donutLabelR)

  return [
    {
      key: 'female',
      x: fMid.x,
      y: fMid.y,
      count: female.value,
      pct: femalePct.value,
      show: female.value > 0 && fMid.delta >= MIN_ARC_DEG
    },
    {
      key: 'male',
      x: mMid.x,
      y: mMid.y,
      count: male.value,
      pct: malePct.value,
      show: male.value > 0 && mMid.delta >= MIN_ARC_DEG
    }
  ]
})
</script>

