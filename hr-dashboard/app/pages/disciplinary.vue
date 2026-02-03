<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold">Disciplinary Matters</h1>
      <p class="text-slate-300">Log disciplinary cases and track status.</p>
    </div>

    <hr class="border-slate-800" />

    <section class="space-y-3">
      <div class="space-y-2">
        <h2 class="text-base font-semibold text-slate-200">Cases</h2>
        <button
          v-if="!showCaseForm"
          type="button"
          class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
          @click="showCaseForm = true"
        >
          + Add case
        </button>
      </div>

      <form v-if="showCaseForm" class="rounded-md border border-slate-800 bg-slate-900 p-4" @submit.prevent="createCase">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Employee Name</div>
            <input
              v-model="caseForm.employeeName"
              type="text"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            />
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Case Type</div>
            <input v-model="caseForm.caseType" type="text" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
          </label>
          <label class="block md:col-span-2">
            <div class="mb-1 text-sm text-slate-300">Summary</div>
            <input v-model="caseForm.summary" type="text" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Status</div>
            <input v-model="caseForm.status" type="text" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
          </label>
        </div>

        <div class="mt-3 flex items-center justify-between gap-3">
          <div v-if="caseActionError" class="text-xs text-red-200">{{ caseActionError }}</div>
          <div class="ml-auto flex items-center gap-2">
            <button
              type="button"
              class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
              @click="cancelCreate"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40 disabled:opacity-60"
              :disabled="saving"
            >
              Add case
            </button>
          </div>
        </div>
      </form>

      <div v-if="pending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div v-else-if="error" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load cases.
        <div v-if="errorMessage" class="mt-2 text-xs text-red-200/80">{{ errorMessage }}</div>
      </div>
      <div v-else class="overflow-hidden rounded-md border border-slate-800 bg-slate-900">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-950 text-slate-300">
              <tr>
                <th class="px-4 py-3 font-medium">Employee</th>
                <th class="px-4 py-3 font-medium">Case Type</th>
                <th class="px-4 py-3 font-medium">Summary</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Created Date</th>
                <th class="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in cases" :key="c.id" class="border-t border-slate-800 align-top">
                <template v-if="editId === c.id">
                  <td class="px-4 py-3">
                    <input
                      v-model="editForm.employeeName"
                      type="text"
                      class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <input v-model="editForm.caseType" type="text" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
                  </td>
                  <td class="px-4 py-3">
                    <input v-model="editForm.summary" type="text" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
                  </td>
                  <td class="px-4 py-3">
                    <input v-model="editForm.status" type="text" class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50" />
                  </td>
                  <td class="px-4 py-3 text-slate-200">
                    {{ formatDate(c.createdAt) }}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40"
                        @click="cancelEdit"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40 disabled:opacity-60"
                        :disabled="saving"
                        @click="saveEdit"
                      >
                        Save
                      </button>
                    </div>
                    <div v-if="editError" class="mt-2 text-xs text-red-200">{{ editError }}</div>
                  </td>
                </template>

                <template v-else>
                  <td class="px-4 py-3 text-slate-50">{{ c.employeeName }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ c.caseType }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ c.summary }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ c.status }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ formatDate(c.createdAt) }}</td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40"
                        @click="startEdit(c)"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        class="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-950/50"
                        @click="deleteCase(c.id)"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </template>
              </tr>

              <tr v-if="cases.length === 0" class="border-t border-slate-800">
                <td colspan="6" class="px-4 py-6 text-center text-slate-300">No cases yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="!pending && !error && actionError" class="text-xs text-red-200">{{ actionError }}</div>
    </section>
  </div>
</template>

<script setup lang="ts">
type DisciplinaryCase = {
  id: string
  employeeName: string
  caseType: string
  summary: string
  status: string
  createdAt: string
}

function getErrorMessage(error: unknown) {
  const e = error as Record<string, unknown> | null
  if (!e) return ''
  const d = e['data'] as Record<string, unknown> | undefined
  return (
    (typeof d?.message === 'string' && d.message) ||
    (typeof e['message'] === 'string' && (e['message'] as string)) ||
    (typeof e['statusMessage'] === 'string' && (e['statusMessage'] as string)) ||
    ''
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString()
}

const {
  data,
  pending,
  error,
  refresh: refreshCases
} = await useFetch<DisciplinaryCase[]>('/api/disciplinary')

const cases = computed(() => data.value ?? [])
const errorMessage = computed(() => getErrorMessage(error.value))

const showCaseForm = ref(false)
const caseForm = reactive({ employeeName: '', caseType: '', summary: '', status: '' })

const saving = ref(false)
const actionError = ref('')
const caseActionError = ref('')

const editId = ref<string | null>(null)
const editForm = reactive({ employeeName: '', caseType: '', summary: '', status: '' })
const editError = ref('')

function cancelCreate() {
  caseActionError.value = ''
  showCaseForm.value = false
}

async function createCase() {
  caseActionError.value = ''
  saving.value = true
  try {
    await $fetch('/api/disciplinary', { method: 'POST', body: { ...caseForm } })
    caseForm.employeeName = ''
    caseForm.caseType = ''
    caseForm.summary = ''
    caseForm.status = ''
    showCaseForm.value = false
    await refreshCases()
  } catch (err) {
    caseActionError.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}

function startEdit(c: DisciplinaryCase) {
  editError.value = ''
  editId.value = c.id
  editForm.employeeName = c.employeeName
  editForm.caseType = c.caseType
  editForm.summary = c.summary
  editForm.status = c.status
}

function cancelEdit() {
  editId.value = null
  editError.value = ''
}

async function saveEdit() {
  const id = editId.value
  if (!id) return
  editError.value = ''
  saving.value = true
  try {
    await $fetch(`/api/disciplinary/${id}`, { method: 'PUT', body: { ...editForm } })
    editId.value = null
    await refreshCases()
  } catch (err) {
    editError.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}

async function deleteCase(id: string) {
  actionError.value = ''
  saving.value = true
  try {
    await $fetch(`/api/disciplinary/${id}`, { method: 'DELETE' })
    if (editId.value === id) editId.value = null
    await refreshCases()
  } catch (err) {
    actionError.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}
</script>

