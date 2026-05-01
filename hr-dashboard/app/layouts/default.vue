<template>
  <div :class="rootClass">
    <header
      v-if="!isReportMode"
      class="surface-tint-nav sticky top-0 z-40 backdrop-blur"
    >
      <div class="flex min-h-[3.25rem] items-center gap-4 px-6 sm:px-12 lg:px-20">
        <NuxtLink
          to="/odoo"
          class="flex shrink-0 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-hr-navy/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <img
            src="/Ramps-Logo-Colored.png"
            alt="Ramps Logistics"
            class="h-9 w-auto max-w-full object-contain"
            loading="eager"
          />
        </NuxtLink>

        <nav class="min-w-0 flex-1 overflow-x-auto pl-4 sm:pl-6">
          <ul class="flex items-center">
            <li
              v-for="(item, idx) in navItems"
              :key="item.to"
              class="flex shrink-0 items-center"
            >
              <span
                v-if="idx > 0"
                class="mx-1 h-4 w-px bg-slate-200"
                aria-hidden="true"
              />
              <NuxtLink
                :to="item.to"
                class="inline-flex items-center whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-blue-100/60 hover:text-brand-blue"
                active-class="nav-link-active-brand shadow-sm"
                exact-active-class="nav-link-active-brand shadow-sm"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <div
          v-if="auth?.authenticated && auth.user"
          ref="userMenuRoot"
          class="relative shrink-0"
        >
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-hr-navy hover:bg-slate-50 hover:text-hr-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-hr-navy/40"
            aria-label="Open user menu"
            :aria-expanded="userMenuOpen"
            aria-haspopup="true"
            @click="userMenuOpen = !userMenuOpen"
          >
            <svg
              class="h-5 w-5"
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
          </button>

          <div
            v-if="userMenuOpen"
            role="menu"
            class="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5"
          >
            <div class="flex flex-col items-center gap-2 px-4 pt-5 pb-4">
              <div class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 text-hr-navy ring-1 ring-purple-100">
                <svg
                  class="h-7 w-7"
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
              </div>
              <div class="w-full text-center">
                <div class="truncate text-sm font-semibold text-hr-navy" :title="userDisplayName">
                  {{ userDisplayName }}
                </div>
                <div
                  v-if="auth.user.email"
                  class="mt-0.5 truncate text-xs text-slate-500"
                  :title="auth.user.email"
                >
                  {{ auth.user.email }}
                </div>
              </div>
            </div>
            <div class="border-t border-slate-100 px-3 py-3">
              <button
                type="button"
                class="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-purple-100 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 px-3 py-2 text-sm font-semibold text-hr-navy transition hover:brightness-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40"
                @click="onSignOutClick"
              >
                <span>Sign out</span>
                <svg
                  class="h-4 w-4 shrink-0 text-hr-navy/70"
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
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="min-w-0 bg-white px-6 pb-6 pt-6 text-slate-800 sm:px-12 lg:px-20">
      <slot />
    </main>
    <SignOutDialog v-model="signOutDialogOpen" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const signOutDialogOpen = ref(false)
const userMenuOpen = ref(false)
const userMenuRoot = ref<HTMLElement | null>(null)

function onSignOutClick() {
  userMenuOpen.value = false
  signOutDialogOpen.value = true
}

function handleDocumentClick(event: MouseEvent) {
  if (!userMenuOpen.value) return
  const root = userMenuRoot.value
  if (root && !root.contains(event.target as Node)) {
    userMenuOpen.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') userMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
})

watch(() => route.fullPath, () => {
  userMenuOpen.value = false
})

const { data: auth } = await useFetch<{
  authenticated: boolean
  user: { name: string; email: string } | null
}>('/api/auth/me', { key: 'auth-me' })

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
  isReportMode.value ? 'min-h-screen bg-white text-slate-800' : 'min-h-screen bg-white text-slate-800'
)

const navItems = [
  { label: 'Home', to: '/odoo' },
  { label: 'Employees', to: '/odoo/employees' },
  { label: 'Recruitment & Onboarding', to: '/recruitment' },
  { label: 'Contract Management', to: '/contracts' },
  { label: 'Medical Enrollments & EAP', to: '/medical-enrollments-eap' },
  { label: 'Progressive Discipline', to: '/disciplinary' }
]
</script>
