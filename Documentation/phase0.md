# Phase 0 Plan — Foundation (Nuxt 4 + Tailwind + Navigation Shell)

## Objective

Deliver a **demo-ready navigation shell** for the HR Dashboard MVP with:
- **Nuxt 4 scaffold**
- **TailwindCSS**
- **App layout + routes** (placeholders only; no CSV/JSON logic yet)

This phase is complete when the app runs locally and you can click through all primary pages in a consistent layout.

---

## Deliverables (end of Phase 0)

- A Nuxt 4 app scaffolded in a dedicated folder (recommended: `./hr-dashboard/`) to avoid conflicts with existing docs/files.
- TailwindCSS configured and usable in Vue components.
- A reusable application shell layout (sidebar + main content).
- Placeholder pages for all top-level routes in the spec, wired into the sidebar navigation.
- A short “demo script” to validate the shell.

---

## Implementation Steps

### 1) Scaffold Nuxt 4 app

- Create the app in a subfolder to avoid scaffolding into a non-empty directory:
  - `npx nuxi@latest init hr-dashboard`
- Install dependencies:
  - `cd hr-dashboard`
  - `npm install` (or `pnpm install` / `yarn install`, pick one and stick to it)
- Start dev server to confirm the scaffold works:
  - `npm run dev`

**Exit criteria**
- Dev server starts without errors and loads the default Nuxt page.

---

### 2) Add TailwindCSS (Nuxt module approach)

- Install Tailwind module:
  - `npm install -D @nuxtjs/tailwindcss`
- Enable it in `nuxt.config.ts` via `modules: ['@nuxtjs/tailwindcss']`.
- Confirm Tailwind works by applying a few utility classes in the home page.

**Exit criteria**
- Tailwind utilities render correctly (e.g., spacing, typography, background colors).

---

### 3) Create the AppShell layout (sidebar navigation)

- Create `layouts/default.vue` containing:
  - Fixed/scrollable sidebar with app name “HR Dashboard”
  - Navigation links (NuxtLink) to each page
  - Main content area (`<NuxtPage />`)
- Keep styling minimal but clean and consistent using Tailwind.

**Recommended nav items (Phase 0)**
- Home (Analytics): `/`
- Employees: `/employees`
- Recruitment & Onboarding: `/recruitment`
- Performance: `/performance`
- Disciplinary Matters: `/disciplinary`

**Exit criteria**
- Layout is applied across pages and navigation is visible on every route.

---

### 4) Add placeholder routes/pages (no data logic yet)

Create placeholder pages with a title + brief “coming next phase” note:
- `pages/index.vue`
- `pages/employees/index.vue`
- `pages/recruitment.vue`
- `pages/performance.vue`
- `pages/disciplinary.vue`

Optional (helps validate routing structure early, even if unused until Phase 1):
- `pages/employees/[employeeKey].vue` (placeholder “Employee Profile” page)

**Exit criteria**
- All routes resolve (no 404s) and render inside the shared layout.

---

### 5) Phase 0 demo script (what to show)

- Start the app: `npm run dev`
- Click through each sidebar link and confirm:
  - The URL changes correctly
  - The page title changes correctly
  - The layout stays consistent

---

## Acceptance Criteria (Phase 0 complete)

- App scaffolds cleanly and runs locally via `npm run dev`.
- Tailwind is installed, enabled, and utilities apply correctly.
- A shared layout (`layouts/default.vue`) renders a sidebar + content area.
- Primary routes exist and are navigable:
  - `/`
  - `/employees`
  - `/recruitment`
  - `/performance`
  - `/disciplinary`
- No CSV parsing, no Nitro APIs, and no JSON persistence implemented in Phase 0.

