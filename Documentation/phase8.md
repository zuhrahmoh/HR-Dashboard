# Phase 8 Summary — Odoo Employee Module Data Source (Checkpoint)

## Objective

Switch the HR Dashboard’s **employee data source** from local CSV files to the **Odoo Employee module** database (server-side), while keeping the original CSV-driven pages intact.

This phase is a checkpoint to:

- Prove end-to-end connectivity to Odoo (JSON-RPC) via Nuxt’s Nitro server
- Keep credentials secure (server-only via environment variables)
- Duplicate key pages so changes can be tracked safely:
  - CSV baseline remains unchanged (`/`, `/employees`, etc.)
  - New Odoo-driven equivalents live under `/odoo/*`
- Ensure data mapping is robust enough for dashboard analytics + employee browsing
- Add/adjust key dashboard visuals and UI formatting for readability

---

## Why this approach (page duplication)

We created **duplicated “Odoo versions”** of the Home and Employees experiences rather than swapping the CSV source in-place. This provides:

- A clean “before vs after” comparison (CSV vs Odoo)
- A safer iteration surface while field mapping and Odoo schemas evolve
- A clear path to production migration: once mappings are stable, the CSV pages can be retired or repointed

---

## Major deliverables shipped

### A) Secure Odoo integration (server-side JSON-RPC client)

Implemented an Odoo JSON-RPC client that runs on the Nuxt server (Nitro), not in the browser.

- **Config source**: `.env` and `runtimeConfig` (server-only)
- **Protocol**: JSON-RPC (`common.authenticate`, `object.execute_kw`)
- **Database selection**:
  - Uses `db` from the URL query (`/web?db=...`) if present
  - Falls back to `ODOO_DB` if set
  - Can attempt DB auto-detection when needed

Key files:

- `hr-dashboard/nuxt.config.ts`
  - Added `runtimeConfig.odoo` keys: `url`, `username`, `password`, `db`, `insecureTLS`, `cacheTtlMs`
- `hr-dashboard/server/utils/odoo.ts`
  - JSON-RPC helpers + authentication + `executeKw()`
  - Development support for insecure TLS via `NODE_TLS_REJECT_UNAUTHORIZED=0` when enabled

### B) Odoo employee loader + mapping layer (server-side)

Built a reusable loader that:

- Reads Odoo `hr.employee` via `search_read`
- Maps Odoo fields into the app’s canonical `Employee` shape
- Caches results for short TTL to reduce repeated calls

Key file:

- `hr-dashboard/server/utils/odooEmployees.ts`

Mapping strategy:

- Uses `fields_get` to discover available fields and then selects the best match from candidate lists (supports variations across environments).
- Normalizes:
  - `many2one` fields (e.g., department, manager, country)
  - date fields (`YYYY-MM-DD`) using a safe `toYmd()` helper
  - string cleanup for inconsistent/false-ish values

Notable field selections and priorities:

- **Country**: `country_id`, `work_location_id`, `work_country_id` (priority can be adjusted per environment)
- **Start date (Date Hired)**: prioritizes `date_hired`
- **Employment type**: tries common variants like `employment_type`, `employee_type`, `x_*` custom fields
- **Date of birth**: tries `birthday` and common variants
- **Talent rating**: supports custom `x_*` fields when present
- **Contract/Probation end date**: supports custom `x_*` fields and common end-date fields

Also added:

- **Archived employee handling**: support loading `active=false` employees when needed via Odoo context `active_test: false`
- **Departure reason**: mapped from `departure_reason_id` when available

### C) New Odoo API endpoints (Nitro)

Created server endpoints that serve Odoo data to the UI, keeping credentials private.

Key endpoints:

- `GET /api/odoo/employees`
  - Returns mapped employees from Odoo
  - Supports `includeInactive=1` to include archived records
  - File: `hr-dashboard/server/api/odoo/employees.get.ts`
