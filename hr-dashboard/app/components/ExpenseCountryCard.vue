<template>
  <section class="rounded-md border border-slate-200 bg-white shadow-card p-4">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h3 class="truncate text-base font-semibold text-hr-navy" :title="country">{{ country || '—' }}</h3>
        <p v-if="monthDisplay" class="mt-0.5 text-sm text-slate-400">{{ monthDisplay }}</p>
      </div>
      <div class="text-right">
        <div class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total Outgoing Expenses</div>
        <div class="text-sm font-semibold tabular-nums text-emerald-700">
          {{ formatCurrency(total) }}
        </div>
        <div v-if="showDeltas" class="mt-0.5 text-xs font-semibold tabular-nums" :class="deltaTextClass(deltaTotal)">
          {{ formatDelta(deltaTotal) }}
        </div>
      </div>
    </div>

    <dl
      class="mt-4 grid grid-cols-[8.5rem_6.5rem_minmax(0,1fr)] items-center gap-x-1 gap-y-1.5 overflow-hidden rounded-md bg-slate-100 p-2.5 text-xs text-slate-800 shadow-md shadow-slate-900/10"
    >
      <div v-for="row in breakdownRows" :key="row.key" class="contents">
        <dt class="min-w-0 truncate font-medium text-slate-800" :title="row.label">{{ row.label }}</dt>
        <dd class="min-w-0">
          <div class="h-1.5 w-full overflow-hidden rounded bg-slate-200">
            <div class="h-full min-w-0 rounded bg-hr-navy" :style="{ width: row.widthPct }" />
          </div>
        </dd>
        <dd class="min-w-0 justify-self-end break-words text-right tabular-nums text-xs font-semibold leading-tight text-slate-900">
          <div class="flex flex-col items-end">
            <div>{{ formatCurrency(row.value) }}</div>
            <div v-if="showDeltas" class="text-[11px] font-semibold tabular-nums leading-tight" :class="deltaTextClass(row.delta)">
              {{ formatDelta(row.delta) }}
            </div>
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
  total: number
  showDeltas?: boolean
  deltaGrossSalary?: number
  deltaOvertime?: number
  deltaVc?: number
  deltaNisCompany?: number
  deltaMedicalPlanEmployer?: number
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
  if (n > 0) return 'text-emerald-600'
  if (n < 0) return 'text-rose-300'
  return 'text-slate-400'
}

const country = computed(() => props.country)
const monthDisplay = computed(() => formatExpenseMonthLabel(props.month))
const grossSalary = computed(() => props.grossSalary)
const overtime = computed(() => props.overtime)
const vc = computed(() => props.vc)
const nisCompany = computed(() => props.nisCompany)
const medicalPlanEmployer = computed(() => props.medicalPlanEmployer)
const total = computed(() => props.total)
const showDeltas = computed(() => props.showDeltas === true)

const deltaGrossSalary = computed(() => (Number.isFinite(props.deltaGrossSalary) ? (props.deltaGrossSalary as number) : 0))
const deltaOvertime = computed(() => (Number.isFinite(props.deltaOvertime) ? (props.deltaOvertime as number) : 0))
const deltaVc = computed(() => (Number.isFinite(props.deltaVc) ? (props.deltaVc as number) : 0))
const deltaNisCompany = computed(() => (Number.isFinite(props.deltaNisCompany) ? (props.deltaNisCompany as number) : 0))
const deltaMedicalPlanEmployer = computed(() =>
  Number.isFinite(props.deltaMedicalPlanEmployer) ? (props.deltaMedicalPlanEmployer as number) : 0
)
const deltaTotal = computed(() => (Number.isFinite(props.deltaTotal) ? (props.deltaTotal as number) : 0))

function widthPctForValue(value: number) {
  const t = total.value
  if (!Number.isFinite(value) || !Number.isFinite(t) || t <= 0) return '0%'
  return `${Math.max(0, Math.min(100, (value / t) * 100))}%`
}

const breakdownRows = computed(() => [
  {
    key: 'grossSalary',
    label: 'Gross Salary',
    value: grossSalary.value,
    delta: deltaGrossSalary.value,
    widthPct: widthPctForValue(grossSalary.value)
  },
  { key: 'overtime', label: 'Overtime', value: overtime.value, delta: deltaOvertime.value, widthPct: widthPctForValue(overtime.value) },
  { key: 'vc', label: 'VC', value: vc.value, delta: deltaVc.value, widthPct: widthPctForValue(vc.value) },
  { key: 'nisCompany', label: 'NIS (Company)', value: nisCompany.value, delta: deltaNisCompany.value, widthPct: widthPctForValue(nisCompany.value) },
  {
    key: 'medicalPlanEmployer',
    label: 'Medical Plan (Employer)',
    value: medicalPlanEmployer.value,
    delta: deltaMedicalPlanEmployer.value,
    widthPct: widthPctForValue(medicalPlanEmployer.value)
  }
])
</script>

