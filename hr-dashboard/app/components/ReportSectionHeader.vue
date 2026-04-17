<template>
  <div class="flex items-end justify-between gap-4">
    <div class="min-w-0 space-y-1">
      <h2 class="text-lg font-semibold text-hr-navy">{{ title }}</h2>
      <p v-if="subtitle" class="text-sm text-slate-600">{{ subtitle }}</p>
    </div>
    <div v-if="badge" class="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
      {{ badge }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  badge?: string
}>()
</script>

