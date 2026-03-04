## Phase 15 — Odoo Production Switch + Contracts/Probations Tracking (Source-of-truth Odoo)

### Objective
Switch the HR Dashboard’s Odoo integration to the **production Odoo server**, align backend field mapping to the **production schema**, and improve the **Contracts** workflow so:
- Upcoming items are split into **contract expiries** vs **probations**.
- Expired contracts are shown based on **Odoo data** (no client-side caching).
- Rows only disappear from tables when the **status is set to Completed**.

This phase builds on Phase 14’s reporting work but focuses on **Odoo correctness + contract/probation tracking UX**.

---

### Environment & credentials (production)
Odoo connection continues to be configured via runtime environment variables (already supported by `nuxt.config.ts` and `server/utils/odoo.ts`):
- **`ODOO_URL`**: production base URL (e.g. `https://laser.rampslogistics.com`)
- **`ODOO_DB`**: production database name (e.g. `prod_db_jan_6_2023_v15`)
- **`ODOO_USERNAME`**, **`ODOO_PASSWORD`**
- **`ODOO_INSECURE_TLS`**: `0` recommended for production TLS
- **`ODOO_CACHE_TTL_MS`**: optional caching window for employee pulls

Notes:
- `.env` is **gitignored**; do not commit secrets.
- `hr-dashboard/.env.example` was updated to reflect the production host/db pattern (password remains blank).

---

### Backend: production Odoo field alignment

#### Employee talent rating (production schema)
Production stores talent rating across multiple fields:
- A **role/type** field identifying **Player vs Leader**
- Separate **player rating** and **leader rating** fields

Implementation:
- `server/utils/odooEmployees.ts` now detects production field names (confirmed on prod):
  - `player_type`
  - `player_rating`
  - `leader_rating`
- It derives `employee.talentRating` from the role-specific rating + role label (e.g. `"b+ Player"`, `"b Leader"`), with safe fallbacks to legacy single-field mappings when present.

Why it mattered:
- The Talent Density analytics depends on `talentRating` being populated; incorrect field detection resulted in all-zero buckets until production field names were added.

#### Contract vs probation end dates (production schema)
Production uses:
- **Contract end** (includes interns/contract staff): e.g. `end_contract_date` / `contract_end`
- **Probation end** (permanent employees): `end_of_probation`

Implementation:
- `server/utils/odooEmployees.ts` now detects production field names and stores:
  - `employee.contractEndDate`
  - `employee.probationEndDate`
  - plus the existing `employee.contractOrProbationEndDate` (kept for legacy usage / “next end date” behavior)
- `server/utils/employees.ts` was added (missing previously) and extended to include optional `contractEndDate` / `probationEndDate` fields.

Guardrails:
- Basic date sanity checks were added to ignore invalid end dates (relative to `startDate`).

---

### Backend API: `/api/odoo/analytics/home` contract/probation tracking

#### Query parameter
The endpoint supports a window selector:
- **`upcomingDays`**: `30 | 60 | 90`
- Default remains **60** when omitted or invalid.

#### Response shape changes (breaking)
The contract-related payload was refactored to support separate tables:
- **Added**
  - `upcomingContractExpiries`: upcoming items based on **contract end date**
  - `upcomingProbations`: upcoming items based on **probation end date**
  - `expiredContracts`: expired items based on **contract end date only**
- **Removed/renamed**
  - `upcomingContracts` is no longer used by the Contracts page; it was replaced by the split lists above.

#### Business logic rules
- **Upcoming contract expiries**
  - Uses `contractEndDate`
  - Only includes **non-permanent** employees (contract/intern), so permanent employees aren’t flagged for old contract dates.
- **Upcoming probations**
  - Uses `probationEndDate`
  - Applies to active employees (typically permanent staff).
- **Pending Contract Expiries (expired contracts)**
  - Uses **contract end date only** (explicitly not probation)
  - Includes only **non-permanent** employees (contract/intern)

---

### Debugging support (field discovery)
Added a development-oriented endpoint to confirm production field names:
- `GET /api/odoo/debug/hr-employee-fields`

This returns:
- detected candidate field names used by the mapper
- a filtered list of “interesting” `hr.employee` fields (by name pattern)

This endpoint is used to validate field matching when moving between environments.

---

### Frontend: Contracts page + tables UX

#### Contracts page (`app/pages/contracts.vue`)
- Added a **Window** selector tied to `upcomingDays` (30/60/90), re-fetching `/api/odoo/analytics/home` automatically.
- Updated to consume the new response shape:
  - `upcomingContractExpiries`
  - `upcomingProbations`
  - `expiredContracts`

#### Upcoming/Expired tables (`app/components/UpcomingContractsTable.vue`)
Refactored from a single mixed table into three sections:
- **Upcoming contract expiries** (table)
- **Upcoming probations** (table)
- **Pending Contract Expiries** (table)

Presentation improvements:
- Sections are separated with divider lines (`<hr class="border-slate-800" />`).
- Section headings were increased for clarity.
- The “Days” column heading was renamed to **Time remaining**.
- Added a **Days | Weeks | Days+Weeks** toggle controlling how “Time remaining” is displayed:
  - Days: `45`
  - Weeks: `7w` (computed as \( \lceil days/7 \rceil \))
  - Both: `45d (7w)`

#### Status workflow
- Status is still a local UI state per row (persisted in `localStorage`) but:
  - Rows are removed from view **only when set to Completed**.
  - Odoo remains the source of truth for which rows exist in each section.
- Status label change:
  - `pending` is now displayed as **Not Started** (internal value unchanged).

#### Status badge sizing
`app/components/StatusBadgeSelect.vue` was updated to be slightly smaller (height, padding, font-size, icon-size) for better table fit.

---

### Dependency notes
No new npm dependencies were added in Phase 15.

---

### Validation checklist (what to verify)
- `GET /api/odoo/health` returns `200` and shows the expected production host/db configuration.
- `GET /api/odoo/employees` returns employees with:
  - `talentRating` populated (for Talent Density)
  - `contractEndDate` and `probationEndDate` populated where applicable
- `GET /api/odoo/analytics/home?upcomingDays=30|60|90` returns:
  - `upcomingContractExpiries`, `upcomingProbations`, `expiredContracts` with expected counts
- Contracts page shows:
  - 3 clearly separated sections (contracts / probations / pending expiries)
  - Status hides rows only when Completed
  - Time remaining toggle works (Days/Weeks/Both)

