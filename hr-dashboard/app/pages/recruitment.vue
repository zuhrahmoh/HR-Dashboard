<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold">Recruitment &amp; Onboarding</h1>
      <p class="text-slate-300">Track critical vacancies, recruitment, and onboarding.</p>
    </div>

    <hr class="border-slate-800" />

    <section class="space-y-3">
      <div class="space-y-2">
        <h2 class="text-base font-semibold text-slate-200">Critical Vacancies</h2>
        <button
          v-if="!showVacancyForm"
          type="button"
          class="inline-flex items-center rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
          @click="showVacancyForm = true"
        >
          <span aria-hidden="true" class="mr-1.5 font-semibold">+</span>
          <span>Add vacancy</span>
        </button>
      </div>

      <form
        v-if="showVacancyForm"
        class="rounded-md border border-slate-800 bg-slate-900 p-4"
        @submit.prevent="createVacancy"
      >
        <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Position Title</div>
            <input
              v-model="vacancyForm.positionTitle"
              type="text"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500"
            />
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Department</div>
            <select
              v-model="vacancyForm.department"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            >
              <option value="" disabled>Select department</option>
              <option v-for="d in vacancyDepartments" :key="d" :value="d">{{ d }}</option>
            </select>
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Country</div>
            <select
              v-model="vacancyForm.country"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            >
              <option value="" disabled>Select country</option>
              <option v-for="c in vacancyCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Priority</div>
            <select
              v-model="vacancyForm.priority"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            >
              <option value="" disabled>Select priority</option>
              <option v-for="p in vacancyPriorities" :key="p" :value="p">{{ formatPriority(p) }}</option>
            </select>
          </label>
        </div>

        <div class="mt-3 flex items-center justify-between gap-3">
          <div v-if="vacancyActionError" class="text-xs text-red-200">{{ vacancyActionError }}</div>
          <div class="ml-auto flex items-center gap-2">
            <button
              type="button"
              class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
              @click="cancelVacancyCreate"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="inline-flex items-center rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40 disabled:opacity-60"
              :disabled="vacancySaving"
            >
              <span aria-hidden="true" class="mr-1.5 font-semibold">+</span>
              <span>Add vacancy</span>
            </button>
          </div>
        </div>
      </form>

      <div v-if="vacanciesPending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div v-else-if="vacanciesError" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load vacancies.
        <div v-if="vacanciesErrorMessage" class="mt-2 text-xs text-red-200/80">{{ vacanciesErrorMessage }}</div>
      </div>
      <div v-else-if="(vacancies?.length ?? 0) === 0" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">
        No vacancies yet.
      </div>
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div v-for="v in vacancies" :key="v.id" class="rounded-md border border-slate-800 bg-slate-900 p-4">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="truncate text-sm font-semibold text-slate-50">{{ v.positionTitle }}</div>
              <div class="mt-1 text-xs text-slate-300">{{ v.department }} · {{ v.country }}</div>
              <div class="mt-2">
                <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" :class="priorityBadgeClass(v.priority)">
                  {{ formatPriority(v.priority) }}
                </span>
              </div>
            </div>

            <div class="shrink-0 space-x-2">
              <button
                type="button"
                class="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800/40"
                @click="startEditVacancy(v)"
              >
                Edit
              </button>
              <button
                type="button"
                class="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800/40"
                @click="deleteVacancy(v.id)"
              >
                Delete
              </button>
            </div>
          </div>

          <form v-if="vacancyEditId === v.id" class="mt-4 space-y-3" @submit.prevent="saveEditVacancy">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label class="block">
                <div class="mb-1 text-xs text-slate-300">Position Title</div>
                <input
                  v-model="vacancyEditForm.positionTitle"
                  type="text"
                  class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                />
              </label>
              <label class="block">
                <div class="mb-1 text-xs text-slate-300">Department</div>
                <select
                  v-model="vacancyEditForm.department"
                  class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                >
                  <option value="" disabled>Select department</option>
                  <option v-for="d in vacancyDepartments" :key="d" :value="d">{{ d }}</option>
                </select>
              </label>
              <label class="block">
                <div class="mb-1 text-xs text-slate-300">Country</div>
                <select
                  v-model="vacancyEditForm.country"
                  class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                >
                  <option value="" disabled>Select country</option>
                  <option v-for="c in vacancyCountries" :key="c" :value="c">{{ c }}</option>
                </select>
              </label>
              <label class="block">
                <div class="mb-1 text-xs text-slate-300">Priority</div>
                <select
                  v-model="vacancyEditForm.priority"
                  class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                >
                  <option value="" disabled>Select priority</option>
                  <option v-for="p in vacancyPriorities" :key="p" :value="p">{{ formatPriority(p) }}</option>
                </select>
              </label>
            </div>

            <div v-if="vacancyEditError" class="text-xs text-red-200">{{ vacancyEditError }}</div>

            <div class="flex items-center justify-end gap-2">
              <button
                type="button"
                class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
                @click="cancelEditVacancy"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40 disabled:opacity-60"
                :disabled="vacancySaving"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <hr class="border-slate-800" />

    <section class="space-y-3">
      <div class="space-y-2">
        <h2 class="text-base font-semibold text-slate-200">Critical Recruitment</h2>
        <button
          v-if="!showCriticalRecruitmentForm"
          type="button"
          class="inline-flex items-center rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
          @click="showCriticalRecruitmentForm = true"
        >
          <span aria-hidden="true" class="mr-1.5 font-semibold">+</span>
          <span>Add candidate</span>
        </button>
      </div>

      <form
        v-if="showCriticalRecruitmentForm"
        class="rounded-md border border-slate-800 bg-slate-900 p-4"
        @submit.prevent="createCriticalRecruitment"
      >
        <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Candidate Name</div>
            <input
              v-model="criticalRecruitmentForm.candidateName"
              type="text"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            />
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Position</div>
            <input
              v-model="criticalRecruitmentForm.position"
              type="text"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            />
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Country</div>
            <select
              v-model="criticalRecruitmentForm.country"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            >
              <option value="" disabled>Select country</option>
              <option v-for="c in vacancyCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Stage</div>
            <select
              v-model="criticalRecruitmentForm.stage"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            >
              <option value="" disabled>Select stage</option>
              <option v-for="s in criticalRecruitmentStages" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
        </div>

        <div class="mt-3 flex items-center justify-between gap-3">
          <div v-if="criticalRecruitmentActionError" class="text-xs text-red-200">{{ criticalRecruitmentActionError }}</div>
          <div class="ml-auto flex items-center gap-2">
            <button
              type="button"
              class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
              @click="cancelCriticalRecruitmentCreate"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="inline-flex items-center rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40 disabled:opacity-60"
              :disabled="criticalRecruitmentSaving"
            >
              <span aria-hidden="true" class="mr-1.5 font-semibold">+</span>
              <span>Add candidate</span>
            </button>
          </div>
        </div>
      </form>

      <div v-if="criticalRecruitmentPending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div
        v-else-if="criticalRecruitmentError"
        class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200"
      >
        Failed to load critical recruitment.
        <div v-if="criticalRecruitmentErrorMessage" class="mt-2 text-xs text-red-200/80">{{ criticalRecruitmentErrorMessage }}</div>
      </div>
      <div
        v-else
        class="overflow-hidden rounded-md border border-slate-800 bg-slate-900"
      >
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-950 text-slate-300">
              <tr>
                <th class="px-4 py-3 font-medium">Candidate</th>
                <th class="px-4 py-3 font-medium">Position</th>
                <th class="px-4 py-3 font-medium">Country</th>
                <th class="px-4 py-3 font-medium">Stage</th>
                <th class="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in criticalRecruitment" :key="c.id" class="border-t border-slate-800">
                <template v-if="criticalRecruitmentEditId === c.id">
                  <td class="px-4 py-3">
                    <input
                      v-model="criticalRecruitmentEditForm.candidateName"
                      type="text"
                      class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <input
                      v-model="criticalRecruitmentEditForm.position"
                      type="text"
                      class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <select
                      v-model="criticalRecruitmentEditForm.country"
                      class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                    >
                      <option value="" disabled>Select country</option>
                      <option v-for="c in vacancyCountries" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </td>
                  <td class="px-4 py-3">
                    <select
                      v-model="criticalRecruitmentEditForm.stage"
                      class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                    >
                      <option value="" disabled>Select stage</option>
                      <option v-for="s in criticalRecruitmentStages" :key="s" :value="s">{{ s }}</option>
                    </select>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40"
                        @click="cancelEditCriticalRecruitment"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40 disabled:opacity-60"
                        :disabled="criticalRecruitmentSaving"
                        @click="saveEditCriticalRecruitment"
                      >
                        Save
                      </button>
                    </div>
                    <div v-if="criticalRecruitmentEditError" class="mt-2 text-xs text-red-200">{{ criticalRecruitmentEditError }}</div>
                  </td>
                </template>

                <template v-else>
                  <td class="px-4 py-3 text-slate-50">{{ c.candidateName }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ c.position }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ c.country }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" :class="criticalRecruitmentStageBadgeClass(c.stage)">
                      {{ c.stage }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40"
                        @click="startEditCriticalRecruitment(c)"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        class="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-950/50"
                        @click="deleteCriticalRecruitment(c.id)"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </template>
              </tr>

              <tr v-if="(criticalRecruitment?.length ?? 0) === 0" class="border-t border-slate-800">
                <td colspan="5" class="px-4 py-6 text-center text-slate-300">No candidates yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <hr class="border-slate-800" />

    <section class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-slate-200">New Hires</h2>
        <label class="flex items-center gap-2 text-sm font-medium text-slate-300">
          <span class="whitespace-nowrap">Month</span>
          <select
            v-model="selectedNewHireMonth"
            class="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus:border-slate-600"
          >
            <option v-for="m in newHireMonths" :key="m" :value="m">{{ formatMonthLabel(m) }}</option>
          </select>
        </label>
      </div>

      <div v-if="odooNewHiresPending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div v-else-if="odooNewHiresError" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load new hires.
        <div v-if="odooNewHiresErrorMessage" class="mt-2 text-xs text-red-200/80">{{ odooNewHiresErrorMessage }}</div>
      </div>
      <div v-else class="overflow-hidden rounded-md border border-slate-800 bg-slate-900">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-950 text-slate-300">
              <tr>
                <th class="px-4 py-3 font-medium">Name</th>
                <th class="px-4 py-3 font-medium">Position</th>
                <th class="px-4 py-3 font-medium">Country</th>
                <th class="px-4 py-3 font-medium">Start Date</th>
                <th class="px-4 py-3 font-medium">Tenure</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="n in odooNewHires" :key="n.employeeKey" class="border-t border-slate-800">
                <td class="px-4 py-3 text-slate-50">{{ n.name }}</td>
                <td class="px-4 py-3 text-slate-200">{{ n.position }}</td>
                <td class="px-4 py-3 text-slate-200">{{ n.countryAssigned }}</td>
                <td class="px-4 py-3 text-slate-200">{{ formatYmdDateOrDash(n.startDate) }}</td>
                <td class="px-4 py-3 text-slate-200">{{ n.tenure || '—' }}</td>
              </tr>

              <tr v-if="odooNewHires.length === 0" class="border-t border-slate-800">
                <td colspan="5" class="px-4 py-6 text-center text-slate-300">No new hires found for this month.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="space-y-2 pt-2">
        <h3 class="text-sm font-semibold text-slate-200">New Hire Check-ins</h3>
        <NewHireCheckinsTable :items="odooNewHires" />
      </div>
    </section>

    <hr class="border-slate-800" />

    <section class="space-y-3">
      <div class="space-y-1">
        <h2 class="text-base font-semibold text-slate-200">Recent Separations</h2>
        <p class="text-xs text-slate-400">Employees where Active = false (resigned / fired / retired).</p>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-slate-300">Archived employees (by month, from Odoo write date).</div>
        <label class="flex items-center gap-2 text-sm font-medium text-slate-300">
          <span class="whitespace-nowrap">Month</span>
          <select
            v-model="selectedSeparationMonth"
            class="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus:border-slate-600"
          >
            <option v-for="m in separationMonths" :key="m" :value="m">{{ formatMonthLabel(m) }}</option>
          </select>
        </label>
      </div>

      <div v-if="separationsPending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
      <div v-else-if="separationsError" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
        Failed to load employees.
        <div v-if="separationsErrorMessage" class="mt-2 text-xs text-red-200/80">{{ separationsErrorMessage }}</div>
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
                <th class="px-4 py-3 font-medium">Separation Date</th>
                <th class="px-4 py-3 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in recentSeparations" :key="e.employeeKey" class="border-t border-slate-800">
                <td class="px-4 py-3 text-slate-50">{{ e.name }}</td>
                <td class="px-4 py-3 text-slate-200">{{ e.department }}</td>
                <td class="px-4 py-3 text-slate-200">{{ e.position }}</td>
                <td class="px-4 py-3 text-slate-200">{{ e.countryAssigned }}</td>
                <td class="px-4 py-3 text-slate-200">{{ formatYmdDateOrDash(e.startDate) }}</td>
                <td class="px-4 py-3 text-slate-200">{{ formatYmdDateOrDash(e.separatedAt) }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" :class="separationTypeBadgeClass(e.separationType)">
                    {{ formatSeparationType(e.separationType) }}
                  </span>
                </td>
              </tr>
              <tr v-if="recentSeparations.length === 0" class="border-t border-slate-800">
                <td colspan="7" class="px-4 py-6 text-center text-slate-300">No separations found for this month.</td>
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
import NewHireCheckinsTable from '~/components/NewHireCheckinsTable.vue'

type Vacancy = {
  id: string
  positionTitle: string
  department: string
  country: string
  priority: string
  createdAt: string
}

type CriticalRecruitment = {
  id: string
  candidateName: string
  position: string
  country: string
  stage: string
  createdAt: string
}

type NewHire = {
  id: string
  name: string
  position: string
  country: string
  startDate: string
  status: string
  createdAt: string
}

type OdooNewHire = {
  employeeKey: string
  name: string
  position: string
  department: string
  countryAssigned: string
  startDate: string | null
  tenure?: string
  createdAt: string | null
}

type OdooNewHiresResponse = {
  currentMonth: string
  months: string[]
  items: OdooNewHire[]
}

type Employee = {
  employeeKey: string
  name: string
  department: string
  position: string
  startDate: string | null
  countryAssigned: string
  employeeStatus: string
}

type OdooSeparationsRow = {
  employeeKey: string
  name: string
  department: string
  position: string
  countryAssigned: string
  startDate: string | null
  separatedAt: string
  separationType: 'resigned' | 'retired' | 'fired' | 'separated'
}

type OdooSeparationsResponse = {
  currentMonth: string
  months: string[]
  items: OdooSeparationsRow[]
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function normalizePriority(value: string) {
  return value.trim().toLowerCase()
}

function formatPriority(value: string) {
  const v = normalizePriority(value)
  if (v === 'high') return 'High'
  if (v === 'medium') return 'Medium'
  if (v === 'low') return 'Low'
  return value.trim()
}

function priorityBadgeClass(value: string) {
  const v = normalizePriority(value)
  if (v === 'high') return 'border-red-900/60 bg-red-950/30 text-red-200'
  if (v === 'medium') return 'border-amber-900/60 bg-amber-950/30 text-amber-200'
  if (v === 'low') return 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200'
  return 'border-slate-700 bg-slate-900 text-slate-200'
}

function normalizeStage(value: string) {
  return value.trim().toLowerCase()
}

function criticalRecruitmentStageBadgeClass(value: string) {
  const v = normalizeStage(value)
  if (v === 'interview stage') return 'border-sky-900/60 bg-sky-950/30 text-sky-200'
  if (v === 'approval stage') return 'border-indigo-900/60 bg-indigo-950/30 text-indigo-200'
  if (v === 'contract development') return 'border-violet-900/60 bg-violet-950/30 text-violet-200'
  if (v === 'plan development') return 'border-teal-900/60 bg-teal-950/30 text-teal-200'
  if (v === 'offer stage') return 'border-amber-900/60 bg-amber-950/30 text-amber-200'
  if (v === 'offer accepted') return 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200'
  return 'border-slate-700 bg-slate-900 text-slate-200'
}

function normalizeNewHireStatus(value: string) {
  return value.trim().toLowerCase()
}

function newHireStatusBadgeClass(value: string) {
  const v = normalizeNewHireStatus(value)
  if (v === 'pre-onboarding stage') return 'border-sky-900/60 bg-sky-950/30 text-sky-200'
  if (v === 'onboarding') return 'border-amber-900/60 bg-amber-950/30 text-amber-200'
  if (v === 'hired') return 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200'
  return 'border-slate-700 bg-slate-900 text-slate-200'
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

function formatMonthLabel(monthKey: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(monthKey.trim())
  if (!m) return monthKey
  const y = Number(m[1])
  const mo = Number(m[2])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return monthKey
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

const {
  data: vacanciesData,
  pending: vacanciesPending,
  error: vacanciesError,
  refresh: refreshVacancies
} = await useFetch<Vacancy[]>('/api/vacancies')
const vacancies = computed(() => vacanciesData.value ?? [])
const vacanciesErrorMessage = computed(() => getErrorMessage(vacanciesError.value))

const {
  data: criticalRecruitmentData,
  pending: criticalRecruitmentPending,
  error: criticalRecruitmentError,
  refresh: refreshCriticalRecruitment
} = await useFetch<CriticalRecruitment[]>('/api/critical-recruitment')
const criticalRecruitment = computed(() => criticalRecruitmentData.value ?? [])
const criticalRecruitmentErrorMessage = computed(() => getErrorMessage(criticalRecruitmentError.value))

const selectedNewHireMonth = ref('')
const newHireQuery = computed(() => ({ month: selectedNewHireMonth.value || undefined }))
const {
  data: odooNewHiresData,
  pending: odooNewHiresPending,
  error: odooNewHiresError
} = await useFetch<OdooNewHiresResponse>('/api/odoo/new-hires', { query: newHireQuery })

const newHireMonths = computed(() => odooNewHiresData.value?.months ?? [])
const odooNewHires = computed(() => odooNewHiresData.value?.items ?? [])
const odooNewHiresErrorMessage = computed(() => getErrorMessage(odooNewHiresError.value))

watchEffect(() => {
  if (selectedNewHireMonth.value) return
  const m = odooNewHiresData.value?.currentMonth
  if (m) selectedNewHireMonth.value = m
})

const { data: employeesData, pending: employeesPending, error: employeesError } = await useFetch<Employee[]>('/api/employees')
const employeesErrorMessage = computed(() => getErrorMessage(employeesError.value))

const selectedSeparationMonth = ref('')
const separationsQuery = computed(() => ({ month: selectedSeparationMonth.value || undefined }))
const {
  data: separationsData,
  pending: separationsPending,
  error: separationsError
} = await useFetch<OdooSeparationsResponse>('/api/odoo/separations', { query: separationsQuery })
const separationsErrorMessage = computed(() => getErrorMessage(separationsError.value))

const separationMonths = computed(() => separationsData.value?.months ?? [])
watchEffect(() => {
  if (selectedSeparationMonth.value) return
  const m = separationsData.value?.currentMonth
  if (m) selectedSeparationMonth.value = m
})

const recentSeparations = computed(() =>
  (separationsData.value?.items ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))
)

const vacancyCountries = computed(() => uniqueSorted((employeesData.value ?? []).map((e) => e.countryAssigned)))
const vacancyDepartments = computed(() => uniqueSorted((employeesData.value ?? []).map((e) => e.department)))
const vacancyPriorities = ['high', 'medium', 'low'] as const
const criticalRecruitmentStages = [
  'Interview stage',
  'Approval stage',
  'Contract development',
  'Plan development',
  'Offer stage',
  'Offer accepted'
] as const
const newHireStatuses = ['Pre-Onboarding Stage', 'Onboarding', 'Hired'] as const

function formatSeparationType(value: OdooSeparationsRow['separationType']) {
  if (value === 'resigned') return 'Resigned'
  if (value === 'retired') return 'Retired'
  if (value === 'fired') return 'Fired'
  return 'Separated'
}

function separationTypeBadgeClass(value: OdooSeparationsRow['separationType']) {
  if (value === 'resigned') return 'border-amber-500/40 bg-amber-950/40 text-amber-100'
  if (value === 'retired') return 'border-violet-400/30 bg-violet-500/10 text-violet-200'
  if (value === 'fired') return 'border-red-500/40 bg-red-950/40 text-red-100'
  return 'border-slate-700 bg-slate-900 text-slate-200'
}

type DatePickerTarget = 'newHireCreate' | 'newHireEdit' | null

const newHireCreateDatePickerEl = ref<HTMLElement | null>(null)
const newHireEditDatePickerEl = ref<HTMLElement | null>(null)

const datePicker = reactive({
  openFor: null as DatePickerTarget,
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth()
})

const datePickerWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map((n) => Number(n))
  if (!y || !m || !d) return false
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

function monthLabel(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })
}

const datePickerMonthLabel = computed(() => monthLabel(datePicker.viewYear, datePicker.viewMonth))

const activeDatePickerValue = computed(() => {
  if (datePicker.openFor === 'newHireCreate') return newHireForm.startDate
  if (datePicker.openFor === 'newHireEdit') return newHireEditForm.startDate
  return ''
})

const datePickerCells = computed(() => {
  const first = new Date(datePicker.viewYear, datePicker.viewMonth, 1)
  const daysInMonth = new Date(datePicker.viewYear, datePicker.viewMonth + 1, 0).getDate()
  const mondayStartOffset = (first.getDay() + 6) % 7
  const cells: Array<{ key: string; day: number | null; iso: string | null }> = []
  for (let i = 0; i < 42; i += 1) {
    const day = i - mondayStartOffset + 1
    if (day < 1 || day > daysInMonth) {
      cells.push({ key: `e-${i}`, day: null, iso: null })
      continue
    }
    const iso = `${datePicker.viewYear}-${pad2(datePicker.viewMonth + 1)}-${pad2(day)}`
    cells.push({ key: iso, day, iso })
  }
  return cells
})

function openDatePicker(target: Exclude<DatePickerTarget, null>) {
  datePicker.openFor = target
  const value = target === 'newHireCreate' ? newHireForm.startDate : newHireEditForm.startDate
  if (isValidIsoDate(value)) {
    const parts = value.split('-')
    const y = Number(parts[0])
    const m = Number(parts[1])
    datePicker.viewYear = y
    datePicker.viewMonth = m - 1
    return
  }
  const now = new Date()
  datePicker.viewYear = now.getFullYear()
  datePicker.viewMonth = now.getMonth()
}

function toggleDatePicker(target: Exclude<DatePickerTarget, null>) {
  if (datePicker.openFor === target) {
    datePicker.openFor = null
    return
  }
  openDatePicker(target)
}

function closeDatePicker() {
  datePicker.openFor = null
}

function shiftDatePickerMonth(delta: -1 | 1) {
  const dt = new Date(datePicker.viewYear, datePicker.viewMonth + delta, 1)
  datePicker.viewYear = dt.getFullYear()
  datePicker.viewMonth = dt.getMonth()
}

function selectDatePickerDate(iso: string) {
  if (!datePicker.openFor) return
  if (datePicker.openFor === 'newHireCreate') newHireForm.startDate = iso
  if (datePicker.openFor === 'newHireEdit') newHireEditForm.startDate = iso
  closeDatePicker()
}

const showVacancyForm = ref(false)
const vacancyForm = reactive({ positionTitle: '', department: '', country: '', priority: '' })
const vacancySaving = ref(false)
const vacancyActionError = ref('')
const vacancyEditId = ref<string | null>(null)
const vacancyEditForm = reactive({ positionTitle: '', department: '', country: '', priority: '' })
const vacancyEditError = ref('')

function cancelVacancyCreate() {
  vacancyActionError.value = ''
  showVacancyForm.value = false
}

async function createVacancy() {
  vacancyActionError.value = ''
  vacancySaving.value = true
  try {
    await $fetch('/api/vacancies', { method: 'POST', body: { ...vacancyForm } })
    vacancyForm.positionTitle = ''
    vacancyForm.department = ''
    vacancyForm.country = ''
    vacancyForm.priority = ''
    showVacancyForm.value = false
    await refreshVacancies()
  } catch (err) {
    vacancyActionError.value = getErrorMessage(err)
  } finally {
    vacancySaving.value = false
  }
}

function startEditVacancy(v: Vacancy) {
  vacancyEditError.value = ''
  vacancyEditId.value = v.id
  vacancyEditForm.positionTitle = v.positionTitle
  vacancyEditForm.department = v.department
  vacancyEditForm.country = v.country
  vacancyEditForm.priority = v.priority
}

function cancelEditVacancy() {
  vacancyEditId.value = null
  vacancyEditError.value = ''
}

async function saveEditVacancy() {
  const id = vacancyEditId.value
  if (!id) return
  vacancyEditError.value = ''
  vacancySaving.value = true
  try {
    await $fetch(`/api/vacancies/${id}`, { method: 'PUT', body: { ...vacancyEditForm } })
    vacancyEditId.value = null
    await refreshVacancies()
  } catch (err) {
    vacancyEditError.value = getErrorMessage(err)
  } finally {
    vacancySaving.value = false
  }
}

async function deleteVacancy(id: string) {
  vacancyActionError.value = ''
  vacancySaving.value = true
  try {
    await $fetch(`/api/vacancies/${id}`, { method: 'DELETE' })
    if (vacancyEditId.value === id) vacancyEditId.value = null
    await refreshVacancies()
  } catch (err) {
    vacancyActionError.value = getErrorMessage(err)
  } finally {
    vacancySaving.value = false
  }
}

const showCriticalRecruitmentForm = ref(false)
const criticalRecruitmentForm = reactive({ candidateName: '', position: '', country: '', stage: '' })
const criticalRecruitmentSaving = ref(false)
const criticalRecruitmentActionError = ref('')
const criticalRecruitmentEditId = ref<string | null>(null)
const criticalRecruitmentEditForm = reactive({ candidateName: '', position: '', country: '', stage: '' })
const criticalRecruitmentEditError = ref('')

function cancelCriticalRecruitmentCreate() {
  criticalRecruitmentActionError.value = ''
  showCriticalRecruitmentForm.value = false
}

async function createCriticalRecruitment() {
  criticalRecruitmentActionError.value = ''
  criticalRecruitmentSaving.value = true
  try {
    await $fetch('/api/critical-recruitment', { method: 'POST', body: { ...criticalRecruitmentForm } })
    criticalRecruitmentForm.candidateName = ''
    criticalRecruitmentForm.position = ''
    criticalRecruitmentForm.country = ''
    criticalRecruitmentForm.stage = ''
    showCriticalRecruitmentForm.value = false
    await refreshCriticalRecruitment()
  } catch (err) {
    criticalRecruitmentActionError.value = getErrorMessage(err)
  } finally {
    criticalRecruitmentSaving.value = false
  }
}

function startEditCriticalRecruitment(c: CriticalRecruitment) {
  criticalRecruitmentEditError.value = ''
  criticalRecruitmentEditId.value = c.id
  criticalRecruitmentEditForm.candidateName = c.candidateName
  criticalRecruitmentEditForm.position = c.position
  criticalRecruitmentEditForm.country = c.country
  criticalRecruitmentEditForm.stage = c.stage
}

function cancelEditCriticalRecruitment() {
  criticalRecruitmentEditId.value = null
  criticalRecruitmentEditError.value = ''
}

async function saveEditCriticalRecruitment() {
  const id = criticalRecruitmentEditId.value
  if (!id) return
  criticalRecruitmentEditError.value = ''
  criticalRecruitmentSaving.value = true
  try {
    await $fetch(`/api/critical-recruitment/${id}`, { method: 'PUT', body: { ...criticalRecruitmentEditForm } })
    criticalRecruitmentEditId.value = null
    await refreshCriticalRecruitment()
  } catch (err) {
    criticalRecruitmentEditError.value = getErrorMessage(err)
  } finally {
    criticalRecruitmentSaving.value = false
  }
}

async function deleteCriticalRecruitment(id: string) {
  criticalRecruitmentActionError.value = ''
  criticalRecruitmentSaving.value = true
  try {
    await $fetch(`/api/critical-recruitment/${id}`, { method: 'DELETE' })
    if (criticalRecruitmentEditId.value === id) criticalRecruitmentEditId.value = null
    await refreshCriticalRecruitment()
  } catch (err) {
    criticalRecruitmentActionError.value = getErrorMessage(err)
  } finally {
    criticalRecruitmentSaving.value = false
  }
}

const showNewHireForm = ref(false)
const newHireForm = reactive({ name: '', position: '', country: '', startDate: '', status: '' })
const newHireSaving = ref(false)
const newHireActionError = ref('')
const newHireEditId = ref<string | null>(null)
const newHireEditForm = reactive({ name: '', position: '', country: '', startDate: '', status: '' })
const newHireEditError = ref('')

onMounted(() => {
  const onPointerDown = (event: MouseEvent) => {
    if (!datePicker.openFor) return
    const container = datePicker.openFor === 'newHireCreate' ? newHireCreateDatePickerEl.value : newHireEditDatePickerEl.value
    if (!container) return
    const target = event.target
    if (target instanceof Node && !container.contains(target)) closeDatePicker()
  }
  window.addEventListener('mousedown', onPointerDown)
  onBeforeUnmount(() => window.removeEventListener('mousedown', onPointerDown))
})

function cancelNewHireCreate() {
  newHireActionError.value = ''
  showNewHireForm.value = false
}

async function createNewHire() {
  newHireActionError.value = ''
  newHireSaving.value = true
  try {
    await $fetch('/api/new-hires', { method: 'POST', body: { ...newHireForm } })
    newHireForm.name = ''
    newHireForm.position = ''
    newHireForm.country = ''
    newHireForm.startDate = ''
    newHireForm.status = ''
    showNewHireForm.value = false
    await refreshNewHires()
  } catch (err) {
    newHireActionError.value = getErrorMessage(err)
  } finally {
    newHireSaving.value = false
  }
}

function startEditNewHire(n: NewHire) {
  newHireEditError.value = ''
  newHireEditId.value = n.id
  newHireEditForm.name = n.name
  newHireEditForm.position = n.position
  newHireEditForm.country = n.country
  newHireEditForm.startDate = n.startDate
  newHireEditForm.status = n.status
}

function cancelEditNewHire() {
  newHireEditId.value = null
  newHireEditError.value = ''
}

async function saveEditNewHire() {
  const id = newHireEditId.value
  if (!id) return
  newHireEditError.value = ''
  newHireSaving.value = true
  try {
    await $fetch(`/api/new-hires/${id}`, { method: 'PUT', body: { ...newHireEditForm } })
    newHireEditId.value = null
    await refreshNewHires()
  } catch (err) {
    newHireEditError.value = getErrorMessage(err)
  } finally {
    newHireSaving.value = false
  }
}

async function deleteNewHire(id: string) {
  newHireActionError.value = ''
  newHireSaving.value = true
  try {
    await $fetch(`/api/new-hires/${id}`, { method: 'DELETE' })
    if (newHireEditId.value === id) newHireEditId.value = null
    await refreshNewHires()
  } catch (err) {
    newHireActionError.value = getErrorMessage(err)
  } finally {
    newHireSaving.value = false
  }
}
</script>

