<template>
  <div class="relative">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-md border border-purple-100 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 px-2.5 py-1.5 text-xs font-semibold text-hr-navy shadow-sm transition hover:brightness-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40 disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="generatingReport"
      @click="generateReport"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0 text-hr-navy">
        <path d="M12 2l1.4 5.1L18 8.5l-4.6 1.4L12 15l-1.4-5.1L6 8.5l4.6-1.4L12 2Z" fill="currentColor" />
        <path
          d="M19 13l.8 2.8L22 16.6l-2.2.8L19 20l-.8-2.6L16 16.6l2.2-.8L19 13Z"
          fill="currentColor"
          opacity="0.9"
        />
      </svg>
      <span class="whitespace-nowrap">{{ generatingReport ? 'Generating…' : 'Generate Report' }}</span>
    </button>

    <div v-if="reportError" class="mt-2 max-w-xs text-xs text-pink-700">{{ reportError }}</div>
  </div>
</template>

<script setup lang="ts">
const generatingReport = ref(false)
const reportError = ref('')

function ymdUtc() {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function generateReport() {
  if (!import.meta.client || generatingReport.value) return
  reportError.value = ''
  generatingReport.value = true
  try {
    const res = await fetch('/api/reports/complete', { method: 'GET' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Failed to generate report (${res.status})`)
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hr-dashboard-complete-report-${ymdUtc()}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    reportError.value = e instanceof Error ? e.message : 'Failed to generate report.'
  } finally {
    generatingReport.value = false
  }
}
</script>