- `GET /api/odoo/employees/:employeeKey`
  - Employee profile lookup by stable `employeeKey`
  - File: `hr-dashboard/server/api/odoo/employees/[employeeKey].get.ts`
- `GET /api/odoo/analytics/home`
  - Odoo version of home analytics (headcount, separations, talent density, upcoming contracts, age data)
  - File: `hr-dashboard/server/api/odoo/analytics/home.get.ts`
- `GET /api/odoo/separations`
  - Monthly separations list (archived employees grouped by `write_date`)
  - File: `hr-dashboard/server/api/odoo/separations.get.ts`

### D) Duplicated Odoo pages for Home and Employees

Implemented parallel pages to match the CSV pages, but backed by Odoo endpoints:

- `hr-dashboard/app/pages/odoo/index.vue`
  - Uses `/api/odoo/analytics/home`
- `hr-dashboard/app/pages/odoo/employees/index.vue`
  - Uses `/api/odoo/employees`
  - Added **Employment Type** column and filter
- `hr-dashboard/app/pages/odoo/employees/[employeeKey].vue`
  - Uses `/api/odoo/employees/:employeeKey`
  - Displays Employment Type (title-cased)

Navigation additions:

- `hr-dashboard/app/layouts/default.vue`
  - Added sidebar links:
    - Home (Odoo) → `/odoo`
    - Employees (Odoo) → `/odoo/employees`

### E) Consistent date formatting across the dashboard

Introduced a shared date formatting utility:

- `hr-dashboard/app/utils/dates.ts`
  - Formats `YYYY-MM-DD` into a readable format like `19 Mar 2026`
  - Adds safe “—” handling for empty/null values

Applied across multiple pages/components so displayed dates are consistent and readable.

### F) Age analytics + visualizations

Added Odoo/CSV analytics support for average age (requires DOB):

- Computes average age by country and gender from DOB fields (excludes resigned/archived employees for “active workforce” analytics).
- Implemented a grouped bar chart visualization for readability.

Key components:

- `hr-dashboard/app/components/AverageAgeGroupedBarChart.vue`
  - Grouped male/female bars per country
  - “Company-wide average age” summary
  - Auto-contained axis/labels and container-safe formatting

Note:

- The earlier “pyramid” visualization was removed from the Home pages to simplify the UI and keep a single clear age chart.

### G) UI/UX readability improvements (global)

Made baseline typography and palette improvements to increase readability:

- Added **Inter** as the primary font
- Updated base sizing/line-height and improved sidebar active-state contrast

Key files:

- `hr-dashboard/tailwind.config.ts` (font family extension)
- `hr-dashboard/app/assets/css/tailwind.css` (global base typography + focus styling)
- `hr-dashboard/app/layouts/default.vue` (sidebar styling)

### H) Dashboard workflow enhancements (upcoming contracts status tracking)

Added interactive status tracking to the Upcoming Contracts section:

- Status column with dropdown per row
- Default status: **Pending**
- Split into two tables:
  - normal “upcoming” list
  - “Pending Contract Expiries” list for rows where `daysRemaining <= 0` and status not completed
- Highlight rows when contract/probation end date is within **6 weeks (42 days)** (pink row highlight for visibility).
- Persist status selections in `localStorage`
- Replaced native `<select>` with a custom dark-menu dropdown for consistent dark UI

Key files:

- `hr-dashboard/app/components/UpcomingContractsTable.vue`
- `hr-dashboard/app/components/StatusBadgeSelect.vue`

### H2) Recruitment onboarding workflow — New Hire Check-ins (monthly benchmarks)

Added a **New Hire Check-ins** section to the Recruitment page so HR can track and act on **regular monthly check-ups** with new hires. This is a second table focused on tenure-based milestones, separate from the main New Hires list.

**Objective**

- Support HR’s need for scheduled check-ins at 1, 2, and 3 months after start date.
- Surface which hires are due or overdue for a check-in without scanning the main table.
- Keep a simple status per check-in (No Action → In Progress → Completed) for workflow tracking.

**UX and behaviour**

