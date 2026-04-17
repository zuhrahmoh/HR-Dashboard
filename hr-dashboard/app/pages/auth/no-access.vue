<template>
  <div class="flex min-h-screen items-center justify-center bg-hr-page p-6 text-slate-900">
    <div class="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <h1 class="text-lg font-semibold tracking-tight">Access denied</h1>
      <p class="mt-3 text-sm leading-relaxed text-slate-600">
        You signed in, but this account does not have the required HR dashboard app role in Microsoft Entra. Ask your administrator to assign you the
        correct role on the enterprise application.
      </p>
      <p class="mt-5 text-sm">
        <button
          type="button"
          class="font-medium text-sky-600 underline decoration-sky-500/50 underline-offset-2 hover:text-sky-700"
          @click="signOutDialogOpen = true"
        >
          Sign out
        </button>
      </p>
    </div>
    <SignOutDialog v-model="signOutDialogOpen" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const signOutDialogOpen = ref(false)
</script>
