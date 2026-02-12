<template>
  <section class="rounded-md border border-slate-800 bg-slate-900 p-4">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h3 class="truncate text-base font-semibold text-slate-100" :title="country">{{ country || '—' }}</h3>
        <p v-if="month" class="mt-0.5 text-sm text-slate-400">{{ month }}</p>
      </div>
      <div class="text-right">
        <div class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total Outgoing Expenses</div>
        <div class="text-base font-semibold tabular-nums text-emerald-400">
          {{ formatCurrency(total) }}
        </div>
        <div v-if="showDeltas" class="mt-0.5 text-sm font-semibold tabular-nums" :class="deltaTextClass(deltaTotal)">
          {{ formatDelta(deltaTotal) }}
        </div>
      </div>
    </div>

    <dl
      class="mt-4 grid grid-cols-[8.5rem_6.5rem_max-content] items-center gap-x-1 gap-y-1.5 overflow-hidden rounded-md bg-slate-950/20 p-2.5 text-xs text-slate-200 shadow-lg shadow-black/20"
    >
      <div v-for="row in breakdownRows" :key="row.key" class="contents">
        <dt class="min-w-0 truncate text-slate-400" :title="row.label">{{ row.label }}</dt>
        <dd>
          <div class="h-1.5 w-full overflow-hidden rounded bg-slate-800">
            <div class="h-full rounded bg-slate-200" :style="{ width: row.widthPct }" />
          </div>
        </dd>
        <dd class="justify-self-end whitespace-nowrap text-right tabular-nums text-[13px] font-semibold text-slate-100">
          <div class="flex flex-col items-end">
            <div>{{ formatCurrency(row.value) }}</div>
            <div v-if="showDeltas" class="text-[11px] font-semibold tabular-nums" :class="deltaTextClass(row.delta)">
              {{ formatDelta(row.delta) }}
            </div>
          </div>
        </dd>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  country: string
  month: string | null
  grossSalary: number
  paye: number
  overtime: number
  vc: number
  healthSurcharge: number
  nisCompany: number
  total: number
  showDeltas?: boolean
  deltaGrossSalary?: number
  deltaPaye?: number
  deltaOvertime?: number
  deltaVc?: number
  deltaHealthSurcharge?: number
  deltaNisCompany?: number
  deltaTotal?: number
}>()

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function formatCurrency(v: number) {
  const n = Number.isFinite(v) ? v : 0
  return fmt.format(n)
}

function formatDelta(v: number) {
  const n = Number.isFinite(v) ? v : 0
  if (n === 0) return '±' + formatCurrency(0)
  const abs = formatCurrency(Math.abs(n))
  return (n > 0 ? '+' : '-') + abs.replace(/^-/, '')
}

function deltaTextClass(v: number) {
  const n = Number.isFinite(v) ? v : 0
  if (n > 0) return 'text-emerald-300'
  if (n < 0) return 'text-rose-300'
  return 'text-slate-400'
}

const country = computed(() => props.country)
const month = computed(() => props.month)
const grossSalary = computed(() => props.grossSalary)
const paye = computed(() => props.paye)
const overtime = computed(() => props.overtime)
const vc = computed(() => props.vc)
const healthSurcharge = computed(() => props.healthSurcharge)
const nisCompany = computed(() => props.nisCompany)
const total = computed(() => props.total)
const showDeltas = computed(() => props.showDeltas === true)

const deltaGrossSalary = computed(() => (Number.isFinite(props.deltaGrossSalary) ? (props.deltaGrossSalary as number) : 0))
const deltaPaye = computed(() => (Number.isFinite(props.deltaPaye) ? (props.deltaPaye as number) : 0))
const deltaOvertime = computed(() => (Number.isFinite(props.deltaOvertime) ? (props.deltaOvertime as number) : 0))
const deltaVc = computed(() => (Number.isFinite(props.deltaVc) ? (props.deltaVc as number) : 0))
const deltaHealthSurcharge = computed(() => (Number.isFinite(props.deltaHealthSurcharge) ? (props.deltaHealthSurcharge as number) : 0))
const deltaNisCompany = computed(() => (Number.isFinite(props.deltaNisCompany) ? (props.deltaNisCompany as number) : 0))
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
  {
    key: 'paye',
    label: 'PAYE',
    value: paye.value,
    delta: deltaPaye.value,
    widthPct: widthPctForValue(paye.value)
  },
  { key: 'overtime', label: 'Overtime', value: overtime.value, delta: deltaOvertime.value, widthPct: widthPctForValue(overtime.value) },
  { key: 'vc', label: 'VC', value: vc.value, delta: deltaVc.value, widthPct: widthPctForValue(vc.value) },
  {
    key: 'healthSurcharge',
    label: 'Health Surcharge',
    value: healthSurcharge.value,
    delta: deltaHealthSurcharge.value,
    widthPct: widthPctForValue(healthSurcharge.value)
  },
  { key: 'nisCompany', label: 'NIS (Company)', value: nisCompany.value, delta: deltaNisCompany.value, widthPct: widthPctForValue(nisCompany.value) }
])
</script>

