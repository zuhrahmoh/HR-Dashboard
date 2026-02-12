# Phase 5 Plan — Recruitment & Onboarding (JSON CRUD + Recent Separations)

## Objective

Implement the **Phase 5** scope from `project.md`:

- Add **JSON CRUD** workflows for:
  - **Critical Vacancies** (`vacancies.json`)
  - **Critical Recruitment** (`critical-recruitment.json`)
  - **New Hires** (`new-hires.json`)
- Add **Recent Separations** table from `employees.csv` (employees where `Employee Status == Resigned`)
- Update `/recruitment` to become a **usable, demo-ready page** for user-entered HR tracking

Phase 5 is complete when the Recruitment page supports adding/editing/removing entries that persist locally via JSON files and reload correctly after refresh/restart.

---

## Current State (what exists today)

- Phases **0–4 implemented** in `hr-dashboard/` (employees pipeline + home analytics).
- `hr-dashboard/app/pages/recruitment.vue` is still a placeholder (no workflows yet).
- No JSON CRUD server APIs exist yet beyond CSV read endpoints.
- Server-side file path resolution patterns already exist:
  - CSV utilities use `fileURLToPath(new URL(..., import.meta.url))` for stable paths.

---

## Web Research Summary (best-practice guidance)

- **Nuxt/Nitro server endpoints**: implement API routes in `server/api` using `defineEventHandler()` and throw typed errors via `createError()` for clean client propagation.  
  - Nuxt server structure: `https://nuxt.com/docs/4.x/directory-structure/server`  
  - Nuxt `createError`: `https://nuxt.com/docs/4.x/api/utils/create-error`

- **Atomic JSON writes (recommended)**: use a proven atomic write implementation to avoid partial/corrupted JSON when saving. `write-file-atomic` implements “write temp → fsync → rename” and queues concurrent writes.  
  - `write-file-atomic`: `https://www.npmjs.com/package/write-file-atomic`

- **Windows note (important for this workspace)**: `fs.rename()` replacement semantics differ across platforms; on Windows it may fail when overwriting an existing destination file. Prefer an atomic-write helper library or implement a Windows-safe fallback (delete/replace strategy + retry).  
  - Node `fs` docs: `https://nodejs.org/docs/latest/api/fs.html`

- **Optional alternative**: Nitro’s storage layer (`useStorage`) can persist data on the filesystem via unstorage drivers, but it stores key/value items—not specifically named JSON files like `vacancies.json`. It’s useful if you later want a storage abstraction.  
  - Nitro KV storage: `https://nitro.build/guide/storage`  
  - Unstorage fs driver: `https://unstorage.unjs.io/drivers/fs`

- **Payload validation**: for CRUD endpoints, validate request bodies at the API boundary. Zod (TypeScript-first) or Ajv (JSON Schema) are common production choices; Phase 5 can start with minimal manual validation to avoid new dependencies.  
  - Zod: `https://zod.dev/`  
  - Ajv: `https://ajv.js.org/`

---

## Phase 5 Deliverables

### A) JSON persistence utilities (server-side)

Add a small JSON store layer under:

- `hr-dashboard/server/utils/jsonStore.ts` (or per-resource files)

Responsibilities:

- Resolve each JSON file path on disk
- If the file does not exist, initialize with an empty array (`[]`)
- Read and parse JSON (return typed arrays)
- Write JSON safely (atomic / crash-safe) with **last-write-wins** semantics

Recommended location for persisted files:

- Preferred: `hr-dashboard/data/*.json`
- Fallback: repo root `*.json` (only if needed)

### B) Nitro CRUD APIs (server-side)

Add JSON CRUD endpoints (per `project.md` section 6):

- `/api/vacancies`
- `/api/critical-recruitment`
- `/api/new-hires`

CRUD method set (recommended REST shape):

- `GET /api/<resource>` → list items
- `POST /api/<resource>` → create item
- `PUT /api/<resource>/:id` → update item
- `DELETE /api/<resource>/:id` → delete item

### C) Recruitment page UI (`/recruitment`)

Implement the full page as four sections:

- **Critical Vacancies**: card list + Add/Edit/Delete
- **Critical Recruitment**: table/list + Add/Edit/Delete
- **New Hires**: table/list + Add/Edit/Delete
- **Recent Separations**: read-only table from `employees.csv` filtering `Resigned`

No notes fields anywhere on this page (per `project.md`).

---

## Data Contracts (minimal, spec-aligned)

To support reliable updates/deletes, each user-entered record should have an internal `id` (not in the UI unless you want it). Recommended generation: `crypto.randomUUID()` on the server.

