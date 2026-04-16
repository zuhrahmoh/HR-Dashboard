<template>
  <div :class="rootClass">
    <div class="flex min-h-screen min-w-0 items-start">
      <aside
        v-if="!isReportMode"
        class="sticky top-0 flex h-screen w-56 shrink-0 flex-col overflow-y-auto border-r border-slate-800/80 bg-slate-950"
      >
        <div class="shrink-0 px-4 py-4">
          <NuxtLink to="/odoo" class="block focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
            <img
              src="/Ramps-Logo-Original-white.png"
              alt="Ramps Logistics"
              class="h-12 w-auto max-w-full object-contain object-left"
              loading="eager"
            />
          </NuxtLink>
        </div>
        <nav class="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <div class="px-2 pb-2 text-[11px] font-semibold tracking-wide text-slate-400">MENU</div>

          <ul class="space-y-2">
            <li v-for="item in navItems" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="block rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900/60 hover:text-slate-50"
                active-class="bg-sky-500/10 text-sky-200 ring-1 ring-sky-500/20 hover:bg-sky-500/10 hover:text-sky-200"
                exact-active-class="bg-sky-500/10 text-sky-200 ring-1 ring-sky-500/20 hover:bg-sky-500/10 hover:text-sky-200"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>

          <div class="pt-4">
            <div ref="reportMenuRoot" class="relative">
              <button
                type="button"
                class="relative inline-flex w-full items-center rounded-md border border-slate-700 bg-slate-900/70 px-1.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="generatingReport"
                :aria-expanded="reportMenuOpen"
                aria-haspopup="listbox"
                @click="toggleReportMenu"
                @keydown.escape.prevent="closeReportMenu"
              >
                <span class="flex w-full items-center justify-center gap-1.5 pr-6">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0 text-slate-50">
                    <path d="M12 2l1.4 5.1L18 8.5l-4.6 1.4L12 15l-1.4-5.1L6 8.5l4.6-1.4L12 2Z" fill="currentColor" />
                    <path
                      d="M19 13l.8 2.8L22 16.6l-2.2.8L19 20l-.8-2.6L16 16.6l2.2-.8L19 13Z"
                      fill="currentColor"
                      opacity="0.9"
                    />
                  </svg>
                  <span class="whitespace-nowrap">{{ generatingReport ? 'Generating…' : 'Generate summary report' }}</span>
                </span>
                <svg
                  class="absolute right-2 h-3.5 w-3.5 shrink-0 text-slate-300/80"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                  />
                </svg>
              </button>

              <div
                v-if="reportMenuOpen"
                class="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-md border border-slate-700 bg-slate-950 shadow-xl shadow-black/30"
                role="listbox"
                aria-label="Generate report month"
              >
                <button
                  v-for="opt in reportMonthOptions"
                  :key="opt.value || 'current'"
                  type="button"
                  class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-800 focus:bg-slate-800 focus:outline-none"
                  @click="generateReportForMonth(opt.value)"
                >
                  <span class="whitespace-normal">{{ opt.label }}</span>
                  <span class="shrink-0 text-xs text-slate-400">{{ opt.caption }}</span>
                </button>
              </div>
            </div>
            <div v-if="reportError" class="mt-2 text-xs text-red-200">{{ reportError }}</div>
          </div>
        </nav>
        <div
          v-if="auth?.authenticated && auth.user"
          class="shrink-0 border-t border-slate-800/80 px-4 py-3 text-left"
        >
          <div class="flex min-w-0 items-start gap-2">
            <svg
              class="mt-0.5 h-5 w-5 shrink-0 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            <div class="min-w-0 flex-1 truncate text-sm font-bold text-slate-50" :title="auth.user.email || undefined">
              {{ userDisplayName }}
            </div>
          </div>
          <NuxtLink
            to="/auth/logout"
            class="mt-3 inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-1 font-mono text-xs font-normal text-slate-50 ring-1 ring-slate-700/80 hover:bg-slate-700 hover:text-slate-50"
          >
            <span>Sign out</span>
            <svg
              class="h-3 w-3 shrink-0 text-slate-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
              />
            </svg>
          </NuxtLink>
        </div>
      </aside>

      <main class="min-w-0 flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { data: auth } = await useFetch<{ authenticated: boolean; user: { name: string; email: string } | null }>('/api/auth/me', {
  key: 'auth-me'
})

