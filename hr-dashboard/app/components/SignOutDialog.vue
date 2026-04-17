<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-out-dialog-title"
    >
      <button
        type="button"
        class="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]"
        aria-label="Dismiss"
        @click="open = false"
      />
      <div
        class="relative z-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-card"
        @click.stop
      >
        <h2 id="sign-out-dialog-title" class="text-base font-semibold text-slate-900">Sign out?</h2>
        <p class="mt-2 text-sm leading-relaxed text-slate-600">
          You will be signed out of this app and your Microsoft session for it will end. You can sign in again afterwards.
        </p>
        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="open = false"
          >
            No
          </button>
          <button
            type="button"
            class="rounded-md bg-hr-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-hr-navy/90"
            @click="confirm"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const open = defineModel<boolean>({ default: false })

function confirm() {
  if (import.meta.client) {
    window.location.assign('/auth/logout')
  }
}
</script>
