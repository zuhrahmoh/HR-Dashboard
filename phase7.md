# Phase 7 Plan — Disciplinary (CRUD Cases + Status Tracking)

## Objective

Implement the **Phase 7** scope from `project.md`:

- Build the **Disciplinary Matters** page (`/disciplinary`)
- Add **CRUD case logging** with **status tracking**
- Persist user-entered cases locally (JSON file)
- Demo: **disciplinary logging** workflow

Phase 7 is complete when disciplinary cases can be added/edited/deleted, statuses can be updated, and the data **persists locally** and survives reloads/restarts.

---

## Current State (project reality today)

- The Nuxt app lives in `hr-dashboard/` (Nuxt `^4.2.2`).
- Recruitment workflows are implemented using JSON persistence via `hr-dashboard/server/utils/jsonStore.ts` and resource CRUD endpoints under `hr-dashboard/server/api/`.
- The Disciplinary page is still a placeholder:
  - `hr-dashboard/app/pages/disciplinary.vue` shows “Phase 0 placeholder…”
- There is currently **no** disciplinary JSON data file under `hr-dashboard/data/`.
- There are currently **no** disciplinary CRUD endpoints under `hr-dashboard/server/api/`.

---

## Web Research Summary (best-practice guidance)

- **Nuxt/Nitro API routes**: implement endpoints in `~/server/api/*` with `defineEventHandler()`; use h3 helpers like `readBody()` and `getRouterParam()` for CRUD.  
  Refs: `https://nuxt.com/docs/4.x/guide/directory-structure/server`, `https://nuxt.com/docs/4.x/getting-started/server`
- **Consistent error handling**: throw `createError({ statusCode, statusMessage })` so the client gets clean, consistent errors.  
  Ref: `https://nuxt.com/docs/4.x/api/utils/create-error`
- **Persistence options**:
  - Nitro’s `useStorage()` (unstorage) can persist to filesystem drivers but is key/value oriented.  
    Refs: `https://nitro.build/guide/storage`, `https://unstorage.unjs.io/drivers/fs`
  - This repo already standardizes on **named JSON files + atomic-ish writes** in `server/utils/jsonStore.ts`, which is the lowest-risk approach for this MVP.
- **Windows-safe atomic writes**: for JSON files, the “write temp → rename” pattern can hit transient `EPERM`/`EBUSY`. Using a library such as `atomically`/`write-file-atomic` is a common best-practice if you need stronger guarantees.  
  Refs: `https://www.npmjs.com/package/atomically`, `https://www.npmjs.com/package/write-file-atomic`

---

## Phase 7 Deliverables

### A) Disciplinary cases JSON persistence (server-side)

Persist cases in a local JSON file (per `project.md`):

- File: `hr-dashboard/data/disciplinary-cases.json`
- Storage: array of records (append/update/remove)
- Write semantics: last-write-wins, safe writes via the existing `jsonStore.ts`

### B) Nitro CRUD API (server-side)

Implement the spec endpoint set (from `project.md` section 6):

- `GET /api/disciplinary` → list cases
- `POST /api/disciplinary` → create case
- `PUT /api/disciplinary/:id` → update case
- `DELETE /api/disciplinary/:id` → delete case

### C) Disciplinary page UI (`/disciplinary`)

Implement a demo-friendly UI similar to `/recruitment`:

- Read list from `GET /api/disciplinary`
- Add form (toggleable)
- Inline edit per row (including status updates)
- Delete action per row
- Clear loading/error/empty states

No notes fields (per `project.md`).

---

## Data Contract (minimal, spec-aligned)

Fields from `project.md`:

- Employee Name (free text)
- Case Type
- Summary
- Status
- Created Date

Recommended stored shape:

```ts
type DisciplinaryCase = {
  id: string
  employeeName: string
  caseType: string
  summary: string
  status: string
  createdAt: string // ISO timestamp
}
```

Notes:

- Keep `status` as a required free-text string (spec does not constrain allowed values).
- Generate `id` on the server with `crypto.randomUUID()` (matches existing CRUD patterns).

---

## Recommended Implementation Approach (matches this repo’s patterns)

### 1) Create the disciplinary JSON file

- Add `hr-dashboard/data/disciplinary-cases.json` with initial content `[]`.

### 2) Implement CRUD endpoints (mirror existing resources)

Create:

- `hr-dashboard/server/api/disciplinary.get.ts`
- `hr-dashboard/server/api/disciplinary.post.ts`
- `hr-dashboard/server/api/disciplinary/[id].put.ts`
- `hr-dashboard/server/api/disciplinary/[id].delete.ts`

Implementation details:

- Use `readJsonArray<DisciplinaryCase>('disciplinary-cases.json')` and `writeJsonArray(...)`.
- Validate required strings at the API boundary (same `requireNonEmptyString` helper pattern used in `new-hires`).
- Sort lists deterministically (recommended: newest first by `createdAt`).
- Return `404` when updating/deleting a missing `id`.

### 3) Build the `/disciplinary` page

Update `hr-dashboard/app/pages/disciplinary.vue` to:

- `useFetch<DisciplinaryCase[]>('/api/disciplinary')`
- Render a table with: Employee Name, Case Type, Summary, Status, Created Date, actions
- Provide:
  - “Add case” form (create via `POST`)
  - Inline edit mode (save via `PUT`)
  - Delete action (via `DELETE`)
- Reuse the error-message extraction pattern from `/recruitment` to surface server validation errors cleanly.

---

## Acceptance Criteria (Phase 7 complete)

- `/disciplinary` is functional and demo-ready:
  - Create/Edit/Delete cases works
  - Status is editable and persists
  - Clean loading/error/empty states
- Server APIs exist and behave correctly:
  - `GET /api/disciplinary` returns an array
  - `POST` creates a case with server-generated `id` and `createdAt`
  - `PUT` updates by `id` and returns 404 if missing
  - `DELETE` deletes by `id` and returns 404 if missing
- Local persistence:
  - Data is stored in `hr-dashboard/data/disciplinary-cases.json`
  - Data survives refresh/restart
- Spec compliance:
  - No “notes” field/UI for disciplinary cases

---

## Demo Script (Phase 7)

From `hr-dashboard/`:

- `npm run dev`
- Visit `/disciplinary`:
  - Add a new case (fill all fields), confirm it appears in the list
  - Edit the case’s status, confirm it updates
  - Refresh the page, confirm the case and status persist
  - Delete the case, refresh, confirm it’s gone

