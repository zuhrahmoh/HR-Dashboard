<template>
  <section class="rounded-md border border-slate-800 bg-slate-900 p-4">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h3 class="truncate text-sm font-semibold text-slate-100" :title="country">{{ country || '—' }}</h3>
        <p v-if="month" class="mt-0.5 text-xs text-slate-400">{{ month }}</p>
      </div>
      <div class="text-right text-sm font-semibold tabular-nums text-emerald-400">
        {{ formatCurrency(total) }}
      </div>
    </div>

    <dl class="mt-4 space-y-2 rounded-md bg-slate-950/20 p-3 text-xs text-slate-200 shadow-lg shadow-black/20">
      <div v-for="row in breakdownRows" :key="row.key" class="grid grid-cols-12 items-center gap-3">
        <dt class="col-span-4 truncate text-slate-400" :title="row.label">{{ row.label }}</dt>
        <dd class="col-span-6">
          <div class="h-2 w-full overflow-hidden rounded bg-slate-800">
            <div class="h-full rounded bg-slate-200" :style="{ width: row.widthPct }" />
          </div>
        </dd>
        <dd class="col-span-2 text-right tabular-nums">{{ formatCurrency(row.value) }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  country: string
  month: string | null
  salariesInclusiveOfPaye: number
  overtime: number
  vc: number
  otherAllowances: number
  nisCompany: number
  total: number
}>()

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

function formatCurrency(v: number) {
  const n = Number.isFinite(v) ? v : 0
  return fmt.format(n)
}

const country = computed(() => props.country)
const month = computed(() => props.month)
const salariesInclusiveOfPaye = computed(() => props.salariesInclusiveOfPaye)
const overtime = computed(() => props.overtime)
const vc = computed(() => props.vc)
const otherAllowances = computed(() => props.otherAllowances)
const nisCompany = computed(() => props.nisCompany)
const total = computed(() => props.total)

function widthPctForValue(value: number) {
  const t = total.value
  if (!Number.isFinite(value) || !Number.isFinite(t) || t <= 0) return '0%'
  return `${Math.max(0, Math.min(100, (value / t) * 100))}%`
}

const breakdownRows = computed(() => [
  {
    key: 'salariesInclusiveOfPaye',
    label: 'Salaries (incl. PAYE)',
    value: salariesInclusiveOfPaye.value,
    widthPct: widthPctForValue(salariesInclusiveOfPaye.value)
  },
  { key: 'overtime', label: 'Overtime', value: overtime.value, widthPct: widthPctForValue(overtime.value) },
  { key: 'vc', label: 'VC', value: vc.value, widthPct: widthPctForValue(vc.value) },
  {
    key: 'otherAllowances',
    label: 'Other allowances',
    value: otherAllowances.value,
    widthPct: widthPctForValue(otherAllowances.value)
  },
  { key: 'nisCompany', label: 'NIS (Company)', value: nisCompany.value, widthPct: widthPctForValue(nisCompany.value) }
])
</script>

