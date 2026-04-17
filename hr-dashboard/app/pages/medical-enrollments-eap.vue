<template>
  <div class="min-w-0 space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold">Medical Enrollments and Employee Assistance Program (EAP)</h1>
      <p class="text-slate-600">Medical enrollments and EAP referrals from Odoo (read-only).</p>
    </div>

    <hr />

    <MedicalEnrollmentsTable />

    <hr />

    <EapReferralsTable />
  </div>
</template>

<script setup lang="ts">
import MedicalEnrollmentsTable from '~/components/MedicalEnrollmentsTable.vue'
import EapReferralsTable from '~/components/EapReferralsTable.vue'
</script>

