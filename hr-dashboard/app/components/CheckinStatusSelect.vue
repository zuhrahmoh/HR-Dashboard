<template>
  <div ref="rootEl" class="relative block w-full min-w-0">
    <button
      type="button"
      class="flex w-full min-w-0 max-w-full items-start gap-1.5 rounded-lg border px-2 py-1.5 text-left text-xs font-semibold outline-none ring-0 transition focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      :class="badgeClass"
      @click="toggle"
      @keydown.escape.prevent="close"
    >
      <span class="min-w-0 flex-1 break-words whitespace-normal">{{ labelFor(modelValue) }}</span>
      <svg class="mt-0.5 h-4 w-4 shrink-0 opacity-80" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute left-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg shadow-slate-900/15"
      role="listbox"
      aria-label="Status"
    >
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
        @click="select(opt.value)"
      >
        <span>{{ opt.label }}</span>
        <span v-if="opt.value === modelValue" class="text-slate-600">✓</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
type StatusKey = 'no_action' | 'in_progress' | 'completed'

const props = defineProps<{
  modelValue: StatusKey
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: StatusKey): void
}>()

const options = [
  { value: 'no_action' as const, label: 'No Action' },
  { value: 'in_progress' as const, label: 'In Progress' },
  { value: 'completed' as const, label: 'Completed' }
]

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

function labelFor(v: StatusKey) {
  const m = options.find((o) => o.value === v)
  return m ? m.label : 'No Action'
}

const badgeClass = computed(() => {
  const v = props.modelValue
  if (v === 'no_action') return 'border-red-400/30 bg-red-500/10 text-red-900'
  if (v === 'in_progress') return 'border-amber-400/30 bg-amber-500/10 text-amber-950'
  return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-900'
})

function close() {
  open.value = false
}

function toggle() {
  open.value = !open.value
}

function select(v: StatusKey) {
  emit('update:modelValue', v)
  close()
}

function onDocumentPointerDown(e: MouseEvent | PointerEvent) {
  const root = rootEl.value
  if (!root) return
  const target = e.target as Node | null
  if (target && root.contains(target)) return
  close()
}

watch(
  open,
  (isOpen) => {
    if (typeof document === 'undefined') return
    if (isOpen) document.addEventListener('pointerdown', onDocumentPointerDown, true)
    else document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})
</script>

