<template>
  <div class="space-y-5 p-1" :data-report-ready="reportReady ? '1' : undefined">

    <div class="rpt-section-title">Section 5 — Progressive Discipline</div>

    <!-- 5.1 Process Summary -->
    <div class="break-inside-avoid">
      <div class="rpt-subsection-title" style="margin-top:0;">5.1 Process Summary</div>
      <p class="mb-2 text-[12.5px] text-slate-600">Progressive discipline follows a 3-stage process:</p>
      <ol class="list-decimal space-y-1 pl-5">
        <li class="text-[12.5px] text-slate-700">Investigation and matter acknowledgement</li>
        <li class="text-[12.5px] text-slate-700">Disciplinary review and recommendation</li>
        <li class="text-[12.5px] text-slate-700">Final outcome and resolution</li>
      </ol>
    </div>

    <!-- 5.2 Selected Cases -->
    <div>
      <div class="rpt-subsection-title">5.2 Selected Cases</div>
      <div class="mb-1.5 text-[11.5px] text-slate-500">
        Only cases marked "Include in Report" are shown below.
        <template v-if="includedCases.length > 0"> Total selected: <strong>{{ includedCases.length }}</strong>.</template>
      </div>

      <div v-if="includedCases.length === 0" class="rpt-empty">
        No progressive discipline cases were selected for inclusion in this report.
      </div>
      <table v-else class="rpt-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Country</th>
            <th>Summary</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in casesForDisplay" :key="c.id">
            <td class="font-medium">{{ c.employeeName || '—' }}</td>
            <td>{{ c.country || '—' }}</td>
            <td class="text-slate-600" style="max-width:220px;">{{ c.summary || '—' }}</td>
            <td>
              <span class="rpt-badge" :style="statusBadgeStyle(c.status)">{{ c.status || '—' }}</span>
            </td>
            <td class="tabular-nums text-slate-500">{{ formatDate(c.createdAt) }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="includedCases.length > casesForDisplay.length" class="mt-2 text-[11.5px] text-slate-400">
        Showing {{ casesForDisplay.length }} of {{ includedCases.length }} selected cases.
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
type DisciplinaryCase = {
  id: string
  employeeName: string
  department?: string
  country?: string
  summary: string
  status: string
  includeInReport: boolean
  createdAt: string
}

const REPORT_TOP_CASES = 20

function formatDate(val: string | null | undefined) {
  if (!val) return '—'
  const s = (val || '').trim()
  const ymd = s.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd || '—'
  const [y, m, d] = ymd.split('-')
  try { return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-TT', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return ymd }
}

function normalizeCountry(v: string) {
  const s = (v || '').trim().toLowerCase()
  if (!s) return ''
  if (s === 'trinidad and tobago' || s === 'trinidad & tobago' || s === 'trinidad') return 'trinidad and tobago'
  if (s === 'guyana' || s === 'guy') return 'guyana'
  return s
}

function countryRank(v: string) {
  const n = normalizeCountry(v)
  if (n === 'trinidad and tobago') return 0
  if (n === 'guyana') return 1
  return 2
}

function statusBadgeStyle(v: string) {
  const s = (v || '').trim().toLowerCase()
  if (s === 'investigation') return 'border-color:#7dd3fc;background:#f0f9ff;color:#075985;'
  if (s === 'disciplinary meeting') return 'border-color:#fcd34d;background:#fffbeb;color:#78350f;'
  if (s === 'conciliation') return 'border-color:#93c5fd;background:#eff6ff;color:#1e40af;'
  if (s === 'outcome to be communicated') return 'border-color:#a5b4fc;background:#eef2ff;color:#3730a3;'
  if (s === 'finalize outcome') return 'border-color:#c4b5fd;background:#f5f3ff;color:#4c1d95;'
  return ''
}

definePageMeta({ layout: false })

const { data, pending } = await useFetch<DisciplinaryCase[]>('/api/odoo/disciplinary-cases')
const cases = computed(() => data.value ?? [])
const includedCases = computed(() =>
  cases.value
    .filter((c) => !!c.includeInReport)
    .slice()
    .sort((a, b) => countryRank(a.country ?? '') - countryRank(b.country ?? '') || b.createdAt.localeCompare(a.createdAt) || a.employeeName.localeCompare(b.employeeName))
)
const casesForDisplay = computed(() => includedCases.value.slice(0, REPORT_TOP_CASES))

const reportReady = computed(() => !pending.value)
</script>
