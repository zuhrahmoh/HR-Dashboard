<template>
  <div class="flex flex-wrap items-center gap-6">
    <div class="relative mt-6 h-40 w-40">
      <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(30 41 59)" stroke-width="10" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="rgb(244 63 94)"
          stroke-width="10"
          stroke-linecap="round"
          :stroke-dasharray="dashArray"
          stroke-dashoffset="0"
        />
      </svg>

      <div class="absolute inset-0 grid place-items-center text-center">
        <div class="text-sm text-slate-300">Resigned</div>
        <div class="text-3xl font-semibold tabular-nums">{{ resigned }}</div>
        <div class="text-sm text-slate-400 tabular-nums">of {{ total }}</div>
      </div>
    </div>

    <div class="space-y-2 text-base">
      <div class="flex items-center justify-between gap-6">
        <div class="text-slate-300">Total (T)</div>
        <div class="tabular-nums text-slate-50">{{ total }}</div>
      </div>
      <div class="flex items-center justify-between gap-6">
        <div class="text-slate-300">Resigned (R)</div>
        <div class="tabular-nums text-slate-50">{{ resigned }}</div>
      </div>
      <div class="flex items-center justify-between gap-6">
        <div class="text-slate-300">R / T</div>
        <div class="tabular-nums text-slate-50">{{ ratioLabel }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  resigned: number
  total: number
}>()

const ratio = computed(() => {
  if (!Number.isFinite(props.resigned) || !Number.isFinite(props.total)) return 0
  if (props.total <= 0) return 0
  return Math.max(0, Math.min(1, props.resigned / props.total))
})

const ratioLabel = computed(() => `${Math.round(ratio.value * 100)}%`)

const dashArray = computed(() => {
  const r = 42
  const c = 2 * Math.PI * r
  const filled = c * ratio.value
  const empty = c - filled
  return `${filled} ${empty}`
})

const resigned = computed(() => (Number.isFinite(props.resigned) ? props.resigned : 0))
const total = computed(() => (Number.isFinite(props.total) ? props.total : 0))
</script>