- **Placement**: Section sits under the existing “New Hires” table on the Recruitment page (`/recruitment`).
- **When rows appear**: A check-in row is shown starting **7 days before** the milestone date (e.g. 1 month, 2 months, 3 months from `startDate`) and remains in the table until that check-in is marked **Completed**.
- **Milestones**: 1 month, 2 months, 3 months (computed from each new hire’s start date).
- **Visual cues**:
  - **Check-In Approaching** badge per row with the milestone (1 / 2 / 3 month) and distinct colors so HR can quickly see which milestone is due.
  - **Days** column shows the number of days until the milestone (negative values indicate the check-in is overdue).
- **Status**: Each check-in row has a status dropdown: **No Action**, **In Progress**, **Completed**. Selections are persisted in **localStorage** (no backend yet), so the table survives refresh and gives HR an actionable worklist.

**Data and implementation notes**

- Tenure and milestone due dates are derived **client-side** from the existing New Hires data (`startDate`); no new API or persistence layer was added in this phase.
- The table consumes the same new-hires source as the main Recruitment New Hires table (e.g. `/api/new-hires` or Odoo-backed list, depending on page wiring). Future phases can add a dedicated check-in API and server-side persistence (e.g. `new_hire_checkins` with `newHireId`, `milestone`, `dueDate`, `completedAt`, `notes`) and migrate status off localStorage.

**Key files**

- `hr-dashboard/app/components/NewHireCheckinsTable.vue` — Renders the check-ins table, computes tenure/milestones from start dates, and wires status to localStorage.
- `hr-dashboard/app/components/CheckinStatusSelect.vue` — Reusable status dropdown (No Action / In Progress / Completed) with dark-theme styling consistent with the dashboard.

### H3) Recruitment separations — monthly table + separation type

Updated Recruitment “Recent Separations” to match the Home separations month logic:

- Monthly view (defaults to current month) with a month filter for prior months
- Uses Odoo archive date (`write_date`) via `separatedAt` for month grouping
- Adds **Separation Date** and **Type** columns (Resigned / Retired / Fired / Separated), consistent with the Home donut categories

Key files:

- `hr-dashboard/server/api/odoo/separations.get.ts`
- `hr-dashboard/app/pages/recruitment.vue`

### I) Archived employees as separations + resignation reason filtering

Odoo behavior:

- When an employee is archived, Odoo sets `active=false`
- Archived employees have a departure reason stored in `departure_reason_id`

Updates:

- Recruitment page “Recent Separations” lists archived employees (active=false) from a dedicated monthly endpoint (`/api/odoo/separations`)
- Odoo Home “Employee Separations” now counts only archived employees whose **departure reason is Resigned**

Key files:

- `hr-dashboard/server/utils/odooEmployees.ts` (include inactive + map departure reason)
- `hr-dashboard/server/api/odoo/analytics/home.get.ts` (resigned count uses departure reason)
- `hr-dashboard/server/api/odoo/separations.get.ts` (monthly separations list)
- `hr-dashboard/app/pages/recruitment.vue`

### J) Odoo employee profile page – layout and visualizations

Reworked the Odoo employee profile page (`/odoo/employees/:employeeKey`) so it occupies the full page with a clear card layout and consistent styling.

**Layout**

- **Top row (two cards side by side)**
  - **Primary info**: Avatar (initials only, no photo), name, position, status/type badges, then a shaded inner block with Department, Country, Reporting To.
  - **Contact**: Work Email, Work Phone, Personal Phone (Personal Email omitted for compactness).
- **Middle row**: Full-width **Employment** card with Start Date, Tenure, Contract/Probation End, Gender, and Employee Key on a single line (Employee Key at the end).
- **Bottom row**: Full-width **Talent** card with rating and a 5-badge scale.

**Badges (employment type / status)**

- **Active** → green pill.
- **Contract** → purple pill.
- **Permanent** → pink pill.
- **Intern** → teal blue pill.

**Talent section**

