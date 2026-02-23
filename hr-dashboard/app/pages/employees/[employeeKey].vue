<template>
  <div class="rounded-md border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200">Redirecting…</div>
</template>

<script setup lang="ts">
const route = useRoute()
const employeeKey = String(route.params.employeeKey || '').trim()
const target = employeeKey ? `/odoo/employees/${encodeURIComponent(employeeKey)}` : '/odoo/employees'
await navigateTo(target, { redirectCode: 301 })
</script>

