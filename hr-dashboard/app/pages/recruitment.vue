<template>
  <div class="space-y-6" :data-report-ready="reportReady ? '1' : undefined">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold">Recruitment &amp; Onboarding</h1>
      <p class="text-slate-300">Track critical vacancies, recruitment, onboarding and offboarding processes.</p>
    </div>

    <hr v-if="!isReportMode" class="border-slate-800" />

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
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        <div v-for="v in vacanciesForDisplay" :key="v.id" class="rounded-md border border-slate-800 bg-slate-900 p-3">
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
      <div v-if="isReportMode && vacancies.length > vacanciesForDisplay.length" class="mt-3 text-xs text-slate-400">
        Showing top {{ vacanciesForDisplay.length }} vacancies. See the dashboard for the full list.
      </div>

      <div class="rounded-md border border-slate-700 bg-slate-800/20 p-3 text-xs text-slate-200">
        <div class="flex items-center gap-2 font-semibold text-slate-100">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 text-amber-300">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M10 18a8 8 0 1 0 0-16a8 8 0 0 0 0 16Zm0-13.25a1 1 0 0 1 1 1V12a1 1 0 1 1-2 0V5.75a1 1 0 0 1 1-1Zm0 11.75a1.25 1.25 0 1 0 0-2.5a1.25 1.25 0 0 0 0 2.5Z"
            />
          </svg>
          <span>Shortlisting of Candidates</span>
        </div>
        <div class="mt-2 space-y-1 text-slate-200/90">
          <div>
            (a) Receive, review, and acknowledge request. Determine if to proceed with obtaining approval or dismiss, based on HR’s assessment for the need for the resource.
          </div>
          <div>
            (b) Obtain internal approval to recruit and advertise or review database.
          </div>
          <div>
            (c) Screen and shortlist candidates.
          </div>
        </div>
      </div>
    </section>

    <hr v-if="!isReportMode" class="border-slate-800" />

    <section class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-slate-200">Recruitment &amp; Onboarding</h2>
        <div class="flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-2 text-sm font-medium text-slate-300">
            <span class="whitespace-nowrap">Country</span>
            <select
              v-model="selectedRecruitmentCountry"
              class="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus:border-slate-600"
            >
              <option value="">All</option>
              <option v-for="c in criticalRecruitmentCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-sm font-medium text-slate-300">
            <span class="whitespace-nowrap">Stage</span>
            <select
              v-model="selectedRecruitmentStage"
              class="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus:border-slate-600"
            >
              <option value="">All</option>
              <option v-for="s in criticalRecruitmentStages" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
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
          <label class="block md:col-span-4">
            <div class="mb-1 text-sm text-slate-300">Notes (optional)</div>
            <input
              v-model="criticalRecruitmentForm.notes"
              type="text"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500"
              placeholder="Add any notes for this candidate…"
            />
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
        Failed to load recruitment.
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
                <th class="px-4 py-3 font-medium">Notes</th>
                <th class="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in criticalRecruitmentForDisplay" :key="c.id" class="border-t border-slate-800">
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
                  <td class="px-4 py-3">
                    <input
                      v-model="criticalRecruitmentEditForm.notes"
                      type="text"
                      class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500"
                      placeholder="Notes…"
                    />
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
                      {{ normalizeRecruitmentStage(c.stage) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 align-top text-slate-200">
                    <div class="max-w-[28rem] whitespace-normal break-words" :class="isReportMode ? 'report-clamp-2' : ''">
                      {{ c.notes || '—' }}
                    </div>
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

              <tr v-if="(filteredCriticalRecruitment?.length ?? 0) === 0" class="border-t border-slate-800">
                <td colspan="6" class="px-4 py-6 text-center text-slate-300">No candidates found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-if="isReportMode && filteredCriticalRecruitment.length > criticalRecruitmentForDisplay.length" class="mt-3 text-xs text-slate-400">
        Showing top {{ criticalRecruitmentForDisplay.length }} candidates. See the dashboard for the full list.
      </div>
    </section>

    <hr v-if="!isReportMode" class="border-slate-800" />

    <section v-if="!isReportMode" class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-slate-200">New Hires</h2>
        <div class="flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-2 text-sm font-medium text-slate-300">
            <span class="whitespace-nowrap">Country</span>
            <select
              v-model="selectedNewHireCountry"
              class="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus:border-slate-600"
            >
              <option value="">All</option>
              <option v-for="c in newHireCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
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
                <th class="px-4 py-3 font-medium">Onboarding Checklist</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="n in filteredNewHires" :key="n.employeeKey">
                <tr class="border-t border-slate-800 align-top">
                  <td class="px-4 py-3 text-slate-50">{{ n.name }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ n.position }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ n.countryAssigned }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ formatYmdDateOrDash(n.startDate) }}</td>
                  <td class="px-4 py-3 text-slate-200">{{ n.tenure || '—' }}</td>
                  <td class="px-4 py-3">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40"
                      @click="toggleOnboardingChecklist(n)"
                    >
                      <span>
                        Checklist ({{ onboardingDoneCount(n) }}/{{ ONBOARDING_TASKS.length }})
                      </span>
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        class="h-4 w-4 text-slate-400"
                        aria-hidden="true"
                        :class="expandedOnboardingKey === onboardingRowKey(n) ? 'rotate-180' : ''"
                      >
                        <path
                          fill-rule="evenodd"
                          clip-rule="evenodd"
                          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>

                <tr v-if="expandedOnboardingKey === onboardingRowKey(n)" class="border-t border-slate-800">
                  <td colspan="6" class="bg-slate-950/30 px-4 py-4">
                    <div class="space-y-3">
                      <div class="text-xs font-semibold text-slate-200">Onboarding Checklist</div>
                      <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <label
                          v-for="(task, idx) in ONBOARDING_TASKS"
                          :key="task"
                          class="flex cursor-pointer items-start gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 hover:bg-slate-900/40"
                        >
                          <input
                            type="checkbox"
                            class="sr-only"
                            :checked="isOnboardingTaskDone(n, idx)"
                            @change="(e) => setOnboardingTaskDone(n, idx, (e.target as HTMLInputElement).checked)"
                          />
                          <span
                            class="relative mt-0.5 inline-flex h-5 w-5 shrink-0 rounded-full border"
                            :class="
                              isOnboardingTaskDone(n, idx)
                                ? 'border-sky-400/50 bg-sky-500/15'
                                : 'border-slate-600/60 bg-slate-950'
                            "
                            aria-hidden="true"
                          >
                            <span
                              v-if="isOnboardingTaskDone(n, idx)"
                              class="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-200"
                            />
                          </span>
                          <span
                            class="text-sm"
                            :class="isOnboardingTaskDone(n, idx) ? 'text-slate-400 line-through' : 'text-slate-200'"
                          >
                            {{ task }}
                          </span>
                        </label>
                      </div>
                      <div class="text-xs text-slate-400">Checked items are saved in this browser.</div>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="filteredNewHires.length === 0" class="border-t border-slate-800">
                <td colspan="6" class="px-4 py-6 text-center text-slate-300">No new hires found for this month.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <hr v-if="!isReportMode" class="border-slate-800" />

    <section v-if="!isReportMode" class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-slate-200">Offboarding</h2>
          <p class="text-xs text-slate-400">Manual tracker for HR to record offboarding progress.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-2 text-sm font-medium text-slate-300">
            <span class="whitespace-nowrap">Country</span>
            <select
              v-model="selectedOffboardingCountry"
              class="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus:border-slate-600"
            >
              <option value="">All</option>
              <option v-for="c in offboardingCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <button
            v-if="!showOffboardingCreateForm"
            type="button"
            class="inline-flex items-center rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
            @click="showOffboardingCreateForm = true"
          >
            <span aria-hidden="true" class="mr-1.5 font-semibold">+</span>
            <span>Add offboarding</span>
          </button>
        </div>
      </div>

      <form
        v-if="showOffboardingCreateForm"
        class="rounded-md border border-slate-800 bg-slate-900 p-4"
        @submit.prevent="createOffboarding"
      >
        <div class="grid grid-cols-1 gap-3 md:grid-cols-6">
          <label class="block md:col-span-2">
            <div class="mb-1 text-sm text-slate-300">Name</div>
            <input
              v-model="offboardingCreateForm.name"
              type="text"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            />
          </label>

          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Country</div>
            <select
              v-model="offboardingCreateForm.country"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            >
              <option value="" disabled>Select country</option>
              <option v-for="c in vacancyCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>

          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Departure Type</div>
            <select
              v-model="offboardingCreateForm.departureType"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            >
              <option value="" disabled>Select type</option>
              <option v-for="t in offboardingDepartureTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </label>

          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Status</div>
            <select
              v-model="offboardingCreateForm.status"
              class="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
            >
              <option value="" disabled>Select status</option>
              <option v-for="s in offboardingStatuses" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </label>

          <label class="block">
            <div class="mb-1 text-sm text-slate-300">Date Effective</div>
            <DateInput v-model="offboardingCreateForm.effectiveDate" />
          </label>
        </div>

        <div class="mt-3 flex items-center justify-between gap-3">
          <div v-if="offboardingCreateError" class="text-xs text-red-200">{{ offboardingCreateError }}</div>
          <div class="ml-auto flex items-center gap-2">
            <button
              type="button"
              class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
              @click="cancelOffboardingCreate"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
            >
              Save
            </button>
          </div>
        </div>
      </form>

      <div class="overflow-hidden rounded-md border border-slate-800 bg-slate-900">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-950 text-slate-300">
              <tr>
                <th class="px-4 py-3 font-medium">Name</th>
                <th class="px-4 py-3 font-medium">Country</th>
                <th class="px-4 py-3 font-medium">Departure Type</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium">Date Effective</th>
                <th class="px-4 py-3 font-medium">Exit Checklist</th>
                <th class="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="row in filteredOffboardingRows" :key="row.id">
                <tr class="border-t border-slate-800 align-top">
                  <template v-if="offboardingEditId === row.id">
                    <td class="px-4 py-3">
                      <input
                        v-model="offboardingEditForm.name"
                        type="text"
                        class="w-full min-w-56 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                      />
                    </td>
                    <td class="px-4 py-3">
                      <select
                        v-model="offboardingEditForm.country"
                        class="w-full min-w-40 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                      >
                        <option value="" disabled>Select country</option>
                        <option v-for="c in vacancyCountries" :key="c" :value="c">{{ c }}</option>
                      </select>
                    </td>
                    <td class="px-4 py-3">
                      <select
                        v-model="offboardingEditForm.departureType"
                        class="w-full min-w-40 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                      >
                        <option value="" disabled>Select type</option>
                        <option v-for="t in offboardingDepartureTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
                      </select>
                    </td>
                    <td class="px-4 py-3">
                      <select
                        v-model="offboardingEditForm.status"
                        class="w-full min-w-56 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50"
                      >
                        <option value="" disabled>Select status</option>
                        <option v-for="s in offboardingStatuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                      </select>
                    </td>
                    <td class="px-4 py-3">
                      <DateInput v-model="offboardingEditForm.effectiveDate" />
                    </td>
                    <td class="px-4 py-3 text-slate-400"></td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex justify-end gap-2">
                        <button
                          type="button"
                          class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40"
                          @click="cancelEditOffboarding"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40"
                          @click="saveEditOffboarding"
                        >
                          Save
                        </button>
                      </div>
                      <div v-if="offboardingEditError" class="mt-2 text-xs text-red-200">{{ offboardingEditError }}</div>
                    </td>
                  </template>

                  <template v-else>
                    <td class="px-4 py-3 font-medium text-slate-50">{{ row.name || '—' }}</td>
                    <td class="px-4 py-3 text-slate-200">{{ row.country || '—' }}</td>
                    <td class="px-4 py-3 text-slate-200">
                      <span
                        v-if="row.departureType"
                        class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                        :class="offboardingDepartureTypeBadgeClass(row.departureType)"
                      >
                        {{ offboardingDepartureTypeLabel(row.departureType) }}
                      </span>
                      <span v-else class="text-slate-400">—</span>
                    </td>
                    <td class="px-4 py-3 text-slate-200">
                      <span
                        v-if="row.status"
                        class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                        :class="offboardingStatusBadgeClass(row.status)"
                      >
                        {{ offboardingStatusLabel(row.status) }}
                      </span>
                      <span v-else class="text-slate-400">—</span>
                    </td>
                    <td class="whitespace-nowrap px-4 py-3 tabular-nums text-slate-200">{{ row.effectiveDate || '—' }}</td>
                    <td class="px-4 py-3">
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40"
                        @click="toggleExitChecklist(row)"
                      >
                        <span>Checklist ({{ exitDoneCount(row) }}/{{ EXIT_TASKS.length }})</span>
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          class="h-4 w-4 text-slate-400"
                          aria-hidden="true"
                          :class="expandedExitChecklistId === row.id ? 'rotate-180' : ''"
                        >
                          <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                          />
                        </svg>
                      </button>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex justify-end gap-2">
                        <button
                          type="button"
                          class="rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/40"
                          @click="startEditOffboarding(row)"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          class="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-1.5 text-xs text-red-200 hover:bg-red-950/50"
                          @click="deleteOffboarding(row.id)"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </template>
                </tr>

                <tr
                  v-if="offboardingEditId !== row.id && expandedExitChecklistId === row.id"
                  class="border-t border-slate-800"
                >
                  <td colspan="7" class="bg-slate-950/30 px-4 py-4">
                    <div class="space-y-3">
                      <div class="text-xs font-semibold text-slate-200">Exit Checklist</div>
                      <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <label
                          v-for="(task, idx) in EXIT_TASKS"
                          :key="task"
                          class="flex cursor-pointer items-start gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 hover:bg-slate-900/40"
                        >
                          <input
                            type="checkbox"
                            class="sr-only"
                            :checked="isExitTaskDone(row, idx)"
                            @change="(e) => setExitTaskDone(row, idx, (e.target as HTMLInputElement).checked)"
                          />
                          <span
                            class="relative mt-0.5 inline-flex h-5 w-5 shrink-0 rounded-full border"
                            :class="
                              isExitTaskDone(row, idx)
                                ? 'border-sky-400/50 bg-sky-500/15'
                                : 'border-slate-600/60 bg-slate-950'
                            "
                            aria-hidden="true"
                          >
                            <span
                              v-if="isExitTaskDone(row, idx)"
                              class="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-200"
                            />
                          </span>
                          <span
                            class="text-sm"
                            :class="isExitTaskDone(row, idx) ? 'text-slate-400 line-through' : 'text-slate-200'"
                          >
                            {{ task }}
                          </span>
                        </label>
                      </div>
                      <div class="text-xs text-slate-400">Checked items are saved in this browser.</div>
                    </div>
                  </td>
                </tr>
              </template>

              <tr v-if="filteredOffboardingRows.length === 0" class="border-t border-slate-800">
                <td colspan="7" class="px-4 py-6 text-center text-slate-300">No offboarding items yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <hr v-if="!isReportMode" class="border-slate-800" />

    <section v-if="!isReportMode" class="space-y-3">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-slate-200">Upcoming Onboarding Check-ins</h2>
          <p class="text-xs text-slate-400">Shows 1–6 month check-ins when they are due within the next 14 days (probation &lt; 6 months).</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-2 text-sm font-medium text-slate-300">
            <span class="whitespace-nowrap">Country</span>
            <select
              v-model="selectedCheckinsCountry"
              class="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus:border-slate-600"
            >
              <option value="">All</option>
              <option v-for="c in checkinsCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-sm font-medium text-slate-300">
            <span class="whitespace-nowrap">Check-in</span>
            <select
              v-model="upcomingCheckinsFilter"
              class="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus:border-slate-600"
            >
              <option value="all">All</option>
              <option value="1">1 month</option>
              <option value="2-3">2–3 months</option>
              <option value="4-6">4–6 months</option>
            </select>
          </label>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40"
            :aria-expanded="upcomingCheckinsExpanded"
            @click="upcomingCheckinsExpanded = !upcomingCheckinsExpanded"
          >
            <span>{{ upcomingCheckinsExpanded ? 'Collapse' : 'Expand' }}</span>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              class="h-4 w-4 text-slate-300 transition-transform"
              aria-hidden="true"
              :class="upcomingCheckinsExpanded ? 'rotate-180' : ''"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="upcomingCheckinsExpanded">
        <div v-if="probationNewHiresPending" class="rounded-md border border-slate-800 bg-slate-900 p-4 text-slate-200">Loading…</div>
        <div v-else-if="probationNewHiresError" class="rounded-md border border-red-900/60 bg-red-950/30 p-4 text-red-200">
          Failed to load onboarding check-ins.
          <div v-if="probationNewHiresErrorMessage" class="mt-2 text-xs text-red-200/80">{{ probationNewHiresErrorMessage }}</div>
        </div>
        <div v-else>
          <NewHireCheckinsTable :items="filteredCheckinsNewHires" :checkin-filter="upcomingCheckinsFilter" />
        </div>
      </div>
    </section>

    <hr v-if="!isReportMode" class="border-slate-800" />

    <section v-if="!isReportMode" class="space-y-3">
      <div class="space-y-1">
        <h2 class="text-base font-semibold text-slate-200">Recent Separations</h2>
        <p class="text-xs text-slate-400">Employees where Active = false (resigned / fired / retired).</p>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-slate-300">Archived employees (by month, from Odoo write date).</div>
        <div class="flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-2 text-sm font-medium text-slate-300">
            <span class="whitespace-nowrap">Country</span>
            <select
              v-model="selectedSeparationCountry"
              class="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-sm text-slate-100 outline-none focus:border-slate-600"
            >
              <option value="">All</option>
              <option v-for="c in separationCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
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
import { ensureUsaOption } from '~/utils/countryOptions'
import DateInput from '~/components/DateInput.vue'
import NewHireCheckinsTable from '~/components/NewHireCheckinsTable.vue'