### Vacancies (`vacancies.json`)

Fields from spec:

- `positionTitle: string`
- `department: string`
- `country: string`
- `priority: string`

Recommended stored shape:

- `id: string`
- `positionTitle: string`
- `department: string`
- `country: string`
- `priority: string`
- `createdAt: string` (ISO timestamp)

### Critical Recruitment (`critical-recruitment.json`)

Fields from spec:

- `candidateName: string`
- `position: string`
- `country: string`
- `stage: string`

Recommended stored shape:

- `id: string`
- `candidateName: string`
- `position: string`
- `country: string`
- `stage: string`
- `createdAt: string` (ISO timestamp)

### New Hires (`new-hires.json`)

Fields from spec:

- `name: string`
- `position: string`
- `country: string`
- `startDate: string` (store as `YYYY-MM-DD` when possible; otherwise keep raw string)
- `status: string`

Recommended stored shape:

- `id: string`
- `name: string`
- `position: string`
- `country: string`
- `startDate: string`
- `status: string`
- `createdAt: string` (ISO timestamp)

---

## Recommended Implementation Approach (Nuxt 4 + Nitro, consistent with this repo)

### 1) Add a robust JSON store (read/write + atomic writes)

Implement a utility layer that exposes:

- `readArray<T>(path): Promise<T[]>`
- `writeArray<T>(path, items): Promise<void>`

**Best option (recommended on Windows):**

- Add `write-file-atomic` to `hr-dashboard/` and use it for writes.

**No-dependency fallback (acceptable for MVP):**

- Write to a temp file (same directory), then replace the destination.
- On Windows, if rename-overwrite fails, do:
  - delete destination (if exists), then rename temp → destination
  - include a short retry loop for transient `EPERM` / `EBUSY`

### 2) Resolve JSON file paths consistently

Follow the same pattern used by `server/utils/employees.ts` and `server/utils/expenses.ts`:

- Preferred: `fileURLToPath(new URL('../../data/<file>.json', import.meta.url))`
- Fallback: `fileURLToPath(new URL('../../../<file>.json', import.meta.url))`

### 3) Build resource-specific CRUD handlers

Create endpoints as separate method files (clear, conventional Nitro routing):

- `hr-dashboard/server/api/vacancies.get.ts`
- `hr-dashboard/server/api/vacancies.post.ts`
- `hr-dashboard/server/api/vacancies/[id].put.ts`
- `hr-dashboard/server/api/vacancies/[id].delete.ts`

Repeat the same structure for:

- `critical-recruitment`
- `new-hires`

Implementation rules:

- Validate payloads (at least: required strings present; `id` exists for updates).
- Return `404` on update/delete of missing `id`.
- Return stable ordering (e.g., newest first by `createdAt`) to keep the UI consistent.
- Use `createError({ status, statusText })` for API errors.

### 4) Recent separations (read-only, from existing employees pipeline)

In the Recruitment page, fetch `GET /api/employees` and derive:

- `separations = employees.filter(e => status == 'Resigned')`

Display as a simple table (Name, Department, Position, Country, Start Date).

### 5) UI implementation for `/recruitment` (match existing patterns)

Match the style used in `/employees`:

- Use `useFetch()` for lists.
- Use Tailwind cards/tables for sections.
- For Create/Edit:
  - simplest MVP: inline form at the top of each section + per-row “Edit” mode
  - or: a lightweight modal component (only if you want it; none exists today)

---

## Acceptance Criteria (Phase 5 complete)

- `/recruitment` is fully functional:
  - CRUD works for **Vacancies**, **Critical Recruitment**, **New Hires**
  - data persists in local JSON files and survives reloads
- Server APIs exist and behave correctly:
  - `GET` returns arrays
  - `POST` creates a new record with a server-generated `id`
  - `PUT` updates by `id` and returns 404 if missing
  - `DELETE` deletes by `id` and returns 404 if missing
- JSON writes are safe enough for demo use:
  - no corrupted JSON from partial writes (atomic write strategy in place)
- Recent separations table shows employees where `Employee Status == Resigned`
- No notes fields are present anywhere on Recruitment & Onboarding

---

## Demo Script (Phase 5)

From `hr-dashboard/`:

- `npm run dev`
- Visit `/recruitment`:
  - Add a Vacancy, refresh, confirm it persists
  - Edit it, refresh, confirm the update persists
  - Delete it, refresh, confirm it’s gone
  - Repeat quickly for Critical Recruitment + New Hires
  - Confirm Recent Separations table shows resigned employees from `employee_info.csv`

