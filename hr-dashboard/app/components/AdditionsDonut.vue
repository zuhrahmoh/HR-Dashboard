<template>
  <div class="mt-6 grid gap-6 sm:grid-cols-[10rem_1fr] sm:items-start">
    <div class="flex justify-center sm:justify-start">
      <div class="relative h-40 w-40">
        <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(30 41 59)" stroke-width="10" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgb(16 185 129)"
            stroke-width="10"
            stroke-linecap="round"
            :stroke-dasharray="dashArray"
            stroke-dashoffset="0"
          />
        </svg>

        <div class="absolute inset-0 grid place-items-center text-center">
          <div class="text-sm text-slate-300">Additions</div>
          <div class="text-3xl font-semibold tabular-nums">{{ selectedHires }}</div>
          <div class="text-sm text-slate-400 tabular-nums">{{ selectedMonthLabel }}</div>
        </div>
      </div>
    </div>

    <div class="min-w-0 space-y-2 text-base">
      <label class="flex items-center gap-2 text-sm font-medium text-slate-300">
        <span class="whitespace-nowrap">Month</span>
        <select
          v-model="selectedMonth"
          class="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus:border-slate-600"
        >
          <option v-for="m in months" :key="m" :value="m">{{ formatMonthLabel(m) }}</option>
        </select>
      </label>

      <div class="flex items-center justify-between gap-6">
        <div class="text-slate-300">Additions</div>
        <div class="tabular-nums text-slate-50">{{ selectedHires }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  additions: {
    currentMonth: string
    months: string[]
    byMonth: Record<string, { hires: number }>
  }
  totalHeadcount: number
}>()

const ratio = computed(() => {
  const h = selectedHires.value
  const t = Number.isFinite(props.totalHeadcount) ? props.totalHeadcount : 0
  if (t <= 0) return 0
  return Math.max(0, Math.min(1, h / t))
})

const months = computed(() => props.additions?.months ?? [])

const selectedMonth = ref<string>(props.additions?.currentMonth ?? (months.value[0] ?? ''))
watch(
  () => props.additions?.currentMonth,
  (v) => {
    if (!v) return
    if (!selectedMonth.value) selectedMonth.value = v
  }
)

const dashArray = computed(() => {
  const r = 42
  const c = 2 * Math.PI * r
  const filled = c * ratio.value
  const empty = c - filled
  return `${filled} ${empty}`
})

function safeInt(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

const monthData = computed(() => {
  const key = selectedMonth.value
  const d = props.additions?.byMonth?.[key]
  return { hires: safeInt(d?.hires) }
})

const selectedHires = computed(() => monthData.value.hires)

function formatMonthLabel(monthKey: string) {
  const m = /^(\d{4})-(\d{2})$/.exec((monthKey ?? '').trim())
  if (!m) return monthKey
  const y = Number(m[1])
  const mo = Number(m[2])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return monthKey
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

const selectedMonthLabel = computed(() => (selectedMonth.value ? formatMonthLabel(selectedMonth.value) : '—'))
</script>

