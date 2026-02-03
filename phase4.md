# Phase 4 Plan — Talent & Risk (Talent Density + Upcoming Contracts)

## Objective

Implement the **Phase 4** scope from `project.md`:

- **Talent Density** (two stacked bar visuals):
  - Leaders distribution by rating buckets
  - Players distribution by rating buckets
- **Upcoming Contracts** table (contract/probation end in ≤ 30 days)
- Demo: **talent distribution + time-based risk** driven from the employee CSV pipeline

Phase 4 is complete when Home (`/`) renders both Talent Density visuals and the Upcoming Contracts table using real employee data, following the rules in `project.md` (section **5.1 D/E**).

---

## Current State (what exists today)

- **Phase 0–3 implemented** in `hr-dashboard/`:
  - Home page (`hr-dashboard/app/pages/index.vue`) renders:
    - Geographical Headcount
    - Employee Separations
    - Global Expense Breakdown cards
  - Home analytics API exists: `GET /api/analytics/home` (`hr-dashboard/server/api/analytics/home.get.ts`)
    - Currently returns `headcountByCountry` and `separations` only
  - Employee CSV pipeline exists: `hr-dashboard/server/utils/employees.ts`
    - Normalizes `contractOrProbationEndDate` into `YYYY-MM-DD` (or `null`)
    - **Does not currently expose the “A Player rating” field** from `employee_info.csv` (needed for Talent Density)
- **No charting library** is installed; existing visuals use **simple Vue + Tailwind** (recommended to keep Phase 4 consistent and low-risk).

---

## Web Research Summary (implementation best-practices)

- **Nuxt SSR + browser-only components**: if you later introduce a charting library that depends on the DOM, Nuxt recommends wrapping it with `<ClientOnly>` to avoid SSR/runtime errors.  
  Ref: [Nuxt `<ClientOnly>` docs](https://nuxt.com/docs/4.x/api/components/client-only)
- **Safe date window calculations**: to avoid timezone “off-by-one day” issues when working with `YYYY-MM-DD`, parse with `Date.UTC(year, monthIndex, day)` (or append `T00:00:00.000Z`) instead of relying on `new Date('YYYY-MM-DD')` behavior across environments.  
  Ref: [MDN `Date.UTC()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/UTC)
- **Stacked bar without dependencies**: a CSS-based stacked bar is a common lightweight approach for dashboards and works well with responsive layouts (Tailwind-friendly).  
  Ref: `https://dev.to/vyckes/creating-a-stacked-bar-chart-using-only-css-3jc1`

---

## Phase 4 Deliverables

### A) Extend employee normalization to include rating (server-side)

Update `hr-dashboard/server/utils/employees.ts` to expose the CSV column:

- CSV header: `A Player rating`
- Internal field (recommended): `talentRating: string` (raw string from CSV; trimmed)

This is required for Talent Density classification:

- contains `Leader` → Leaders
- contains `Player` → Players

### B) Extend the Home analytics API (server-side)

Update `GET /api/analytics/home` (`hr-dashboard/server/api/analytics/home.get.ts`) to include:

- **Talent density distributions** (excluding resigned employees)
- **Upcoming contracts** (excluding resigned employees)

### C) Add reusable UI components (client-side)

Add:

- `hr-dashboard/app/components/TalentDensityStackedBar.vue`
- `hr-dashboard/app/components/UpcomingContractsTable.vue`

### D) Update Home page (`/`)

Update `hr-dashboard/app/pages/index.vue` to render:

- Talent Density section (two stacked bars)
- Upcoming Contracts section (table)

---

## Recommended Implementation Approach (Nuxt 4 + Nitro, consistent with this repo)

### 1) Define the extended `/api/analytics/home` response shape (contract first)

Extend the existing response with minimal, Phase 4–specific additions:

- `talentDensity: {`
  - `leaders: Array<{ bucket: 'A' | 'B+' | 'B' | 'B-'; count: number }>`
  - `players: Array<{ bucket: 'A' | 'B+' | 'B' | 'B-' | 'C'; count: number }>`
  - `}`
- `upcomingContracts: Array<{`
  - `employeeKey: string`
  - `name: string`
  - `department: string`
  - `position: string`
  - `countryAssigned: string`
  - `contractOrProbationEndDate: string` (normalized `YYYY-MM-DD`)
  - `daysRemaining: number`
  - `}>`

Keep bucket order fixed (for stable UI):

- Leaders: `A`, `B+`, `B`, `B-`
- Players: `A`, `B+`, `B`, `B-`, `C`

### 2) Talent Density computation rules (server-side)

From `project.md`:

- Exclude resigned employees
- Read rating string and classify:
  - if rating contains `leader` → Leaders
  - if rating contains `player` → Players
- Bucket extraction:
  - Read the grade prefix from the rating string (e.g., `B+ Player` → `B+`)
  - Only count grades in the allowed bucket lists above
  - Ignore missing/unknown ratings (don’t invent new buckets in Phase 4)

### 3) Upcoming Contracts computation rules (server-side)

From `project.md`:

- Exclude resigned employees
- Select employees with a non-null `contractOrProbationEndDate`
- Include those whose end date is in **0–30 days** from “today”
- Sort ascending by end date (soonest first)

Date handling (recommended):

- Parse `YYYY-MM-DD` into a UTC midnight timestamp using `Date.UTC(...)`
- Compute days remaining using integer day math, avoiding timezone drift

### 4) UI components (no new chart dependencies)

**TalentDensityStackedBar**

- Inputs:
  - `title: string`
  - `segments: Array<{ bucket: string; count: number }>`
- Behavior:
  - Compute total
  - Render a single horizontal bar segmented by bucket proportion
  - Show a compact legend with bucket labels + counts
  - Clean empty state when total is 0

**UpcomingContractsTable**

- Inputs:
  - `items: Array<{ name; department; position; countryAssigned; contractOrProbationEndDate; daysRemaining }>`
- Behavior:
  - Responsive, readable table
  - Empty state when there are no upcoming contracts

### 5) Home page integration

- Reuse the existing `useFetch('/api/analytics/home')`
- Add two new sections below existing analytics:
  - **Talent Density** (two cards/rows: Leaders, Players)
  - **Upcoming Contracts** (table)
- Reuse the existing loading/error state pattern already used for analytics on Home.

---

## Acceptance Criteria (Phase 4 complete)

- `employee_info.csv` rating field is available in server-side employee records (read-only).
- `GET /api/analytics/home` returns additional Phase 4 fields:
  - `talentDensity.leaders` and `talentDensity.players` computed per spec and excluding resigned employees
  - `upcomingContracts` includes only employees whose `contractOrProbationEndDate` is within 30 days and excludes resigned employees
  - Upcoming contracts are sorted by soonest end date
- Home page (`/`) renders:
  - Leaders stacked bar distribution
  - Players stacked bar distribution
  - Upcoming contracts table
- No regressions:
  - Headcount, Separations, and Expense cards still render correctly

---

## Demo Script (Phase 4)

From `hr-dashboard/`:

- `npm run dev`
- Visit `/`:
  - Confirm Talent Density shows two stacked bars (Leaders + Players)
  - Confirm Upcoming Contracts table lists only end dates within the next 30 days (and is sorted by soonest)
  - Spot-check one employee with a known `Contract/Probation End Date` from `employee_info.csv` and verify `daysRemaining` is sensible

