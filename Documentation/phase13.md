# Phase 13 Plan — Replace JSON Stores with Postgres (Docker) for Tracking Pages

## Objective

Prepare the HR Dashboard for deployment by **retiring repository-local JSON persistence** for tracking pages and replacing it with a **local PostgreSQL database running in Docker**, while keeping:

- **Home analytics** sourced from the **Odoo test server only**.
  - We will **remove the non-Odoo Home page** and its supporting API routes from the codebase to avoid future maintenance confusion.
  - The sidebar will only show the “main” pages (Odoo Home + the operational pages).
- **Salary + expense details** sourced from **SharePoint lists** (via Microsoft Graph).
- The existing dashboard UI/UX and API contracts as stable as possible.

This phase is complete when all CRUD tracking tables that currently persist to `hr-dashboard/data/*.json` (or repo-root JSON fallbacks) instead persist to Postgres, with a clear migration path for existing JSON data.

---

## Current architecture (relevant parts)

### Frontend

- Pages and components under `hr-dashboard/app/**` call internal endpoints like:
  - `GET/POST/PUT/DELETE /api/vacancies`
  - `GET/POST/PUT/DELETE /api/critical-recruitment`
  - `GET/POST/PUT/DELETE /api/disciplinary`
  - `GET/POST/PUT/DELETE /api/contract-changes`
  - `GET/POST/PUT/DELETE /api/medical-enrollments`
  - `GET/POST/PUT/DELETE /api/eap-referrals`

### Backend (Nitro on Node)

- CRUD endpoints live in `hr-dashboard/server/api/**`.
- JSON persistence is implemented in `hr-dashboard/server/utils/jsonStore.ts` via:
  - `readJsonArray(fileName)`
  - `writeJsonArray(fileName, items)`

### What currently uses JSON persistence (inventory)

These API routes read/write local JSON files:

- **Recruitment tracking**
  - `vacancies.json` via `/api/vacancies`
  - `critical-recruitment.json` via `/api/critical-recruitment`
  - Legacy: `new-hires.json` via `/api/new-hires` (note: the page also pulls Odoo new hires via `/api/odoo/new-hires`)
- **Contracts tracking**
  - `contract-changes.json` via `/api/contract-changes`
- **Disciplinary tracking**
  - `disciplinary-cases.json` via `/api/disciplinary`
- **Medical & EAP tracking**
  - `medical-enrollments.json` via `/api/medical-enrollments`
  - `eap-referrals.json` via `/api/eap-referrals`
- **Performance note persistence**
  - `c-player-notes.json` via `/api/c-player-notes/:employeeKey`

The repo also currently includes a **non-Odoo home analytics path**:

- `app/pages/index.vue` (the `/` home page) calls `GET /api/analytics/home`
- `GET /api/analytics/home` computes “additions” from `new-hires.json` (legacy mechanism)

---

## Target architecture (end state)

### Postgres becomes the persistence layer for tracking CRUD

- Keep the existing Nitro API endpoints and request/response shapes.
- Replace the storage implementation under those endpoints from:
  - **JSON file I/O** → **Postgres CRUD**.

### Docker provides the local database

- Add a `docker-compose.yml` (or `compose.yml`) to run:
  - `postgres:16-alpine` (recommended baseline)
  - a named volume for data persistence
- The app uses a `DATABASE_URL` connection string in server runtime config.

### Recommended DB access approach for this Nuxt/Nitro app

Use **Prisma ORM + Postgres** for:

- Type-safe models in TypeScript
- Migrations (`prisma migrate dev` / `prisma migrate deploy`)
- A Nuxt-friendly server runtime pattern (singleton Prisma client) to avoid connection explosions during dev HMR

Authoritative references:

