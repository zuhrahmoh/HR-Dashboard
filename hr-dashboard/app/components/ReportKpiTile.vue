<template>
  <section class="rounded-lg border border-slate-200 bg-white p-4">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ label }}</div>
        <div class="mt-2 text-3xl font-semibold tabular-nums text-slate-900">{{ value }}</div>
        <div v-if="subtitle" class="mt-1 text-sm text-slate-600">{{ subtitle }}</div>
        <div v-if="insight" class="mt-2 text-sm text-slate-700">{{ insight }}</div>
      </div>
      <div v-if="accent" class="h-10 w-1 shrink-0 rounded-full" :style="{ backgroundColor: accent }" />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  subtitle?: string
  insight?: string
  accent?: string
}>()
</script>

