<template>
  <div data-report-ready="1" style="min-height:1050px;background:#fff;font-family:Arial,Helvetica,sans-serif;display:flex;flex-direction:column;">
    <!-- Top accent bar -->
    <div style="height:5px;background:linear-gradient(90deg,#0d1b3e 55%,#ec4899 100%);" />

    <!-- Main content -->
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:64px 80px 40px;">
      <img src="/Ramps-Logo-Colored.png" alt="Ramps Logistics" style="height:44px;object-fit:contain;object-position:left;margin-bottom:52px;" />

      <div style="border-left:4px solid #0d1b3e;padding-left:20px;margin-bottom:44px;">
        <h1 style="font-size:30px;font-weight:800;color:#0d1b3e;margin:0 0 8px 0;line-height:1.2;">
          HR Workforce &amp; Operations Report
        </h1>
        <p style="font-size:13px;color:#64748b;margin:0;">Dashboard-generated HR report</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:56px;">
        <div style="font-size:12px;color:#334155;">
          <strong>Generated:</strong> {{ generatedAt }}
        </div>
        <div v-if="reportPeriod" style="font-size:12px;color:#334155;">
          <strong>Reporting period:</strong> {{ reportPeriod }}
        </div>
        <div style="font-size:11px;color:#94a3b8;margin-top:6px;">
          Data sourced from Odoo/Laser HR dashboard modules and dashboard-managed records.
        </div>
      </div>

      <!-- Section index -->
      <div style="border:1px solid #e2e8f0;padding:16px 20px;max-width:380px;">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:10px;">Contents</div>
        <ol style="margin:0;padding-left:16px;list-style:decimal;display:flex;flex-direction:column;gap:5px;">
          <li style="font-size:11px;color:#334155;">Executive Summary</li>
          <li style="font-size:11px;color:#334155;">Workforce Snapshot</li>
          <li style="font-size:11px;color:#334155;">Cost Overview</li>
          <li style="font-size:11px;color:#334155;">Recruitment &amp; Onboarding</li>
          <li style="font-size:11px;color:#334155;">Contract Management</li>
          <li style="font-size:11px;color:#334155;">Progressive Discipline</li>
        </ol>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #e2e8f0;padding:16px 80px;">
      <div style="font-size:10px;font-style:italic;color:#94a3b8;">
        Confidential — For internal HR and management use only.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const reportMonth = computed(() => (typeof route.query.reportMonth === 'string' ? route.query.reportMonth.trim() : ''))

const generatedAt = computed(() => {
  return new Date().toLocaleString('en-TT', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })
})

const reportPeriod = computed(() => {
  if (!reportMonth.value || !/^\d{4}-\d{2}$/.test(reportMonth.value)) return ''
  const [year, month] = reportMonth.value.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleString('en-TT', { month: 'long', year: 'numeric' })
})
</script>
