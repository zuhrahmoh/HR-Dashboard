<template>
  <div class="min-w-0 space-y-6" :data-report-ready="reportReady ? '1' : undefined">
    <div class="space-y-3">
      <div class="space-y-1">
        <h1 class="text-gradient-brand text-3xl font-extrabold tracking-tight">Recruitment &amp; Onboarding</h1>
        <p class="text-slate-600">Track critical vacancies, recruitment, onboarding and offboarding processes.</p>
      </div>
    </div>

    <section
      v-if="!isReportMode"
      aria-label="Recruitment overview"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
    >
      <button type="button" class="surface-tint-card relative overflow-hidden rounded-xl p-4 pl-5 shadow-card text-left scale-[0.97] transition-transform hover:scale-[1.00] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40" @click="navigateRecruitmentSection('critical-vacancies')">
        <span aria-hidden="true" class="absolute inset-x-0 top-0 h-[3px] bg-pink-500" />
        <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Critical Vacancies</div>
        <div class="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-pink-600">{{ criticalVacanciesKpi }}</div>
        <div class="mt-1 text-sm text-slate-500">Open roles</div>
      </button>
      <button type="button" class="surface-tint-card relative overflow-hidden rounded-xl p-4 pl-5 shadow-card text-left scale-[0.97] transition-transform hover:scale-[1.00] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40" @click="navigateRecruitmentSection('recruitment-onboarding')">
        <span aria-hidden="true" class="absolute inset-x-0 top-0 h-[3px] bg-brand-blue" />
        <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Candidates in Recruitment Pipeline</div>
        <div class="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-brand-blue">{{ candidatesInPipelineKpi }}</div>
        <div class="mt-1 text-sm text-slate-500">Active candidates</div>
      </button>
      <button type="button" class="surface-tint-card relative overflow-hidden rounded-xl p-4 pl-5 shadow-card text-left scale-[0.97] transition-transform hover:scale-[1.00] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40" @click="navigateRecruitmentSection('recent-new-hires')">
        <span aria-hidden="true" class="absolute inset-x-0 top-0 h-[3px] bg-teal-500" />
        <div class="text-xs font-medium uppercase tracking-wide text-slate-500">New Hires</div>
        <div class="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-teal-600">{{ newHiresKpi }}</div>
        <div class="mt-1 text-sm text-slate-500">This month</div>
      </button>
      <button type="button" class="surface-tint-card relative overflow-hidden rounded-xl p-4 pl-5 shadow-card text-left scale-[0.97] transition-transform hover:scale-[1.00] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40" @click="navigateRecruitmentSection('upcoming-onboarding-checkins')">
        <span aria-hidden="true" class="absolute inset-x-0 top-0 h-[3px] bg-brand-purple" />
        <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Check-ins Due</div>
        <div class="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-brand-purple">{{ checkinsDueKpi }}</div>
        <div class="mt-1 text-sm text-slate-500">Next 14 days</div>
      </button>
    </section>

    <nav
      v-if="!isReportMode"
      class="surface-tint-nav sticky top-[3.25rem] z-20 -mx-1 flex flex-wrap items-center gap-x-1 gap-y-1 rounded-md px-1.5 pt-1 pb-1.5 backdrop-blur-sm"
      aria-label="Recruitment sections"
    >
      <span class="shrink-0 pr-0.5 text-[10px] font-semibold tracking-wide text-brand-blue">JUMP TO:</span>
      <template v-for="(item, i) in recruitmentSectionNavItems" :key="item.id">
        <span
          v-if="i > 0"
          class="px-1 text-[11px] font-light text-hr-navy/35 select-none"
          aria-hidden="true"
        >|</span>
        <button
          type="button"
          class="rounded-md px-3 py-2 text-xs font-medium text-hr-navy transition hover:bg-purple-100/60 hover:text-brand-purple"
          @click="navigateRecruitmentSection(item.id)"
        >
          {{ item.label }}
        </button>
      </template>
      <button
        v-if="showRecruitmentBackToTop"
        type="button"
        class="ml-auto inline-flex items-center gap-1.5 rounded-md border border-brand-blue bg-brand-blue/10 px-3 py-1.5 text-xs font-semibold text-brand-blue shadow-sm transition hover:bg-brand-blue/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
        @click="scrollRecruitmentToTop"
      >
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M10 16V4M5 9l5-5 5 5" />
        </svg>
        <span>Back to top</span>
      </button>
    </nav>

    <section id="critical-vacancies" class="surface-tint-hero scroll-mt-32 space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
      <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div class="flex min-w-0 items-start gap-3">
          <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
          <h2 class="text-gradient-brand text-xl font-bold tracking-tight">Critical Vacancies</h2>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span class="whitespace-nowrap">Country</span>
            <select
              v-model="selectedVacancyCountry"
              class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              <option value="">All</option>
              <option v-for="c in vacancyListCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <button
            v-if="!showVacancyForm"
            type="button"
            class="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100"
            @click="showVacancyForm = true"
          >
            <span aria-hidden="true" class="mr-1.5 font-semibold">+</span>
            <span>Add vacancy</span>
          </button>
        </div>
      </div>

      <form
        v-if="showVacancyForm"
        class="rounded-md border border-slate-200 bg-white shadow-card p-4"
        @submit.prevent="createVacancy"
      >
        <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label class="block">
            <div class="mb-1 text-sm text-slate-600">Position Title</div>
            <input
              v-model="vacancyForm.positionTitle"
              type="text"
              class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
            />
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-600">Department</div>
            <select
              v-model="vacancyForm.department"
              class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            >
              <option value="" disabled>Select department</option>
              <option v-for="d in vacancyDepartments" :key="d" :value="d">{{ d }}</option>
            </select>
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-600">Country</div>
            <select
              v-model="vacancyForm.country"
              class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            >
              <option value="" disabled>Select country</option>
              <option v-for="c in vacancyCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-600">Priority</div>
            <select
              v-model="vacancyForm.priority"
              class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            >
              <option value="" disabled>Select priority</option>
              <option v-for="p in vacancyPriorities" :key="p" :value="p">{{ formatPriority(p) }}</option>
            </select>
          </label>
        </div>

        <div class="mt-3 flex items-center justify-between gap-3">
          <div v-if="vacancyActionError" class="text-xs text-pink-700">{{ vacancyActionError }}</div>
          <div class="ml-auto flex items-center gap-2">
            <button
              type="button"
              class="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100"
              @click="cancelVacancyCreate"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100 disabled:opacity-60"
              :disabled="vacancySaving"
            >
              <span aria-hidden="true" class="mr-1.5 font-semibold">+</span>
              <span>Add vacancy</span>
            </button>
          </div>
        </div>
      </form>

      <div v-if="vacanciesPending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">Loading…</div>
      <div v-else-if="vacanciesError" class="rounded-md border border-pink-200 bg-pink-50 p-4 text-pink-800">
        Failed to load vacancies.
        <div v-if="vacanciesErrorMessage" class="mt-2 text-xs text-pink-700/80">{{ vacanciesErrorMessage }}</div>
      </div>
      <div v-else-if="(vacancies?.length ?? 0) === 0" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">
        No vacancies yet.
      </div>
      <div
        v-else-if="vacanciesForDisplay.length === 0"
        class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800"
      >
        No critical vacancies for this country.
      </div>
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        <div v-for="v in vacanciesForDisplay" :key="v.id" class="rounded-md border border-slate-200 bg-white shadow-card p-3">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="truncate text-sm font-semibold text-hr-navy">{{ v.positionTitle }}</div>
              <div class="mt-1 text-xs text-slate-600">{{ v.department }} · {{ v.country }}</div>
            </div>

            <div class="flex shrink-0 flex-col items-end gap-2">
              <span :class="[tableDataBadgeClass, priorityBadgeClass(v.priority)]">
                {{ formatPriority(v.priority) }}
              </span>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="inline-flex h-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-1.5 text-[11px] text-slate-800 hover:bg-slate-100"
                  @click="startEditVacancy(v)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete vacancy"
                  title="Delete vacancy"
                  @click="deleteVacancy(v.id)"
                >
                <svg
                  class="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
              </div>
            </div>
          </div>

          <form v-if="vacancyEditId === v.id" class="mt-4 space-y-3" @submit.prevent="saveEditVacancy">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label class="block">
                <div class="mb-1 text-xs text-slate-600">Position Title</div>
                <input
                  v-model="vacancyEditForm.positionTitle"
                  type="text"
                  class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <label class="block">
                <div class="mb-1 text-xs text-slate-600">Department</div>
                <select
                  v-model="vacancyEditForm.department"
                  class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                >
                  <option value="" disabled>Select department</option>
                  <option v-for="d in vacancyDepartments" :key="d" :value="d">{{ d }}</option>
                </select>
              </label>
              <label class="block">
                <div class="mb-1 text-xs text-slate-600">Country</div>
                <select
                  v-model="vacancyEditForm.country"
                  class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                >
                  <option value="" disabled>Select country</option>
                  <option v-for="c in vacancyCountries" :key="c" :value="c">{{ c }}</option>
                </select>
              </label>
              <label class="block">
                <div class="mb-1 text-xs text-slate-600">Priority</div>
                <select
                  v-model="vacancyEditForm.priority"
                  class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                >
                  <option value="" disabled>Select priority</option>
                  <option v-for="p in vacancyPriorities" :key="p" :value="p">{{ formatPriority(p) }}</option>
                </select>
              </label>
            </div>

            <div v-if="vacancyEditError" class="text-xs text-pink-700">{{ vacancyEditError }}</div>

            <div class="flex items-center justify-end gap-2">
              <button
                type="button"
                class="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100"
                @click="cancelEditVacancy"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100 disabled:opacity-60"
                :disabled="vacancySaving"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
      <div
        v-if="isReportMode && vacanciesFiltered.length > vacanciesForDisplay.length"
        class="mt-3 text-xs text-slate-400"
      >
        Showing top {{ vacanciesForDisplay.length }} vacancies. See the dashboard for the full list.
      </div>

      <div class="surface-tint-card rounded-md p-3 text-xs text-slate-800">
        <div class="flex items-center gap-2 font-semibold text-brand-blue">
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 text-brand-blue">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M10 18a8 8 0 1 0 0-16a8 8 0 0 0 0 16Zm0-13.25a1 1 0 0 1 1 1V12a1 1 0 1 1-2 0V5.75a1 1 0 0 1 1-1Zm0 11.75a1.25 1.25 0 1 0 0-2.5a1.25 1.25 0 0 0 0 2.5Z"
            />
          </svg>
          <span>Shortlisting of Candidates</span>
        </div>
        <div class="mt-2 space-y-1 text-slate-800/90">
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

    <section id="recruitment-onboarding" class="surface-tint-hero scroll-mt-32 min-w-0 space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
      <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div class="flex min-w-0 items-start gap-3">
          <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
          <h2 class="text-gradient-brand text-xl font-bold tracking-tight">Recruitment &amp; Onboarding</h2>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span class="whitespace-nowrap">Country</span>
            <select
              v-model="selectedRecruitmentCountry"
              class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              <option value="">All</option>
              <option v-for="c in criticalRecruitmentCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span class="whitespace-nowrap">Stage</span>
            <select
              v-model="selectedRecruitmentStage"
              class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              <option value="">All</option>
              <option v-for="s in criticalRecruitmentStages" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
          <button
            v-if="!showCriticalRecruitmentForm"
            type="button"
            class="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100"
            @click="showCriticalRecruitmentForm = true"
          >
            <span aria-hidden="true" class="mr-1.5 font-semibold">+</span>
            <span>Add candidate</span>
          </button>
        </div>
      </div>

      <form
        v-if="showCriticalRecruitmentForm"
        class="rounded-md border border-slate-200 bg-white shadow-card p-4"
        @submit.prevent="createCriticalRecruitment"
      >
        <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label class="block">
            <div class="mb-1 text-sm text-slate-600">Candidate Name</div>
            <input
              v-model="criticalRecruitmentForm.candidateName"
              type="text"
              class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-600">Position</div>
            <input
              v-model="criticalRecruitmentForm.position"
              type="text"
              class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-600">Country</div>
            <select
              v-model="criticalRecruitmentForm.country"
              class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            >
              <option value="" disabled>Select country</option>
              <option v-for="c in vacancyCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label class="block">
            <div class="mb-1 text-sm text-slate-600">Stage</div>
            <select
              v-model="criticalRecruitmentForm.stage"
              class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            >
              <option value="" disabled>Select stage</option>
              <option v-for="s in criticalRecruitmentStages" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
          <label class="block md:col-span-4">
            <div class="mb-1 text-sm text-slate-600">Notes (optional)</div>
            <input
              v-model="criticalRecruitmentForm.notes"
              type="text"
              class="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
              placeholder="Add any notes for this candidate…"
            />
          </label>
        </div>

        <div class="mt-3 flex items-center justify-between gap-3">
          <div v-if="criticalRecruitmentActionError" class="text-xs text-pink-700">{{ criticalRecruitmentActionError }}</div>
          <div class="ml-auto flex items-center gap-2">
            <button
              type="button"
              class="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100"
              @click="cancelCriticalRecruitmentCreate"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100 disabled:opacity-60"
              :disabled="criticalRecruitmentSaving"
            >
              <span aria-hidden="true" class="mr-1.5 font-semibold">+</span>
              <span>Add candidate</span>
            </button>
          </div>
        </div>
      </form>

      <div v-if="criticalRecruitmentPending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">Loading…</div>
      <div
        v-else-if="criticalRecruitmentError"
        class="rounded-md border border-pink-200 bg-pink-50 p-4 text-pink-800"
      >
        Failed to load recruitment.
        <div v-if="criticalRecruitmentErrorMessage" class="mt-2 text-xs text-pink-700/80">{{ criticalRecruitmentErrorMessage }}</div>
      </div>
      <div v-else class="rounded-md border border-slate-200 bg-white shadow-card">
        <table class="w-full table-fixed border-collapse text-center text-sm">
          <colgroup>
            <col style="width: 18%" />
            <col style="width: 17%" />
            <col style="width: 12%" />
            <col style="width: 14%" />
            <col style="width: 27%" />
            <col style="width: 12%" />
          </colgroup>
          <thead class="bg-slate-100 text-slate-600">
            <tr>
              <th class="px-3 py-3 align-bottom font-medium">Candidate</th>
              <th class="px-3 py-3 align-bottom font-medium">Position</th>
              <th class="px-3 py-3 align-bottom font-medium">Country</th>
              <th class="px-3 py-3 align-bottom font-medium">Stage</th>
              <th class="px-3 py-3 align-bottom font-medium">Notes</th>
              <th class="px-3 py-3 align-bottom font-medium"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in criticalRecruitmentForDisplay" :key="c.id" class="border-t border-hr-navy/25">
              <template v-if="criticalRecruitmentEditId === c.id">
                <td class="min-w-0 px-3 py-3 align-top">
                  <input
                    v-model="criticalRecruitmentEditForm.candidateName"
                    type="text"
                    class="w-full min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  />
                </td>
                <td class="min-w-0 px-3 py-3 align-top">
                  <input
                    v-model="criticalRecruitmentEditForm.position"
                    type="text"
                    class="w-full min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  />
                </td>
                <td class="min-w-0 px-3 py-3 align-top">
                  <select
                    v-model="criticalRecruitmentEditForm.country"
                    class="w-full min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="" disabled>Select country</option>
                    <option v-for="c in vacancyCountries" :key="c" :value="c">{{ c }}</option>
                  </select>
                </td>
                <td class="min-w-0 px-3 py-3 align-top">
                  <select
                    v-model="criticalRecruitmentEditForm.stage"
                    class="w-full min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="" disabled>Select stage</option>
                    <option v-for="s in criticalRecruitmentStages" :key="s" :value="s">{{ s }}</option>
                  </select>
                </td>
                <td class="min-w-0 px-3 py-3 align-top">
                  <input
                    v-model="criticalRecruitmentEditForm.notes"
                    type="text"
                    class="w-full min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
                    placeholder="Notes…"
                  />
                </td>
                <td class="min-w-0 px-3 py-3 align-top text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 hover:bg-slate-100"
                        @click="cancelEditCriticalRecruitment"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 hover:bg-slate-100 disabled:opacity-60"
                        :disabled="criticalRecruitmentSaving"
                        @click="saveEditCriticalRecruitment"
                      >
                        Save
                      </button>
                    </div>
                    <div v-if="criticalRecruitmentEditError" class="mt-2 text-xs text-pink-700">{{ criticalRecruitmentEditError }}</div>
                  </td>
                </template>

                <template v-else>
                  <td class="min-w-0 break-words px-3 py-3 align-top text-slate-900">{{ c.candidateName }}</td>
                  <td class="min-w-0 break-words px-3 py-3 align-top text-slate-800">{{ c.position }}</td>
                  <td class="min-w-0 break-words px-3 py-3 align-top text-slate-800">{{ c.country }}</td>
                  <td class="min-w-0 px-3 py-3 align-top">
                    <span :class="[tableDataBadgeClass, criticalRecruitmentStageBadgeClass(c.stage)]">
                      {{ normalizeRecruitmentStage(c.stage) }}
                    </span>
                  </td>
                  <td class="min-w-0 px-3 py-3 align-top text-slate-800">
                    <div class="break-words whitespace-normal" :class="isReportMode ? 'report-clamp-2' : ''">
                      {{ c.notes || '—' }}
                    </div>
                  </td>
                  <td class="min-w-0 px-3 py-3 align-top text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 hover:bg-slate-100"
                        @click="startEditCriticalRecruitment(c)"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        class="rounded-md border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs text-pink-800 hover:bg-pink-100"
                        @click="deleteCriticalRecruitment(c.id)"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </template>
              </tr>

              <tr v-if="(filteredCriticalRecruitment?.length ?? 0) === 0" class="border-t border-hr-navy/25">
                <td colspan="6" class="px-3 py-6 text-center text-slate-600">No candidates found.</td>
              </tr>
            </tbody>
        </table>
      </div>
      <div v-if="isReportMode && filteredCriticalRecruitment.length > criticalRecruitmentForDisplay.length" class="mt-3 text-xs text-slate-400">
        Showing top {{ criticalRecruitmentForDisplay.length }} candidates. See the dashboard for the full list.
      </div>
    </section>

    <section v-if="!isReportMode" id="recent-new-hires" class="surface-tint-hero scroll-mt-32 min-w-0 space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
      <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div class="flex min-w-0 items-start gap-3">
          <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
          <h2 class="text-gradient-brand text-xl font-bold tracking-tight">New Hires</h2>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span class="whitespace-nowrap">Country</span>
            <select
              v-model="selectedNewHireCountry"
              class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              <option value="">All</option>
              <option v-for="c in newHireCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span class="whitespace-nowrap">Month</span>
            <select
              v-model="selectedNewHireMonth"
              class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              <option v-for="m in newHireMonths" :key="m" :value="m">{{ formatMonthLabel(m) }}</option>
            </select>
          </label>
        </div>
      </div>

      <div v-if="odooNewHiresPending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">Loading…</div>
      <div v-else-if="odooNewHiresError" class="rounded-md border border-pink-200 bg-pink-50 p-4 text-pink-800">
        Failed to load new hires.
        <div v-if="odooNewHiresErrorMessage" class="mt-2 text-xs text-pink-700/80">{{ odooNewHiresErrorMessage }}</div>
      </div>
      <div
        v-else
        id="recent-new-hires-table"
        class="scroll-mt-24 rounded-md border border-slate-200 bg-white shadow-card"
      >
        <table class="w-full table-fixed border-collapse text-center text-sm">
          <colgroup>
            <col style="width: 17%" />
            <col style="width: 17%" />
            <col style="width: 15%" />
            <col style="width: 14%" />
            <col style="width: 12%" />
            <col style="width: 25%" />
          </colgroup>
          <thead class="bg-slate-100 text-slate-600">
            <tr>
              <th class="px-3 py-3 align-bottom font-medium">Name</th>
              <th class="px-3 py-3 align-bottom font-medium">Position</th>
              <th class="px-3 py-3 align-bottom font-medium">Country</th>
              <th class="px-3 py-3 align-bottom font-medium">Start</th>
              <th class="px-3 py-3 align-bottom font-medium">Tenure</th>
              <th class="px-3 py-3 align-bottom font-medium">Onboarding</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="n in filteredNewHires" :key="n.employeeKey">
              <tr class="border-t border-hr-navy/25 align-top">
                <td class="min-w-0 break-words px-3 py-3 text-slate-900">{{ n.name }}</td>
                <td class="min-w-0 break-words px-3 py-3 text-slate-800">{{ n.position }}</td>
                <td class="min-w-0 break-words px-3 py-3 text-slate-800">{{ n.countryAssigned }}</td>
                <td class="min-w-0 whitespace-nowrap px-3 py-3 tabular-nums text-slate-800">{{ formatYmdDateOrDash(n.startDate) }}</td>
                <td class="min-w-0 px-3 py-3 tabular-nums text-slate-800">{{ formatTenureReadable(n.tenure) }}</td>
                <td class="min-w-0 px-3 py-3 align-top">
                  <button
                    type="button"
                    class="inline-flex max-w-full items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 hover:bg-slate-100"
                    @click="toggleOnboardingChecklist(n)"
                  >
                    <span class="min-w-0 text-left break-words">
                      Checklist ({{ onboardingDoneCount(n) }}/{{ ONBOARDING_TASKS.length }})
                    </span>
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        class="h-4 w-4 shrink-0 text-slate-400"
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

              <tr v-if="expandedOnboardingKey === onboardingRowKey(n)" class="border-t border-hr-navy/25">
                <td colspan="6" class="bg-slate-100 px-3 py-4">
                    <div class="space-y-3">
                      <div class="text-xs font-semibold text-hr-navy">Onboarding Checklist</div>
                      <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <label
                          v-for="(task, idx) in ONBOARDING_TASKS"
                          :key="task"
                          class="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            class="sr-only"
                            :checked="isOnboardingTaskDone(n, idx)"
                            @change="(e) => void setOnboardingTaskDone(n, idx, (e.target as HTMLInputElement).checked)"
                          />
                          <span
                            class="relative mt-0.5 inline-flex h-5 w-5 shrink-0 rounded-full border"
                            :class="
                              isOnboardingTaskDone(n, idx)
                                ? 'border-teal-400/60 bg-teal-50'
                                : 'border-slate-300/80 bg-slate-100'
                            "
                            aria-hidden="true"
                          >
                            <span
                              v-if="isOnboardingTaskDone(n, idx)"
                              class="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500"
                            />
                          </span>
                          <span
                            class="text-sm"
                            :class="isOnboardingTaskDone(n, idx) ? 'text-slate-400 line-through' : 'text-slate-800'"
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

              <tr v-if="filteredNewHires.length === 0" class="border-t border-hr-navy/25">
                <td colspan="6" class="px-3 py-6 text-center text-slate-600">No new hires found for this month.</td>
              </tr>
            </tbody>
        </table>
      </div>
    </section>

    <section v-if="!isReportMode" id="offboarding" class="surface-tint-hero scroll-mt-32 min-w-0 space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
      <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div class="flex min-w-0 items-start gap-3">
          <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
          <div class="min-w-0 space-y-0.5">
            <h2 class="text-gradient-brand text-xl font-bold tracking-tight">Offboarding</h2>
            <p class="text-xs text-slate-500">
              Pulled from Odoo: employees still active but marked offboarding until their last working day (then archived).
            </p>
          </div>
        </div>
        <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
          <span class="whitespace-nowrap">Country</span>
          <select
            v-model="selectedOffboardingCountry"
            class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          >
            <option value="">All</option>
            <option v-for="c in offboardingCountries" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>
      </div>

      <div v-if="offboardingPending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">Loading…</div>
      <div v-else-if="offboardingError" class="rounded-md border border-pink-200 bg-pink-50 p-4 text-pink-800">
        Failed to load offboarding employees from Odoo.
        <div v-if="offboardingErrorMessage" class="mt-2 text-xs text-pink-700/80">{{ offboardingErrorMessage }}</div>
      </div>
      <div v-else class="rounded-md border border-slate-200 bg-white shadow-card">
        <table class="w-full table-fixed border-collapse text-center text-sm">
          <colgroup>
            <col style="width: 17%" />
            <col style="width: 17%" />
            <col style="width: 15%" />
            <col style="width: 14%" />
            <col style="width: 12%" />
            <col style="width: 25%" />
          </colgroup>
          <thead class="bg-slate-100 text-slate-600">
            <tr>
              <th class="px-3 py-3 align-bottom font-medium">Name</th>
              <th class="px-3 py-3 align-bottom font-medium">Country</th>
              <th class="px-3 py-3 align-bottom font-medium">Departure reason</th>
              <th class="px-3 py-3 align-bottom font-medium">Status</th>
              <th class="px-3 py-3 align-bottom font-medium">Last working day</th>
              <th class="px-3 py-3 align-bottom font-medium">Exit</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in filteredOffboardingEmployees" :key="row.employeeKey">
              <tr class="border-t border-hr-navy/25 align-top">
                <td class="min-w-0 break-words px-3 py-3 align-top font-medium text-slate-800">
                  {{ row.name || '—' }}
                </td>
                <td class="min-w-0 break-words px-3 py-3 text-slate-800">{{ row.countryAssigned || '—' }}</td>
                <td class="min-w-0 px-3 py-3 text-slate-800">
                  <span
                    v-if="offboardingDepartureKind(row)"
                    :class="[tableDataBadgeClass, offboardingDepartureTypeBadgeClass(offboardingDepartureKind(row)!)]"
                  >
                    {{ offboardingDepartureTypeLabel(offboardingDepartureKind(row)!) }}
                  </span>
                  <span v-else-if="row.departureReason?.trim()" :class="[tableDataBadgeClass, 'border-slate-200/90 bg-slate-100 text-slate-600']">
                    {{ row.departureReason.trim() }}
                  </span>
                  <span v-else class="text-slate-400">—</span>
                </td>
                <td class="min-w-0 px-3 py-3 text-slate-800">
                  <span :class="[tableDataBadgeClass, offboardingWorkflowBadgeClass(row)]">
                    {{ offboardingWorkflowLabel(row) }}
                  </span>
                </td>
                <td class="min-w-0 whitespace-nowrap px-3 py-3 tabular-nums text-slate-800">
                  {{ formatYmdDateOrDash(row.lastWorkingDay ?? null) }}
                </td>
                <td class="min-w-0 px-3 py-3 align-top">
                  <button
                    type="button"
                    class="inline-flex max-w-full items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 hover:bg-slate-100"
                    @click="toggleExitChecklist(row)"
                  >
                    <span class="min-w-0 text-left break-words">Checklist ({{ exitDoneCount(row) }}/{{ EXIT_TASKS.length }})</span>
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      class="h-4 w-4 shrink-0 text-slate-400"
                      aria-hidden="true"
                      :class="expandedExitChecklistKey === row.employeeKey ? 'rotate-180' : ''"
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

              <tr v-if="expandedExitChecklistKey === row.employeeKey" class="border-t border-hr-navy/25">
                <td colspan="6" class="bg-slate-100 px-3 py-4">
                  <div class="space-y-3">
                    <div class="text-xs font-semibold text-hr-navy">Exit Checklist</div>
                    <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <label
                        v-for="(task, idx) in EXIT_TASKS"
                        :key="task"
                        class="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          class="sr-only"
                          :checked="isExitTaskDone(row, idx)"
                          @change="(e) => void setExitTaskDone(row, idx, (e.target as HTMLInputElement).checked)"
                        />
                        <span
                          class="relative mt-0.5 inline-flex h-5 w-5 shrink-0 rounded-full border"
                          :class="
                            isExitTaskDone(row, idx)
                              ? 'border-teal-400/60 bg-teal-50'
                              : 'border-slate-300/80 bg-slate-100'
                          "
                          aria-hidden="true"
                        >
                          <span
                            v-if="isExitTaskDone(row, idx)"
                            class="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500"
                          />
                        </span>
                        <span
                          class="text-sm"
                          :class="isExitTaskDone(row, idx) ? 'text-slate-400 line-through' : 'text-slate-800'"
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

            <tr v-if="!offboardingPending && !offboardingError && filteredOffboardingEmployees.length === 0" class="border-t border-hr-navy/25">
              <td colspan="6" class="px-3 py-6 text-center text-slate-600">
                No employees in offboarding. Mark offboarding in Odoo.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="!isReportMode" id="upcoming-onboarding-checkins" class="surface-tint-hero scroll-mt-32 min-w-0 space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
      <div class="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div class="flex min-w-0 items-start gap-3">
          <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
          <div class="min-w-0 space-y-0.5">
            <h2 class="text-gradient-brand text-xl font-bold tracking-tight">Upcoming Onboarding Check-ins</h2>
            <p class="text-xs text-slate-500">Shows 1–6 month check-ins when they are due within the next 14 days (probation &lt; 6 months).</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span class="whitespace-nowrap">Country</span>
              <select
                v-model="selectedCheckinsCountry"
                class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                <option value="">All</option>
                <option v-for="c in checkinsCountries" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>
            <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span class="whitespace-nowrap">Check-in</span>
              <select
                v-model="upcomingCheckinsFilter"
                class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
              >
                <option value="all">All</option>
                <option value="1">1 month</option>
                <option value="2-3">2–3 months</option>
                <option value="4-6">4–6 months</option>
              </select>
            </label>
          </div>

          <button
            v-if="completedCheckinsCount > 0"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800 hover:bg-teal-100"
            @click="completedCheckinsHistoryOpen = true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>Completed check-ins ({{ completedCheckinsCount }})</span>
          </button>
        </div>
      </div>

      <div v-if="upcomingCheckinsExpanded">
        <div v-if="probationNewHiresPending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">Loading…</div>
        <div v-else-if="probationNewHiresError" class="rounded-md border border-pink-200 bg-pink-50 p-4 text-pink-800">
          Failed to load onboarding check-ins.
          <div v-if="probationNewHiresErrorMessage" class="mt-2 text-xs text-pink-700/80">{{ probationNewHiresErrorMessage }}</div>
        </div>
        <div v-else class="min-w-0">
          <NewHireCheckinsTable
            v-model:history-open="completedCheckinsHistoryOpen"
            :items="filteredCheckinsNewHires"
            :checkin-filter="upcomingCheckinsFilter"
            @update:completed-count="completedCheckinsCount = $event"
          />
        </div>
      </div>

      <div class="flex justify-end">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-100"
          :aria-expanded="upcomingCheckinsExpanded"
          @click="upcomingCheckinsExpanded = !upcomingCheckinsExpanded"
        >
          <span>{{ upcomingCheckinsExpanded ? 'Collapse' : 'Expand' }}</span>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            class="h-4 w-4 text-slate-600 transition-transform"
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
    </section>

    <section v-if="!isReportMode" id="recent-separations" class="surface-tint-hero scroll-mt-32 min-w-0 space-y-4 rounded-2xl p-4 shadow-card sm:p-5">
      <div class="flex min-w-0 items-start gap-3">
        <span class="mt-1 h-6 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden="true" />
        <div class="min-w-0 space-y-0.5">
          <h2 class="text-gradient-brand text-xl font-bold tracking-tight">Recent Separations</h2>
          <p class="text-xs text-slate-500">Employees where Active = false (resigned / fired / retired).</p>
        </div>
      </div>

      <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-slate-600">Archived employees (by month, from Odoo write date).</div>
        <div class="flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span class="whitespace-nowrap">Country</span>
            <select
              v-model="selectedSeparationCountry"
              class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              <option value="">All</option>
              <option v-for="c in separationCountries" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-sm font-medium text-slate-600">
            <span class="whitespace-nowrap">Month</span>
            <select
              v-model="selectedSeparationMonth"
              class="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-sm text-slate-900 outline-none focus:border-slate-400"
            >
              <option v-for="m in separationMonths" :key="m" :value="m">{{ formatMonthLabel(m) }}</option>
            </select>
          </label>
        </div>
      </div>

      <div v-if="separationsPending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">Loading…</div>
      <div v-else-if="separationsError" class="rounded-md border border-pink-200 bg-pink-50 p-4 text-pink-800">
        Failed to load employees.
        <div v-if="separationsErrorMessage" class="mt-2 text-xs text-pink-700/80">{{ separationsErrorMessage }}</div>
      </div>
      <div
        v-else
        id="recent-separations-table"
        class="scroll-mt-24 rounded-md border border-slate-200 bg-white shadow-card"
      >
        <table class="w-full table-fixed border-collapse text-center text-sm">
          <colgroup>
            <col style="width: 16%" />
            <col style="width: 15%" />
            <col style="width: 16%" />
            <col style="width: 13%" />
            <col style="width: 12%" />
            <col style="width: 12%" />
            <col style="width: 16%" />
          </colgroup>
          <thead class="bg-slate-100 text-slate-600">
            <tr>
              <th class="px-3 py-3 align-bottom font-medium">Name</th>
              <th class="px-3 py-3 align-bottom font-medium">Department</th>
              <th class="px-3 py-3 align-bottom font-medium">Position</th>
              <th class="px-3 py-3 align-bottom font-medium">Country</th>
              <th class="px-3 py-3 align-bottom font-medium">Start</th>
              <th class="px-3 py-3 align-bottom font-medium">Separated</th>
              <th class="px-3 py-3 align-bottom font-medium">Type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in recentSeparations" :key="e.employeeKey" class="border-t border-hr-navy/25 align-top">
              <td class="min-w-0 break-words px-3 py-3 text-slate-900">{{ e.name }}</td>
              <td class="min-w-0 break-words px-3 py-3 text-slate-800">{{ e.department }}</td>
              <td class="min-w-0 break-words px-3 py-3 text-slate-800">{{ e.position }}</td>
              <td class="min-w-0 break-words px-3 py-3 text-slate-800">{{ e.countryAssigned }}</td>
              <td class="min-w-0 whitespace-nowrap px-3 py-3 tabular-nums text-slate-800">{{ formatYmdDateOrDash(e.startDate) }}</td>
              <td class="min-w-0 whitespace-nowrap px-3 py-3 tabular-nums text-slate-800">{{ formatYmdDateOrDash(e.separatedAt) }}</td>
              <td class="min-w-0 px-3 py-3 align-top">
                <span :class="[tableDataBadgeClass, separationTypeBadgeClass(e.separationType)]">
                  {{ formatSeparationType(e.separationType) }}
                </span>
              </td>
            </tr>
            <tr v-if="recentSeparations.length === 0" class="border-t border-hr-navy/25">
              <td colspan="7" class="px-3 py-6 text-center text-slate-600">No separations found for this month.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { formatYmdDateOrDash } from '~/utils/dates'