const route = useRoute()
const isReportMode = computed(() => route.query.report === '1')

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
  notes?: string
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

function normalizeRecruitmentStage(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const v = normalizeStage(trimmed)
  if (v === 'pre-onboarding stage') return 'Pre-Onboarding Stage'
  if (v === 'interview & evaluation stage') return 'Interview & Evaluation Stage'
  if (v === 'offer stage') return 'Offer Stage'
  if (v === 'feedback stage') return 'Feedback Stage'
  if (v === 'interview stage' || v === 'approval stage') return 'Interview & Evaluation Stage'
  if (v === 'contract development' || v === 'plan development') return 'Offer Stage'
  if (v === 'offer accepted') return 'Feedback Stage'
  return trimmed
}

function criticalRecruitmentStageBadgeClass(value: string) {
  const v = normalizeStage(normalizeRecruitmentStage(value))
  if (v === 'pre-onboarding stage') return 'border-emerald-900/60 bg-emerald-950/30 text-emerald-200'
  if (v === 'interview & evaluation stage') return 'border-sky-900/60 bg-sky-950/30 text-sky-200'
  if (v === 'offer stage') return 'border-violet-900/60 bg-violet-950/30 text-violet-200'
  if (v === 'feedback stage') return 'border-amber-900/60 bg-amber-950/30 text-amber-200'
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

const REPORT_TOP_VACANCIES = 12
const REPORT_TOP_CANDIDATES = 15
const vacanciesForDisplay = computed(() => (isReportMode.value ? vacancies.value.slice(0, REPORT_TOP_VACANCIES) : vacancies.value))

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

const selectedNewHireCountry = ref('')
const newHireCountries = computed(() => ensureUsaOption(uniqueSorted(odooNewHires.value.map((n) => n.countryAssigned))))
const filteredNewHires = computed(() => {
  const selected = selectedNewHireCountry.value.trim()
  const items = odooNewHires.value ?? []
  return selected ? items.filter((n) => n.countryAssigned === selected) : items
})

const ONBOARDING_TASKS = [
  'HR Orientation',
  'HSSEF Orientation',
  'Received Laptop, Mouse, Bag, Headset, etc',
  'Received Welcome Package inclusive of welcome note',
  'Walkaround the Office to meet various departments by HR rep',
  'Received Security Codes to the Office(s)',
  'Got access to LASER modules and was shown how to use it',
  'Addition to Company Phone Plan',
  "Was added to the Ramps WhatsApp Group for the country",
  "Was added to the other relevant Ramps What's App Groups",
  'Nectar Profile Created',
  'Add to the New Employee Teams Chat',
  'Was added to the Ramps Email Group for the country',
  'Checked my Email and Teams to make sure it works properly',
  'Completed Payroll Form',
  'Completed Employee Information Update Form',
  'Reviewed and signed HR Onboarding Policies',
  'Reviewed the HSSEQ policy'
] as const

type OnboardingChecklistState = Record<string, boolean[]>
const ONBOARDING_STORAGE_KEY = 'hr-dashboard:new-hires-onboarding-checklist:v1'
const onboardingByRowKey = ref<OnboardingChecklistState>({})

const EXIT_TASKS = [
  'Letter confirming separation of employee (resignation, retirement, termination)',
  'Inform IBWIL to remove from Medical Plan',
  'Inform Finance about resignation/removal from Payroll',
  'Payment of outstanding commissions (Sales personnel)',
  "Removal of the employee's contents from office or workspace",
  'Company Cell Phone',
  'Disconnection from Company phone plan',
  'Collection of employee Ramps ID card',
  'Collection of access card',
  'Collection of Airport Pass',
  'Collection of Customs Badge',
  'Exit employee interview',
  'Notify Airport Authority',
  'Notify Comptroller of Customs and Excise',
  'Acceptance of resignation letter (include accrued and utilized vacation days and related vacation pay, commissions, outstanding loans, confirm outstanding salary, commissions due, loans due, cellphone costs due, other amounts due e.g. gas, approved entertainment cost)',
  'Float',
  'Company polo/shirt',
  'Personnel Transfer Book',
  'Any other pending transaction'
] as const

type ExitChecklistState = Record<string, boolean[]>
const EXIT_STORAGE_KEY = 'hr-dashboard:offboarding-exit-checklist:v1'
const exitByRowId = ref<ExitChecklistState>({})

function normalizeExitChecklistArray(value: unknown) {
  if (!Array.isArray(value)) return null
  const out = new Array(EXIT_TASKS.length).fill(false) as boolean[]
  for (let i = 0; i < out.length; i += 1) out[i] = Boolean(value[i])
  return out
}

function exitRowKey(row: OffboardingRow) {
  return `off:${row.id}`
}

function exitChecklistFor(row: OffboardingRow) {
  const k = exitRowKey(row)
  const existing = exitByRowId.value[k]
  if (existing && Array.isArray(existing) && existing.length === EXIT_TASKS.length) return existing
  return new Array(EXIT_TASKS.length).fill(false) as boolean[]
}

function isExitTaskDone(row: OffboardingRow, idx: number) {
  return exitChecklistFor(row)[idx] === true
}

function setExitTaskDone(row: OffboardingRow, idx: number, done: boolean) {
  const k = exitRowKey(row)
  const next = exitChecklistFor(row).slice()
  next[idx] = done
  exitByRowId.value = { ...exitByRowId.value, [k]: next }
}

function exitDoneCount(row: OffboardingRow) {
  return exitChecklistFor(row).filter(Boolean).length
}

const expandedExitChecklistId = ref<string | null>(null)
function toggleExitChecklist(row: OffboardingRow) {
  expandedExitChecklistId.value = expandedExitChecklistId.value === row.id ? null : row.id
}

function safeParseObject(input: string | null) {
  if (!input) return null
  try {
    const v = JSON.parse(input) as unknown
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null
    return v as Record<string, unknown>
  } catch {
    return null
  }
}

function onboardingRowKey(n: OdooNewHire) {
  const ek = (n.employeeKey ?? '').trim()
  const start = (n.startDate ?? '').trim()
  return `emp:${ek}|start:${start}`
}

function normalizeChecklistArray(value: unknown) {
  if (!Array.isArray(value)) return null
  const out = new Array(ONBOARDING_TASKS.length).fill(false) as boolean[]
  for (let i = 0; i < out.length; i += 1) out[i] = Boolean(value[i])
  return out
}

function checklistFor(n: OdooNewHire) {
  const k = onboardingRowKey(n)
  const existing = onboardingByRowKey.value[k]
  if (existing && Array.isArray(existing) && existing.length === ONBOARDING_TASKS.length) return existing
  return new Array(ONBOARDING_TASKS.length).fill(false) as boolean[]
}

function isOnboardingTaskDone(n: OdooNewHire, idx: number) {
  return checklistFor(n)[idx] === true
}

function setOnboardingTaskDone(n: OdooNewHire, idx: number, done: boolean) {
  const k = onboardingRowKey(n)
  const next = checklistFor(n).slice()
  next[idx] = done
  onboardingByRowKey.value = { ...onboardingByRowKey.value, [k]: next }
}

function onboardingDoneCount(n: OdooNewHire) {
  return checklistFor(n).filter(Boolean).length
}

const expandedOnboardingKey = ref<string | null>(null)
function toggleOnboardingChecklist(n: OdooNewHire) {
  const k = onboardingRowKey(n)
  expandedOnboardingKey.value = expandedOnboardingKey.value === k ? null : k
}

onMounted(() => {
  const obj = safeParseObject(window.localStorage.getItem(ONBOARDING_STORAGE_KEY))
  if (!obj) return
  const next: OnboardingChecklistState = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof k !== 'string') continue
    const normalized = normalizeChecklistArray(v)
    if (normalized) next[k] = normalized
  }
  onboardingByRowKey.value = next

  const exitObj = safeParseObject(window.localStorage.getItem(EXIT_STORAGE_KEY))
  if (!exitObj) return
  const exitNext: ExitChecklistState = {}
  for (const [k, v] of Object.entries(exitObj)) {
    if (typeof k !== 'string') continue
    const normalized = normalizeExitChecklistArray(v)
    if (normalized) exitNext[k] = normalized
  }
  exitByRowId.value = exitNext
})

