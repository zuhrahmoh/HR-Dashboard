<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold">Medical Enrollments and Employee Assistance Program (EAP)</h1>
      <p class="text-slate-300">Track medical enrollments and EAP referrals.</p>
    </div>

    <hr class="border-slate-800" />

    <MedicalEnrollmentsTable />

    <hr class="border-slate-800" />

    <EapReferralsTable />
  </div>
</template>

<script setup lang="ts">
import MedicalEnrollmentsTable from '~/components/MedicalEnrollmentsTable.vue'
import EapReferralsTable from '~/components/EapReferralsTable.vue'
</script>

