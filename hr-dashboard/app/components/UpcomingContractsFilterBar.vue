<template>
  <div class="flex shrink-0 flex-nowrap items-end justify-end gap-3">
    <label class="shrink-0 space-y-0.5">
      <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Window</div>
      <select
        v-model="windowDays"
        class="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
      >
        <option value="30">Next 30 days</option>
        <option value="60">Next 60 days</option>
        <option value="90">Next 90 days</option>
      </select>
    </label>

    <div class="inline-flex shrink-0 overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
      <button type="button" :class="unitButtonClass('days')" @click="unitMode = 'days'">Days</button>
      <button type="button" :class="unitButtonClass('weeks')" @click="unitMode = 'weeks'">Weeks</button>
      <button type="button" :class="unitButtonClass('both')" @click="unitMode = 'both'">Days+Weeks</button>
    </div>
  </div>
</template>

<script setup lang="ts">
type UnitMode = 'days' | 'weeks' | 'both'

const windowDays = defineModel<'30' | '60' | '90'>('windowDays', { required: true })
const unitMode = defineModel<UnitMode>('unitMode', { required: true })

function unitButtonClass(mode: UnitMode) {
  const active = unitMode.value === mode
  return [
    'px-3 py-1.5 text-xs font-semibold',
    active ? 'bg-hr-navy text-white' : 'text-slate-700 hover:bg-slate-100'
  ]
}
</script>