watch(
  onboardingByRowKey,
  (v) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(v))
  },
  { deep: true }
)

watch(
  exitByRowId,
  (v) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(EXIT_STORAGE_KEY, JSON.stringify(v))
  },
  { deep: true }
)

watchEffect(() => {
  if (selectedNewHireMonth.value) return
  const m = odooNewHiresData.value?.currentMonth
  if (m) selectedNewHireMonth.value = m
})

const {
  data: probationNewHiresData,
  pending: probationNewHiresPending,
  error: probationNewHiresError
} = await useFetch<OdooNewHiresResponse>('/api/odoo/new-hires', { query: { probation: '1' } })
const probationNewHires = computed(() => probationNewHiresData.value?.items ?? [])
const probationNewHiresErrorMessage = computed(() => getErrorMessage(probationNewHiresError.value))

const upcomingCheckinsExpanded = ref(true)
const upcomingCheckinsFilter = ref<'all' | '1' | '2-3' | '4-6'>('all')
const selectedCheckinsCountry = ref('')
const checkinsCountries = computed(() => ensureUsaOption(uniqueSorted(probationNewHires.value.map((n) => n.countryAssigned))))
const filteredCheckinsNewHires = computed(() => {
  const selected = selectedCheckinsCountry.value.trim()
  const items = probationNewHires.value ?? []
  return selected ? items.filter((n) => n.countryAssigned === selected) : items
})

