# Phase 11 Summary — HR PI5 Correspondence

## Objective

Replace the legacy **Performance / C-Player** page with a new **Employee Contract Management** workflow that supports:

- Manual logging of employee contract changes (create/edit/delete)
- Persistent storage via local JSON-backed API endpoints
- A single home for the CSV-backed **Upcoming Contracts** table (moved off both Home pages)
- Clean routing that retires `/performance` while preserving backwards-compatible redirects
- UI polish to keep layout stable (no global horizontal scroll, no clipped content, consistent table typography)

---

## Major deliverables shipped

### A) New Employee Contract Management page

Primary page:

- `hr-dashboard/app/pages/contracts.vue`

Key functionality:

- **Contract Changes** table with create/edit/delete
- Columns:
  - **Employee Name** (manual text)
  - **Department** (single-select dropdown)
  - **Position** (manual text)
  - **Change Type** (multi-select dropdown with checkboxes; rendered as colored badges)
    - Options: `Salary`, `Role`, `Reporting`, `Job Title`, `Contract Extension`, `Non-Renewal`
  - **Status** (single-select dropdown; rendered as badge)
    - Options: `Approval required`, `Approved`, `On Hold`
  - **Description of Change** (manual text; wraps so long content is readable)
- Improved dropdown UX:
  - True checkbox dropdown for Change Type
  - Click-outside-to-close behavior
  - Edit-state dropdown panel no longer becomes an awkward scrollable clipped element

---

### B) JSON-backed persistence for Contract Changes (Nitro API)

Endpoints:

- `GET /api/contract-changes`
  - File: `hr-dashboard/server/api/contract-changes.get.ts`
  - Normalizes historical data:
    - Defaults missing `status` to `Approval required`
    - Splits legacy combined values (`"Role, Reporting"`) into `["Role", "Reporting"]`
- `POST /api/contract-changes`
  - File: `hr-dashboard/server/api/contract-changes.post.ts`
- `PUT /api/contract-changes/:id`
  - File: `hr-dashboard/server/api/contract-changes/[id].put.ts`
- `DELETE /api/contract-changes/:id`
  - File: `hr-dashboard/server/api/contract-changes/[id].delete.ts`

Storage:

- JSON store file: `contract-changes.json` (via existing `jsonStore` utility)
- IDs generated using `crypto.randomUUID()`

---

### C) Retired `/performance` route without breaking old links

Navigation update:

- `hr-dashboard/app/layouts/default.vue`
  - Sidebar label updated to **Contract Management**
  - Route updated to `/contracts`

Redirects:

- Server-side redirect:
  - `hr-dashboard/nuxt.config.ts`
  - `routeRules: { '/performance': { redirect: '/contracts' } }`
- Client-side redirect middleware:
  - `hr-dashboard/app/middleware/redirect-performance.global.ts`
  - Ensures SPA navigation to `/performance` is replaced to `/contracts`

Outcome:

- `/contracts` is the only real page implementation
- `/performance` is fully retired but safely redirects

---

### D) Upcoming Contracts table moved onto Contract Management page

Goal:

- Keep the **CSV-backed** Upcoming Contracts data source (since Odoo currently lacks end-date fields)
- Remove this table from both home pages and place it under Contract Management

Implementation:

- Component reused:
  - `hr-dashboard/app/components/UpcomingContractsTable.vue`
- Data source for contracts page:
  - `GET /api/analytics/home` (CSV-backed home analytics)
- Removed from:
  - `hr-dashboard/app/pages/index.vue`
  - `hr-dashboard/app/pages/odoo/index.vue`

---

### E) Recruitment page updates (Critical Recruitment + Onboarding check-ins)

Primary page:

- `hr-dashboard/app/pages/recruitment.vue`

#### Critical Recruitment — Stage dropdown

- Added a new stage option: **`Pre-Onboarding Stage`**
  - Display order: **second-to-last** (right before `Feedback Stage`)
  - Badge color: **green** (emerald palette)