import { formatTenureReadable } from '~/utils/tenure'
import { tableDataBadgeClass } from '~/utils/tableBadge'
import { ensureUsaOption } from '~/utils/countryOptions'
import { ONBOARDING_TASKS, EXIT_TASKS } from '~/utils/recruitmentChecklistTasks'
import NewHireCheckinsTable from '~/components/NewHireCheckinsTable.vue'
import { firstQueryString, parseYyyyMm, recruitmentDeeplinkScrollId } from '~/utils/recruitmentDeeplink'

const route = useRoute()
const isReportMode = computed(() => route.query.report === '1')

const recruitmentSectionNavItems = [
  { id: 'critical-vacancies', label: 'Critical Vacancies' },
  { id: 'recruitment-onboarding', label: 'Recruitment & Onboarding' },
  { id: 'recent-new-hires', label: 'New Hires' },
  { id: 'offboarding', label: 'Offboarding' },
  { id: 'upcoming-onboarding-checkins', label: 'Upcoming Onboarding Check-ins' },
  { id: 'recent-separations', label: 'Recent Separations' }
] as const

const criticalVacanciesKpi = computed(() => vacancies.value.length)
const candidatesInPipelineKpi = computed(() => criticalRecruitment.value.length)
const newHiresKpi = computed(() => odooNewHires.value.length)

