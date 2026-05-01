<template>
  <div
    :class="[
      'surface-tint-card relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl shadow-card',
      dense ? 'p-2' : 'p-3'
    ]"
  >
    <span aria-hidden="true" :class="['absolute inset-x-0 top-0 h-[3px]', accentClass]" />
    <div class="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">{{ title }}</div>
    <div :class="['flex min-h-0 flex-1 items-center justify-center', dense ? 'mt-0.5' : 'mt-1.5']">
      <slot name="body" />
    </div>
    <div :class="['flex min-h-[1.25rem] flex-wrap items-center justify-between gap-2', dense ? 'mt-0.5 pt-0' : 'mt-1.5 pt-0.5']">
      <slot name="footer">
        <span class="invisible text-[0.6rem] select-none">—</span>
        <span class="invisible min-w-[7rem] text-[0.6rem] select-none">—</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ title: string; tone?: 'neutral' | 'blue' | 'purple' | 'yellow' | 'teal'; dense?: boolean }>(),
  { tone: 'neutral', dense: false }
)

const accentClass = computed(() => {
  if (props.tone === 'neutral') return 'bg-slate-300'
  if (props.tone === 'teal') return 'bg-teal-500'
  if (props.tone === 'purple') return 'bg-brand-purple'
  return 'bg-brand-gradient'
})
</script>
