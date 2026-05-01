<template>
  <div
    :class="[
      'surface-tint-card relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl shadow-card',
      dense ? 'p-2' : compact ? 'p-3' : 'p-5'
    ]"
  >
    <span aria-hidden="true" :class="['absolute inset-x-0 top-0 h-[3px]', accentClass]" />
    <div class="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {{ title }}
    </div>
    <div
      :class="[
        'flex min-h-0 flex-1 items-center justify-center',
        dense ? 'mt-0.5 gap-1.5' : compact ? 'mt-1.5 gap-2.5' : 'mt-4 gap-6'
      ]"
    >
      <div
        :class="[
          'grid shrink-0 place-items-center rounded-full',
          iconBadgeClass,
          dense
            ? 'h-8 w-8 [&_svg]:h-5 [&_svg]:w-5'
            : compact
              ? 'h-9 w-9 [&_svg]:h-[1.125rem] [&_svg]:w-[1.125rem]'
              : 'h-12 w-12 [&_svg]:h-6 [&_svg]:w-6'
        ]"
        aria-hidden="true"
      >
        <slot name="icon" />
      </div>
      <div
        :class="[
          'font-extrabold tabular-nums tracking-tight',
          valueColorClass,
          dense || compact ? 'text-2xl' : 'text-4xl'
        ]"
      >
        {{ displayCount }}
      </div>
    </div>
    <div
      :class="[
        'flex min-h-0 flex-wrap items-center justify-between gap-2',
        dense ? 'mt-1' : compact ? 'mt-2' : 'mt-5'
      ]"
    >
      <select
        v-model="modelValue"
        :class="[
          'shrink-0 rounded-md border font-medium outline-none transition focus:ring-1',
          tone === 'red' &&
            'border-pink-200 bg-pink-50/80 text-pink-900 focus:border-pink-400 focus:ring-pink-400/30',
          tone === 'green' &&
            'border-teal-200 bg-teal-50/80 text-teal-900 focus:border-teal-400 focus:ring-teal-400/30',
          tone !== 'red' && tone !== 'green' &&
            'border-slate-200 bg-white text-slate-800 focus:border-slate-400 focus:ring-slate-400/30',
          dense ? 'h-6 min-w-[6rem] px-1.5 text-[11px]' : compact ? 'h-6 min-w-[6rem] px-1.5 text-xs' : 'h-8 min-w-[8rem] px-2 text-xs'
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
    dense?: boolean
  }>(),
  { compact: false, tone: 'neutral', dense: false }
)

const iconBadgeClass = computed(() => {
  if (props.tone === 'red') return 'bg-pink-50 text-pink-600 ring-1 ring-inset ring-pink-100'
  if (props.tone === 'green') return 'bg-teal-50 text-teal-600 ring-1 ring-inset ring-teal-100'
  return 'bg-purple-50 text-brand-purple ring-1 ring-inset ring-purple-100'
})

const accentClass = computed(() => {
  if (props.tone === 'red') return 'bg-pink-500'
  if (props.tone === 'green') return 'bg-teal-500'
  return 'bg-slate-300'
})

const valueColorClass = computed(() => {
  if (props.tone === 'red') return 'text-pink-600'
  if (props.tone === 'green') return 'text-teal-600'
  return 'text-hr-navy'
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
