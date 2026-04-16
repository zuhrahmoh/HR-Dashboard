<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
    <div class="max-w-md rounded-lg border border-slate-700 bg-slate-900/80 p-6 shadow-lg shadow-black/20">
      <h1 class="text-lg font-semibold tracking-tight">Access denied</h1>
      <p class="mt-3 text-sm leading-relaxed text-slate-300">
        You signed in, but this account does not have the required HR dashboard app role in Microsoft Entra. Ask your administrator to assign you the
        correct role on the enterprise application.
      </p>
      <p class="mt-5 text-sm">
        <NuxtLink to="/auth/logout" class="font-medium text-sky-400 underline decoration-sky-400/50 underline-offset-2 hover:text-sky-300">
          Sign out
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
</script>