const { data: employeesData, pending: employeesPending, error: employeesError } = await useFetch<Employee[]>('/api/odoo/employees')
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

const selectedSeparationCountry = ref('')
const separationCountries = computed(() => ensureUsaOption(uniqueSorted((separationsData.value?.items ?? []).map((e) => e.countryAssigned))))
const recentSeparations = computed(() => {
  const selected = selectedSeparationCountry.value.trim()
  const items = separationsData.value?.items ?? []
  const filtered = selected ? items.filter((e) => e.countryAssigned === selected) : items
  return filtered.slice().sort((a, b) => a.name.localeCompare(b.name))
})

const vacancyCountries = computed(() => ensureUsaOption(uniqueSorted((employeesData.value ?? []).map((e) => e.countryAssigned))))
const vacancyDepartments = computed(() => uniqueSorted((employeesData.value ?? []).map((e) => e.department)))
const vacancyPriorities = ['high', 'medium', 'low'] as const
const criticalRecruitmentStages = [
  'Interview & Evaluation Stage',
  'Offer Stage',
  'Pre-Onboarding Stage',
  'Feedback Stage'
] as const
const newHireStatuses = ['Pre-Onboarding Stage', 'Onboarding', 'Hired'] as const

const selectedRecruitmentStage = ref('')
const selectedRecruitmentCountry = ref('')

