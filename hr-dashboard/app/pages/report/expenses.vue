<template>
  <div class="space-y-5 p-1" :data-report-ready="reportReady ? '1' : undefined">

    <div class="rpt-section-title">Section 2 — Cost Overview</div>

    <div v-if="pending" class="rpt-empty">Loading…</div>
    <div v-else-if="!expenses || orderedItems.length === 0" class="rpt-empty">No expense data available for this period.</div>

    <template v-else>
      <!-- Summary: highest spend -->
      <div class="grid grid-cols-4 gap-2">
        <div class="rpt-metric-block col-span-2">
          <div class="rpt-metric-label">Highest Spend Country</div>
          <div class="rpt-metric-value">{{ highestSpend ? fmtUsd.format(rowTotal(highestSpend)) : '—' }}</div>
          <div class="rpt-metric-note">{{ highestSpend ? highestSpend.country : '' }}{{ expenses.month ? ` · ${expenses.month}` : '' }}</div>
        </div>
        <div class="rpt-metric-block col-span-2">
          <div class="rpt-metric-label">Total Global Spend</div>
          <div class="rpt-metric-value">{{ fmtUsd.format(globalTotal) }}</div>
          <div class="rpt-metric-note">Across {{ orderedItems.length }} {{ orderedItems.length === 1 ? 'country' : 'countries' }}</div>
        </div>
      </div>

      <!-- Insight bullets -->
      <ul v-if="insightBullets.length > 0" class="rpt-bullets">
        <li v-for="b in insightBullets" :key="b">{{ b }}</li>
      </ul>

      <!-- Per-country tables -->
      <div class="space-y-4">
        <div
          v-for="item in orderedItems"
          :key="item.country"
          class="break-inside-avoid"
        >
          <!-- Country header row -->
          <div class="rpt-country-heading flex items-center justify-between">
            <span>{{ item.country }}</span>
            <span v-if="expenses.month" class="font-normal text-slate-500">{{ expenses.month }}</span>
          </div>

          <!-- Full breakdown if available -->
          <table v-if="hasBreakdown(item)" class="rpt-table">
            <thead>
              <tr>
                <th>Category</th>
                <th class="text-right">%</th>
                <th class="text-right">Amount (USD)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="item.grossSalary">
                <td>Gross Salary</td>
                <td class="text-right tabular-nums">{{ catPct(item.grossSalary, item.total) }}%</td>
                <td class="text-right tabular-nums">{{ fmtUsd.format(item.grossSalary) }}</td>
              </tr>
              <tr v-if="item.allowance">
                <td>Allowance</td>
                <td class="text-right tabular-nums">{{ catPct(item.allowance, item.total) }}%</td>
                <td class="text-right tabular-nums">{{ fmtUsd.format(item.allowance) }}</td>
              </tr>
              <tr v-if="item.overtime">
                <td>Overtime</td>
                <td class="text-right tabular-nums">{{ catPct(item.overtime, item.total) }}%</td>
                <td class="text-right tabular-nums">{{ fmtUsd.format(item.overtime) }}</td>
              </tr>
              <tr v-if="item.vc">
                <td>VC</td>
                <td class="text-right tabular-nums">{{ catPct(item.vc, item.total) }}%</td>
                <td class="text-right tabular-nums">{{ fmtUsd.format(item.vc) }}</td>
              </tr>
              <tr v-if="item.nisCompany">
                <td>NIS (Company)</td>
                <td class="text-right tabular-nums">{{ catPct(item.nisCompany, item.total) }}%</td>
                <td class="text-right tabular-nums">{{ fmtUsd.format(item.nisCompany) }}</td>
              </tr>
              <tr v-if="item.medicalPlanEmployer">
                <td>Medical Plan (Employer)</td>
                <td class="text-right tabular-nums">{{ catPct(item.medicalPlanEmployer, item.total) }}%</td>
                <td class="text-right tabular-nums">{{ fmtUsd.format(item.medicalPlanEmployer) }}</td>
              </tr>
              <tr style="background:#f8fafc;font-weight:700;">
                <td>Total Outgoing</td>
                <td class="text-right">100%</td>
                <td class="text-right tabular-nums">{{ fmtUsd.format(item.total) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Compact row if no breakdown -->
          <table v-else class="rpt-table">
            <thead>
              <tr>
                <th>Country</th>
                <th class="text-right">Total Outgoing (USD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ item.country }}</td>
                <td class="text-right tabular-nums font-semibold">{{ fmtUsd.format(item.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
type ExpenseItem = {
  country: string
  grossSalary?: number
  allowance?: number
  overtime?: number
  vc?: number
  nisCompany?: number
  medicalPlanEmployer?: number
  total: number
}

type ExpensesResponse = {
  month: string | null
  items: ExpenseItem[]
  source: 'sharepoint' | 'csv'
}

const COUNTRY_ORDER = ['Trinidad and Tobago', 'Guyana', 'Suriname', 'Mexico', 'Colombia', 'USA'] as const

function canonicalCountry(raw: string): string {
  const s = String(raw ?? '').trim().replace(/\s+/g, ' ')
  const cmp = s.replace(/\s*&\s*/g, ' and ').toLowerCase()
  if (cmp === 'trinidad and tobago') return 'Trinidad and Tobago'
  if (cmp === 'columbia') return 'Colombia'
  if (cmp === 'usa' || cmp === 'u.s.a.' || cmp === 'united states' || cmp === 'united states of america') return 'USA'
  return s
}

function countrySortKey(country: string) {
  const key = canonicalCountry(country)
  const i = (COUNTRY_ORDER as readonly string[]).indexOf(key)
  return i >= 0 ? i : 999
}

function safeNum(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function catPct(val: number | undefined, total: number | undefined) {
  const t = safeNum(total)
  if (!t) return '<1'
  const p = (safeNum(val) / t) * 100
  return p < 1 ? '<1' : p.toFixed(0)
}

function hasBreakdown(item: ExpenseItem) {
  return safeNum(item.grossSalary) > 0 || safeNum(item.overtime) > 0 || safeNum(item.nisCompany) > 0
}

definePageMeta({ layout: false })

const route = useRoute()
const reportMonth = computed(() => (typeof route.query.reportMonth === 'string' ? route.query.reportMonth.trim() : ''))
const reportMonthKey = computed(() => (/^\d{4}-\d{2}$/.test(reportMonth.value) ? reportMonth.value : ''))

const fmtUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'code', maximumFractionDigits: 0 })

const { data, pending } = await useFetch<ExpensesResponse>('/api/expenses', {
  query: computed(() => ({ month: reportMonthKey.value || undefined })),
  watch: [reportMonthKey]
})
const expenses = computed(() => data.value ?? null)

function rowTotal(item: ExpenseItem) {
  return safeNum(item.total)
}

const orderedItems = computed(() => {
  const items = [...(expenses.value?.items ?? [])].filter((i) => rowTotal(i) > 0)
  items.sort((a, b) => rowTotal(b) - rowTotal(a) || a.country.localeCompare(b.country))
  return items
})

const highestSpend = computed(() => orderedItems.value[0] ?? null)

const globalTotal = computed(() => orderedItems.value.reduce((s, i) => s + rowTotal(i), 0))

const insightBullets = computed(() => {
  const out: string[] = []
  const top = highestSpend.value
  if (top) {
    out.push(`${top.country} has the highest workforce cost for the reporting period.`)
  }
  // Determine the largest category across major countries
  const totals = { grossSalary: 0, allowance: 0, overtime: 0, vc: 0, nisCompany: 0, medicalPlanEmployer: 0 }
  for (const i of orderedItems.value) {
    totals.grossSalary += safeNum(i.grossSalary)
    totals.allowance += safeNum(i.allowance)
    totals.overtime += safeNum(i.overtime)
    totals.vc += safeNum(i.vc)
    totals.nisCompany += safeNum(i.nisCompany)
    totals.medicalPlanEmployer += safeNum(i.medicalPlanEmployer)
  }
  const labels: Record<keyof typeof totals, string> = {
    grossSalary: 'Gross salary',
    allowance: 'Allowance',
    overtime: 'Overtime',
    vc: 'VC',
    nisCompany: 'NIS (Company)',
    medicalPlanEmployer: 'Medical plan (employer)'
  }
  const ranked = (Object.keys(totals) as Array<keyof typeof totals>)
    .filter((k) => totals[k] > 0)
    .sort((a, b) => totals[b] - totals[a])
  const top1 = ranked[0]
  if (top1) {
    out.push(`${labels[top1]} is the largest cost category across reported countries.`)
  }
  return out
})

const reportReady = computed(() => !pending.value)
</script>
