<template>
  <div class="min-w-0 space-y-6">
    <div class="space-y-3">
      <div class="space-y-1">
        <h1 class="text-gradient-brand text-3xl font-extrabold tracking-tight">Medical Enrollments and Employee Assistance Program (EAP)</h1>
        <p class="text-slate-600">Medical enrollments from Odoo (read-only). EAP referrals tracked manually in this app.</p>
      </div>
    </div>

    <nav
      class="surface-tint-nav sticky top-[3.25rem] z-20 -mx-1 flex flex-wrap items-center gap-x-1 gap-y-1 rounded-md px-1.5 pt-1 pb-1.5 backdrop-blur-sm"
      aria-label="Medical and EAP sections"
    >
      <span class="shrink-0 pr-0.5 text-[10px] font-semibold tracking-wide text-brand-blue">JUMP TO:</span>
      <template v-for="(item, i) in medicalEapSectionNavItems" :key="item.id">
        <span
          v-if="i > 0"
          class="px-1 text-[11px] font-light text-hr-navy/35 select-none"
          aria-hidden="true"
        >|</span>
        <button
          type="button"
          class="rounded-md px-3 py-2 text-xs font-medium text-hr-navy transition hover:bg-purple-100/60 hover:text-brand-purple"
          @click="navigateMedicalEapSection(item.id)"
        >
          {{ item.label }}
        </button>
      </template>
      <button
        v-if="showMedicalEapBackToTop"
        type="button"
        class="ml-auto inline-flex items-center gap-1.5 rounded-md border border-brand-blue bg-brand-blue/10 px-3 py-1.5 text-xs font-semibold text-brand-blue shadow-sm transition hover:bg-brand-blue/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
        @click="scrollMedicalEapToTop"
      >
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M10 16V4M5 9l5-5 5 5" />
        </svg>
        <span>Back to top</span>
      </button>
    </nav>

    <MedicalEnrollmentsTable />

    <EapReferralsTable />
  </div>
</template>

<script setup lang="ts">
import MedicalEnrollmentsTable from '~/components/MedicalEnrollmentsTable.vue'
import EapReferralsTable from '~/components/EapReferralsTable.vue'

const medicalEapSectionNavItems = [
  { id: 'medical-enrollments', label: 'Medical Enrollments' },
  { id: 'eap-referrals', label: 'Employee Assistance Program Referrals' }
] as const

function scrollToMedicalEapSection(id: string) {
  if (!import.meta.client) return
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const showMedicalEapBackToTop = ref(false)

function navigateMedicalEapSection(id: string) {
  showMedicalEapBackToTop.value = true
  scrollToMedicalEapSection(id)
}

function scrollMedicalEapToTop() {
  if (!import.meta.client) return
  window.scrollTo({ top: 0, behavior: 'smooth' })
  showMedicalEapBackToTop.value = false
}
</script>