const criticalRecruitmentCountries = computed(() => ensureUsaOption(uniqueSorted((criticalRecruitment.value ?? []).map((c) => c.country))))

const filteredCriticalRecruitment = computed(() => {
  const selected = selectedRecruitmentStage.value.trim()
  const selectedCountry = selectedRecruitmentCountry.value.trim()
  const items = criticalRecruitment.value ?? []
  const stageFiltered = selected ? items.filter((c) => normalizeRecruitmentStage(c.stage) === selected) : items
  return selectedCountry ? stageFiltered.filter((c) => c.country === selectedCountry) : stageFiltered
})

const criticalRecruitmentForDisplay = computed(() =>
  isReportMode.value ? filteredCriticalRecruitment.value.slice(0, REPORT_TOP_CANDIDATES) : filteredCriticalRecruitment.value
)

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

type OffboardingDepartureType = '' | 'resigned' | 'retired' | 'fired' | 'other'
type OffboardingStatus = '' | 'separation_confirmation' | 'exit_formalities' | 'internal_feedback'

type OffboardingRow = {
  id: string
  name: string
  country: string
  departureType: OffboardingDepartureType
  status: OffboardingStatus
  effectiveDate: string
}

const offboardingDepartureTypes = [
  { value: 'resigned', label: 'Resigned' },
  { value: 'retired', label: 'Retired' },
  { value: 'fired', label: 'Fired' },
  { value: 'other', label: 'Other' }
] as const

