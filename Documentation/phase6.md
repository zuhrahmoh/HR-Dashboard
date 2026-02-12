# Phase 6 Plan — Performance (C Players Table + Persistent Notes)

## Objective

Implement the **Phase 6** scope from `project.md`:

- Build the **Performance** page (`/performance`) showing a **C Players table**
- Add **persistent notes** for C Players only
- Demo: **performance tracking** driven from the existing employee CSV pipeline and local JSON persistence

Phase 6 is complete when C Players can be viewed and notes **persist locally** and survive reloads/restarts.

---

## Current State (project reality today)

- Phases **0–5 are implemented** in `hr-dashboard/`:
  - Employee CSV pipeline exists (`server/utils/employees.ts`) and already exposes `talentRating` from the CSV column `A Player rating`.
  - JSON CRUD workflows exist for Recruitment via `server/utils/jsonStore.ts` (atomic writes, Windows-safe retries) and `/server/api/*` endpoints.
- The Performance page is **still a placeholder**:
  - `hr-dashboard/app/pages/performance.vue` says “Phase 0 placeholder”.
- There is currently **no** `c-player-notes.json` file and **no** `/api/c-player-notes/:employeeKey` endpoint implemented.

---

## Web Research Summary (best-practice guidance)

- **Dynamic Nitro routes**: Use the `[param]` filename pattern (e.g., `server/api/users/[id].get.ts`) and read params via `getRouterParam(event, 'id')`.  
  Refs: Nitro routing docs `https://nitro.build/guide/routing`, Nuxt server directory docs `https://nuxt.com/docs/4.x/directory-structure/server`
- **API error propagation**: Use `createError({ statusCode, statusMessage, data })` for consistent client-visible errors in Nuxt/Nitro.  
  Ref: Nuxt `createError` docs `https://nuxt.com/docs/4.x/api/utils/create-error`
- **Server-side persistence option**: Nitro supports `useStorage()` backed by unstorage (including filesystem drivers), but it’s key/value oriented. Your repo already standardizes on named JSON files + atomic writes, which is a good fit for this MVP.  
  Refs: Nitro storage `https://nitro.build/guide/storage`, unstorage fs driver `https://unstorage.unjs.io/drivers/fs`
- **Client fetching pattern**: For route/param reactive fetches, use a function URL with `useFetch(() => '/api/...')` so it refetches when params change.  
  Ref: Nuxt `useFetch` docs `https://nuxt.com/docs/api/composables/use-fetch`

---

## Phase 6 Deliverables

### A) Performance page UI (`/performance`)

- Show a **C Players table** derived from the authoritative CSV employees data:
  - Source: `GET /api/employees`
  - Exclude resigned employees
  - Filter: rating == `C Player` (based on `talentRating`)
- Display general employee info in the table (read-only):
  - Name, Department, Position, Country Assigned (and optionally Start Date)

### B) Notes (allowed only here)

- Notes are allowed **only for C Players** and **only on `/performance`** (per `project.md`)
- Notes must persist locally via a JSON file:
  - `c-player-notes.json`
  - keyed by `employeeKey`

### C) Server API for notes (Nitro)

Implement the spec endpoint (from `project.md` section 6):

- `GET /api/c-player-notes/:employeeKey` → return the saved note for that `employeeKey` (or empty when none)
- `PUT /api/c-player-notes/:employeeKey` → upsert the note for that `employeeKey`

Recommended validation rules (spec-aligned):

- Ensure the `employeeKey` exists in the CSV
- Ensure the employee is **not resigned**
- Ensure the employee is a **C Player** (so notes can’t be written for non-C Players)

---

## Recommended Implementation Approach (Nuxt 4 + Nitro, consistent with this repo)

### 1) Define the notes storage shape (keep it simple)

Use a single local JSON file: `hr-dashboard/data/c-player-notes.json`.

Recommended stored shape (works with the existing `readJsonArray` / `writeJsonArray` helpers):

- `Array<{ employeeKey: string; note: string; updatedAt: string }>`

Upsert logic:

- If a note exists for `employeeKey`, update `note` + `updatedAt`
- If none exists, insert a new record
- If you want “clear note” support without adding a DELETE endpoint: treat an empty/whitespace note as “remove the record”

### 2) Implement Nitro endpoints using the existing persistence layer

Create:

- `hr-dashboard/server/api/c-player-notes/[employeeKey].get.ts`
- `hr-dashboard/server/api/c-player-notes/[employeeKey].put.ts`

Implementation details:

- Use `getRouterParam(event, 'employeeKey')`
- Use `createError({ statusCode, statusMessage })` for 400/404 responses
- Use `server/utils/employees.ts` to validate employee existence + C Player eligibility
- Use `server/utils/jsonStore.ts` for safe reads/writes

### 3) Build the `/performance` page

Minimal, demo-friendly UI approach (matches your `/recruitment` patterns):

- Fetch employees via `useFetch('/api/employees')`
- Derive `cPlayers` computed list:
  - `employeeStatus !== 'Resigned'`
  - `talentRating === 'C Player'` (trimmed; compare exactly)
- For notes:
  - Render a small textarea/editor per row
  - Load the note on demand via `GET /api/c-player-notes/:employeeKey`
  - Save via `PUT /api/c-player-notes/:employeeKey`
  - Show clear “Saving… / Saved / Error” inline feedback

Performance note (optional enhancement):

- If you want to avoid many note fetches, add a single “bulk notes” fetch (not required by `project.md`) by either:
  - reading `c-player-notes.json` on the client via a new API (recommended if you decide you need it), or
  - loading notes lazily when the user expands/edits a row (often good enough for MVP).

---

## Acceptance Criteria (Phase 6 complete)

- `/performance` renders a **C Players** list derived from `employees.csv`:
  - Resigned employees are excluded
  - Only employees with rating exactly `C Player` are included
- Notes behavior:
  - Notes are visible only on `/performance`
  - Notes persist to `c-player-notes.json` and survive refresh/restart
  - Notes cannot be saved for non-C Players (server-side validation)
- Server APIs exist and behave correctly:
  - `GET /api/c-player-notes/:employeeKey` returns the current note (or empty when missing)
  - `PUT /api/c-player-notes/:employeeKey` upserts the note and persists locally using atomic write semantics

---

## Demo Script (Phase 6)

From `hr-dashboard/`:

- `npm run dev`
- Visit `/performance`:
  - Confirm the table shows only active C Players
  - Add/edit a note for one C Player, click save
  - Refresh the page and confirm the note is still present

