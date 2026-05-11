<template>
  <div>
    <dl class="space-y-1 border-l-2 border-slate-100 pl-2">
      <div class="flex min-w-0 items-baseline justify-between gap-2">
        <dt class="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">Created on</dt>
        <dd class="text-right text-xs text-slate-500 tabular-nums">{{ formatDateOnly(createdAt) }}</dd>
      </div>
      <div class="flex min-w-0 items-baseline justify-between gap-2">
        <dt class="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">Last Modified</dt>
        <dd class="text-right text-xs text-slate-500 tabular-nums">{{ formatDateOnly(lastModifiedAt) }}</dd>
      </div>
      <div class="flex min-w-0 items-baseline justify-between gap-2">
        <dt class="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">Completed on</dt>
        <dd class="text-right text-xs text-slate-500 tabular-nums">{{ formatDateTime(completedAt) }}</dd>
      </div>
      <div class="flex min-w-0 items-baseline justify-between gap-2">
        <dt class="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">Last Modified by</dt>
        <dd class="break-words text-right text-xs text-slate-500">{{ lastModifiedBy || '—' }}</dd>
      </div>
    </dl>
    <button
      type="button"
      class="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
      @click="$emit('reopen')"
    >
      Reopen
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  createdAt: string
  lastModifiedAt: string
  lastModifiedBy: string
  completedAt: string
}>()

defineEmits<{
  (e: 'reopen'): void
}>()

const dateOnlyFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})

function formatDateOnly(iso: string | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime()) || d.getTime() === 0) return '—'
  return dateOnlyFormatter.format(d)
}

function formatDateTime(iso: string | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime()) || d.getTime() === 0) return '—'
  return dateTimeFormatter.format(d)
}
</script>
