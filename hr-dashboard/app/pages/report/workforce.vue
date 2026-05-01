<template>
  <div class="space-y-5 p-1" :data-report-ready="reportReady ? '1' : undefined">

    <div class="rpt-section-title">Section 1 — Workforce Snapshot</div>

    <!-- Insight bullets -->
    <ul v-if="insightBullets.length > 0" class="rpt-bullets">
      <li v-for="b in insightBullets" :key="b">{{ b }}</li>
    </ul>

    <!-- Employment type summary -->
    <div>
      <div class="rpt-subsection-title" style="margin-top:0;">Employment Summary</div>
      <div class="grid grid-cols-2 gap-3">
        <!-- Overall breakdown -->
        <div>
          <table class="rpt-table">
            <thead>
              <tr>
                <th>Type</th>
                <th class="text-right">Count</th>
                <th class="text-right">%</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Permanent</td>
                <td class="text-right tabular-nums">{{ overall.permanent }}</td>
                <td class="text-right tabular-nums">{{ pct(overall.permanent, overall.total) }}%</td>
              </tr>
              <tr>
                <td>Contracted</td>
                <td class="text-right tabular-nums">{{ overall.contracted }}</td>
                <td class="text-right tabular-nums">{{ pct(overall.contracted, overall.total) }}%</td>
              </tr>
              <tr>
                <td>Interns</td>
                <td class="text-right tabular-nums">{{ overall.interns }}</td>
                <td class="text-right tabular-nums">{{ pct(overall.interns, overall.total) }}%</td>
              </tr>
              <tr style="background:#f8fafc;font-weight:700;">
                <td>Total</td>
                <td class="text-right tabular-nums">{{ totalHeadcount }}</td>
                <td class="text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Group totals -->
        <div>
          <table class="rpt-table">
            <thead>
              <tr>
                <th>Group</th>
                <th class="text-right">Headcount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>RAMPS (TT, GY, SUR, MEX, COL, USA)</td>
                <td class="text-right tabular-nums">{{ rampsCount }}</td>
              </tr>
              <tr>
                <td>EDO Offshore (TT &amp; GY)</td>
                <td class="text-right tabular-nums">{{ edoCount }}</td>
              </tr>
              <tr v-if="consultants > 0 || independentContractors > 0">
                <td>Consultants</td>
                <td class="text-right tabular-nums">{{ consultants }}</td>
              </tr>
              <tr v-if="independentContractors > 0">
                <td>Independent Contractors</td>
                <td class="text-right tabular-nums">{{ independentContractors }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Geographical distribution -->
    <div>
      <div class="rpt-subsection-title">Geographical Distribution</div>
      <div v-if="geoRows.length === 0" class="rpt-empty">No headcount data available.</div>
      <table v-else class="rpt-table">
        <thead>
          <tr>
            <th>Country</th>
            <th class="text-right">Headcount</th>
            <th class="text-right">% of Total</th>
            <th class="text-right">Permanent</th>
            <th class="text-right">Contracted</th>
            <th class="text-right">Interns</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in geoRows" :key="row.country">
            <td class="font-medium">{{ row.country }}</td>
            <td class="text-right tabular-nums">{{ row.headcount }}</td>
            <td class="text-right tabular-nums">{{ row.pct }}%</td>
            <td class="text-right tabular-nums">{{ row.permanent ?? '—' }}</td>
            <td class="text-right tabular-nums">{{ row.contracted ?? '—' }}</td>
            <td class="text-right tabular-nums">{{ row.interns ?? '—' }}</td>
          </tr>
          <tr style="background:#f8fafc;font-weight:700;">
            <td>Total</td>
            <td class="text-right tabular-nums">{{ totalHeadcount }}</td>
            <td class="text-right">100%</td>
            <td class="text-right tabular-nums">{{ overall.permanent }}</td>
            <td class="text-right tabular-nums">{{ overall.contracted }}</td>
            <td class="text-right tabular-nums">{{ overall.interns }}</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
type HomeAnalytics = {
  headcountByCountry: Array<{ country: string; headcount: number }>
  headcountEmploymentSubtotals?: { consultants: number; independentContractors: number }
  employmentTypeBreakdown?: {
    overall: { permanent: number; contracted: number; interns: number; total: number }
    byCountry: Array<{ country: string; permanent: number; contracted: number; interns: number; total: number }>
  }
}

const RAMPS_COUNTRIES = ['Trinidad and Tobago', 'Guyana', 'Suriname', 'Mexico', 'Colombia', 'USA'] as const
const EDO_COUNTRIES = ['El Dorado Offshore TT', 'El Dorado Offshore GY'] as const

function safeNum(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function sumBy(items: Array<{ country: string; headcount: number }>, countries: readonly string[]) {
  const map = new Map(items.map((i) => [i.country, safeNum(i.headcount)]))
  return countries.reduce((s, c) => s + (map.get(c) ?? 0), 0)
}

function pct(part: number, total: number) {
  if (!total) return '0'
  return ((part / total) * 100).toFixed(0)
}

definePageMeta({ layout: false })

const { data: analyticsData, pending: analyticsPending } = await useFetch<HomeAnalytics>('/api/odoo/analytics/home')
const analytics = computed(() => analyticsData.value ?? null)

const totalHeadcount = computed(() => (analytics.value?.headcountByCountry ?? []).reduce((a, i) => a + safeNum(i.headcount), 0))
const rampsCount = computed(() => sumBy(analytics.value?.headcountByCountry ?? [], RAMPS_COUNTRIES))
const edoCount = computed(() => sumBy(analytics.value?.headcountByCountry ?? [], EDO_COUNTRIES))
const consultants = computed(() => safeNum(analytics.value?.headcountEmploymentSubtotals?.consultants))
const independentContractors = computed(() => safeNum(analytics.value?.headcountEmploymentSubtotals?.independentContractors))

const overall = computed(() => analytics.value?.employmentTypeBreakdown?.overall ?? { permanent: 0, contracted: 0, interns: 0, total: 0 })

const byCountryMap = computed(() => {
  const map = new Map<string, { permanent: number; contracted: number; interns: number }>()
  for (const r of analytics.value?.employmentTypeBreakdown?.byCountry ?? []) {
    map.set(r.country, { permanent: safeNum(r.permanent), contracted: safeNum(r.contracted), interns: safeNum(r.interns) })
  }
  return map
})

const geoRows = computed(() => {
  const items = (analytics.value?.headcountByCountry ?? []).filter((i) => safeNum(i.headcount) > 0)
  items.sort((a, b) => safeNum(b.headcount) - safeNum(a.headcount))
  const total = totalHeadcount.value
  return items.map((i) => {
    const emp = byCountryMap.value.get(i.country)
    return {
      country: i.country,
      headcount: safeNum(i.headcount),
      pct: pct(safeNum(i.headcount), total),
      permanent: emp?.permanent ?? null,
      contracted: emp?.contracted ?? null,
      interns: emp?.interns ?? null
    }
  })
})

const insightBullets = computed(() => {
  const out: string[] = []
  const total = totalHeadcount.value
  if (total <= 0) return out

  const top = (analytics.value?.headcountByCountry ?? []).slice().sort((a, b) => safeNum(b.headcount) - safeNum(a.headcount))[0]
  if (top && safeNum(top.headcount) > 0) {
    const pctTop = Math.round((safeNum(top.headcount) / total) * 100)
    out.push(`${top.country} accounts for ${pctTop}% of total headcount (${safeNum(top.headcount)} of ${total}).`)
  }

  const ot = overall.value
  if (ot.total > 0) {
    const pctPerm = Math.round((safeNum(ot.permanent) / ot.total) * 100)
    out.push(`Permanent employees represent ${pctPerm}% of the workforce.`)
  }

  if (rampsCount.value + edoCount.value > 0) {
    out.push(`RAMPS accounts for ${rampsCount.value} employees; EDO Offshore accounts for ${edoCount.value}.`)
  }

  return out
})

const reportReady = computed(() => !analyticsPending.value)
</script>