const CHECKIN_APPROACH_WINDOW_DAYS = 14
const CHECKIN_MILESTONE_MONTHS = [1, 2, 3, 4, 5, 6] as const
const DAY_MS = 24 * 60 * 60 * 1000

function parseYmdUtcMsLocal(ymd: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const ms = Date.UTC(y, mo - 1, d)
  const dt = new Date(ms)
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
  return ms
}

function addMonthsClampedUtcMsLocal(startUtcMs: number, months: number) {
  const dt = new Date(startUtcMs)
  const y = dt.getUTCFullYear()
  const m0 = dt.getUTCMonth()
  const d = dt.getUTCDate()
  const target = new Date(Date.UTC(y, m0 + months, 1))
  const ty = target.getUTCFullYear()
  const tm0 = target.getUTCMonth()
  const lastDay = new Date(Date.UTC(ty, tm0 + 1, 0)).getUTCDate()
  const td = Math.min(d, lastDay)
  return Date.UTC(ty, tm0, td)
}

function utcTodayMsLocal() {
  const now = new Date()
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

const checkinsDueKpi = computed(() => {
  const today = utcTodayMsLocal()
  let count = 0
  for (const i of probationNewHires.value) {
    const start = (i.startDate ?? '').trim()
    const startMs = start ? parseYmdUtcMsLocal(start) : null
    if (!startMs) continue
    const probationEnd = addMonthsClampedUtcMsLocal(startMs, 6)
    if (today >= probationEnd) continue
    for (const months of CHECKIN_MILESTONE_MONTHS) {
      const dueMs = addMonthsClampedUtcMsLocal(startMs, months)
      const daysUntil = Math.ceil((dueMs - today) / DAY_MS)
      if (daysUntil >= 0 && daysUntil <= CHECKIN_APPROACH_WINDOW_DAYS) count++
    }
  }
  return count
})

function scrollToRecruitmentSection(id: string) {
  if (!import.meta.client) return
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const showRecruitmentBackToTop = ref(false)

function navigateRecruitmentSection(id: string) {
  showRecruitmentBackToTop.value = true
  scrollToRecruitmentSection(id)
}

function scrollRecruitmentToTop() {
  if (!import.meta.client) return
  window.scrollTo({ top: 0, behavior: 'smooth' })
  showRecruitmentBackToTop.value = false
}

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
  departureReason?: string
  lastWorkingDay?: string | null
  offboardingPhase?: string
}

type OffboardingEmployee = Employee

type OdooSeparationsRow = {
  employeeKey: string
  name: string
  department: string
  position: string
  countryAssigned: string
  startDate: string | null
  separatedAt: string
  separationType:
    | 'resigned'
    | 'retired'
    | 'fired'
    | 'vsep'
    | 'end_of_contract'
    | 'probation_failure'
    | 'retrenchment'
    | 'separated'
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
  if (v === 'high') return 'border-pink-200 bg-pink-50 text-pink-800'
  if (v === 'medium') return 'border-purple-200 bg-purple-50 text-brand-purple'
  if (v === 'low') return 'border-teal-200 bg-teal-50 text-teal-800'
  return 'border-slate-300 bg-white text-slate-800'
}

function normalizeStage(value: string) {
  return value.trim().toLowerCase()
}

function normalizeRecruitmentStage(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const v = normalizeStage(trimmed)
  if (v === 'screening stage') return 'Screening Stage'
  if (v === 'first interview') return 'First Interview'
  if (v === 'second interview') return 'Second Interview'
  if (v === 'evaluation stage') return 'Evaluation Stage'
  if (v === 'offer stage') return 'Offer Stage'
  if (v === 'pre-onboarding stage') return 'Pre-Onboarding Stage'
  if (v === 'feedback stage') return 'Feedback Stage'
  return trimmed
}

function criticalRecruitmentStageBadgeClass(value: string) {
  const v = normalizeStage(normalizeRecruitmentStage(value))
  if (v === 'screening stage') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (v === 'first interview') return 'border-sky-200 bg-sky-50 text-sky-800'
  if (v === 'second interview') return 'border-blue-200 bg-blue-50 text-blue-900'
  if (v === 'evaluation stage') return 'border-indigo-200 bg-indigo-50 text-indigo-800'
  if (v === 'offer stage') return 'border-purple-200 bg-purple-50 text-brand-purple'
  if (v === 'pre-onboarding stage') return 'border-teal-200 bg-teal-50 text-teal-800'
  if (v === 'feedback stage') return 'border-pink-200 bg-pink-50 text-pink-800'
  return 'border-slate-300 bg-white text-slate-800'
}

function normalizeNewHireStatus(value: string) {
  return value.trim().toLowerCase()
}

function newHireStatusBadgeClass(value: string) {
  const v = normalizeNewHireStatus(value)
  if (v === 'pre-onboarding stage') return 'border-blue-200 bg-blue-50 text-blue-900'
  if (v === 'onboarding') return 'border-pink-200 bg-pink-50 text-pink-800'
  if (v === 'hired') return 'border-teal-200 bg-teal-50 text-teal-800'
  return 'border-slate-300 bg-white text-slate-800'
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
} = useFetch<Vacancy[]>('/api/vacancies')
const vacancies = computed(() => vacanciesData.value ?? [])
const vacanciesErrorMessage = computed(() => getErrorMessage(vacanciesError.value))

const REPORT_TOP_VACANCIES = 12
const REPORT_TOP_CANDIDATES = 15

const selectedVacancyCountry = ref('')
const vacancyListCountries = computed(() =>
  ensureUsaOption(uniqueSorted(vacancies.value.map((v) => (v.country ?? '').trim()).filter(Boolean)))
)

const vacanciesFiltered = computed(() => {
  const c = selectedVacancyCountry.value.trim()
  if (!c) return vacancies.value
  return vacancies.value.filter((v) => (v.country ?? '').trim() === c)
})

const vacanciesForDisplay = computed(() =>
  isReportMode.value ? vacanciesFiltered.value.slice(0, REPORT_TOP_VACANCIES) : vacanciesFiltered.value
)

const {
  data: criticalRecruitmentData,
  pending: criticalRecruitmentPending,
  error: criticalRecruitmentError,
  refresh: refreshCriticalRecruitment
} = useFetch<CriticalRecruitment[]>('/api/critical-recruitment')
const criticalRecruitment = computed(() => criticalRecruitmentData.value ?? [])
const criticalRecruitmentErrorMessage = computed(() => getErrorMessage(criticalRecruitmentError.value))

const selectedNewHireMonth = ref('')
const newHireQuery = computed(() => ({ month: selectedNewHireMonth.value || undefined }))
const {
  data: odooNewHiresData,
  pending: odooNewHiresPending,
  error: odooNewHiresError
} = useFetch<OdooNewHiresResponse>('/api/odoo/new-hires', { query: newHireQuery })

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

type OnboardingChecklistState = Record<string, boolean[]>
const onboardingByRowKey = ref<OnboardingChecklistState>({})

type ExitChecklistState = Record<string, boolean[]>
const exitByRowId = ref<ExitChecklistState>({})

const { data: onboardingChecklistsPayload, refresh: refreshOnboardingChecklists } = useFetch<{
  checklists: Record<string, boolean[]>
}>('/api/recruitment-onboarding-checklists')

const { data: exitChecklistsPayload, refresh: refreshExitChecklists } = useFetch<{
  checklists: Record<string, boolean[]>
}>('/api/recruitment-exit-checklists')

function normalizeExitChecklistArray(value: unknown) {
  if (!Array.isArray(value)) return null
  const out = new Array(EXIT_TASKS.length).fill(false) as boolean[]
  for (let i = 0; i < out.length; i += 1) out[i] = Boolean(value[i])
  return out
}

function exitRowKey(row: { employeeKey: string }) {
  return `emp:${row.employeeKey}`
}

function exitChecklistFor(row: { employeeKey: string }) {
  const k = exitRowKey(row)
  const existing = exitByRowId.value[k]
  if (existing && Array.isArray(existing) && existing.length === EXIT_TASKS.length) return existing
  return new Array(EXIT_TASKS.length).fill(false) as boolean[]
}

function isExitTaskDone(row: { employeeKey: string }, idx: number) {
  return exitChecklistFor(row)[idx] === true
}

async function setExitTaskDone(row: { employeeKey: string }, idx: number, done: boolean) {
  const k = exitRowKey(row)
  const prev = { ...exitByRowId.value }
  const next = exitChecklistFor(row).slice()
  next[idx] = done
  exitByRowId.value = { ...exitByRowId.value, [k]: next }
  try {
    await $fetch('/api/recruitment-exit-checklists', { method: 'PUT', body: { rowKey: k, taskStates: next } })
    await refreshExitChecklists()
  } catch {
    exitByRowId.value = prev
  }
}

function exitDoneCount(row: { employeeKey: string }) {
  return exitChecklistFor(row).filter(Boolean).length
}

const expandedExitChecklistKey = ref<string | null>(null)
function toggleExitChecklist(row: { employeeKey: string }) {
  expandedExitChecklistKey.value = expandedExitChecklistKey.value === row.employeeKey ? null : row.employeeKey
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

async function setOnboardingTaskDone(n: OdooNewHire, idx: number, done: boolean) {
  const k = onboardingRowKey(n)
  const prev = { ...onboardingByRowKey.value }
  const next = checklistFor(n).slice()
  next[idx] = done
  onboardingByRowKey.value = { ...onboardingByRowKey.value, [k]: next }
  try {
    await $fetch('/api/recruitment-onboarding-checklists', { method: 'PUT', body: { rowKey: k, taskStates: next } })
    await refreshOnboardingChecklists()
  } catch {
    onboardingByRowKey.value = prev
  }
}

function onboardingDoneCount(n: OdooNewHire) {
  return checklistFor(n).filter(Boolean).length
}

const expandedOnboardingKey = ref<string | null>(null)
function toggleOnboardingChecklist(n: OdooNewHire) {
  const k = onboardingRowKey(n)
  expandedOnboardingKey.value = expandedOnboardingKey.value === k ? null : k
}

watch(
  onboardingChecklistsPayload,
  (p) => {
    if (!p?.checklists) return
    const next: OnboardingChecklistState = {}
    for (const [k, raw] of Object.entries(p.checklists)) {
      if (typeof k !== 'string') continue
      const normalized = normalizeChecklistArray(raw)
      if (normalized) next[k] = normalized
    }
    onboardingByRowKey.value = next
  },
  { immediate: true }
)

watch(
  exitChecklistsPayload,
  (p) => {
    if (!p?.checklists) return
    const next: ExitChecklistState = {}
    for (const [k, raw] of Object.entries(p.checklists)) {
      if (typeof k !== 'string') continue
      const normalized = normalizeExitChecklistArray(raw)
      if (normalized) next[k] = normalized
    }
    exitByRowId.value = next
  },
  { immediate: true }
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
} = useFetch<OdooNewHiresResponse>('/api/odoo/new-hires', { query: { probation: '1' } })
const probationNewHires = computed(() => probationNewHiresData.value?.items ?? [])
const probationNewHiresErrorMessage = computed(() => getErrorMessage(probationNewHiresError.value))

const upcomingCheckinsExpanded = ref(true)
const upcomingCheckinsFilter = ref<'all' | '1' | '2-3' | '4-6'>('all')
const completedCheckinsCount = ref(0)
const completedCheckinsHistoryOpen = ref(false)
const selectedCheckinsCountry = ref('')
const checkinsCountries = computed(() => ensureUsaOption(uniqueSorted(probationNewHires.value.map((n) => n.countryAssigned))))
const filteredCheckinsNewHires = computed(() => {
  const selected = selectedCheckinsCountry.value.trim()
  const items = probationNewHires.value ?? []
  return selected ? items.filter((n) => n.countryAssigned === selected) : items
})

const { data: employeesData, pending: employeesPending, error: employeesError } = useFetch<Employee[]>('/api/odoo/employees')
const employeesErrorMessage = computed(() => getErrorMessage(employeesError.value))

const selectedSeparationMonth = ref('')
const separationsQuery = computed(() => ({ month: selectedSeparationMonth.value || undefined }))
const {
  data: separationsData,
  pending: separationsPending,
  error: separationsError
} = useFetch<OdooSeparationsResponse>('/api/odoo/separations', { query: separationsQuery })
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

/** Month filters for HR Analytics deep links (scroll runs when Odoo fetches for those sections finish). */
function applyRecruitmentDeepLink() {
  if (!import.meta.client) return
  const id = recruitmentDeeplinkScrollId(route)
  if (id === 'recent-separations') {
    const m = parseYyyyMm(route.query.sepMonth)
    if (m) selectedSeparationMonth.value = m
    return
  }
  if (id === 'recent-new-hires') {
    const m = parseYyyyMm(route.query.hireMonth)
    if (m) selectedNewHireMonth.value = m
  }
}

watch(
  () =>
    [
      recruitmentDeeplinkScrollId(route),
      firstQueryString(route.query.sepMonth),
      firstQueryString(route.query.hireMonth),
      route.hash
    ] as const,
  () => applyRecruitmentDeepLink(),
  { flush: 'post', immediate: true }
)

function prefersReducedMotionClient() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function resolveRecruitmentDeeplinkScrollEl(id: 'recent-separations' | 'recent-new-hires') {
  if (id === 'recent-new-hires') {
    return document.getElementById('recent-new-hires')
  }
  return document.getElementById('recent-separations')
}

function scrollRecruitmentDeeplinkIntoView() {
  if (!import.meta.client) return
  const id = recruitmentDeeplinkScrollId(route)
  if (!id) return
  if (id === 'recent-separations' && separationsPending.value) return
  if (id === 'recent-new-hires' && odooNewHiresPending.value) return

  const run = () => {
    const el = resolveRecruitmentDeeplinkScrollEl(id)
    if (!el) return
    if (prefersReducedMotionClient()) el.scrollIntoView({ block: 'start' })
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(run, 0)
      })
    })
  })
}