const offboardingStatuses = [
  { value: 'separation_confirmation', label: 'Separation Confirmation' },
  { value: 'exit_formalities', label: 'Exit Formalities' },
  { value: 'internal_feedback', label: 'Internal Feedback' }
] as const

const OFFBOARDING_STORAGE_KEY = 'hr-dashboard:offboarding-manual:v1'
const offboardingRows = ref<OffboardingRow[]>([])
const showOffboardingCreateForm = ref(false)
const offboardingCreateForm = reactive({
  name: '',
  country: '',
  departureType: '' as OffboardingDepartureType,
  status: '' as OffboardingStatus,
  effectiveDate: ''
})
const offboardingCreateError = ref('')

const offboardingEditId = ref<string | null>(null)
const offboardingEditForm = reactive({
  name: '',
  country: '',
  departureType: '' as OffboardingDepartureType,
  status: '' as OffboardingStatus,
  effectiveDate: ''
})
const offboardingEditError = ref('')

const selectedOffboardingCountry = ref('')
const offboardingCountries = computed(() => ensureUsaOption(uniqueSorted(offboardingRows.value.map((r) => r.country))))
const filteredOffboardingRows = computed(() => {
  const selected = selectedOffboardingCountry.value.trim()
  const items = offboardingRows.value ?? []
  return selected ? items.filter((r) => r.country === selected) : items
})

