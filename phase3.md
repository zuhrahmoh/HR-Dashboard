# Phase 3 Plan — Expenses (Global Expense Breakdown)

## Objective

Implement the **Phase 3** scope from `project.md`:

- Parse `global_expenses.csv` (authoritative, read-only)
- Render **Global Expense Breakdown** on the Home page (`/`) as **country expense cards**
- Demo: **expense visibility by country** driven from the CSV

Phase 3 is complete when Home displays expense cards for each country using real CSV data, following the rules in `project.md` (section **5.1 B**).

---

## Current State (what exists today)

- **Phase 0–2 implemented** in `hr-dashboard/`:
  - Layout shell + routes exist
  - Employee CSV pipeline exists in `hr-dashboard/server/utils/employees.ts`
  - Home analytics API exists: `GET /api/analytics/home` (`hr-dashboard/server/api/analytics/home.get.ts`)
  - Home page renders:
    - Geographical Headcount
    - Employee Separations
    - (`hr-dashboard/app/pages/index.vue`)
- **Expense data exists** at repo root: `global_expenses.csv`
  - Header contains inconsistent spacing and a **trailing empty column** (because rows end with a trailing comma)
  - Month values can be inconsistent (e.g., `Decemeber` vs `December`)
- **No expenses API yet**
  - `project.md` expects `GET /api/expenses`, but it does not currently exist.

---

## Web Research Summary (implementation best-practices)

- **Nuxt/Nitro file resolution**: Use `fileURLToPath(new URL(relativePath, import.meta.url))` on the server to resolve data files reliably in ESM builds (Nuxt 4 standard pattern). (See Nuxt docs: `https://nuxt.com/docs/4.x/guide/concepts/esm`, `https://nuxt.com/docs/4.x/api/advanced/import-meta`)
- **CSV parsing (Node)**:
  - Best-practice on the server is to use a mature CSV library like `csv-parse` or `csv-parser` for robust handling of quotes/commas/edge cases.
  - This repo already uses a custom CSV parser in `server/utils/employees.ts`; the lowest-risk approach for Phase 3 is to **reuse that style** (and optionally consider `csv-parse` later if the expenses CSV grows in complexity). (Refs: `https://www.npmjs.com/package/csv-parse`, `https://www.npmjs.com/package/csv-parser`)
- **Currency parsing**:
  - A common robust approach is to strip non-numeric characters (except `.` and `-`) and then `Number(...)` / `parseFloat(...)` the result. (Ref: `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/parseFloat`)

---

## Phase 3 Deliverables

### A) Expenses parsing utility (server-side)

Add a Nitro server utility:

- `hr-dashboard/server/utils/expenses.ts`

Responsibilities:

- Resolve the expenses CSV path on disk
- Parse CSV rows into a normalized internal shape
- Parse currency-like strings into numbers
- Cache parsed results in-memory (module-level cache) similar to the employees pipeline

### B) Expenses API (server-side)

Add Nitro API:

- `GET /api/expenses` → returns expense breakdown per country

### C) Expense card UI (client-side)

Add component:

- `hr-dashboard/app/components/ExpenseCountryCard.vue`

### D) Home page update (`/`)

Update `hr-dashboard/app/pages/index.vue` to:

- Fetch `GET /api/expenses` (in addition to existing `GET /api/analytics/home`)
- Render **Global Expense Breakdown** cards per country with clean empty/loading/error states

---

## Recommended Implementation Approach (Nuxt 4 + Nitro, consistent with this repo)

### 1) Define the `GET /api/expenses` response contract (contract first)

Suggested minimal response shape (Phase 3–specific):

- `month: string | null` (the month displayed on Home, if known)
- `items: Array<{`
  - `country: string`
  - `salariesInclusiveOfPaye: number`
  - `overtime: number`
  - `vc: number`
  - `otherAllowances: number`
  - `nisCompany: number`
  - `total: number`
  - `}>`

Notes:

- Keep numbers as **plain numeric totals** in the API.
- Format currency strings for display in the UI (so the API stays consistent).

### 2) Standardize how the CSV path is resolved

Match the pattern already used in `hr-dashboard/server/utils/employees.ts`:

