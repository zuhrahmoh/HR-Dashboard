<template>
  <div
    :class="[
      'flex h-full min-h-0 w-full min-w-0 flex-col rounded-md border shadow-md shadow-slate-900/[0.08]',
      tone === 'red' && 'border-red-300 bg-red-50/75',
      tone === 'green' && 'border-emerald-300 bg-emerald-50/75',
      tone !== 'red' && tone !== 'green' && 'border-slate-300 bg-white',
      compact ? 'p-2' : 'p-5'
    ]"
  >
    <div :class="['text-center font-semibold text-hr-navy', compact ? 'text-xs' : 'text-sm']">{{ title }}</div>
    <div
      :class="[
        'flex min-h-0 flex-1 items-center justify-center',
        compact ? 'mt-2 gap-2' : 'mt-5 gap-6'
      ]"
    >
      <div :class="['shrink-0', iconToneClass]" aria-hidden="true">
        <slot name="icon" />
      </div>
      <div
        :class="[
          'font-bold tabular-nums tracking-tight text-hr-navy',
          compact ? 'text-xl' : 'text-4xl'
        ]"
      >
        {{ displayCount }}
      </div>
    </div>
    <div
      :class="[
        'flex min-h-0 flex-wrap items-center justify-between gap-2',
        compact ? 'mt-2' : 'mt-6'
      ]"
    >
      <select
        v-model="modelValue"
        :class="[
          'shrink-0 rounded-md border border-slate-300 bg-white font-medium text-slate-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30',
          compact ? 'h-6 min-w-[6rem] px-1 text-xs' : 'h-8 min-w-[8rem] px-1.5 text-xs'
        ]"
      >
        <option v-for="m in monthOptions" :key="m" :value="m">{{ formatMonth(m) }}</option>
      </select>
      <div class="flex min-w-0 shrink-0 justify-end">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const modelValue = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    title: string
    monthOptions: string[]
    displayCount: number
    compact?: boolean
    tone?: 'neutral' | 'red' | 'green'
  }>(),
  { compact: false, tone: 'neutral' }
)

const iconToneClass = computed(() => {
  if (props.tone === 'red') return 'text-red-700'
  if (props.tone === 'green') return 'text-emerald-700'
  return 'text-blue-800'
})

function formatMonth(monthKey: string) {
  const m = /^(\d{4})-(\d{2})$/.exec((monthKey ?? '').trim())
  if (!m) return monthKey
  const y = Number(m[1])
  const mo = Number(m[2])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return monthKey
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}
</script>
