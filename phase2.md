# Phase 2 Plan — Analytics Part 1 (Headcount + Separations)

## Objective

Implement the **Phase 2** scope from `project.md`:

- Home analytics for:
  - **Geographical Headcount** (bar chart)
  - **Employee Separations** (donut / progress ring)
- Demo: **workforce distribution + resignation ratio** driven from the existing employee CSV pipeline (Phase 1).

This phase is complete when the Home page (`/`) renders both visuals using real employee data, following the rules in `project.md`.

---

## Current State (what exists today)

**Phase 0 / Phase 1 already implemented**

- Nuxt 4 app scaffolded in `hr-dashboard/`, Tailwind configured.
- Layout shell + routes exist (`app/layouts/default.vue`, sidebar navigation).
- Employee CSV ingestion exists:
  - `GET /api/employees` (`hr-dashboard/server/api/employees.get.ts`)
  - `GET /api/employees/:employeeKey` (`hr-dashboard/server/api/employees/[employeeKey].get.ts`)
  - CSV parsing + `employeeKey` generation in `hr-dashboard/server/utils/employees.ts`
- Employees UI exists:
  - `/employees` table with search + filters
  - `/employees/:employeeKey` read-only profile (and PDF download endpoint)

**Home page is still a placeholder**

- `hr-dashboard/app/pages/index.vue` currently shows a “Phase 0 placeholder” message and no analytics.

**Charting library**

- No charting library is currently listed in `hr-dashboard/package.json`.

---

## Web Research Note (tooling limitation)

During this session, the built-in web search tool returned generic “Phase 2” project-management resources unrelated to Nuxt/Vue chart integration (even when searching with Nuxt-specific terms).  
The implementation approach below follows **standard Nuxt/Nitro + Vue SSR best practices** (client-only rendering for browser-dependent chart libraries) and aligns to Nuxt documentation patterns.

---

## Phase 2 Deliverables

### A) Analytics API (server-side)

Add Nitro API:

- `GET /api/analytics/home`

Responsibilities:

- Load employees via the existing Phase 1 utility (`loadEmployeesFromCsv()`).
- Compute:
  - **Headcount by Country Assigned** (exclude resigned employees)
  - **Separations**:
    - \(R\) = resigned employees
    - \(T\) = total employees
    - ratio = \(R / T\) (guard \(T = 0\))

### B) Reusable chart components (client-side)

Add components:

- `HeadcountBarChart` (bar chart)
- `SeparationsDonut` (donut/progress ring)

### C) Home page implementation (`/`)

Update `hr-dashboard/app/pages/index.vue` to:

- Fetch `GET /api/analytics/home`
- Render the two charts with clean empty/loading/error states

---

## Recommended Implementation Approach (Nuxt 4 + Nitro)

### 1) Define the analytics response shape (contract first)

Create a stable response contract for `GET /api/analytics/home` (either inline in the endpoint or in a small shared type file).

Suggested shape (minimal and Phase 2–specific):

- `headcountByCountry: Array<{ country: string; headcount: number }>`
- `separations: { resigned: number; total: number; ratio: number }`

**Exit criteria**
- API returns deterministic, correctly computed values from the CSV.

---

### 2) Implement `GET /api/analytics/home` using the existing CSV pipeline

Create: `hr-dashboard/server/api/analytics/home.get.ts`

Computation rules (from `project.md`):

- **Headcount chart**:
  - group by `countryAssigned`
  - **exclude resigned employees**
- **Separations**:
  - resigned count uses `Employee Status == Resigned`
  - total uses all employees in the CSV

Implementation detail (recommended for robustness):

- Normalize status before checking resigned:
  - `String(employee.employeeStatus).trim().toLowerCase() === 'resigned'`
  - This keeps the UI correct even if the source CSV has whitespace/case inconsistencies.

**Exit criteria**
- Calling `GET /api/analytics/home` returns:
  - headcount bars that sum to “active employees”
  - separations values that reconcile: resigned ≤ total

---

### 3) Choose a charting strategy (best UX with minimal risk)

**Recommended**: ECharts via `echarts` + `vue-echarts`

Why this fits Phase 2:

- Good defaults for bar + donut charts.
- Easy to build a donut “center label” (for resigned count) and show progress (ratio).

Nuxt SSR best practice:

- Render chart components **client-only** to avoid SSR/runtime issues from DOM access.
- Use a Nuxt client plugin to register the chart component once:
  - `hr-dashboard/plugins/echarts.client.ts`
- Wrap chart usage in `<ClientOnly>` (or ensure the component itself is client-only).

**Alternative**: Chart.js via `chart.js` + `vue-chartjs`

- Also viable; still requires client-only rendering patterns in SSR apps.

**Exit criteria**
- Charts render consistently in dev, refresh reliably, and resize correctly.

---

### 4) Build the reusable chart components

Create:

- `hr-dashboard/app/components/HeadcountBarChart.vue`
  - Props: `items: Array<{ country: string; headcount: number }>`
  - Chart:
    - X-axis: country
    - Y-axis: headcount
    - Sort countries (e.g., headcount desc or alpha) and keep it consistent

- `hr-dashboard/app/components/SeparationsDonut.vue`
  - Props: `resigned: number`, `total: number`
  - Chart:
    - donut showing resigned vs remaining
    - center label shows resigned count \(R\)
    - progress derived from ratio \(R / T\)

**Exit criteria**
- Components are data-driven and reusable (no hard-coded fetch inside components).

---

### 5) Update Home page (`hr-dashboard/app/pages/index.vue`)

Implement:

- `useFetch('/api/analytics/home')`
- Render:
  - Title + brief subtitle
  - Two “cards” (headcount + separations)
  - Loading / error / empty states

**Exit criteria**
- Visiting `/` shows both visuals populated from the API.

---

## Acceptance Criteria (Phase 2 complete)

- `GET /api/analytics/home` exists and returns correct values derived from CSV:
  - Headcount by country excludes resigned employees
  - Separations uses resigned count and total count exactly as defined in `project.md`
- Home page (`/`) renders:
  - Geographical Headcount bar chart
  - Employee Separations donut/progress ring
- Visuals reconcile numerically:
  - \(\sum headcountByCountry =\) active employees count
  - resigned ≤ total, ratio in \([0, 1]\) (or 0 when total is 0)
- No change to Phase 1 behavior (Employees list/profile remain intact).

---

## Demo Script (Phase 2)

From `hr-dashboard/`:

- `npm run dev`
- Visit `/`:
  - Confirm headcount bar chart renders and excludes resigned employees
  - Confirm separations donut renders and shows resigned count in the center
- Spot-check reconciliation:
  - Compare resigned/total with a quick manual count from CSV (or by temporarily inspecting `GET /api/analytics/home` JSON output in the browser).

