<template>
  <section class="rounded-xl border border-slate-200/80 bg-white shadow-card p-4">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h3 class="truncate text-base font-semibold text-hr-navy" :title="country">{{ country || '—' }}</h3>
        <p v-if="monthDisplay" class="mt-0.5 text-xs text-slate-500">{{ monthDisplay }}</p>
      </div>
      <div class="text-right">
        <div class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total outgoing</div>
        <div class="text-base font-semibold tabular-nums text-hr-navy">
          {{ formatCurrency(total) }}
        </div>
        <div v-if="showDeltas" class="mt-0.5 text-xs font-semibold tabular-nums" :class="deltaTextClass(deltaTotal)">
          {{ formatDelta(deltaTotal) }}
        </div>
      </div>
    </div>

    <div
      class="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100"
      role="img"
      :aria-label="stackedAriaLabel"
    >
      <div v-if="total > 0" class="flex h-full w-full">
        <div
          v-for="row in visibleBreakdownRows"
          :key="`seg-${row.key}`"
          class="h-full shrink-0 cursor-crosshair transition-[filter] hover:brightness-110"
          :style="{ width: row.widthPct, backgroundColor: row.color }"
          @pointerenter="onSegEnter($event, row)"
          @pointermove="onSegMove($event)"
          @pointerleave="onSegLeave"
        />
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
          {{ tip.label }}:
          <span class="font-semibold tabular-nums text-slate-900">{{ tip.valueLabel }}</span>
          <span class="ml-1 tabular-nums text-slate-400">({{ tip.pctLabel }})</span>
        </div>
        <div
          v-if="tip.showDelta"
          class="mt-0.5 text-[10px] font-semibold tabular-nums"
          :class="deltaTextClass(tip.delta)"
        >
          {{ formatDelta(tip.delta) }}
        </div>
      </div>
    </Teleport>

    <dl class="mt-3 space-y-1.5 text-xs">
      <div
        v-for="row in visibleBreakdownRows"
        :key="row.key"
        class="flex items-center justify-between gap-3"
      >
        <dt class="flex min-w-0 items-center gap-2 text-slate-600">
          <span class="h-2 w-2 shrink-0 rounded-full" :style="{ backgroundColor: row.color }" aria-hidden="true" />
          <span class="truncate font-medium" :title="row.label">{{ row.label }}</span>
          <span class="shrink-0 tabular-nums text-[10px] font-semibold text-slate-400">{{ row.pctLabel }}</span>
        </dt>
        <dd class="shrink-0 text-right tabular-nums font-semibold text-hr-navy">
          <div>{{ formatCurrency(row.value) }}</div>
          <div
            v-if="showDeltas"
            class="text-[11px] font-semibold tabular-nums leading-tight"
            :class="deltaTextClass(row.delta)"
          >
            {{ formatDelta(row.delta) }}
          </div>
        </dd>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
import { formatExpenseMonthLabel } from '~/utils/formatExpenseMonth'

const props = defineProps<{
  country: string
  month: string | null
  currency?: string
  grossSalary: number
  overtime: number
  vc: number
  nisCompany: number
  medicalPlanEmployer: number
  other: number
  total: number
  showDeltas?: boolean
  deltaGrossSalary?: number
  deltaOvertime?: number
  deltaVc?: number
  deltaNisCompany?: number
  deltaMedicalPlanEmployer?: number
  deltaOther?: number
  deltaTotal?: number
}>()

const currency = computed(() => props.currency || 'USD')
const fmtFull = computed(
  () => new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.value, currencyDisplay: 'code' })
)
const fmtCompact = computed(
  () =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.value,
      currencyDisplay: 'code',
      notation: 'compact',
      compactDisplay: 'short'
    })
)

function formatCurrency(v: number) {
  const n = Number.isFinite(v) ? v : 0
  const full = fmtFull.value.format(n)
  if (full.length > 16) return fmtCompact.value.format(n)
  return full
}

function formatDelta(v: number) {
  const n = Number.isFinite(v) ? v : 0
  if (n === 0) return '±' + formatCurrency(0)
  const abs = formatCurrency(Math.abs(n))
  return (n > 0 ? '+' : '-') + abs.replace(/^-/, '')
}

function deltaTextClass(v: number) {
  const n = Number.isFinite(v) ? v : 0
  if (n > 0) return 'text-teal-600'
  if (n < 0) return 'text-pink-600'
  return 'text-slate-400'
}

const country = computed(() => props.country)
const monthDisplay = computed(() => formatExpenseMonthLabel(props.month))
const grossSalary = computed(() => props.grossSalary)
const overtime = computed(() => props.overtime)
const vc = computed(() => props.vc)
const nisCompany = computed(() => props.nisCompany)
const medicalPlanEmployer = computed(() => props.medicalPlanEmployer)
const other = computed(() => props.other)
const total = computed(() => props.total)
const showDeltas = computed(() => props.showDeltas === true)