#### New hire check-ins — probation-based, 14-day visibility

Updated the “check-ins approaching” logic so the table reflects the full probation period instead of the current-month cohort.

- Renamed section to **Upcoming Onboarding Check-ins**
- Check-ins supported: **1–6 months**
- Visibility window: rows appear when a check-in is due **within the next 14 days**
- Population rule: only employees still within probation (**start date < 6 months ago**)
- The month-filtered **New Hires** table (current month + month selector) was moved to the bottom of the page near **Recent Separations**

Key files:

- `hr-dashboard/app/components/NewHireCheckinsTable.vue`
  - Implements the 1–6 month schedule and 14-day approach window
  - Temporarily keeps “Completed” rows visible (completed filtering is deferred for later)
- `hr-dashboard/app/components/CheckinStatusSelect.vue`
  - Reduced badge size
  - Updated status colors:
    - `No Action` → red
    - `In Progress` → yellow (amber)
    - `Completed` → green (emerald)
- `hr-dashboard/server/api/odoo/new-hires.get.ts`
  - Added `?probation=1` mode to return employees still within the 6-month probation window (based on `startDate`)

---

## UI refinements and styling fixes

### A) Tailwind CSS inclusion and base style cleanup

- Ensured Tailwind is loaded from:
  - `hr-dashboard/assets/css/tailwind.css`
- Explicitly included in:
  - `hr-dashboard/nuxt.config.ts` via `css: ['~/assets/css/tailwind.css']`
- Removed global base overrides that changed perceived app typography (custom body font sizing and global heading overrides).

### B) Prevent global horizontal scroll without clipping content

Layout stabilization:

- `hr-dashboard/app/layouts/default.vue`
  - Added `min-w-0` to the flex container and `<main>` so content can shrink correctly in a flex layout.

Global overflow handling:

- `hr-dashboard/assets/css/tailwind.css`
  - Uses `overflow-x-clip` on `body` to avoid page-wide horizontal scroll while minimizing visible clipping.

### C) Upcoming Contracts table typography + width behavior

- `hr-dashboard/app/components/UpcomingContractsTable.vue`
  - Reduced table text size to match the rest of the app (`text-sm` body, `text-xs` headers).
  - Truncated wide text columns (with `title` tooltip) to reduce forced horizontal expansion.
  - Updated highlight styling for imminent rows to a more “midnight purple” look, with a more prominent inset boundary.
  - Ensured the bottom boundary renders through the last highlighted row in each group.
  - **Pending Contract Expiries persistence**:
    - Expired rows are cached in **browser localStorage** so they persist in the pending table even after they fall outside the CSV “next 60 days” dataset.
    - Cached rows remain until their status is marked `Completed`.

---

## Test plan (manual)

- Navigate to **Recruitment & Onboarding** (`/recruitment`)
  - Confirm **Upcoming Onboarding Check-ins** shows only check-ins due within 14 days (1–6 months) for employees still in probation (< 6 months).
  - Confirm check-in status badge colors match: red/yellow/green for No Action / In Progress / Completed.
  - Confirm **New Hires** month-filtered table is located near the bottom of the page.
  - Confirm Critical Recruitment stage dropdown includes `Pre-Onboarding Stage` with a green badge.
- Navigate to **Contract Management** (`/contracts`)
  - Add a new Contract Change entry
  - Verify Change Type supports multi-select checkboxes and shows colored badges
  - Verify Status is single-select and does not wrap
  - Edit and delete rows; confirm persistence after refresh
- Navigate to `/performance`
  - Confirm it redirects to `/contracts`
- Confirm Upcoming Contracts table:
  - Appears only on `/contracts`
  - Is removed from `/` and `/odoo`
  - Uses the darker purple highlight for upcoming rows
  - Matches table font size across the page
  - Does not cause global horizontal scrolling or clipped right-side content
  - Confirm **Pending Contract Expiries** persist until status is set to `Completed`