const userDisplayName = computed(() => {
  const u = auth.value?.user
  if (!u) return ''
  return (u.name ?? '').trim() || u.email || 'Signed in'
})

const isReportMode = computed(() => (route.query.report ?? '') === '1')

useHead(() => ({
  htmlAttrs: {
    'data-report': isReportMode.value ? '1' : undefined
  }
}))

const rootClass = computed(() =>
  isReportMode.value ? 'min-h-screen bg-white text-slate-900' : 'min-h-screen bg-slate-950 text-slate-100'
)

const navItems = [
  { label: 'Home', to: '/odoo' },
  { label: 'Employees', to: '/odoo/employees' },
  { label: 'Recruitment & Onboarding', to: '/recruitment' },
  { label: 'Contract Management', to: '/contracts' },
  { label: 'Medical Enrollments & EAP', to: '/medical-enrollments-eap' },
  { label: 'Progressive Discipline', to: '/disciplinary' }
]

const generatingReport = ref(false)
const reportError = ref('')
const reportMenuOpen = ref(false)
const reportMenuRoot = ref<HTMLElement | null>(null)

function ymdUtc() {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function generateCompleteReport() {
  if (!import.meta.client) return
  if (generatingReport.value) return
  reportError.value = ''
  generatingReport.value = true
  try {
    const res = await fetch('/api/reports/complete', { method: 'GET' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Failed to generate report (${res.status})`)
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hr-dashboard-complete-report-${ymdUtc()}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to generate report.'
    reportError.value = msg
  } finally {
    generatingReport.value = false
  }
}

function monthLabelShort(yyyyMm: string) {
  const m = /^(\d{4})-(\d{2})$/.exec((yyyyMm ?? '').trim())
  if (!m) return yyyyMm
  const y = Number(m[1])
  const mo = Number(m[2])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return yyyyMm
  const dt = new Date(Date.UTC(y, mo - 1, 1))
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dt)
}

const reportMonthOptions = computed(() => {
  // Limited to Jan/Feb as requested (months available in expenses).
  const year = new Date().getUTCFullYear()
  const feb = `${year}-02`
  const jan = `${year}-01`
  return [
    { value: '', label: 'Current report', caption: 'Live' },
    { value: feb, label: monthLabelShort(feb), caption: 'Historical' },
    { value: jan, label: monthLabelShort(jan), caption: 'Historical' }
  ]
})

function closeReportMenu() {
  reportMenuOpen.value = false
}

function toggleReportMenu() {
  if (generatingReport.value) return
  reportMenuOpen.value = !reportMenuOpen.value
}

async function generateReportForMonth(month: string) {
  if (!import.meta.client) return
  if (generatingReport.value) return
  closeReportMenu()
  reportError.value = ''
  generatingReport.value = true
  try {
    const qs = month ? `?reportMonth=${encodeURIComponent(month)}` : ''
    const res = await fetch(`/api/reports/complete${qs}`, { method: 'GET' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Failed to generate report (${res.status})`)
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const suffix = month ? `-${month}` : ''
    a.download = `hr-dashboard-complete-report${suffix}-${ymdUtc()}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to generate report.'
    reportError.value = msg
  } finally {
    generatingReport.value = false
  }
}

function onDocumentPointerDown(e: MouseEvent | PointerEvent) {
  const root = reportMenuRoot.value
  if (!root) return
  const target = e.target as Node | null
  if (target && root.contains(target)) return
  closeReportMenu()
}

watch(
  reportMenuOpen,
  (open) => {
    if (typeof document === 'undefined') return
    if (open) document.addEventListener('pointerdown', onDocumentPointerDown, true)
    else document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
})
</script>