function safeParseArray(input: string | null) {
  if (!input) return null
  try {
    const v = JSON.parse(input) as unknown
    if (!Array.isArray(v)) return null
    return v as unknown[]
  } catch {
    return null
  }
}

function newOffboardingId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function cancelOffboardingCreate() {
  offboardingCreateError.value = ''
  showOffboardingCreateForm.value = false
  offboardingCreateForm.name = ''
  offboardingCreateForm.country = ''
  offboardingCreateForm.departureType = ''
  offboardingCreateForm.status = ''
  offboardingCreateForm.effectiveDate = ''
}

function createOffboarding() {
  offboardingCreateError.value = ''
  offboardingRows.value = [
    ...offboardingRows.value,
    {
      id: newOffboardingId(),
      name: offboardingCreateForm.name.trim(),
      country: offboardingCreateForm.country,
      departureType: offboardingCreateForm.departureType,
      status: offboardingCreateForm.status,
      effectiveDate: offboardingCreateForm.effectiveDate.trim()
    }
  ]
  cancelOffboardingCreate()
}

function startEditOffboarding(row: OffboardingRow) {
  offboardingEditError.value = ''
  offboardingEditId.value = row.id
  offboardingEditForm.name = row.name
  offboardingEditForm.country = row.country
  offboardingEditForm.departureType = row.departureType
  offboardingEditForm.status = row.status
  offboardingEditForm.effectiveDate = row.effectiveDate
}

function cancelEditOffboarding() {
  offboardingEditId.value = null
  offboardingEditError.value = ''
}

function saveEditOffboarding() {
  const id = offboardingEditId.value
  if (!id) return
  offboardingEditError.value = ''
  offboardingRows.value = offboardingRows.value.map((r) =>
    r.id === id
      ? {
          ...r,
          name: offboardingEditForm.name.trim(),
          country: offboardingEditForm.country,
          departureType: offboardingEditForm.departureType,
          status: offboardingEditForm.status,
          effectiveDate: offboardingEditForm.effectiveDate.trim()
        }
      : r
  )
  cancelEditOffboarding()
}

function deleteOffboarding(id: string) {
  offboardingRows.value = offboardingRows.value.filter((r) => r.id !== id)
  if (offboardingEditId.value === id) cancelEditOffboarding()
}

