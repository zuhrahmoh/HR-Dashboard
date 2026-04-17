<template>
  <div
    :class="[
      'flex h-full min-h-0 w-full min-w-0 flex-col rounded-md border p-2 shadow-md shadow-slate-900/[0.08]',
      tone === 'blue' && 'border-blue-300 bg-blue-50/75',
      tone === 'purple' && 'border-purple-300 bg-purple-50/75',
      tone !== 'blue' && tone !== 'purple' && 'border-slate-300 bg-white'
    ]"
  >
    <div class="text-center text-xs font-semibold text-hr-navy">{{ title }}</div>
    <div class="mt-2 flex min-h-0 flex-1 items-center justify-center">
      <slot name="body" />
    </div>
    <div class="mt-2 flex min-h-[1.25rem] flex-wrap items-center justify-between gap-2 pt-0.5">
      <slot name="footer">
        <span class="invisible text-[0.6rem] select-none">—</span>
        <span class="invisible min-w-[7rem] text-[0.6rem] select-none">—</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string; tone?: 'neutral' | 'blue' | 'purple' }>(), {
  tone: 'neutral'
})
</script>
