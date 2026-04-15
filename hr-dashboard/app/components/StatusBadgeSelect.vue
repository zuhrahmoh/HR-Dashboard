<template>
  <div ref="rootEl" class="relative block w-full min-w-0">
    <button
      type="button"
      class="flex w-full min-w-0 max-w-full items-start gap-1.5 rounded-lg border px-2 py-1.5 text-left text-xs font-semibold outline-none ring-0 transition focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      :class="badgeClass"
      @click="toggle"
      @keydown.escape.prevent="close"
    >
      <span class="min-w-0 flex-1 break-words whitespace-normal">{{ labelFor(modelValue) }}</span>
      <svg class="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-md border border-slate-700 bg-slate-950 shadow-xl shadow-black/30"
      role="listbox"
      aria-label="Status"
    >
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-800 focus:bg-slate-800 focus:outline-none"
        @click="select(opt.value)"
      >
        <span class="whitespace-normal">{{ opt.label }}</span>
        <span v-if="opt.value === modelValue" class="text-slate-300">✓</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
type StatusKey =
  | 'not_started'
  | 'discussion_in_progress'
  | 'confirmed_for_permanency'
  | 'contracted_extension'
  | 'unsuccessful_probation'

const props = defineProps<{
  modelValue: StatusKey
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: StatusKey): void
}>()

const options = [
  { value: 'not_started' as const, label: 'Not Started' },
  { value: 'discussion_in_progress' as const, label: 'Discussion in progress' },
  { value: 'confirmed_for_permanency' as const, label: 'Confirmed for Permanency' },
  { value: 'contracted_extension' as const, label: 'Contracted Extension' },
  { value: 'unsuccessful_probation' as const, label: 'Unsuccessful Probation' }
]

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

function labelFor(v: StatusKey) {
  const m = options.find((o) => o.value === v)
  return m ? m.label : 'Not Started'
}

const badgeClass = computed(() => {
  const v = props.modelValue
  if (v === 'not_started') return 'border-amber-400/30 bg-amber-500/10 text-amber-200'
  if (v === 'discussion_in_progress') return 'border-sky-400/30 bg-sky-500/10 text-sky-200'
  if (v === 'confirmed_for_permanency') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
  if (v === 'contracted_extension') return 'border-violet-400/30 bg-violet-500/10 text-violet-200'
  return 'border-red-400/30 bg-red-500/10 text-red-200'
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

