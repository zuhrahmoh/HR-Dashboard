<template>
  <div class="space-y-6 p-1" :data-report-ready="reportReady ? '1' : undefined">

    <div class="rpt-section-title">Section 3 — Recruitment &amp; Onboarding</div>

    <!-- 3.1 Critical Vacancies -->
    <div class="break-before-avoid">
      <div class="rpt-subsection-title" style="margin-top:0;">3.1 Critical Vacancies</div>

      <!-- Summary line -->
      <div class="mb-2 text-[12px] text-slate-600">
        Total vacancies: <strong>{{ vacancies.length }}</strong>
        <template v-if="highCount > 0"> · High priority: <strong>{{ highCount }}</strong></template>
        <template v-if="medLowCount > 0"> · Medium / Low: <strong>{{ medLowCount }}</strong></template>
      </div>

      <div v-if="vacancies.length === 0" class="rpt-empty">No critical vacancies currently tracked.</div>

      <div v-else class="space-y-3">
        <div v-for="[country, rows] in vacanciesByCountryEntries" :key="country" class="break-inside-avoid">
          <div class="rpt-country-heading">{{ country }} ({{ rows.length }})</div>
          <table class="rpt-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Department</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="v in rows" :key="v.id">
                <td class="font-medium">{{ v.positionTitle || '—' }}</td>
                <td>{{ v.department || '—' }}</td>
                <td>
                  <span class="rpt-badge" :style="priorityStyle(v.priority)">{{ formatPriority(v.priority) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 3.2 Candidates in Recruitment Pipeline -->
    <div :class="allCandidates.length > 0 ? 'break-before-page' : 'break-inside-avoid'">
      <div class="rpt-subsection-title" :style="allCandidates.length > 0 ? 'margin-top:0;' : ''">3.2 Candidates in Recruitment Pipeline</div>
      <div v-if="allCandidates.length === 0" class="rpt-empty">No candidates in recruitment pipeline.</div>
      <table v-else class="rpt-table">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Position</th>
            <th>Country</th>
            <th>Stage</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in allCandidates" :key="c.id">
            <td class="font-medium">{{ c.candidateName || '—' }}</td>
            <td>{{ c.position || '—' }}</td>
            <td>{{ c.country || '—' }}</td>
            <td>
              <span class="rpt-badge" :style="stageBadgeStyle(c.stage)">{{ normalizeStageLabel(c.stage) || '—' }}</span>
            </td>
            <td class="text-slate-500">{{ c.notes || '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 3.3 New Hires -->
    <div class="break-before-page">
      <div class="rpt-subsection-title" style="margin-top:0;">3.3 New Hires</div>
      <div class="mb-1.5 text-[11.5px] text-slate-500">{{ monthLabel }}</div>
      <div v-if="newHires.length === 0" class="rpt-empty">No new hires recorded for the selected month.</div>
      <div v-else class="space-y-3">
        <div v-for="[country, rows] in newHiresByCountryEntries" :key="country" class="break-inside-avoid">
          <div class="rpt-country-heading">{{ country }} ({{ rows.length }})</div>
          <table class="rpt-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Start Date</th>
                <th>Tenure</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.employeeKey">
                <td class="font-medium">{{ r.name }}</td>
                <td>{{ r.position || '—' }}</td>
                <td class="tabular-nums">{{ formatDate(r.startDate) }}</td>
                <td class="text-slate-500">{{ r.tenure || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 3.4 Offboarding -->
    <div>
      <div class="rpt-subsection-title">3.4 Offboarding</div>
      <div v-if="offboarding.length === 0" class="rpt-empty">No employees currently in offboarding.</div>
      <table v-else class="rpt-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Country</th>
            <th>Department</th>
            <th>Position</th>
            <th>Departure Reason</th>
            <th>Last Working Day</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in offboarding" :key="e.employeeKey">
            <td class="font-medium">{{ e.name }}</td>
            <td>{{ e.countryAssigned || '—' }}</td>
            <td>{{ e.department || '—' }}</td>
            <td>{{ e.position || '—' }}</td>
            <td>{{ e.departureReason || '—' }}</td>
            <td class="tabular-nums">{{ formatDate(e.lastWorkingDay) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 3.5 Recent Separations -->
    <div class="break-before-avoid">
      <div class="rpt-subsection-title">3.5 Recent Separations</div>
      <div class="mb-1.5 text-[11.5px] text-slate-500">{{ monthLabel }}</div>
      <div v-if="separations.length === 0" class="rpt-empty">No recent separations for the selected month.</div>
      <table v-else class="rpt-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Department</th>
            <th>Position</th>
            <th>Country</th>
            <th>Start Date</th>
            <th>Separation Date</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in separations" :key="r.employeeKey">
            <td class="font-medium">{{ r.name }}</td>
            <td>{{ r.department || '—' }}</td>
            <td>{{ r.position || '—' }}</td>
            <td>{{ r.countryAssigned || '—' }}</td>
            <td class="tabular-nums">{{ formatDate(r.startDate) }}</td>
            <td class="tabular-nums">{{ formatDate(r.separatedAt) }}</td>
            <td>
              <span class="rpt-badge" :style="sepTypeBadgeStyle(r.separationType)">{{ formatSepType(r.separationType) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
type Vacancy = { id: string; positionTitle: string; department: string; country: string; priority: string; createdAt: string }

type CriticalRecruitment = { id: string; candidateName: string; position: string; country: string; stage: string; notes?: string; createdAt: string }

type OdooNewHire = { employeeKey: string; name: string; position: string; department: string; countryAssigned: string; startDate: string | null; tenure?: string; createdAt: string | null }
type OdooNewHiresResponse = { currentMonth: string; months: string[]; items: OdooNewHire[] }

type OffboardingEmployee = { employeeKey: string; name: string; department: string; position: string; countryAssigned: string; departureReason?: string; lastWorkingDay?: string | null; employeeStatus: string }

type SeparationType = 'resigned' | 'retired' | 'fired' | 'vsep' | 'end_of_contract' | 'probation_failure' | 'retrenchment' | 'separated'
type SeparationRow = { employeeKey: string; name: string; department: string; position: string; countryAssigned: string; startDate: string | null; separatedAt: string; separationType: SeparationType }
type SeparationsResponse = { currentMonth: string; months: string[]; items: SeparationRow[] }

type HomeAnalytics = { additions: { currentMonth: string } }

function safeNum(v: unknown) { const n = typeof v === 'number' ? v : Number(v); return Number.isFinite(n) ? n : 0 }

function formatDate(val: string | null | undefined) {
  if (!val) return '—'
  const ymd = val.trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return val.trim().slice(0, 10) || '—'
  const [y, m, d] = ymd.split('-')
  try { return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-TT', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return ymd }
}

function normalizePriority(v: string) { return (v || '').trim().toLowerCase() }
function formatPriority(v: string) {
  const p = normalizePriority(v)
  if (p === 'high') return 'High'
  if (p === 'medium') return 'Medium'
  if (p === 'low') return 'Low'
  return (v || '').trim() || '—'
}
function priorityStyle(v: string) {
  const p = normalizePriority(v)
  if (p === 'high') return 'border-color:#F5B5C4;background:#FDF2F4;color:#6B1C2E;'
  if (p === 'medium') return 'border-color:#FFD591;background:#FFF7E6;color:#874D00;'
  if (p === 'low') return 'border-color:#C2EEE5;background:#E9F7F4;color:#00667E;'
  return ''
}

function normalizeStageLabel(v: string) {
  const t = (v || '').trim()
  if (!t) return ''
  const lv = t.toLowerCase()
  if (lv === 'pre-onboarding stage') return 'Pre-Onboarding Stage'
  if (lv === 'interview & evaluation stage') return 'Interview & Evaluation Stage'
  if (lv === 'offer stage') return 'Offer Stage'
  if (lv === 'feedback stage') return 'Feedback Stage'
  return t
}
function stageBadgeStyle(v: string) {
  const lv = normalizeStageLabel(v).toLowerCase()
  if (lv === 'pre-onboarding stage') return 'border-color:#6ee7b7;background:#ecfdf5;color:#065f46;'
  if (lv === 'offer stage') return 'border-color:#c4b5fd;background:#f5f3ff;color:#4c1d95;'
  if (lv === 'interview & evaluation stage') return 'border-color:#7dd3fc;background:#f0f9ff;color:#075985;'
  if (lv === 'feedback stage') return 'border-color:#fcd34d;background:#fffbeb;color:#78350f;'
  return ''
}

const TYPE_LABELS: Record<SeparationType, string> = {
  resigned: 'Resigned', retired: 'Retired', fired: 'Fired', vsep: 'VSEP',
  end_of_contract: 'End of Contract', probation_failure: 'Probation Failure',
  retrenchment: 'Retrenchment', separated: 'Separated'
}
function formatSepType(v: SeparationType) { return TYPE_LABELS[v] ?? 'Separated' }
function sepTypeBadgeStyle(v: SeparationType) {
  if (v === 'resigned') return 'border-color:#99f6e4;background:#f0fdfa;color:#0f766e;'
  if (v === 'retired') return 'border-color:#c4b5fd;background:#f5f3ff;color:#4c1d95;'
  if (v === 'fired') return 'border-color:#fbcfe8;background:#fdf2f8;color:#9d174d;'
  if (v === 'vsep') return 'border-color:#bfdbfe;background:#eff6ff;color:#1e40af;'
  if (v === 'end_of_contract') return 'border-color:#a5b4fc;background:#eef2ff;color:#3730a3;'
  if (v === 'probation_failure') return 'border-color:#fecaca;background:#fff1f2;color:#9f1239;'
  if (v === 'retrenchment') return 'border-color:#f0abfc;background:#fdf4ff;color:#6b21a8;'
  return 'border-color:#e2e8f0;background:#f8fafc;color:#475569;'
}

definePageMeta({ layout: false })

const route = useRoute()
const reportMonth = computed(() => (typeof route.query.reportMonth === 'string' ? route.query.reportMonth.trim() : ''))
const reportMonthKey = computed(() => (/^\d{4}-\d{2}$/.test(reportMonth.value) ? reportMonth.value : ''))

// All Odoo endpoints share an in-memory employees cache, so kicking them off in parallel lets the first
// caller warm the cache while the others wait on the same promise instead of running sequentially.
const [
  { data: analyticsData, pending: analyticsPending },
  { data: vacanciesData, pending: vacanciesPending },
  { data: candidatesData, pending: candidatesPending },
  { data: offboardingData, pending: offboardingPending }
] = await Promise.all([
  useFetch<HomeAnalytics>('/api/odoo/analytics/home'),
  useFetch<Vacancy[]>('/api/vacancies'),
  useFetch<CriticalRecruitment[]>('/api/critical-recruitment'),
  useFetch<OffboardingEmployee[]>('/api/odoo/offboarding')
])

const analytics = computed(() => analyticsData.value ?? null)
const monthKey = computed(() => reportMonthKey.value || analytics.value?.additions?.currentMonth || '')
const monthLabel = computed(() => {
  if (!monthKey.value) return '—'
  const [y, m] = monthKey.value.split('-')
  try { return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-TT', { month: 'long', year: 'numeric' }) }
  catch { return monthKey.value }
})

const [
  { data: newHiresData, pending: newHiresPending },
  { data: separationsData, pending: separationsPending }
] = await Promise.all([
  useFetch<OdooNewHiresResponse>('/api/odoo/new-hires', { query: { month: monthKey.value || undefined } }),
  useFetch<SeparationsResponse>('/api/odoo/separations', { query: { month: monthKey.value || undefined } })
])

const vacancies = computed(() => (vacanciesData.value ?? []).slice().sort((a, b) => {
  const pr = (v: string) => { const p = normalizePriority(v); return p === 'high' ? 0 : p === 'medium' ? 1 : 2 }
  return pr(a.priority) - pr(b.priority) || (a.positionTitle ?? '').localeCompare(b.positionTitle ?? '')
}))
const highCount = computed(() => vacancies.value.filter((v) => normalizePriority(v.priority) === 'high').length)
const medLowCount = computed(() => vacancies.value.length - highCount.value)

const vacanciesByCountry = computed(() => {
  const map = new Map<string, Vacancy[]>()
  for (const v of vacancies.value) {
    const c = (v.country || '—').trim() || '—'
    const arr = map.get(c) ?? []
    arr.push(v)
    map.set(c, arr)
  }
  return map
})
const vacanciesByCountryEntries = computed(() => Array.from(vacanciesByCountry.value.entries()).sort((a, b) => a[0].localeCompare(b[0])))

const allCandidates = computed(() => (candidatesData.value ?? []).slice().sort((a, b) => (a.country ?? '').localeCompare(b.country ?? '') || (a.candidateName ?? '').localeCompare(b.candidateName ?? '')))

const newHires = computed(() => newHiresData.value?.items ?? [])
const newHiresByCountry = computed(() => {
  const map = new Map<string, OdooNewHire[]>()
  for (const r of newHires.value) {
    const c = (r.countryAssigned || '—').trim() || '—'
    const arr = map.get(c) ?? []
    arr.push(r)
    map.set(c, arr)
  }
  for (const [k, arr] of map.entries()) {
    arr.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
    map.set(k, arr)
  }
  return map
})
const newHiresByCountryEntries = computed(() => Array.from(newHiresByCountry.value.entries()).sort((a, b) => a[0].localeCompare(b[0])))

const offboarding = computed(() => (offboardingData.value ?? []).slice().sort((a, b) => (a.countryAssigned ?? '').localeCompare(b.countryAssigned ?? '') || a.name.localeCompare(b.name)))
const separations = computed(() => (separationsData.value?.items ?? []).slice().sort((a, b) => (a.countryAssigned ?? '').localeCompare(b.countryAssigned ?? '') || a.name.localeCompare(b.name)))

const reportReady = computed(() =>
  !analyticsPending.value && !vacanciesPending.value && !candidatesPending.value && !newHiresPending.value && !offboardingPending.value && !separationsPending.value
)
</script>
