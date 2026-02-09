<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <div class="flex min-h-screen">
      <aside class="w-56 shrink-0 border-r border-slate-800/80 bg-slate-950">
        <div class="px-4 py-4">
          <div class="text-base font-semibold tracking-tight text-slate-50">HR Dashboard</div>
        </div>
        <nav class="px-2 pb-4">
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
  { label: 'Home (Odoo)', to: '/odoo' },
  { label: 'Employees (Odoo)', to: '/odoo/employees' },
  { label: 'Recruitment & Onboarding', to: '/recruitment' },
  { label: 'Performance Management', to: '/performance' },
  { label: 'Disciplinary Matters', to: '/disciplinary' }
]
</script>

