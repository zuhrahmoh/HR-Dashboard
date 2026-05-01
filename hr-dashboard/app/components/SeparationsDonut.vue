<template>
  <div>
    <div class="mt-4 grid gap-4 sm:grid-cols-[9rem_1fr] sm:items-start">
      <div class="flex justify-center sm:justify-start">
        <div class="relative h-36 w-36">
          <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(243 232 255)" stroke-width="10" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="rgb(236 72 153)"
              stroke-width="10"
              stroke-linecap="round"
              :stroke-dasharray="dashArray"
              stroke-dashoffset="0"
            />
          </svg>

          <div class="absolute inset-0 grid place-items-center text-center">
            <div class="text-sm text-slate-600">Separations</div>
            <div class="text-3xl font-semibold tabular-nums">{{ selectedSeparations }}</div>
            <div class="text-sm text-slate-400 tabular-nums">{{ selectedMonthLabel }}</div>
          </div>
        </div>
      </div>

      <div class="min-w-0 space-y-2 text-base">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span class="whitespace-nowrap">Month</span>
            <select
              v-model="selectedMonth"
              class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              <option v-for="m in months" :key="m" :value="m">{{ formatMonthLabel(m) }}</option>
            </select>
          </label>

          <div v-if="showBreakdown" class="flex flex-wrap gap-1.5">
            <button
              v-for="reason in REASON_KEYS"
              :key="reason"
              type="button"
              class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums"
              :class="reasonPillClass(reason, include[reason])"
              @click="include[reason] = !include[reason]"
            >
              {{ REASON_LABELS[reason] }}
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between gap-6">
          <div class="text-slate-600">Separations</div>
          <div class="tabular-nums text-slate-900">{{ selectedSeparations }}</div>
        </div>

        <div v-if="showBreakdown && breakdownText" class="pt-1 text-sm text-slate-400">
          Breakdown: {{ breakdownText }}
        </div>
      </div>
    </div>

    <div v-if="showRecruitmentDetailsLink" class="mt-3 flex justify-end">
      <button
        type="button"
        class="rounded-md border border-slate-300 bg-white shadow-sm px-2.5 py-1 text-xs font-semibold text-hr-navy hover:bg-slate-100"
        @click="openRecruitmentSeparationsDetails"
      >
        See details
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
type ReasonKey =
  | 'resigned'
  | 'retired'
  | 'fired'
  | 'vsep'
  | 'end_of_contract'
  | 'probation_failure'
  | 'retrenchment'
  | 'separated'

type MonthBreakdown = Record<ReasonKey, number> & { headcountAfter: number }

const REASON_KEYS: ReasonKey[] = [
  'resigned',
  'retired',
  'fired',
  'vsep',
  'end_of_contract',
  'probation_failure',
  'retrenchment',
  'separated'
]

const REASON_LABELS: Record<ReasonKey, string> = {
  resigned: 'Resigned',
  retired: 'Retired',
  fired: 'Fired',
  vsep: 'VSEP',
  end_of_contract: 'End of Contract',
  probation_failure: 'Probation Failure',
  retrenchment: 'Retrenchment',
  separated: 'Separated'
}

const props = defineProps<{
  separations: {
    currentMonth: string
    months: string[]
    byMonth: Record<string, Partial<MonthBreakdown>>
  }
  showBreakdown?: boolean
  /** Shows a button linking to Recruitment → Recent separations for the selected month. */
  showRecruitmentDetailsLink?: boolean
}>()

function openRecruitmentSeparationsDetails() {
  if (!props.showRecruitmentDetailsLink) return
  const m = (selectedMonth.value ?? '').trim()
  if (!/^\d{4}-\d{2}$/.test(m)) return
  navigateTo(`/recruitment?section=recent-separations&sepMonth=${encodeURIComponent(m)}#recent-separations-table`)
}

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

const include = reactive<Record<ReasonKey, boolean>>({
  resigned: true,
  retired: true,
  fired: true,
  vsep: true,
  end_of_contract: true,
  probation_failure: true,
  retrenchment: true,
  separated: true
})

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
  const out = {} as MonthBreakdown
  for (const k of REASON_KEYS) out[k] = safeInt(d?.[k])
  out.headcountAfter = safeInt(d?.headcountAfter)
  return out
})

const totalAllReasons = computed(() => REASON_KEYS.reduce((sum, k) => sum + monthData.value[k], 0))

const selectedSeparations = computed(() => {
  if (!showBreakdown.value) return totalAllReasons.value
  return REASON_KEYS.reduce((sum, k) => (include[k] ? sum + monthData.value[k] : sum), 0)
})

const headcountAfterSelected = computed(
  () => monthData.value.headcountAfter + (totalAllReasons.value - selectedSeparations.value)
)

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

const breakdownText = computed(() => {
  const parts = REASON_KEYS.filter((k) => monthData.value[k] > 0).map(
    (k) => `${REASON_LABELS[k]} ${monthData.value[k]}`
  )
  return parts.join(', ')
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

const REASON_PILL_CLASSES: Record<ReasonKey, string> = {
  resigned: 'border-teal-200 bg-teal-50 text-teal-800',
  retired: 'border-purple-200 bg-purple-50 text-brand-purple',
  fired: 'border-pink-200 bg-pink-50 text-pink-800',
  vsep: 'border-blue-200 bg-blue-50 text-blue-800',
  end_of_contract: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  probation_failure: 'border-rose-200 bg-rose-50 text-rose-800',
  retrenchment: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800',
  separated: 'border-slate-200 bg-slate-50 text-slate-700'
}

function reasonPillClass(reason: ReasonKey, enabled: boolean) {
  if (!enabled) return 'border-slate-200 bg-slate-50 text-slate-400'
  return REASON_PILL_CLASSES[reason]
}
</script>
