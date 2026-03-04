<template>
  <div class="mt-4 grid gap-4 sm:grid-cols-[9rem_1fr] sm:items-start">
    <div class="flex justify-center sm:justify-start">
      <div class="relative h-36 w-36">
        <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(30 41 59)" stroke-width="10" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgb(244 63 94)"
            stroke-width="10"
            stroke-linecap="round"
            :stroke-dasharray="dashArray"
            stroke-dashoffset="0"
          />
        </svg>

        <div class="absolute inset-0 grid place-items-center text-center">
          <div class="text-sm text-slate-300">Separations</div>
          <div class="text-3xl font-semibold tabular-nums">{{ selectedSeparations }}</div>
          <div class="text-sm text-slate-400 tabular-nums">{{ selectedMonthLabel }}</div>
        </div>
      </div>
    </div>

    <div class="min-w-0 space-y-2 text-base">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <label class="flex items-center gap-2 text-sm font-medium text-slate-300">
          <span class="whitespace-nowrap">Month</span>
          <select
            v-model="selectedMonth"
            class="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus:border-slate-600"
          >
            <option v-for="m in months" :key="m" :value="m">{{ formatMonthLabel(m) }}</option>
          </select>
        </label>

        <div v-if="showBreakdown" class="flex flex-wrap gap-1.5 sm:flex-nowrap">
          <button
            type="button"
            class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums"
            :class="reasonPillClass('resigned', include.resigned)"
            @click="include.resigned = !include.resigned"
          >
            Resigned
          </button>
          <button
            type="button"
            class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums"
            :class="reasonPillClass('retired', include.retired)"
            @click="include.retired = !include.retired"
          >
            Retired
          </button>
          <button
            type="button"
            class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums"
            :class="reasonPillClass('fired', include.fired)"
            @click="include.fired = !include.fired"
          >
            Fired
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between gap-6">
        <div class="text-slate-300">Separations</div>
        <div class="tabular-nums text-slate-50">{{ selectedSeparations }}</div>
      </div>

      <div v-if="showBreakdown" class="pt-1 text-sm text-slate-400">
        Breakdown: Resigned {{ monthData.resigned }}, Retired {{ monthData.retired }}, Fired {{ monthData.fired }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  separations: {
    currentMonth: string
    months: string[]
    byMonth: Record<
      string,
      {
        resigned: number
        retired: number
        fired: number
        headcountAfter: number
      }
    >
  }
  showBreakdown?: boolean
}>()

const months = computed(() => props.separations?.months ?? [])
const showBreakdown = computed(() => props.showBreakdown !== false)

const selectedMonth = ref<string>(props.separations?.currentMonth ?? (months.value[0] ?? ''))
watch(
  () => props.separations?.currentMonth,
  (v) => {
    if (!v) return
    if (!selectedMonth.value) selectedMonth.value = v
  }
)

const include = reactive({ resigned: true, retired: true, fired: true })

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function safeInt(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

const monthData = computed(() => {
  const key = selectedMonth.value
  const d = props.separations?.byMonth?.[key]
  return {
    resigned: safeInt(d?.resigned),
    retired: safeInt(d?.retired),
    fired: safeInt(d?.fired),
    headcountAfter: safeInt(d?.headcountAfter)
  }
})

const totalAllReasons = computed(() => monthData.value.resigned + monthData.value.retired + monthData.value.fired)

const selectedSeparations = computed(() => {
  if (!showBreakdown.value) return totalAllReasons.value
  let sum = 0
  if (include.resigned) sum += monthData.value.resigned
  if (include.retired) sum += monthData.value.retired
  if (include.fired) sum += monthData.value.fired
  return sum
})

const headcountAfterSelected = computed(() => monthData.value.headcountAfter + (totalAllReasons.value - selectedSeparations.value))

const ratio = computed(() => {
  const before = headcountAfterSelected.value + selectedSeparations.value
  return before > 0 ? clamp01(selectedSeparations.value / before) : 0
})

const dashArray = computed(() => {
  const r = 42
  const c = 2 * Math.PI * r
  const filled = c * ratio.value
  const empty = c - filled
  return `${filled} ${empty}`
})

function formatMonthLabel(monthKey: string) {
  const m = /^(\d{4})-(\d{2})$/.exec((monthKey ?? '').trim())
  if (!m) return monthKey
  const y = Number(m[1])
  const mo = Number(m[2])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return monthKey
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

const selectedMonthLabel = computed(() => (selectedMonth.value ? formatMonthLabel(selectedMonth.value) : '—'))

function reasonPillClass(reason: 'resigned' | 'retired' | 'fired', enabled: boolean) {
  if (!enabled) return 'border-slate-800 bg-slate-950 text-slate-400'
  if (reason === 'resigned') return 'border-amber-500/40 bg-amber-950/40 text-amber-100'
  if (reason === 'retired') return 'border-violet-400/30 bg-violet-500/10 text-violet-200'
  return 'border-red-500/40 bg-red-950/40 text-red-100'
}
</script>

