<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold">Performance Management</h1>
      <p class="text-slate-300">C Player tracking with locally persisted notes.</p>
    </div>

    <hr class="border-slate-800" />

    <section class="space-y-3">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-slate-200">C Players</h2>
          <p class="text-xs text-slate-400">Excludes resigned employees.</p>
        </div>
        <div class="shrink-0 text-xs text-slate-400">Count: {{ cPlayers.length }}</div>
      </div>

      <div v-if="employeesPending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div v-else-if="employeesError" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load employees.
        <div v-if="employeesErrorMessage" class="mt-2 text-xs text-red-200/80">{{ employeesErrorMessage }}</div>
      </div>

      <div v-else class="overflow-hidden rounded-md border border-slate-800 bg-slate-900">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-950 text-slate-300">
              <tr>
                <th class="px-4 py-3 font-medium">Name</th>
                <th class="px-4 py-3 font-medium">Department</th>
                <th class="px-4 py-3 font-medium">Position</th>
                <th class="px-4 py-3 font-medium">Country</th>
                <th class="px-4 py-3 font-medium">Start Date</th>
                <th class="px-4 py-3 font-medium">Notes</th>
                <th class="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in cPlayers" :key="e.employeeKey" class="border-t border-slate-800 align-top">
                <td class="px-4 py-3 text-slate-50">{{ e.name }}</td>
                <td class="px-4 py-3 text-slate-200">{{ e.department }}</td>
                <td class="px-4 py-3 text-slate-200">{{ e.position }}</td>
                <td class="px-4 py-3 text-slate-200">{{ e.countryAssigned }}</td>
                <td class="px-4 py-3 text-slate-200">{{ formatYmdDateOrDash(e.startDate) }}</td>
                <td class="px-4 py-3">
                  <div v-if="noteLoading[e.employeeKey]" class="text-xs text-slate-400">Loading note…</div>
                  <template v-else-if="editingNoteEmployeeKey === e.employeeKey">
                    <textarea
                      v-model="notes[e.employeeKey]"
                      rows="3"
                      class="w-80 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500"
                      placeholder="Add a note…"
                      :disabled="noteSaving[e.employeeKey]"
                    />
                    <div v-if="noteError[e.employeeKey]" class="mt-2 text-xs text-red-200">{{ noteError[e.employeeKey] }}</div>
                    <div v-else-if="noteSaving[e.employeeKey]" class="mt-2 text-xs text-slate-300">Saving…</div>
                  </template>
                  <template v-else-if="!notes[e.employeeKey]">
                    <textarea
                      v-model="notes[e.employeeKey]"
                      rows="3"
                      class="w-80 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500"
                      placeholder="Add a note…"
                      :disabled="noteSaving[e.employeeKey]"
                    />
                    <div v-if="noteError[e.employeeKey]" class="mt-2 text-xs text-red-200">{{ noteError[e.employeeKey] }}</div>
                    <div v-else-if="noteSaving[e.employeeKey]" class="mt-2 text-xs text-slate-300">Saving…</div>
                  </template>
                  <div v-else class="w-80 whitespace-pre-wrap break-words text-slate-200">
                    {{ notes[e.employeeKey] || '—' }}
                  </div>
                </td>
                <td class="px-4 py-3 text-right">
                  <div v-if="editingNoteEmployeeKey === e.employeeKey" class="flex justify-end gap-2">
                    <button
                      type="button"
                      class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40"
                      :disabled="noteSaving[e.employeeKey] || noteLoading[e.employeeKey]"
                      @click="cancelEditNote(e.employeeKey)"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40 disabled:opacity-60"
                      :disabled="noteSaving[e.employeeKey] || noteLoading[e.employeeKey]"
                      @click="saveNoteAndClose(e.employeeKey)"
                    >
                      Save
                    </button>
                  </div>
                  <button
                    v-else-if="notes[e.employeeKey]"
                    type="button"
                    class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40 disabled:opacity-60"
                    :disabled="noteSaving[e.employeeKey] || noteLoading[e.employeeKey]"
                    @click="startEditNote(e.employeeKey)"
                  >
                    Edit
                  </button>
                  <button
                    v-else
                    type="button"
                    class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40 disabled:opacity-60"
                    :disabled="noteSaving[e.employeeKey] || noteLoading[e.employeeKey]"
                    @click="saveNote(e.employeeKey)"
                  >
                    Save
                  </button>
                </td>
              </tr>

              <tr v-if="cPlayers.length === 0" class="border-t border-slate-800">
                <td colspan="7" class="px-4 py-6 text-center text-slate-300">No active C Players found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { formatYmdDateOrDash } from '~/utils/dates'

