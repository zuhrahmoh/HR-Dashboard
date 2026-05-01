<template>
  <div v-if="!isTotalOnly" class="report-expense-card report-keep">
    <ExpenseCountryCard
      :country="item.country"
      :month="month"
      currency="USD"
      :gross-salary="item.grossSalary"
      :overtime="item.overtime"
      :vc="item.vc"
      :nis-company="item.nisCompany"
      :medical-plan-employer="item.medicalPlanEmployer"
      :other="item.other"
      :total="item.total"
      :show-deltas="false"
    />
  </div>

  <section v-else class="rounded-md border border-slate-200 bg-white p-4 report-keep">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h3 class="truncate text-sm font-semibold text-hr-navy" :title="item.country">{{ item.country || '—' }}</h3>
        <p v-if="month" class="mt-0.5 text-sm text-slate-600">{{ month }}</p>
      </div>
      <div class="text-right text-sm font-semibold tabular-nums text-hr-navy">
        {{ fmtUsd.format(item.total) }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import ExpenseCountryCard from '~/components/ExpenseCountryCard.vue'

type ExpenseItem = {
  country: string
  grossSalary: number
  overtime: number
  vc: number
  nisCompany: number
  medicalPlanEmployer: number
  other: number
  totalOutgoingExpenses: number
  total: number
}

const props = defineProps<{
  item: ExpenseItem
  month: string | null
}>()

const fmtUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'code', maximumFractionDigits: 0 })

const isTotalOnly = computed(() => {
  const i = props.item
  return (
    i.grossSalary === 0 &&
    i.overtime === 0 &&
    i.vc === 0 &&
    i.nisCompany === 0 &&
    i.medicalPlanEmployer === 0 &&
    i.other === 0
  )
})
</script>