- Preferred (future-proof) location:
  - `hr-dashboard/data/global_expenses.csv`
- Fallback (current repo layout):
  - repo root `global_expenses.csv`

Implementation detail:

- Use `fileURLToPath(new URL(..., import.meta.url))` for both candidates, and pick the first that exists.

### 3) Parse the CSV robustly (handle real file quirks)

The current `global_expenses.csv` has these quirks that the parser should handle:

- **Headers with inconsistent spacing** (e.g., `Salaries  inclusive of PAYE`)
- **Headers with trailing spaces** (e.g., `NIS (Company) `)
- **Trailing comma** at the end of each row, producing an empty final column/header

Recommended strategy (same as employees pipeline):

- Normalize headers:
  - `trim`
  - collapse whitespace
  - lowercase
- Map known headers to canonical keys, e.g.:
  - `country` → `country`
  - `month` → `month`
  - `salaries inclusive of paye` → `salariesInclusiveOfPaye`
  - `overtime` → `overtime`
  - `vc` → `vc`
  - `other allowances` → `otherAllowances`
  - `nis (company)` → `nisCompany`
- Ignore empty headers and unknown columns (so the trailing empty column doesn’t break parsing).

### 4) Parse amounts (currency strings → numbers)

Recommended parsing logic per field:

- Accept inputs like:
  - `"$83,955.60"`
  - `$940.00`
  - `$0.00`
  - empty cell
- Convert to a number using:
  - `cleaned = raw.replace(/[^\d.-]/g, '')`
  - `amount = Number(cleaned)` (or `parseFloat`)
  - Treat non-finite results as `0`

### 5) Month handling (avoid brittle assumptions)

`project.md` doesn’t define month behavior, but the CSV includes a `Month` column.

Recommended Phase 3 behavior (minimal + robust):

- If all rows share the same month string, return it as `month` and render it on Home.
- If multiple month values are present, pick the **most recent snapshot by file order**:
  - Determine the last non-empty month value present in the file and filter rows to that month for display.
  - Return that month as `month`.

This keeps Home aligned with “cards per country” without requiring a new month selector UI.

### 6) Compute totals and sort for stable UI

For each country row:

- Compute:
  - `total = salariesInclusiveOfPaye + overtime + vc + otherAllowances + nisCompany`
- Sort `items` deterministically (recommended):
  - by `total` descending, then by `country` ascending

### 7) Build the reusable card component

Create `ExpenseCountryCard.vue` with props:

- `country: string`
- `month: string | null`
- `items` (or individual numeric fields)

UI content (direct CSV mapping as per `project.md`):

- Country name
- Month (if present)
- Breakdown lines:
  - Salaries (inclusive of PAYE)
  - Overtime
  - VC
  - Other allowances
  - NIS (Company)
  - Total

### 8) Update Home page (`/`) to render expense cards

In `hr-dashboard/app/pages/index.vue`:

- Keep existing analytics fetch (`/api/analytics/home`)
- Add a second fetch (`/api/expenses`)
- Add a new section titled **Global Expense Breakdown**
- Render cards in a responsive grid (e.g., 1 column on mobile, 2–3 on larger screens)
- Include loading/error/empty states consistent with current Home UI patterns

---

## Acceptance Criteria (Phase 3 complete)

- `global_expenses.csv` is parsed on the server (no client-side file reads).
- `GET /api/expenses` exists and returns:
  - one expense breakdown item per country (for the selected month snapshot)
  - numeric totals parsed correctly from the CSV
  - stable ordering
- Home page (`/`) renders **Global Expense Breakdown**:
  - Cards per country
  - Values reconcile (Total equals sum of categories)
- No regressions to Phase 2 visuals (Headcount + Separations still render correctly).

---

## Demo Script (Phase 3)

From `hr-dashboard/`:

- `npm run dev`
- Visit `/`:
  - Confirm Headcount + Separations still render (Phase 2)
  - Confirm Global Expense Breakdown cards render from `global_expenses.csv`
- Spot-check:
  - Compare one country’s numbers with the CSV values
  - Confirm Total equals the sum of the category values shown on the card

