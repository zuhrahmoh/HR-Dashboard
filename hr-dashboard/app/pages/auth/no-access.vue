<template>
  <div class="flex min-h-screen items-center justify-center bg-white p-6 text-slate-900">
    <div class="surface-tint-hero max-w-md rounded-2xl p-6 shadow-card">
      <h1 class="text-gradient-brand text-3xl font-semibold tracking-tight">Access denied</h1>
      <p class="mt-3 text-sm leading-relaxed text-slate-600">
        You signed in, but this account does not have the required HR dashboard app role in Microsoft Entra. Ask your administrator to assign you the
        correct role on the enterprise application.
      </p>
      <p class="mt-5 text-sm">
        <button
          type="button"
          class="font-semibold text-brand-purple underline decoration-brand-purple/50 underline-offset-2 hover:text-brand-purple/80"
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