watch(
  () => ({
    id: recruitmentDeeplinkScrollId(route),
    fullPath: route.fullPath,
    sepPending: separationsPending.value,
    hirPending: odooNewHiresPending.value
  }),
  (s) => {
    if (!s.id) return
    if (s.id === 'recent-separations' && s.sepPending) return
    if (s.id === 'recent-new-hires' && s.hirPending) return
    scrollRecruitmentDeeplinkIntoView()
  },
  { flush: 'post', immediate: true }
)

const vacancyCountries = computed(() => ensureUsaOption(uniqueSorted((employeesData.value ?? []).map((e) => e.countryAssigned))))
const vacancyDepartments = computed(() => uniqueSorted((employeesData.value ?? []).map((e) => e.department)))
const vacancyPriorities = ['high', 'medium', 'low'] as const
const criticalRecruitmentStages = [
  'Screening Stage',
  'First Interview',
  'Second Interview',
  'Evaluation Stage',
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

const SEPARATION_TYPE_LABELS: Record<OdooSeparationsRow['separationType'], string> = {
  resigned: 'Resigned',
  retired: 'Retired',
  fired: 'Fired',
  vsep: 'VSEP',
  end_of_contract: 'End of Contract',
  probation_failure: 'Probation Failure',
  retrenchment: 'Retrenchment',
  separated: 'Separated'
}

const SEPARATION_TYPE_BADGE_CLASSES: Record<OdooSeparationsRow['separationType'], string> = {
  resigned: 'border-teal-200 bg-teal-50 text-teal-800',
  retired: 'border-purple-200 bg-purple-50 text-purple-800',
  fired: 'border-pink-200 bg-pink-50 text-pink-800',
  vsep: 'border-blue-200 bg-blue-50 text-blue-800',
  end_of_contract: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  probation_failure: 'border-rose-200 bg-rose-50 text-rose-800',
  retrenchment: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800',
  separated: 'border-slate-200 bg-slate-50 text-slate-700'
}

function formatSeparationType(value: OdooSeparationsRow['separationType']) {
  return SEPARATION_TYPE_LABELS[value] ?? 'Separated'
}

function separationTypeBadgeClass(value: OdooSeparationsRow['separationType']) {
  return SEPARATION_TYPE_BADGE_CLASSES[value] ?? SEPARATION_TYPE_BADGE_CLASSES.separated
}

type OffboardingDepartureKind = OdooSeparationsRow['separationType'] | 'other'

function normalizeDepartureReasonFromOdoo(
  reason: string | undefined
): Exclude<OdooSeparationsRow['separationType'], 'separated'> | null {
  const v = (reason ?? '').trim().toLowerCase()
  if (!v) return null
  if (v.includes('vsep') || v.includes('voluntary separation')) return 'vsep'
  if (v.includes('end of contract') || v.includes('non-renewal') || v.includes('non renewal')) return 'end_of_contract'
  if (v.includes('probation')) return 'probation_failure'
  if (v.includes('retrench')) return 'retrenchment'
  if (v === 'resigned' || v.startsWith('resign')) return 'resigned'
  if (v === 'retired' || v.startsWith('retire')) return 'retired'
  if (v === 'fired' || v.startsWith('fire') || v.includes('terminated') || v.includes('termination')) return 'fired'
  return null
}

function offboardingDepartureKind(row: OffboardingEmployee): OffboardingDepartureKind | null {
  const n = normalizeDepartureReasonFromOdoo(row.departureReason)
  if (n) return n
  if (row.departureReason?.trim()) return 'other'
  return null
}

function offboardingDepartureTypeLabel(value: OffboardingDepartureKind) {
  if (value === 'other') return 'Other'
  return SEPARATION_TYPE_LABELS[value]
}

function offboardingDepartureTypeBadgeClass(value: OffboardingDepartureKind) {
  if (value === 'other') return 'border-blue-200 bg-blue-50 text-blue-800'
  return SEPARATION_TYPE_BADGE_CLASSES[value]
}

function offboardingWorkflowLabel(row: OffboardingEmployee) {
  return row.offboardingPhase?.trim() || 'Offboarding'
}

function offboardingWorkflowBadgeClass(row: OffboardingEmployee) {
  if (row.offboardingPhase?.trim()) return 'border-purple-200 bg-purple-50 text-brand-purple'
  return 'border-pink-200 bg-pink-50 text-pink-800'
}

const {
  data: offboardingData,
  pending: offboardingPending,
  error: offboardingError
} = useFetch<OffboardingEmployee[]>('/api/odoo/offboarding')
const offboardingErrorMessage = computed(() => getErrorMessage(offboardingError.value))
const offboardingEmployees = computed(() => offboardingData.value ?? [])
const selectedOffboardingCountry = ref('')
const offboardingCountries = computed(() =>
  ensureUsaOption(uniqueSorted(offboardingEmployees.value.map((r) => r.countryAssigned)))
)
const filteredOffboardingEmployees = computed(() => {
  const selected = selectedOffboardingCountry.value.trim()
  const items = offboardingEmployees.value ?? []
  return selected ? items.filter((r) => r.countryAssigned === selected) : items
})

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