type Employee = {
  employeeKey: string
  name: string
  department: string
  position: string
  startDate: string | null
  countryAssigned: string
  employeeStatus: string
  talentRating?: string
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

function isResigned(status: string) {
  return status.trim().toLowerCase() === 'resigned'
}

function isCPlayer(talentRating: string | undefined) {
  return (talentRating ?? '').trim() === 'C Player'
}

const { data: employeesData, pending: employeesPending, error: employeesError } = await useFetch<Employee[]>('/api/employees')
const employeesErrorMessage = computed(() => getErrorMessage(employeesError.value))

const cPlayers = computed(() =>
  (employeesData.value ?? [])
    .filter((e) => !isResigned(e.employeeStatus ?? '') && isCPlayer(e.talentRating))
    .sort((a, b) => a.name.localeCompare(b.name))
)

const notes = reactive<Record<string, string>>({})
const noteLoading = reactive<Record<string, boolean>>({})
const noteSaving = reactive<Record<string, boolean>>({})
const noteError = reactive<Record<string, string>>({})
const noteSavedAt = reactive<Record<string, number>>({})
const editingNoteEmployeeKey = ref<string | null>(null)
const noteEditOriginal = reactive<Record<string, string>>({})

function startEditNote(employeeKey: string) {
  noteEditOriginal[employeeKey] = notes[employeeKey] ?? ''
  noteError[employeeKey] = ''
  editingNoteEmployeeKey.value = employeeKey
}

function cancelEditNote(employeeKey: string) {
  if (typeof noteEditOriginal[employeeKey] === 'string') {
    notes[employeeKey] = noteEditOriginal[employeeKey]
  }
  noteError[employeeKey] = ''
  editingNoteEmployeeKey.value = null
}

async function loadNote(employeeKey: string) {
  if (noteLoading[employeeKey]) return
  noteError[employeeKey] = ''
  noteSavedAt[employeeKey] = 0
  noteLoading[employeeKey] = true
  try {
    const res = await $fetch<{ note: string }>(`/api/c-player-notes/${employeeKey}`)
    notes[employeeKey] = typeof res?.note === 'string' ? res.note : ''
  } catch (err) {
    noteError[employeeKey] = getErrorMessage(err) || 'Failed to load note.'
    notes[employeeKey] = notes[employeeKey] ?? ''
  } finally {
    noteLoading[employeeKey] = false
  }
}

async function saveNote(employeeKey: string) {
  if (noteSaving[employeeKey]) return
  noteError[employeeKey] = ''
  noteSavedAt[employeeKey] = 0
  noteSaving[employeeKey] = true
  try {
    const res = await $fetch<{ note: string }>(`/api/c-player-notes/${employeeKey}`, {
      method: 'PUT',
      body: { note: notes[employeeKey] ?? '' }
    })
    notes[employeeKey] = typeof res?.note === 'string' ? res.note : (notes[employeeKey] ?? '')
    noteSavedAt[employeeKey] = Date.now()
  } catch (err) {
    noteError[employeeKey] = getErrorMessage(err) || 'Failed to save note.'
  } finally {
    noteSaving[employeeKey] = false
  }
}

async function saveNoteAndClose(employeeKey: string) {
  await saveNote(employeeKey)
  if (!noteError[employeeKey]) {
    editingNoteEmployeeKey.value = null
  }
}

if (import.meta.client) {
  watch(
    cPlayers,
    (items) => {
      for (const e of items) {
        if (typeof notes[e.employeeKey] !== 'string' && !noteLoading[e.employeeKey]) {
          notes[e.employeeKey] = ''
          loadNote(e.employeeKey)
        } else if (!noteLoading[e.employeeKey] && !noteError[e.employeeKey] && noteSavedAt[e.employeeKey] === undefined) {
          loadNote(e.employeeKey)
        }
      }
    },
    { immediate: true }
  )
}
</script>

