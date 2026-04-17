<template>
  <div>
    <div class="mt-4 grid gap-4 sm:grid-cols-[9rem_1fr] sm:items-start">
      <div class="flex justify-center sm:justify-start">
        <div class="relative h-36 w-36">
          <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(13 27 62)" stroke-width="10" />
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
            <div class="text-sm text-slate-600">Additions</div>
            <div class="text-3xl font-semibold tabular-nums">{{ selectedHires }}</div>
            <div class="text-sm text-slate-400 tabular-nums">{{ selectedMonthLabel }}</div>
          </div>
        </div>
      </div>

      <div class="min-w-0 space-y-2 text-base">
        <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
          <span class="whitespace-nowrap">Month</span>
          <select
            v-model="selectedMonth"
            class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          >
            <option v-for="m in months" :key="m" :value="m">{{ formatMonthLabel(m) }}</option>
          </select>
        </label>

        <div class="flex items-center justify-between gap-6">
          <div class="text-slate-600">Additions</div>
          <div class="tabular-nums text-slate-900">{{ selectedHires }}</div>
        </div>
      </div>
    </div>

    <div v-if="showRecruitmentDetailsLink" class="mt-3 flex justify-end">
      <button
        type="button"
        class="rounded-md border border-slate-300 bg-white shadow-sm px-2.5 py-1 text-xs font-semibold text-hr-navy hover:bg-slate-100"
        @click="openRecruitmentNewHiresDetails"
      >
        See details
      </button>
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
  /** Shows a button linking to Recruitment → New hires for the selected month. */
  showRecruitmentDetailsLink?: boolean
}>()

function openRecruitmentNewHiresDetails() {
  if (!props.showRecruitmentDetailsLink) return
  const m = (selectedMonth.value ?? '').trim()
  if (!/^\d{4}-\d{2}$/.test(m)) return
  navigateTo(`/recruitment?section=recent-new-hires&hireMonth=${encodeURIComponent(m)}#recent-new-hires-table`)
}

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