const deltaGrossSalary = computed(() => (Number.isFinite(props.deltaGrossSalary) ? (props.deltaGrossSalary as number) : 0))
const deltaOvertime = computed(() => (Number.isFinite(props.deltaOvertime) ? (props.deltaOvertime as number) : 0))
const deltaVc = computed(() => (Number.isFinite(props.deltaVc) ? (props.deltaVc as number) : 0))
const deltaNisCompany = computed(() => (Number.isFinite(props.deltaNisCompany) ? (props.deltaNisCompany as number) : 0))
const deltaMedicalPlanEmployer = computed(() =>
  Number.isFinite(props.deltaMedicalPlanEmployer) ? (props.deltaMedicalPlanEmployer as number) : 0
)
const deltaOther = computed(() => (Number.isFinite(props.deltaOther) ? (props.deltaOther as number) : 0))
const deltaTotal = computed(() => (Number.isFinite(props.deltaTotal) ? (props.deltaTotal as number) : 0))

const CATEGORY_COLORS = {
  grossSalary: 'rgb(30 58 138)',
  overtime: 'rgb(20 184 166)',
  vc: 'rgb(168 85 247)',
  nisCompany: 'rgb(236 72 153)',
  medicalPlanEmployer: 'rgb(192 132 252)',
  other: 'rgb(148 163 184)'
} as const

function pctForValue(value: number) {
  const t = total.value
  if (!Number.isFinite(value) || !Number.isFinite(t) || t <= 0) return 0
  return Math.max(0, Math.min(100, (value / t) * 100))
}

function widthPctForValue(value: number) {
  return `${pctForValue(value)}%`
}

function pctLabelForValue(value: number) {
  const p = pctForValue(value)
  if (p === 0) return '0%'
  if (p < 1) return '<1%'
  return `${Math.round(p)}%`
}

const breakdownRows = computed(() => [
  {
    key: 'grossSalary',
    label: 'Gross Salary',
    color: CATEGORY_COLORS.grossSalary,
    value: grossSalary.value,
    delta: deltaGrossSalary.value,
    widthPct: widthPctForValue(grossSalary.value),
    pctLabel: pctLabelForValue(grossSalary.value)
  },
  {
    key: 'overtime',
    label: 'Overtime',
    color: CATEGORY_COLORS.overtime,
    value: overtime.value,
    delta: deltaOvertime.value,
    widthPct: widthPctForValue(overtime.value),
    pctLabel: pctLabelForValue(overtime.value)
  },
  {
    key: 'vc',
    label: 'VC',
    color: CATEGORY_COLORS.vc,
    value: vc.value,
    delta: deltaVc.value,
    widthPct: widthPctForValue(vc.value),
    pctLabel: pctLabelForValue(vc.value)
  },
  {
    key: 'nisCompany',
    label: 'NIS (Company)',
    color: CATEGORY_COLORS.nisCompany,
    value: nisCompany.value,
    delta: deltaNisCompany.value,
    widthPct: widthPctForValue(nisCompany.value),
    pctLabel: pctLabelForValue(nisCompany.value)
  },
  {
    key: 'medicalPlanEmployer',
    label: 'Medical Plan (Employer)',
    color: CATEGORY_COLORS.medicalPlanEmployer,
    value: medicalPlanEmployer.value,
    delta: deltaMedicalPlanEmployer.value,
    widthPct: widthPctForValue(medicalPlanEmployer.value),
    pctLabel: pctLabelForValue(medicalPlanEmployer.value)
  },
  {
    key: 'other',
    label: 'Other',
    color: CATEGORY_COLORS.other,
    value: other.value,
    delta: deltaOther.value,
    widthPct: widthPctForValue(other.value),
    pctLabel: pctLabelForValue(other.value)
  }
])

const visibleBreakdownRows = computed(() => breakdownRows.value.filter((r) => (Number.isFinite(r.value) ? r.value : 0) > 0))

const stackedAriaLabel = computed(() =>
  `Expense composition for ${country.value || 'country'}: ` +
  visibleBreakdownRows.value.map((r) => `${r.label} ${r.pctLabel}`).join(', ')
)

type Tip = {
  country: string
  label: string
  valueLabel: string
  pctLabel: string
  delta: number
  showDelta: boolean
  x: number
  y: number
}
const tip = ref<Tip | null>(null)

type SegRow = { label: string; value: number; delta: number; pctLabel: string }

function onSegEnter(ev: PointerEvent, row: SegRow) {
  tip.value = {
    country: country.value || '—',
    label: row.label,
    valueLabel: formatCurrency(row.value),
    pctLabel: row.pctLabel,
    delta: row.delta,
    showDelta: showDeltas.value,
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