- Displays the rating letter (A, B+, B, B-, C) when available from the server.
- **5-badge scale** next to the rating (badge/ribbon icons): 5 badges always shown; when a rating exists, the corresponding number are filled in yellow (A = 5, B+ = 4, B = 3, B- = 2, C = 1); when no rating is available, all badges are unfilled (gray).
- Logic is ready for when the talent rating field is added on the server; until then every employee shows the unfilled scale.

**Contact and spacing**

- Contact card uses `break-words` so long emails/phones don’t overlap.
- Tighter padding and line spacing so all sections fit with minimal scrolling.

Key file:

- `hr-dashboard/app/pages/odoo/employees/[employeeKey].vue`

### K) Odoo employee profile PDF – card layout on white background

The PDF downloaded from the Odoo employee profile now matches the on-screen layout: rounded containers with drop shadows on a white page.

**Layout**

- **Stacked sections** (no side-by-side): Employee Information, Contact, Employment, Talent – each full width, one per row.
- **Rounded cards** with light gray drop shadow and light gray border; white fill.
- **Shaded inner box** on the Employee Information card: Department, Country, and Reporting To sit inside a light gray rounded rectangle (same idea as the profile page’s inner block).
- **Line spacing** increased (card gaps, padding, row spacing) so the content fills the page.

**Implementation**

- New `buildProfilePdfCardLayout()` in `profilePdf.ts`: draws rounded rects (Bézier corners), shadow, and shaded box; single stream object for the page contents so the PDF renders correctly.
- Odoo PDF handler calls `buildProfilePdfCardLayout()` with primary, contact, employment, and talent data; initials derived from name.

Key files:

- `hr-dashboard/server/utils/profilePdf.ts` (`roundedRectPath`, `drawRoundedCard`, `drawShadedBox`, `buildProfilePdfCardLayout`, `ProfileCardInput`)
- `hr-dashboard/server/api/odoo/employees/[employeeKey]/pdf.get.ts` (uses card layout and passes profile-matching data)

### L) Odoo analytics – error handling and health check

**Error handling on Odoo analytics page**

- When the analytics/additions request fails with a **“fetch failed”**-style error (e.g. server not reachable, connection refused), the UI shows the error message and a short hint: ensure the dev server is running and reachable, and to check `/api/odoo/health` for Odoo config.
- Applied to the three analytics cards (Geographical Headcount, Employee Separations, Employee Additions) on `/odoo`.

**Health check endpoint**

- **GET /api/odoo/health** returns a small JSON payload indicating whether Odoo config is present (no secrets): e.g. `config: "ok"` with `urlHost`, `urlPort`, `db`, `insecureTLS`, or `config: "missing"` with `hasUrl`, `hasUsername`, `hasPassword` and an error hint.
- Used to confirm the server is up and env vars are loaded when Odoo data does not load.

Key files:

- `hr-dashboard/app/pages/odoo/index.vue` (`isFetchFailed()`, troubleshooting hint when message indicates fetch failed)
- `hr-dashboard/server/api/odoo/health.get.ts` (new)

---

## Operational fixes made during the phase

### Dev-server stability (HMR port conflict)

Resolved Vite/Nuxt HMR port conflicts by explicitly setting a stable port:

- `hr-dashboard/nuxt.config.ts` → `vite.server.hmr.port = 24679`

### TLS / test server certificate handling (dev)

Because the test server can present TLS issues in development environments, insecure TLS support was added behind a config flag:

- `.env` / `runtimeConfig.odoo.insecureTLS`
- When enabled, server sets `NODE_TLS_REJECT_UNAUTHORIZED=0` for the process (dev only)

---

## Data contracts and key fields pulled from Odoo (employee)

The Odoo loader maps the following into the app’s canonical employee object:

- **Identity**
  - `id` → `employeeKey` (stable prefix: `odoo-<id>`)
  - `name`
- **Org**
  - `department_id` → `department`
  - `job_title` or `job_id` → `position`
  - `parent_id` → `reportingTo`