function offboardingDepartureTypeLabel(value: OffboardingDepartureType) {
  if (value === 'resigned') return 'Resigned'
  if (value === 'retired') return 'Retired'
  if (value === 'fired') return 'Fired'
  if (value === 'other') return 'Other'
  return '—'
}

function offboardingStatusLabel(value: OffboardingStatus) {
  if (value === 'separation_confirmation') return 'Separation Confirmation'
  if (value === 'exit_formalities') return 'Exit Formalities'
  if (value === 'internal_feedback') return 'Internal Feedback'
  return '—'
}

function offboardingDepartureTypeBadgeClass(value: Exclude<OffboardingDepartureType, ''>) {
  if (value === 'resigned') return 'border-amber-500/40 bg-amber-950/40 text-amber-100'
  if (value === 'retired') return 'border-violet-400/30 bg-violet-500/10 text-violet-200'
  if (value === 'fired') return 'border-red-500/40 bg-red-950/40 text-red-100'
  return 'border-sky-900/60 bg-sky-950/30 text-sky-200'
}

function offboardingStatusBadgeClass(value: Exclude<OffboardingStatus, ''>) {
  if (value === 'separation_confirmation') return 'border-sky-900/60 bg-sky-950/30 text-sky-200'
  if (value === 'exit_formalities') return 'border-amber-900/60 bg-amber-950/30 text-amber-200'
  return 'border-violet-900/60 bg-violet-950/30 text-violet-200'
}

onMounted(() => {
  if (typeof window === 'undefined') return
  const raw = safeParseArray(window.localStorage.getItem(OFFBOARDING_STORAGE_KEY))
  if (!raw) return
  const next: OffboardingRow[] = []
  for (const v of raw) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) continue
    const o = v as Record<string, unknown>
    const id = typeof o.id === 'string' ? o.id : ''
    const name = typeof o.name === 'string' ? o.name : ''
    const country = typeof o.country === 'string' ? o.country : ''
    const departureType = typeof o.departureType === 'string' ? o.departureType : ''
    const status = typeof o.status === 'string' ? o.status : ''
    const effectiveDate = typeof o.effectiveDate === 'string' ? o.effectiveDate : ''

    const isDepartureType =
      departureType === '' || departureType === 'resigned' || departureType === 'retired' || departureType === 'fired' || departureType === 'other'
    const isStatus =
      status === '' || status === 'separation_confirmation' || status === 'exit_formalities' || status === 'internal_feedback'
    if (!id || !isDepartureType || !isStatus) continue

    next.push({
      id,
      name,
      country,
      departureType: departureType as OffboardingDepartureType,
      status: status as OffboardingStatus,
      effectiveDate
    })
  }
  offboardingRows.value = next
})

watch(
  offboardingRows,
  (v) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(OFFBOARDING_STORAGE_KEY, JSON.stringify(v))
  },
  { deep: true }
)

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
const criticalRecruitmentForm = reactive({ candidateName: '', position: '', country: '', stage: '', notes: '' })
const criticalRecruitmentSaving = ref(false)
const criticalRecruitmentActionError = ref('')
const criticalRecruitmentEditId = ref<string | null>(null)
const criticalRecruitmentEditForm = reactive({ candidateName: '', position: '', country: '', stage: '', notes: '' })
const criticalRecruitmentEditError = ref('')

function cancelCriticalRecruitmentCreate() {
  criticalRecruitmentActionError.value = ''
  showCriticalRecruitmentForm.value = false
}

async function createCriticalRecruitment() {
  criticalRecruitmentActionError.value = ''
  criticalRecruitmentSaving.value = true
  try {
    await $fetch('/api/critical-recruitment', {
      method: 'POST',
      body: {
        ...criticalRecruitmentForm,
        stage: normalizeRecruitmentStage(criticalRecruitmentForm.stage),
        notes: criticalRecruitmentForm.notes
      }
    })
    criticalRecruitmentForm.candidateName = ''
    criticalRecruitmentForm.position = ''
    criticalRecruitmentForm.country = ''
    criticalRecruitmentForm.stage = ''
    criticalRecruitmentForm.notes = ''
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
  criticalRecruitmentEditForm.stage = normalizeRecruitmentStage(c.stage)
  criticalRecruitmentEditForm.notes = c.notes || ''
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
    await $fetch(`/api/critical-recruitment/${id}`, {
      method: 'PUT',
      body: {
        ...criticalRecruitmentEditForm,
        stage: normalizeRecruitmentStage(criticalRecruitmentEditForm.stage),
        notes: criticalRecruitmentEditForm.notes
      }
    })
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

const reportReady = ref(false)
watchEffect(async () => {
  if (!isReportMode.value) {
    reportReady.value = true
    return
  }

  if (vacanciesPending.value || criticalRecruitmentPending.value) {
    reportReady.value = false
    return
  }

  await nextTick()
  reportReady.value = true
})
</script>

