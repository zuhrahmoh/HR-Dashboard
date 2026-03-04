<template>
  <div class="space-y-6" :data-report-ready="reportReady ? '1' : undefined">
    <div class="space-y-1">
      <h1 class="text-3xl font-semibold">Expenses</h1>
      <p class="text-base text-slate-300">Global expense breakdown snapshot.</p>
    </div>

    <hr class="border-slate-800" />

    <section class="space-y-4">
      <ReportKpiTile
        label="Highest spend (month)"
        :value="highestSpendValue"
        :subtitle="highestSpendSubtitle"
        :insight="highestSpendInsight"
        :accent="ACCENTS.expense"
      />

      <section class="report-fragment-box rounded-lg border border-slate-200 bg-white p-4">
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-slate-900">Global expense breakdown</h2>
          <p class="text-sm text-slate-600">General expenses breakdown by country (grid).</p>
        </div>

        <div v-if="pending" class="mt-4 text-sm text-slate-700">Loading…</div>
        <div v-else-if="(expenses?.items?.length ?? 0) === 0" class="mt-4 text-sm text-slate-700">No expenses data.</div>

        <div v-else class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <ReportExpenseCard
            v-for="(item, idx) in (expenses?.items ?? [])"
            :key="`${item.country}__${idx}`"
            :item="item"
            :month="expenses?.month ?? null"
          />
        </div>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import ReportKpiTile from '~/components/ReportKpiTile.vue'
import ReportExpenseCard from '~/components/ReportExpenseCard.vue'

type ExpensesResponse = {
  month: string | null
  items: Array<{
    country: string
    grossSalary: number
    paye: number
    overtime: number
    vc: number
    healthSurcharge: number
    nisCompany: number
    totalOutgoingExpenses: number
    total: number
  }>
  source: 'sharepoint' | 'csv'
  warning?: string
}

const ACCENTS = {
  expense: '#0f766e'
} as const

const route = useRoute()
const reportMonth = computed(() => (typeof route.query.reportMonth === 'string' ? route.query.reportMonth.trim() : ''))
const reportMonthKey = computed(() => (/^\d{4}-\d{2}$/.test(reportMonth.value) ? reportMonth.value : ''))

const fmtUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'code', maximumFractionDigits: 0 })

const { data, pending } = await useFetch<ExpensesResponse>('/api/expenses', {
  query: computed(() => ({ month: reportMonthKey.value || undefined })),
  watch: [reportMonthKey]
})
const expenses = computed(() => data.value ?? null)

const highestSpend = computed(() => {
  const items = (expenses.value?.items ?? []).slice().filter((i) => (i.country || '').trim())
  items.sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
  return items[0] ?? null
})

const highestSpendValue = computed(() => (highestSpend.value ? fmtUsd.format(highestSpend.value.total) : '—'))
const highestSpendSubtitle = computed(() =>
  highestSpend.value ? `Country: ${highestSpend.value.country}${expenses.value?.month ? ` · ${expenses.value.month}` : ''}` : 'Country: —'
)
const highestSpendInsight = computed(() => (highestSpend.value ? `Highest spend country this month: ${highestSpend.value.country}.` : ''))

const reportReady = ref(false)
watchEffect(async () => {
  if (pending.value) {
    reportReady.value = false
    return
  }
  await nextTick()
  reportReady.value = true
})
</script>

