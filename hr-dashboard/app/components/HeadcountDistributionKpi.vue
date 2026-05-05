<template>
  <div
    class="surface-tint-card relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl p-2 shadow-card"
  >
    <span aria-hidden="true" class="absolute inset-x-0 top-0 h-[3px] bg-brand-blue" />
    <div class="text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Headcount</div>

    <div class="mt-0.5 flex min-h-0 flex-1 items-center justify-center gap-1.5">
      <div
        class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-brand-blue ring-1 ring-inset ring-blue-100"
        aria-hidden="true"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="7.5" r="2.75" />
          <circle cx="5.5" cy="9.5" r="2.25" />
          <circle cx="18.5" cy="9.5" r="2.25" />
          <path d="M7 19v-1.5a5 5 0 0 1 10 0V19" />
          <path d="M2 19v-1a4 4 0 0 1 4-4" />
          <path d="M22 19v-1a4 4 0 0 0-4-4" />
        </svg>
      </div>
      <div
        class="text-brand-blue text-2xl font-extrabold tabular-nums tracking-tight"
        :aria-label="`Total headcount ${total}`"
      >
        {{ total }}
      </div>
    </div>

    <div class="mt-0.5 w-full min-w-0 px-0.5 text-center text-[11px] font-medium leading-snug text-hr-navy/70">
      <p class="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0">
        <span>RAMPS <span class="tabular-nums text-hr-navy">{{ rampsHeadcount }}</span></span>
        <span class="text-hr-navy/35" aria-hidden="true">|</span>
        <span>EDO <span class="tabular-nums text-hr-navy">{{ edoHeadcount }}</span></span>
      </p>
      <p v-if="independentContractors > 0" class="mt-0.5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0 text-[10px] text-hr-navy/55">
        <span>Ind. contractors <span class="tabular-nums text-hr-navy/80">{{ independentContractors }}</span></span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
type Breakdown = { permanent: number; contracted: number; interns: number; total: number }

const props = defineProps<{
  overall: Breakdown
  rampsHeadcount: number
  edoHeadcount: number
  independentContractors: number
}>()

function safeInt(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

const total = computed(() => safeInt(props.overall?.total))
</script>
