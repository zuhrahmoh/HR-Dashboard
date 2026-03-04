## Phase 16 — Complete PDF Reporting + Historical Snapshots + Governance Controls

### Objective
Extend the HR Dashboard beyond Phase 15’s Odoo production + contracts work by delivering:
- A **polished, production-ready “Complete report” PDF** (portrait A4) with reliable page splitting and a clean light theme.
- **Historical report generation** for selected months (limited to months available for expenses).
- **Historical headcount snapshots** stored in the database and visualized as a trend (dashboard + report).
- **Report governance controls** (disciplinary cases explicitly opted into the report).
- **Data hygiene and taxonomy consistency** (USA labeling, exclusions, and targeted one-off data fixes).

---

### Reporting & PDF generation (complete report)

#### New server endpoint: Complete PDF report
- **`GET /api/reports/complete`** (`server/api/reports/complete.get.ts`)
  - Uses **Playwright Chromium** to render report-only pages and **pdf-lib** to merge them into a single PDF.
  - Generates **portrait A4** with header/footer (generated timestamp + page numbers).
  - Accepts optional query:
    - **`reportMonth=YYYY-MM`**: used to render historical values for month-scoped sections.

#### Report page order (updated)
The merged report order is:
1. Workforce overview
2. Expenses
3. Separations
4. Recruitment
5. Critical vacancies
6. Disciplinary

#### Report-only pages
Implemented a dedicated report route group (`app/pages/report/`) rendered in report mode:
- `app/pages/report/workforce.vue`
- `app/pages/report/expenses.vue`
- `app/pages/report/separations.vue`
- `app/pages/report/recruitment.vue`
- `app/pages/report/vacancies.vue`
- `app/pages/report/disciplinary.vue`
- `app/pages/report/summary.vue` (executive summary)

#### Report styling system (light theme, stable pagination)
Added global report helpers in `assets/css/tailwind.css` driven by `html[data-report='1']`:
- **Light theme overrides** for dark dashboard surfaces/text in exports.
- **Page-break controls**:
  - `.report-keep`: avoid splitting key blocks/tables
  - `.report-page`: force a new page
  - Heading orphan prevention (`break-after: avoid-page`)
- **Hide interactive UI** (buttons/inputs/selects) in exports.
- **Table wrapping fixes** (remove nowrap and allow word-breaking).
- **Devtools overlay suppression** to avoid exporting runtime widgets.

---

### Historical report generation (month dropdown)
Updated the sidebar “Generate summary report” control (`app/layouts/default.vue`):
- Button now opens a dropdown with:
  - **Current report** (live)
  - **February (current year)** (historical)
  - **January (current year)** (historical)
- Selected historical months call:
  - `GET /api/reports/complete?reportMonth=YYYY-MM`
- Month label display is formatted as **`Mon YYYY` / `Month YYYY`** (frontend formatting).
- UI polish: the icon + label are **centered** within the button, with the chevron pinned right.

Scope note:
- Only **month-scoped sections** are expected to vary by `reportMonth` (notably expenses, additions, separations). Other sections remain “current snapshot”.

---

### Workforce: historical headcount snapshots + trends

#### Database model
Added `HeadcountSnapshot` to Prisma (`prisma/schema.prisma`):
- `month` is **unique** (stored as a UTC DateTime; normalized to first-of-month)
- `headcount` stores the snapshot value for that month

#### API: snapshots feed
- **`GET /api/analytics/headcount-snapshots`** (`server/api/analytics/headcount-snapshots.get.ts`)
  - Returns `{ items: [{ month: "YYYY-MM", headcount }] }` ordered ascending by month.

#### Seeding script
- `scripts/seed-headcount-snapshots.ts`
  - Upserts the provided historical snapshot table into `HeadcountSnapshot`.

#### UI: trend visualization
- New chart component: `app/components/HeadcountMonthlyLineChart.vue`
  - **Y-axis starts at 0**
  - **X-axis starts at first available year** (first tick always shown)
  - Topmost Y-axis label includes the max value
  - Supports `variant="dark" | "light"` for dashboard vs report styling

#### Dashboard integration
- Home page (`app/pages/odoo/index.vue`):
  - Added a **“View trends”** toggle on Geographical Headcount to reveal the monthly headcount line chart.
  - Added a **Back** button to collapse the overview.

#### Report integration
- Workforce report (`app/pages/report/workforce.vue`):
  - Includes the **monthly headcount line chart** under “Geographical headcount”.
  - Moves “Permanent vs contracted” + “Gender breakdown” into a **second page** using `.report-page`.
  - Removed the inaccurate “workforce grew/declined” insight from the **Workforce Headcount** KPI tile on the report page.

---

### Disciplinary: “Include in Report” governance control (persisted)

#### Database
Extended Prisma `DisciplinaryCase` (`prisma/schema.prisma`):
- `includeInReport Boolean @default(false)`

#### API behavior
Updated disciplinary endpoints to support and persist `includeInReport`:
- `POST /api/disciplinary`: accepts `includeInReport` (defaults to `false`)
- `PUT /api/disciplinary/:id`: supports **partial updates** so toggling `includeInReport` does not require sending all fields
- `GET /api/disciplinary`: includes `includeInReport` in returned rows

