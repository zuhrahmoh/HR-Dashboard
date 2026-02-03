<template>
  <div class="min-h-screen bg-slate-950 text-slate-50">
    <div class="flex min-h-screen">
      <aside class="w-56 shrink-0 border-r border-slate-800 bg-slate-900">
        <div class="px-4 py-4">
          <div class="text-lg font-semibold">HR Dashboard</div>
        </div>
        <nav class="px-2 pb-4">
          <div class="px-2 pb-2 text-xs font-medium tracking-wide text-slate-400">MENU</div>
          <ul class="space-y-2">
            <li v-for="item in navItems" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="block rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:text-white"
                active-class="bg-slate-50 text-slate-900 hover:bg-slate-50 hover:text-slate-900"
                exact-active-class="bg-slate-50 text-slate-900 hover:bg-slate-50 hover:text-slate-900"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </aside>

      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Employees', to: '/employees' },
  { label: 'Recruitment & Onboarding', to: '/recruitment' },
  { label: 'Performance Management', to: '/performance' },
  { label: 'Disciplinary Matters', to: '/disciplinary' }
]
</script>