- **Location**
  - `country_id` / `work_location_id` / `work_country_id` → `countryAssigned`
- **Employment**
  - `active` → `employeeStatus` (active workforce vs archived)
  - `date_hired` (or variants) → `startDate`
  - Employment type (custom field variants) → `employeeType`
  - Contract/probation end (custom field variants) → `contractOrProbationEndDate`
  - Departure reason (`departure_reason_id`) → `departureReason` (when available)
- **People metrics**
  - `gender`
  - `birthday` (or variants) → `birthDate`
  - talent rating fields (custom variants) → `talentRating`

---

## Intended next steps (what this phase enables)

1. **Production schema alignment**
   - Confirm exact field names in Laser/production (employment type, contract end, talent rating, DOB, departure reason).
   - Lock down field mapping priority lists accordingly.

2. **Separation breakdown**
   - Expand the separations visualization (if desired) to show counts by departure reason, and filter by months in which teh separation occured (this will involve adding a new field to the database to track the date an employee is archived):
     - Resigned
     - Retired
     - Fired

3. **Credential and TLS hardening**
   - Ensure production uses valid certificates and `insecureTLS` is disabled.
   - Confirm secrets handling in deployment pipeline (no credentials in client bundles).

4. **Decommission CSV baseline (later)**
   - Once Odoo mapping is fully verified:
     - remove CSV pages and retain a single source of truth plus sharepoint lists to retrieve employee salaries and global expense breakdowns.

---

## Files created/updated (high-signal list)

- Odoo integration and mapping
  - `hr-dashboard/nuxt.config.ts`
  - `hr-dashboard/server/utils/odoo.ts`
  - `hr-dashboard/server/utils/odooEmployees.ts`
  - `hr-dashboard/server/api/odoo/analytics/home.get.ts`
  - `hr-dashboard/server/api/odoo/separations.get.ts`
  - `hr-dashboard/server/api/odoo/employees.get.ts`
  - `hr-dashboard/server/api/odoo/employees/[employeeKey].get.ts`
  - `hr-dashboard/server/api/odoo/health.get.ts` (Odoo config health check)
- Odoo employee profile and PDF
  - `hr-dashboard/app/pages/odoo/employees/[employeeKey].vue` (card layout, badges, talent badge scale)
  - `hr-dashboard/server/utils/profilePdf.ts` (card layout, rounded rects, shaded box, `buildProfilePdfCardLayout`)
  - `hr-dashboard/server/api/odoo/employees/[employeeKey]/pdf.get.ts` (uses card layout)
- Duplicated Odoo pages
  - `hr-dashboard/app/pages/odoo/index.vue` (analytics; error hint when fetch failed)
  - `hr-dashboard/app/pages/odoo/employees/index.vue`
  - `hr-dashboard/app/layouts/default.vue`
- UI and formatting
  - `hr-dashboard/app/utils/dates.ts`
  - `hr-dashboard/app/assets/css/tailwind.css`
  - `hr-dashboard/tailwind.config.ts`
- Visualizations / UX enhancements
  - `hr-dashboard/app/components/AverageAgeGroupedBarChart.vue`
  - `hr-dashboard/app/components/UpcomingContractsTable.vue`
  - `hr-dashboard/app/components/StatusBadgeSelect.vue`
  - `hr-dashboard/app/components/NewHireCheckinsTable.vue` (monthly check-in milestones)
  - `hr-dashboard/app/components/CheckinStatusSelect.vue`
  - `hr-dashboard/app/components/ExpenseCountryCard.vue`
  - `hr-dashboard/app/components/AdditionsDonut.vue`
  - `hr-dashboard/app/components/SeparationsDonut.vue`
  - `hr-dashboard/app/components/HeadcountBarChart.vue` (Geographical Headcount)
  - `hr-dashboard/app/components/TalentDensityStackedBar.vue` (Leaders / Players)
  - `hr-dashboard/app/components/GenderBreakdownPie.vue` (gender by country)

