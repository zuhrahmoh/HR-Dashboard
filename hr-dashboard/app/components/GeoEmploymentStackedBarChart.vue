<template>
  <div class="flex h-full min-h-0 w-full min-w-0 flex-col text-slate-800">
    <div v-if="rows.length === 0" class="text-xs text-slate-500">No geographic employment data.</div>

    <div v-else class="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 pb-1.5 text-[9px] font-medium uppercase tracking-wide text-slate-500">
        <span class="inline-flex items-center gap-1">
          <span class="h-2 w-2 shrink-0 rounded-full bg-[rgb(30_58_138)]" aria-hidden="true" />
          Permanent
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="h-2 w-2 shrink-0 rounded-full bg-[rgb(20_184_166)]" aria-hidden="true" />
          Contracted
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="h-2 w-2 shrink-0 rounded-full bg-[rgb(236_72_153)]" aria-hidden="true" />
          Interns
        </span>
      </div>

      <div class="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-1.5">
        <div
          v-for="row in rows"
          :key="row.country"
          class="grid min-w-0 w-full items-center gap-x-2 [grid-template-columns:4.5rem_minmax(0,1fr)_5ch]"
        >
          <div
            class="min-w-0 truncate text-left text-[10px] font-semibold leading-tight tracking-tight text-slate-700"
            :title="row.country"
          >
            {{ row.shortLabel }}
          </div>

          <div class="relative min-h-[1.5rem] min-w-0 w-full">
            <div
              class="relative h-[1.5rem] w-full overflow-hidden rounded-full bg-slate-100/80"
            >
              <template v-if="row.total <= 0">
                <div class="h-full w-full" />
              </template>
              <div
                v-else
                class="flex h-full min-w-0 overflow-hidden rounded-full"
                :style="{ width: barLengthPct(row.total) }"
              >
                <div
                  v-if="row.permanentFrac > 0"
                  class="h-full shrink-0 cursor-crosshair bg-[rgb(30_58_138)] transition-[filter] hover:brightness-110"
                  :style="{ width: pct(row.permanentFrac) }"
                  @pointerenter="onSegEnter($event, row.country, 'Permanent', row.permanent)"
                  @pointermove="onSegMove($event)"
                  @pointerleave="onSegLeave"
                />
                <div
                  v-if="row.contractedFrac > 0"
                  class="h-full shrink-0 cursor-crosshair bg-[rgb(20_184_166)] transition-[filter] hover:brightness-110"
                  :style="{ width: pct(row.contractedFrac) }"
                  @pointerenter="onSegEnter($event, row.country, 'Contracted', row.contracted)"
                  @pointermove="onSegMove($event)"
                  @pointerleave="onSegLeave"
                />
                <div
                  v-if="row.internFrac > 0"
                  class="h-full shrink-0 cursor-crosshair bg-[rgb(236_72_153)] transition-[filter] hover:brightness-110"
                  :style="{ width: pct(row.internFrac) }"
                  @pointerenter="onSegEnter($event, row.country, 'Interns', row.interns)"
                  @pointermove="onSegMove($event)"
                  @pointerleave="onSegLeave"
                />
              </div>
            </div>
          </div>

          <div
            class="min-w-0 w-full shrink-0 text-right text-[11px] font-semibold tabular-nums text-hr-navy"
          >
            {{ row.total }}
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="tip"
        class="pointer-events-none fixed z-[200] whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] shadow-lg shadow-slate-900/15"
        :style="{ left: `${tip.x}px`, top: `${tip.y}px`, transform: 'translate(-50%, calc(-100% - 8px))' }"
      >
        <div class="font-semibold leading-tight text-slate-800">{{ tip.country }}</div>
        <div class="mt-0.5 text-slate-600">
          {{ tip.segment }}: <span class="font-semibold tabular-nums text-slate-900">{{ tip.count }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
type RowIn = {
  country: string
  permanent: number
  contracted: number
  interns: number
  total: number
}

const props = defineProps<{
  items: RowIn[]
}>()

const BRANCH_ABBREV: Record<string, string> = {
  'Trinidad and Tobago': 'TT',
  'Trinidad & Tobago': 'TT',
  Guyana: 'GUY',
  USA: 'USA',
  Suriname: 'SUR',
  'El Dorado Offshore GY': 'EDO GUY',
  'El Dorado Offshore TT': 'EDO TT',
  Mexico: 'MEX',
  Colombia: 'COL'
}

function countryAbbrev(country: string) {
  const v = (country ?? '').trim()
  if (!v) return '—'
  const amp = v.replace(/\s*&\s*/g, ' and ')
  return BRANCH_ABBREV[v] ?? BRANCH_ABBREV[amp] ?? v
}

const rows = computed(() => {
  const list = (props.items ?? [])
    .map((r) => {
      const permanent = Math.max(0, Math.floor(r.permanent ?? 0))
      const contracted = Math.max(0, Math.floor(r.contracted ?? 0))
      const interns = Math.max(0, Math.floor(r.interns ?? 0))
      const total = Math.max(0, Math.floor(r.total ?? permanent + contracted + interns))
      const t = total > 0 ? total : permanent + contracted + interns
      const denom = t > 0 ? t : 1
      return {
        country: (r.country ?? '').trim() || '—',
        shortLabel: countryAbbrev(r.country ?? ''),
        permanent,
        contracted,
        interns,
        total: t,
        permanentFrac: permanent / denom,
        contractedFrac: contracted / denom,
        internFrac: interns / denom
      }
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
  return list
})

const maxRowTotal = computed(() => {
  const list = rows.value
  if (!list.length) return 1
  return Math.max(1, ...list.map((r) => r.total))
})

function barLengthPct(total: number) {
  const m = maxRowTotal.value
  const p = m > 0 ? (Math.max(0, total) / m) * 100 : 0
  return `${Math.min(100, p)}%`
}

function pct(frac: number) {
  const p = Math.max(0, Math.min(1, frac)) * 100
  return `${p}%`
}

type Tip = { country: string; segment: string; count: number; x: number; y: number }
const tip = ref<Tip | null>(null)

function onSegEnter(ev: PointerEvent, country: string, segment: string, count: number) {
  tip.value = {
    country,
    segment,
    count,
    x: ev.clientX,
    y: ev.clientY
  }
}

function onSegMove(ev: PointerEvent) {
  const t = tip.value
  if (!t) return
  tip.value = { ...t, x: ev.clientX, y: ev.clientY }
}

function onSegLeave() {
  tip.value = null
}
</script>
