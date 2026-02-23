<template>
  <div class="rounded-md border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">Redirecting…</div>
</template>

<script setup lang="ts">
await navigateTo('/odoo/employees', { redirectCode: 301 })
</script>

