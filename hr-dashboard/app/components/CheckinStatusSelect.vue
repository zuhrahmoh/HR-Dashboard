<template>
  <div ref="rootEl" class="relative block w-full min-w-0">
    <button
      ref="buttonEl"
      type="button"
      class="flex w-full min-w-0 max-w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-center text-xs font-semibold outline-none ring-0 transition focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      :class="badgeClass"
      @click="toggle"
      @keydown.escape.prevent="close"
    >
      <span class="min-w-0 break-words whitespace-normal">{{ labelFor(modelValue) }}</span>
      <svg class="mt-0.5 h-4 w-4 shrink-0 opacity-80" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
        class="fixed z-[300] w-40 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg shadow-slate-900/15"
        :style="{ left: `${menuPos.left}px`, top: `${menuPos.top}px` }"
        role="listbox"
        aria-label="Status"
      >
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          class="relative flex w-full items-center justify-center gap-2 px-3 py-2 text-center text-sm text-slate-800 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
          @click="select(opt.value)"
        >
          <span>{{ opt.label }}</span>
          <span v-if="opt.value === modelValue" class="absolute right-3 text-slate-600">✓</span>
        </button>
      </div>
    </Teleport>
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
const buttonEl = ref<HTMLButtonElement | null>(null)
const menuEl = ref<HTMLElement | null>(null)
const menuPos = ref({ left: 0, top: 0 })

const MENU_WIDTH = 160
const MENU_HEIGHT_ESTIMATE = 130
const MENU_GAP = 4

function labelFor(v: StatusKey) {
  const m = options.find((o) => o.value === v)
  return m ? m.label : 'No Action'
}

const badgeClass = computed(() => {
  const v = props.modelValue
  if (v === 'no_action') return 'border-pink-200 bg-pink-50 text-pink-800'
  if (v === 'in_progress') return 'border-blue-200 bg-blue-50 text-blue-900'
  return 'border-teal-200 bg-teal-50 text-teal-800'
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

