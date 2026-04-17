<template>
  <div ref="rootEl" class="relative">
    <div class="flex items-center gap-2">
      <input
        :value="modelValue"
        type="text"
        inputmode="numeric"
        :placeholder="placeholder"
        class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
        @input="onInput"
        @keydown.escape.prevent="open = false"
      />
      <button
        type="button"
        class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
        aria-label="Open calendar"
        :aria-expanded="open"
        @click="toggle"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M6 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1.5A1.5 1.5 0 0 1 18 5.5v12A1.5 1.5 0 0 1 16.5 19h-13A1.5 1.5 0 0 1 2 17.5v-12A1.5 1.5 0 0 1 3.5 4H5V3a1 1 0 0 1 1-1Zm-2 7v8.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V9H4Z"
          />
        </svg>
      </button>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="open"
      ref="panelEl"
      class="fixed z-[9999] w-[18rem] overflow-hidden rounded-md border border-slate-200 bg-slate-50 shadow-lg"
      role="dialog"
      aria-label="Calendar"
      :style="panelStyle"
    >
      <div class="flex items-center justify-between border-b border-hr-navy/25 px-3 py-2">
        <button
          type="button"
          class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 hover:bg-slate-100"
          aria-label="Previous month"
          @click="shiftMonth(-1)"
        >
          Prev
        </button>
        <div class="text-sm font-medium text-slate-900">{{ monthLabel }}</div>
        <button
          type="button"
          class="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 hover:bg-slate-100"
          aria-label="Next month"
          @click="shiftMonth(1)"
        >
          Next
        </button>
      </div>

      <div class="grid grid-cols-7 gap-px bg-slate-200 p-2 text-center text-xs">
        <div v-for="w in weekdays" :key="w" class="py-1 font-medium text-slate-400">{{ w }}</div>

        <button
          v-for="cell in cells"
          :key="cell.key"
          type="button"
          class="rounded-md py-1.5 text-slate-800 hover:bg-slate-100 disabled:cursor-default disabled:text-slate-600"
          :class="cell.iso === modelValue ? 'bg-sky-500/10 text-sky-200 ring-1 ring-sky-500/20' : ''"
          :disabled="!cell.iso"
          @click="cell.iso && select(cell.iso)"
        >
          {{ cell.day ?? '' }}
        </button>
      </div>

      <div class="border-t border-hr-navy/25 px-3 py-2 text-xs text-slate-400">
        Type as <span class="font-medium text-slate-600">YYYY-MM-DD</span>.
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
  }>(),
  {
    placeholder: 'YYYY-MM-DD'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const rootEl = ref<HTMLElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)
const open = ref(false)

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map((n) => Number(n))
  if (!y || !m || !d) return false
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

function clampMonthViewToValueOrToday() {
  const v = props.modelValue.trim()
  if (isValidIsoDate(v)) {
    const [y, m] = v.split('-').map((n) => Number(n))
    viewYear.value = y
    viewMonth.value = m - 1
    return
  }
  const now = new Date()
  viewYear.value = now.getFullYear()
  viewMonth.value = now.getMonth()
}

const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())

function monthLabelFor(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })
}

const monthLabel = computed(() => monthLabelFor(viewYear.value, viewMonth.value))

const cells = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const mondayStartOffset = (first.getDay() + 6) % 7
  const out: Array<{ key: string; day: number | null; iso: string | null }> = []
  for (let i = 0; i < 42; i += 1) {
    const day = i - mondayStartOffset + 1
    if (day < 1 || day > daysInMonth) {
      out.push({ key: `e-${i}`, day: null, iso: null })
      continue
    }
    const iso = `${viewYear.value}-${pad2(viewMonth.value + 1)}-${pad2(day)}`
    out.push({ key: iso, day, iso })
  }
  return out
})

function shiftMonth(delta: -1 | 1) {
  const dt = new Date(viewYear.value, viewMonth.value + delta, 1)
  viewYear.value = dt.getFullYear()
  viewMonth.value = dt.getMonth()
}

function select(iso: string) {
  emit('update:modelValue', iso)
  open.value = false
}

function onInput(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  emit('update:modelValue', target.value)
}

function toggle() {
  if (!open.value) {
    clampMonthViewToValueOrToday()
    open.value = true
    return
  }
  open.value = false
}

const panelTop = ref(0)
const panelLeft = ref(0)

const panelStyle = computed(() => ({
  top: `${panelTop.value}px`,
  left: `${panelLeft.value}px`
}))

function updatePanelPosition() {
  const root = rootEl.value
  if (!root) return
  const rect = root.getBoundingClientRect()

  const panelWidth = 18 * 16
  const margin = 6
  const left = Math.min(Math.max(margin, rect.left), window.innerWidth - panelWidth - margin)

  let top = rect.bottom + 6
  const panel = panelEl.value
  const panelHeight = panel ? panel.getBoundingClientRect().height : 0
  if (panelHeight > 0 && top + panelHeight > window.innerHeight - margin) {
    const above = rect.top - panelHeight - 6
    if (above >= margin) top = above
  }

  panelLeft.value = Math.round(left)
  panelTop.value = Math.round(top)
}

function queueUpdatePanelPosition() {
  if (typeof requestAnimationFrame === 'undefined') return
  requestAnimationFrame(() => updatePanelPosition())
}

onMounted(() => {
  const onPointerDown = (event: PointerEvent) => {
    if (!open.value) return
    const root = rootEl.value
    const panel = panelEl.value
    const t = event.target
    if (!root || !(t instanceof Node)) return
    if (root.contains(t)) return
    if (panel && panel.contains(t)) return
    open.value = false
  }
  document.addEventListener('pointerdown', onPointerDown)
  onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))
})

watch(open, async (isOpen) => {
  if (!import.meta.client) return
  if (!isOpen) return
  await nextTick()
  updatePanelPosition()
  window.addEventListener('resize', queueUpdatePanelPosition)
  window.addEventListener('scroll', queueUpdatePanelPosition, true)
})

watch(open, (isOpen) => {
  if (!import.meta.client) return
  if (isOpen) return
  window.removeEventListener('resize', queueUpdatePanelPosition)
  window.removeEventListener('scroll', queueUpdatePanelPosition, true)
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('resize', queueUpdatePanelPosition)
  window.removeEventListener('scroll', queueUpdatePanelPosition, true)
})
</script>