- Prisma’s Nuxt guide (setup + recommended Nuxt server utils pattern): [“Build a Nuxt app with Prisma ORM and Prisma Postgres”](https://www.prisma.io/docs/guides/nuxt)
- Docker Compose env var guidance (esp. around secrets and env precedence): [Docker Docs: env var best practices](https://docs.docker.com/compose/how-tos/environment-variables/best-practices)

Drizzle ORM is a viable alternative, but Prisma is the most “batteries-included” fit for this repo because you’ll need migrations + a clean schema with minimal custom tooling.

---

## Implementation plan (detailed)

### A) Add local Postgres via Docker Compose

1. Add a compose file at repo root (recommended) that defines:
   - `postgres` service:
     - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
     - port mapping (e.g. `5432:5432`) for local tooling
     - named volume for `/var/lib/postgresql/data`
     - healthcheck (`pg_isready`)
2. Add a database connection string for the app:
   - `DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<db>`
3. Decide how secrets are handled:
   - dev: `.env` is acceptable locally (not committed)
   - deployment: use platform secrets or Compose secrets (avoid committing passwords)

Deliverables (Phase 13):

- Compose spec documented
- `.env.example` documented (no secrets committed)
- Clear “how to start DB” instructions for developers

### B) Introduce Prisma (no functional changes yet)

1. Add dependencies:
   - `prisma` (dev)
   - `@prisma/client`
   - `pg`
   - `@prisma/adapter-pg` (Prisma’s recommended Postgres adapter pattern)
2. Add `prisma/schema.prisma` and configure `DATABASE_URL`.
3. Add `server/utils/db.ts` that exports a **singleton** Prisma client (Nuxt server utils auto-import pattern).

Acceptance checkpoint:

- App boots with Postgres running (even if endpoints still use JSON at this point).
- Prisma client can connect (a simple “health” query works during local dev).

### C) Design the database schema (models)

Design principle: **mirror the current JSON shapes** so endpoint contracts don’t need to change.

Recommended models (tables) based on current JSON-backed endpoints:

- `Vacancy`
  - `id` (UUID, primary key)
  - `positionTitle`, `department`, `country`, `priority`
  - `createdAt`
- `CriticalRecruitment`
  - `id` (UUID)
  - `candidateName`, `position`, `country`, `stage`
  - `createdAt`
- `DisciplinaryCase`
  - `id` (UUID)
  - `employeeName`, `department?`, `country?`, `caseType?`
  - `summary`, `status`
  - `createdAt`
- `ContractChange`
  - `id` (UUID)
  - `employeeName`, `country`, `department`, `position`
  - `changeTypes` (array of allowed values)
  - `status` (enum)
  - `description`
  - `createdAt`
- `MedicalEnrollment`
  - `id` (UUID)
  - `employeeName`, `country`
  - optional fields already in the API type (`vendor`, `stage`, `dateInitiated`, etc.)
  - `createdAt`, `updatedAt`
- `EapReferral`
  - `id` (UUID)
  - `employeeName`, `country`
  - fields already in the API type (`referralDate`, `reasonCategory`, `programStatus`, etc.)
  - `createdAt`, `updatedAt`
- `CPlayerNote`
  - key by `employeeKey` (unique) + note fields currently supported
  - timestamps

Notes:

- Keep **created/updated timestamps** as ISO strings at the API layer if the UI expects that; internally store as Postgres `timestamp` and format in the API responses.
- For `changeTypes`, Prisma supports Postgres array types (e.g. `String[]`) or a join table. Prefer `String[]` if you want the simplest migration with minimal query complexity.
- Add indexes where obvious:
  - `createdAt` / `updatedAt` sorting
  - `employeeName` for tracking tables
  - `employeeKey` unique for notes

### D) One-time JSON → Postgres migration

Goal: you should be able to deploy without losing already-entered tracking data.

1. Create a migration script that:
   - reads each JSON file using the existing logic (so it finds both `hr-dashboard/data/*.json` and repo-root fallbacks)
   - validates/coerces items (basic safety)
   - inserts into the new tables (preserving IDs and timestamps)
2. Decide how to handle duplicates:
   - safest default: “upsert by id” for each record
3. Add a clear operator workflow:
   - Start Postgres (docker compose)
   - Run Prisma migrations
   - Run import script once (`npm run db:import`)

Acceptance checkpoint:

- Existing JSON records appear in Postgres.
- UI shows the same items after switching endpoints to DB-backed storage.

### E) Swap each CRUD endpoint from JSONStore → DB (keep routes stable)

For each tracking area, do the conversion behind the same endpoints:

1. `/api/vacancies`
2. `/api/critical-recruitment`
3. `/api/disciplinary`
4. `/api/contract-changes`
5. `/api/medical-enrollments`
6. `/api/eap-referrals`
7. `/api/c-player-notes/:employeeKey`

Implementation pattern per endpoint:

- **GET**: query the table, return sorted list (preserving existing sort order semantics)
- **POST**: validate request body, insert row, return created object
- **PUT**: validate request body, update row, return updated object
- **DELETE**: delete row, return success

Important: preserve existing validation rules where they exist today in the JSON-backed handlers (so behavior doesn’t regress).

### F) Retire the non-Odoo home route (deployment decision)

Decision: keep **Odoo home + Odoo analytics only** for deployment.

Plan:

- Remove the non-Odoo Home page and routes from the app:
  - Remove `app/pages/index.vue` (retire the non-Odoo Home UI route).
  - Remove `GET /api/analytics/home` (retire the CSV/JSON-based analytics backend).
  - Remove the “Home” (non-Odoo) link from the sidebar so only Odoo Home remains.
- Optional (recommended) entrypoint convenience:
  - Keep a simple redirect from `/` → `/odoo` (route rule), so users can still type the base URL and land on the Odoo Home.
  - This redirect should not reintroduce a second Home implementation—just a single forwarding rule.
- Confirm month-filter behavior remains intact:
  - New hires are derived from Odoo employee `create_date` (via `/api/odoo/new-hires`).
  - Separations are derived from Odoo archived status + separation date fields (via Odoo analytics/separations endpoints).

### F) Deal with `new-hires.json` (legacy tracking vs Odoo-sourced new hires)

Decision for deployment: **new hires and separations are Odoo-sourced**.

Current reality in code:

- Recruitment page fetches Odoo new hires from `/api/odoo/new-hires`
- The repo still contains `/api/new-hires` endpoints and the backend analytics endpoint `GET /api/analytics/home` reads `new-hires.json` for additions in the CSV-based mode

Phase 13 plan (updated):

- Treat Odoo as the system of record:
  - **New hires**: derived from the Odoo employee profile `create_date` (already exposed via `/api/odoo/new-hires`).
  - **Separations**: derived from the employee being archived + the separation date field recorded in Odoo (already used in Odoo analytics/separations endpoints).
- Retire the legacy “CSV mode additions” mechanism:
  - Deprecate/remove `/api/new-hires` (JSON-backed CRUD) from the runtime path.
  - Remove the dependency on `new-hires.json` inside `GET /api/analytics/home` (or deprecate this CSV-based analytics route entirely for deployment, in favor of the Odoo analytics route `GET /api/odoo/analytics/home`).
- Persistence note:
  - Because Odoo already persists `create_date` and separation/archive status, **we do not need to store new hires/separations in Postgres for persistence**.
  - If you later require “frozen” historical snapshots (e.g., auditability even if Odoo data changes), add optional snapshot tables in Postgres, but keep the primary live source as Odoo.

Recommendation for deployment readiness:

- Prefer a single “source of truth” path:
  - Odoo-powered dashboards (`/odoo/*`) and Odoo endpoints for additions/separations/new hires
  - Tracking tables in Postgres
  - Avoid a parallel “CSV + new-hires.json” path 

### G) Remove JSONStore from the runtime path (retirement)

After all endpoints are DB-backed and migration is complete:

1. Remove calls to `readJsonArray/writeJsonArray` from API routes.
2. Keep `jsonStore.ts` temporarily only for the migration script (optional).
3. Optionally delete the JSON data files after verifying production data is in Postgres (operator step; not automatic).

---

## Deployment preparation notes

### Migrations in deployment

You’ll need a consistent policy:

- Build step: `prisma generate`
- Release/startup step: `prisma migrate deploy`

If you deploy the Nuxt app in a container, run migrations in a separate “release” command or entrypoint step (avoid running migrations concurrently across multiple app replicas).

### Connection management

Avoid creating a new DB connection per request. Use a singleton Prisma client in `server/utils/db.ts` (Prisma’s Nuxt guide provides a proven pattern) so:

- dev HMR doesn’t leak connections
- production has stable pooling behavior

---

## Acceptance criteria

- The deployment “Home” is Odoo-only:
  - The non-Odoo Home page is removed from the sidebar and from the codebase.
  - `GET /api/analytics/home` is removed (no CSV/JSON-based home analytics backend remains).
  - (Optional) `/` redirects to `/odoo` as a pure forwarding rule.
- All tracking CRUD pages persist to Postgres, not JSON files:
  - Recruitment (vacancies + critical recruitment)
  - Contract Management
  - Progressive Discipline
  - Medical Enrollments & EAP
- Existing JSON data can be imported into Postgres via a documented one-time script.
- No secrets are committed; `.env.example` exists; Docker Compose usage is documented.
- Odoo + SharePoint integrations remain unchanged (data sources remain as you described).

---

## Risks & mitigations

- **Schema mismatch risk**: JSON payload shapes drifted over time.
  - Mitigation: base Prisma schema on the server API types and add coercion in migration script.
- **Dual-mode confusion (CSV vs Odoo)**:
  - Mitigation: explicitly choose which dashboards are “primary” for deployment; deprecate the old path if not needed.
- **Deployment migration race** (multiple instances running migrations):
  - Mitigation: run migrations in a single controlled release step.

---

## Implementation details (Phase 13 as-built)

This section documents the concrete “how to run it” details based on the current codebase implementation.

### Daily run commands (local development)

From repo root:

```bash
docker compose up -d
docker compose ps
```

From `hr-dashboard/`:

```bash
npm install
npm run dev
```

Notes:

- Dev server prints the URL (typically `http://127.0.0.1:3000/`). Home is `/odoo` and `/` redirects to `/odoo`.
- To stop the DB:

```bash
docker compose down
```

### One-time setup / data migration (local)

From `hr-dashboard/` (with Postgres running and `DATABASE_URL` set):

```bash
npx prisma migrate dev --name init
npm run db:import
```

### Deployment build + start commands (Node server)

From `hr-dashboard/`:

**Build:**

```bash
npm ci
npm run build
```

**Release step (run once per deploy):**

```bash
npx prisma migrate deploy
```

**Start (serve the built Nitro output):**

```bash
node .output/server/index.mjs
```

If you need a custom port/host, set environment variables supported by the platform (commonly `PORT` / `HOST`) before starting.

### Environment variables required at deployment

**Database**

- `DATABASE_URL`: Postgres connection string (example: `postgresql://user:password@host:5432/dbname`)

**Odoo (required for the main Home/Employees pages)**

- `ODOO_URL`
- `ODOO_USERNAME`
- `ODOO_PASSWORD`
- `ODOO_DB` (required if the server has multiple DBs; optional otherwise)
- `ODOO_INSECURE_TLS` (`1` to allow self-signed TLS; otherwise `0`)
- `ODOO_CACHE_TTL_MS` (optional; defaults in config)

**Microsoft Graph / SharePoint (required if you use SharePoint-backed expenses + compensation)**

- `GRAPH_TENANT_ID`
- `GRAPH_CLIENT_ID`
- `GRAPH_CLIENT_SECRET`
- `SP_HOSTNAME`
- `SP_SITE_ID` (optional if using `SP_SITE_PATH`)
- `SP_SITE_PATH` (optional if using `SP_SITE_ID`)
- `SP_LIST_ID`
- `SP_CACHE_TTL_MS` (optional)
- `NUXT_SHAREPOINT_SITE_ID`
- `NUXT_SHAREPOINT_SALARY_LIST_ID`
- `NUXT_SHAREPOINT_SALARY_CACHE_TTL_MS` (optional)

**Server (optional; depends on host)**

- `PORT`
- `HOST`