#### Dashboard UI updates (Progressive Discipline page)
- `app/pages/disciplinary.vue`:
  - Removed the **Department column** from the table display.
  - Added an **Include in Report** checkbox column with DB-backed persistence.
  - Checkbox styling updated to match the app’s dark theme:
    - **Transparent** unchecked background
    - Dark app-background checked fill + **white tick**
  - Sorting enforced:
    - **Trinidad & Tobago first**
    - **Guyana second**
    - Others alphabetically
    - Newest-first within country
  - Fixed the “page jumps to the top on edit/toggle” issue by not hiding the table during background refreshes.
  - Added two new status options:
    - `Conciliation`
    - `Outcome to be Communicated`

#### Report filtering
- `app/pages/report/disciplinary.vue`:
  - Report includes **only cases where `includeInReport === true`**.
  - Applies the same country-first sorting logic (TT, Guyana, then others).

---

### Critical vacancies & recruitment (report-only filtering)

#### Critical vacancies report rules
- `app/pages/report/vacancies.vue`:
  - KPI value shows **High priority vacancies only**.
  - Insight line reports **total tracked** + “other priorities” count.
  - “Vacancies by country” bar chart still shows **all vacancies**.
  - Listing renamed to **“Critical Vacancy listing”** and shows **High priority** only.
  - Summary bars styled with a pastel/pink tone (`bg-rose-400`) for visibility.

#### Recruitment report rules
- `app/pages/report/recruitment.vue`:
  - “Recruitment & onboarding” table shows candidates in:
    - **Offer Stage**
    - **Pre-Onboarding Stage**
  - Subtitle updated to match this scope.

---

### Country taxonomy consistency (“Houston” → “USA”) + dropdown coverage

#### USA classification
- `server/utils/branchClassification.ts`:
  - Replaced “Houston” labeling with **USA**.
  - Includes conservative matching for Houston/US/LLC patterns and `Ramps Logistics LLC`.

#### Ensure USA is selectable everywhere
Added `app/utils/countryOptions.ts`:
- `ensureUsaOption(values: string[]): string[]` ensures **USA** is always present in country dropdowns, even if not present in the returned data.
Applied across multiple pages/components (e.g. recruitment, medical enrollments, EAP referrals, employees list, contracts).

---

### Odoo data exclusions & targeted one-off corrections

#### Employee exclusions (global)
Added centralized Odoo employee exclusion logic:
- `server/utils/odooEmployeeExclusions.ts`
  - Excludes specific named accounts including independent contractors:
    - **Deron Seepaul**
    - **Krishendath Maharaj**

#### Separations exclusions (temporary)
- `server/api/odoo/separations.get.ts` and `server/api/odoo/analytics/home.get.ts`
  - Temporary exclusions applied for data hygiene:
    - Always exclude: **Jared Rogers**, **Joshua Phillips**
    - Month-specific exclusion: **Raj Mahabir** excluded for **`2026-02`**

#### Additions month attribution (accuracy fix)
- `server/api/odoo/analytics/home.get.ts`
- `server/api/odoo/new-hires.get.ts`
  - For month assignment, prefer:
    - `startDate` (or “date hired” equivalent)
  - Fallback:
    - `createdAt` only when start date is missing

---

### Platform & deployment support
- Local DB runtime:
  - `docker-compose.yml` provides a Postgres 16 container for `DATABASE_URL`.
- Prisma runtime setup:
  - `server/utils/db.ts` uses `@prisma/adapter-pg` + a singleton Prisma client.
  - `prisma.config.ts` defines Prisma schema/migrations + environment URL.
- Build/runtime for PDF generation:
  - `nixpacks.toml` installs system deps for Chromium and runs `playwright install chromium`.
- Environment example:
  - `hr-dashboard/.env.example` documents `DATABASE_URL`, Odoo variables, and optional SharePoint/Graph variables.

---

### Cleanup / migration notes
- Legacy non-Odoo employee pages and endpoints were removed in favor of the Odoo-backed routes:
  - Removed: `app/pages/index.vue`, `app/pages/employees/*`, `server/api/employees/*`
  - Active: `app/pages/odoo/*`, `server/api/odoo/*`

---

### Validation checklist
- Report generation:
  - `GET /api/reports/complete` downloads a merged PDF (portrait A4, no blank pages, headers/footers present).
  - `GET /api/reports/complete?reportMonth=YYYY-MM` produces a month-scoped report for expenses/additions/separations.
- Headcount snapshots:
  - Run `npm run db:generate` after schema updates.
  - Seed: `npx tsx scripts/seed-headcount-snapshots.ts`
  - `GET /api/analytics/headcount-snapshots` returns ordered month/headcount items.
  - Dashboard Home: “View trends” shows the monthly headcount line.
  - Workforce report includes the headcount trend.
- Disciplinary governance:
  - Toggling “Include in Report” persists after refresh.
  - Report disciplinary section includes only checked rows.
  - Page does not jump to the top when editing/toggling.

