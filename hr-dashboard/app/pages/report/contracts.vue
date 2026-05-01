<template>
  <div class="space-y-6 p-1" :data-report-ready="reportReady ? '1' : undefined">

    <div class="rpt-section-title">Section 4 — Contract Management</div>

    <!-- Insight bullets -->
    <ul v-if="insightBullets.length > 0" class="rpt-bullets">
      <li v-for="b in insightBullets" :key="b">{{ b }}</li>
    </ul>

    <!-- 4.0 Contract Risk Summary -->
    <div class="break-inside-avoid">
      <div class="rpt-subsection-title" style="margin-top:0;">4.0 Contract Risk Summary</div>

      <div class="grid grid-cols-4 gap-2">
        <div class="rpt-metric-block">
          <div class="rpt-metric-label">Total Pending Actions</div>
          <div class="rpt-metric-value" :style="pendingTotal > 0 ? 'color:#b91c1c;' : ''">{{ pendingTotal }}</div>
          <div class="rpt-metric-note">Overdue contract &amp; probation items</div>
        </div>
        <div class="rpt-metric-block">
          <div class="rpt-metric-label">Expired Contracts</div>
          <div class="rpt-metric-value">{{ expiredContracts.length }}</div>
          <div class="rpt-metric-note">Contract end date past today</div>
        </div>
        <div class="rpt-metric-block">
          <div class="rpt-metric-label">Past Probations</div>
          <div class="rpt-metric-value">{{ expiredProbations.length }}</div>
          <div class="rpt-metric-note">Probation date past today</div>
        </div>
        <div class="rpt-metric-block">
          <div class="rpt-metric-label">Awaiting Approval</div>
          <div class="rpt-metric-value">{{ awaitingApprovalCount }}</div>
          <div class="rpt-metric-note">Contract changes</div>
        </div>
      </div>

      <div v-if="topRiskCountries.length > 0" class="mt-3">
        <div class="text-[11px] font-semibold uppercase tracking-wide text-slate-500" style="margin-bottom:4px;">Top Risk Countries</div>
        <table class="rpt-table">
          <thead>
            <tr>
              <th>Country</th>
              <th class="text-right">Pending Items</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in topRiskCountries" :key="r.country">
              <td class="font-medium">{{ r.country }}</td>
              <td class="text-right tabular-nums">{{ r.count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 4.1 Contract Changes -->
    <div>
      <div class="rpt-subsection-title" style="margin-top:0;">4.1 Contract Changes</div>
      <div v-if="contractChanges.length === 0" class="rpt-empty">No contract changes awaiting review.</div>
      <table v-else class="rpt-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Country</th>
            <th>Department</th>
            <th>Position</th>
            <th>Change Type</th>
            <th>Status</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in contractChanges" :key="r.id">
            <td class="font-medium">{{ r.employeeName }}</td>
            <td>{{ r.country || '—' }}</td>
            <td>{{ r.department || '—' }}</td>
            <td>{{ r.position || '—' }}</td>
            <td>{{ (r.changeTypes ?? []).join(', ') || '—' }}</td>
            <td>{{ r.status || '—' }}</td>
            <td class="text-slate-500">{{ r.description || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 4.2 Expired Contracts -->
    <div class="break-before-page">
      <div class="rpt-subsection-title" style="margin-top:0;">4.2 Expired Contracts</div>
      <div class="mb-1.5 text-[11.5px] text-slate-500">Contract end date is past today and action has not been completed.</div>
      <div v-if="expiredContracts.length === 0" class="rpt-empty">No expired contracts requiring action.</div>
      <div v-else class="space-y-3">
        <div v-for="[country, rows] in expiredContractsByCountry" :key="country" class="break-inside-avoid">
          <div class="rpt-country-heading">{{ country }} ({{ rows.length }})</div>
          <table class="rpt-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Reporting To</th>
                <th>End Date</th>
                <th class="text-right">Time Overdue</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.key">
                <td class="font-medium">{{ r.name }}</td>
                <td>{{ r.department || '—' }}</td>
                <td>{{ r.position || '—' }}</td>
                <td>{{ r.reportingTo || '—' }}</td>
                <td class="tabular-nums">{{ formatDate(r.contractOrProbationEndDate) }}</td>
                <td class="text-right tabular-nums font-semibold" style="color:#b91c1c;">{{ overdueLabel(r.daysRemaining) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 4.3 Past Probations -->
    <div>
      <div class="rpt-subsection-title">4.3 Past Probations</div>
      <div class="mb-1.5 text-[11.5px] text-slate-500">Probation end date is past today and review has not been actioned.</div>
      <div v-if="expiredProbations.length === 0" class="rpt-empty">No past probation dates requiring action.</div>
      <div v-else class="space-y-3">
        <div v-for="[country, rows] in expiredProbationsByCountry" :key="country" class="break-inside-avoid">
          <div class="rpt-country-heading">{{ country }} ({{ rows.length }})</div>
          <table class="rpt-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Reporting To</th>
                <th>Probation End Date</th>
                <th class="text-right">Time Overdue</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.key">
                <td class="font-medium">{{ r.name }}</td>
                <td>{{ r.department || '—' }}</td>
                <td>{{ r.position || '—' }}</td>
                <td>{{ r.reportingTo || '—' }}</td>
                <td class="tabular-nums">{{ formatDate(r.contractOrProbationEndDate) }}</td>
                <td class="text-right tabular-nums font-semibold" style="color:#b91c1c;">{{ overdueLabel(r.daysRemaining) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 4.4 Pending Actions Summary -->
    <div class="break-inside-avoid">
      <div class="rpt-subsection-title">4.4 Pending Actions</div>

      <!-- Summary counts -->
      <div class="grid grid-cols-3 gap-2 mb-3">
        <div class="rpt-metric-block">
          <div class="rpt-metric-label">Total Pending</div>
          <div class="rpt-metric-value" :style="pendingTotal > 0 ? 'color:#b91c1c;' : ''">{{ pendingTotal }}</div>
          <div class="rpt-metric-note">Overdue items</div>
        </div>
        <div class="rpt-metric-block">
          <div class="rpt-metric-label">Contract Items</div>
          <div class="rpt-metric-value">{{ expiredContracts.length }}</div>
          <div class="rpt-metric-note">Expired contracts</div>
        </div>
        <div class="rpt-metric-block">
          <div class="rpt-metric-label">Probation Items</div>
          <div class="rpt-metric-value">{{ expiredProbations.length }}</div>
          <div class="rpt-metric-note">Past probations</div>
        </div>
      </div>

      <div v-if="pendingTotal === 0" class="rpt-empty">No overdue contract or probation items.</div>
      <table v-else class="rpt-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Employee</th>
            <th>Country</th>
            <th>Department</th>
            <th>End Date</th>
            <th class="text-right">Time Overdue</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in pendingActionRows" :key="`${r.type}__${r.key}`">
            <td class="text-slate-600">{{ r.type }}</td>
            <td class="font-medium">{{ r.name }}</td>
            <td>{{ r.countryAssigned || '—' }}</td>
            <td>{{ r.department || '—' }}</td>
            <td class="tabular-nums">{{ formatDate(r.contractOrProbationEndDate) }}</td>
            <td class="text-right tabular-nums font-semibold" style="color:#b91c1c;">{{ overdueLabel(r.daysRemaining) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
type ContractChange = {
  id: string
  employeeName: string
  country?: string
  department: string
  position: string
  changeTypes: string[]
  status?: string
  description: string
  createdAt: string
}

type ContractExpiryRow = {
  employeeKey?: string
  name: string
  department: string
  position: string
  reportingTo: string
  countryAssigned: string
  contractOrProbationEndDate: string
  daysRemaining: number
}

type HomeAnalytics = {
  upcomingContractExpiries?: ContractExpiryRow[]
  upcomingProbations?: ContractExpiryRow[]
}

function formatDate(val: string | null | undefined) {
  if (!val) return '—'
  const ymd = val.trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd || '—'
  const [y, m, d] = ymd.split('-')
  try { return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-TT', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return ymd }
}

function overdueLabel(daysRemaining: number) {
  const d = Math.abs(daysRemaining)
  const w = Math.ceil(d / 7)
  return `${d}d (${w}w)`
}

function toRow(i: ContractExpiryRow) {
  return { ...i, key: `${i.employeeKey ?? ''}__${i.name}__${i.contractOrProbationEndDate}` }
}

function groupByCountry<T extends { countryAssigned: string }>(items: T[]) {
  const map = new Map<string, T[]>()
  for (const r of items) {
    const c = (r.countryAssigned || '—').trim() || '—'
    const arr = map.get(c) ?? []
    arr.push(r)
    map.set(c, arr)
  }
  const entries = Array.from(map.entries())
  entries.sort((a, b) => a[0].localeCompare(b[0]))
  return entries
}

function isAwaitingApprovalStatus(value: string) {
  const v = (value ?? '').trim().toLowerCase()
  if (!v) return false
  if (v.includes('unapproved') || v.includes('not approved') || v.includes('rejected')) return false
  if (v.includes('hold')) return false
  if (
    (v.includes('approved') || v.includes('complete')) &&
    !v.includes('approval required') &&
    !v.includes('pending') &&
    !v.includes('await')
  ) return false
  return (
    v.includes('approval') ||
    v.includes('required') ||
    v.includes('pending') ||
    v.includes('await') ||
    v.includes('review')
  )
}

definePageMeta({ layout: false })

const [
  { data: contractChangesData, pending: changesPending },
  { data: analyticsData, pending: analyticsPending }
] = await Promise.all([
  useFetch<ContractChange[]>('/api/odoo/contract-changes'),
  useFetch<HomeAnalytics>('/api/odoo/analytics/home', { query: { upcomingDays: '365' } })
])

const contractChanges = computed(() => (contractChangesData.value ?? []).slice().sort((a, b) => (a.country ?? '').localeCompare(b.country ?? '') || a.employeeName.localeCompare(b.employeeName)))

const expiredContracts = computed(() =>
  (analyticsData.value?.upcomingContractExpiries ?? [])
    .filter((r) => r.daysRemaining < 0)
    .map(toRow)
    .sort((a, b) => a.daysRemaining - b.daysRemaining || a.name.localeCompare(b.name))
)

const expiredProbations = computed(() =>
  (analyticsData.value?.upcomingProbations ?? [])
    .filter((r) => r.daysRemaining < 0)
    .map(toRow)
    .sort((a, b) => a.daysRemaining - b.daysRemaining || a.name.localeCompare(b.name))
)

const expiredContractsByCountry = computed(() => groupByCountry(expiredContracts.value))
const expiredProbationsByCountry = computed(() => groupByCountry(expiredProbations.value))

const pendingTotal = computed(() => expiredContracts.value.length + expiredProbations.value.length)

const pendingActionRows = computed(() => {
  const rows = [
    ...expiredContracts.value.map((r) => ({ ...r, type: 'Contract' as const })),
    ...expiredProbations.value.map((r) => ({ ...r, type: 'Probation' as const }))
  ]
  rows.sort((a, b) => a.daysRemaining - b.daysRemaining || a.name.localeCompare(b.name))
  return rows
})

const awaitingApprovalCount = computed(
  () => contractChanges.value.filter((r) => isAwaitingApprovalStatus(r.status ?? '')).length
)

const topRiskCountries = computed(() => {
  const tally = new Map<string, number>()
  for (const r of expiredContracts.value) {
    const c = (r.countryAssigned || '—').trim() || '—'
    tally.set(c, (tally.get(c) ?? 0) + 1)
  }
  for (const r of expiredProbations.value) {
    const c = (r.countryAssigned || '—').trim() || '—'
    tally.set(c, (tally.get(c) ?? 0) + 1)
  }
  return Array.from(tally.entries())
    .map(([country, count]) => ({ country, count }))
    .filter((r) => r.count > 0 && r.country !== '—')
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country))
    .slice(0, 5)
})

const insightBullets = computed(() => {
  const out: string[] = []
  out.push(`Total pending contract / probation actions: ${pendingTotal.value}.`)
  if (expiredContracts.value.length > 0) {
    out.push(`Expired contracts account for ${expiredContracts.value.length} pending ${expiredContracts.value.length === 1 ? 'item' : 'items'}.`)
  }
  if (expiredProbations.value.length > 0) {
    out.push(`Past probations account for ${expiredProbations.value.length} pending ${expiredProbations.value.length === 1 ? 'item' : 'items'}.`)
  }
  const top = topRiskCountries.value[0]
  if (top) {
    out.push(`Top risk country: ${top.country} (${top.count} pending ${top.count === 1 ? 'item' : 'items'}).`)
  }
  return out
})

const reportReady = computed(() => !changesPending.value && !analyticsPending.value)
</script>
