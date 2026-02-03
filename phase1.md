# Phase 1 Plan — Employee Data Pipeline (CSV → employeeKey → Employees List + Profile)

## Objective

Implement the **Phase 1** scope from `project.md`:

- Parse **employee CSV** (authoritative, read-only)
- Generate deterministic **`employeeKey`**
- Build **Employees list** (`/employees`) with search (and optional filters)
- Build **Employee profile routing** (`/employees/:employeeKey`) as a read-only view

This phase is complete when the app can **load employees from CSV**, render the list, and route to a profile page via a stable `employeeKey`.

---

## Current State (what exists today)

**Repo layout**

- Root docs: `project.md`, `phase0.md`, `hr-dashboard/PHASE0_DEMO.md`
- Nuxt app: `hr-dashboard/` (Nuxt `^4.2.2`, Tailwind enabled)
- Routes exist as placeholders:
  - `hr-dashboard/app/pages/index.vue`
  - `hr-dashboard/app/pages/employees/index.vue`
  - `hr-dashboard/app/pages/recruitment.vue`
  - `hr-dashboard/app/pages/performance.vue`
  - `hr-dashboard/app/pages/disciplinary.vue`
- Layout shell exists: `hr-dashboard/app/layouts/default.vue`

**Data**

- A real employee CSV exists at repo root: `employee_info.csv`
  - Header has inconsistencies (spaces, typos like `Country Assigsned`)
  - Includes required Phase 1 fields: `Name`, `Department`, `Position`, `Start Date`, `Employee Status`, and a country-ish column

---

## Phase 1 Deliverables

### A) CSV ingestion (server-side)

- Add Nitro API:
  - `GET /api/employees`
  - `GET /api/employees/:employeeKey`
- Read CSV from disk on the server and return normalized JSON.

### B) employeeKey generation (deterministic)

Implement `employeeKey` per `project.md`:

- Fields used:
  - Name
  - Department
  - Position
  - Start Date
  - Country Assigned
- Normalization:
  - lowercase
  - trim whitespace
  - normalize date to `YYYY-MM-DD`
- Concatenate: `name|department|position|startDate|country`
- Hash: `SHA-1` (Node `crypto`)
- Truncate: 10–12 chars
- Collision handling: deterministic (if collision occurs, derive a stable suffix)

### C) Employees list UI (`/employees`)

- Table listing employees with:
  - Search by name (required)
  - Optional filters: Country, Department, Status (as per `project.md`)
- Row click navigates to `/employees/:employeeKey`.

### D) Employee profile UI (`/employees/:employeeKey`)

- Read-only profile view, showing the employee’s key fields from CSV.

---

## Recommended Implementation Approach (Nuxt 4 + Nitro)

> Note: Web-search tooling in this environment returned irrelevant results for Nuxt/Nitro queries during this session; the plan below follows standard Nuxt 4 + Nitro patterns for `server/api` routes and Node server-side file I/O.

### 1) Decide the authoritative employee CSV path (do this first)

You currently have `employee_info.csv` at the repo root, while `project.md` references `employees.csv`.

Pick **one** of these options:

- **Option A (recommended): keep the current file, standardize name**
  - Rename/move to: `hr-dashboard/data/employees.csv`
  - Keep Phase 1 code reading from that path
- **Option B: keep file where it is**
  - Read from `../employee_info.csv` relative to `hr-dashboard/` (works but is more brittle)

**Exit criteria**
- You can point server code to one stable path that works on your machine.

### 2) Create server-side parsing + normalization utilities

Add a small utilities module responsible for:

- Loading CSV text from disk
- Parsing into rows
- Normalizing headers and mapping to a stable internal shape
- Generating `employeeKey`

**CSV parsing**

- Best practice in Node is to use a dedicated parser (handles quotes/commas reliably).
- If you want **zero new dependencies**, implement a minimal CSV parser only if your CSV is guaranteed simple; otherwise, plan to add a parser library in Phase 1.

**Header mapping (important for your current CSV)**

Your CSV header includes:

- `Country Assigsned` (typo) vs spec `Country Assigned`
- extra spaces: e.g. `Reporting to `, ` Monthly Salary `

Implement a header normalizer:

- Trim header strings
- Collapse internal whitespace
- Lowercase
- Map known variants to canonical keys (e.g., `country assigned`, `country assigsned`)

**Exit criteria**
- Running the server endpoint returns a non-empty employee list with stable keys.

### 3) Implement Nitro APIs

Create these files under `hr-dashboard/server/api/`:

- `employees.get.ts`
  - Returns an array of employees (normalized shape + `employeeKey`)
  - Keep it read-only
- `employees/[employeeKey].get.ts`
  - Returns a single employee by matching `employeeKey`
  - Return 404 if not found

**Performance note**
- Cache parsed employee list in memory (module-level cache) to avoid re-reading CSV on every request during dev.

**Exit criteria**
- `GET /api/employees` works
- `GET /api/employees/<validKey>` returns the correct record

### 4) Build the Employees list page (`hr-dashboard/app/pages/employees/index.vue`)

Implement:

- `useFetch('/api/employees')`
- Search input (client-side filter for Phase 1)
- Optional filters (Country/Department/Status)
- Table rows that navigate using `navigateTo(`/employees/${employee.employeeKey}`)`

**Exit criteria**
- You can search by name and click through to a profile.

### 5) Add Employee profile route page

Create:

- `hr-dashboard/app/pages/employees/[employeeKey].vue`

Implement:

- `const route = useRoute()`
- `useFetch(() => '/api/employees/' + route.params.employeeKey)`
- Read-only detail layout

**Exit criteria**
- Direct navigation to `/employees/<employeeKey>` loads the right employee.

---

## Suggested Internal Data Shape (Phase 1)

Normalize all rows into a stable internal type (even if the CSV has extra columns):

- `employeeKey: string`
- `name: string`
- `department: string`
- `position: string`
- `startDate: string | null` (normalized `YYYY-MM-DD` when parseable)
- `countryAssigned: string`
- `employeeStatus: 'Active' | 'Resigned' | string` (Phase 1 can pass-through; later phases should enforce the two-valid-values rule from `project.md`)

---

## Acceptance Criteria (Phase 1 complete)

- Employees load from CSV via Nitro:
  - `GET /api/employees` returns a list with `employeeKey` populated
  - `GET /api/employees/:employeeKey` returns a single employee (or 404)
- `employeeKey` generation is deterministic:
  - same input row → same key across restarts
  - normalization rules applied (case/trim/date)
- `/employees`:
  - renders a table from real CSV data
  - supports name search
  - row click navigates to profile route
- `/employees/:employeeKey`:
  - renders a read-only view
  - no editing or persistence

---

## Demo Script (Phase 1)

From `hr-dashboard/`:

- `npm run dev`
- Visit:
  - `/employees` → confirm list renders
  - Use search → confirm filtering works
  - Click an employee row → confirm route changes to `/employees/:employeeKey`
  - Refresh on the profile page → confirm it still loads (key is stable)

