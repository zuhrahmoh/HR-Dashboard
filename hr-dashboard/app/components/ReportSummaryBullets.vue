<template>
  <ul class="space-y-2 text-sm text-slate-700">
    <li v-for="(item, idx) in items" :key="idx" class="flex gap-2">
      <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
      <span class="min-w-0">{{ item }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{
  items: string[]
}>()
</script>

