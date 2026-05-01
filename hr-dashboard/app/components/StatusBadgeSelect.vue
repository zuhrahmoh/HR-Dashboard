<template>
  <div ref="rootEl" class="relative inline-block w-[14.5rem] max-w-full min-w-0 align-top">
    <button
      ref="buttonEl"
      type="button"
      :title="labelFor(modelValue)"
      class="inline-flex h-8 w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border px-2 py-0 text-left text-xs font-semibold leading-none outline-none ring-0 transition focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      :class="badgeClass"
      @click="toggle"
      @keydown.escape.prevent="close"
    >
      <span class="min-w-0 flex-1 truncate text-left">{{ labelFor(modelValue) }}</span>
      <svg class="h-3.5 w-3.5 shrink-0 opacity-80" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="menuEl"
        class="fixed z-[300] w-64 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg shadow-slate-900/15"
        :style="{ left: `${menuPos.left}px`, top: `${menuPos.top}px` }"
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
          <span class="whitespace-normal">{{ opt.label }}</span>
          <span v-if="opt.value === modelValue" class="text-slate-600">✓</span>
        </button>
      </div>
    </Teleport>
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
const buttonEl = ref<HTMLButtonElement | null>(null)
const menuEl = ref<HTMLElement | null>(null)
const menuPos = ref({ left: 0, top: 0 })

const MENU_WIDTH = 256
const MENU_HEIGHT_ESTIMATE = 220
const MENU_GAP = 4

function labelFor(v: StatusKey) {
  const m = options.find((o) => o.value === v)
  return m ? m.label : 'Not Started'
}

const badgeClass = computed(() => {
  const v = props.modelValue
  if (v === 'not_started') return 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]'
  if (v === 'discussion_in_progress') return 'border-[#bae6fd] bg-[#f0f9ff] text-[#0369a1]'
  if (v === 'confirmed_for_permanency') return 'border-[#bbf7d0] bg-[#ecfdf5] text-[#047857]'
  if (v === 'contracted_extension') return 'border-[#ddd6fe] bg-[#f5f3ff] text-[#5b21b6]'
  return 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]'
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

function updateMenuPosition() {
  const btn = buttonEl.value
  if (!btn) return
  const rect = btn.getBoundingClientRect()
  const viewportH = window.innerHeight
  const viewportW = window.innerWidth
  let top = rect.bottom + MENU_GAP
  if (top + MENU_HEIGHT_ESTIMATE > viewportH) {
    top = Math.max(MENU_GAP, rect.top - MENU_HEIGHT_ESTIMATE - MENU_GAP)
  }
  let left = rect.left
  if (left + MENU_WIDTH > viewportW) {
    left = Math.max(MENU_GAP, rect.right - MENU_WIDTH)
  }
  menuPos.value = { left, top }
}

function onDocumentPointerDown(e: MouseEvent | PointerEvent) {
  const target = e.target as Node | null
  if (!target) return
  const root = rootEl.value
  const menu = menuEl.value
  if (root && root.contains(target)) return
  if (menu && menu.contains(target)) return
  close()
}

watch(
  open,
  async (isOpen) => {
    if (typeof document === 'undefined') return
    if (isOpen) {
      document.addEventListener('pointerdown', onDocumentPointerDown, true)
      window.addEventListener('scroll', close, true)
      window.addEventListener('resize', close)
      await nextTick()
      updateMenuPosition()
    } else {
      document.removeEventListener('pointerdown', onDocumentPointerDown, true)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  window.removeEventListener('scroll', close, true)
  window.removeEventListener('resize', close)
})
</script>
