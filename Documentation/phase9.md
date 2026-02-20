# Phase 9 Plan — SharePoint Global Expenses (Microsoft Graph) + Month Filtering + Net Changes

## Objective

Replace the Home dashboard’s **Global Expense Breakdown** data source (`global_expenses.csv`) with the SharePoint list **Global Expenses Draft**, so the app always reflects the **latest monthly upload** and supports:

- **Default view**: most recent month’s breakdown (current behavior, but sourced from SharePoint)
- **Filter**: switch to previous months
- **Net changes**: compare a selected month to the prior month (or another chosen month) and show deltas

This phase is complete when `/api/expenses` reads from SharePoint via Microsoft Graph (server-only) and the dashboard UX can select a month and optionally view net changes.

---

## Current State (project reality today)

- The Nuxt app is in `hr-dashboard/` (Nuxt `^4.2.2`) with a Nitro server layer under `hr-dashboard/server/api/`.
- Both Home pages (`/` and `/odoo`) render the same expense visuals and call:
  - `GET /api/expenses`
- `GET /api/expenses` currently reads from `global_expenses.csv` (either `hr-dashboard/data/global_expenses.csv` or repo-root `global_expenses.csv`) and:
  - detects a “latest month” by scanning the CSV and choosing the last month label found
  - aggregates by **country** and returns a snapshot `{ month, items[] }`

Relevant files:
- `hr-dashboard/server/api/expenses.get.ts`
- `hr-dashboard/server/utils/expenses.ts`
- `global_expenses.csv` (also used as “attachment” structure reference if SharePoint is inaccessible)

---

## SharePoint List (expected columns / structure)

Based on the local `global_expenses.csv`, the list likely contains (or can contain) these fields:

- Country
- Month (recommendation: store as a **Date** or **YYYY-MM**; see below)
- Salaries inclusive of PAYE
- Overtime
- VC
- Other allowances
- NIS (Company)

### Important note: Month must be unambiguous
The current CSV sample uses labels like `December` (no year). For a monthly list that grows over time, the SharePoint list should store month in a **year-aware** format, ideally one of:

- **Date column** (recommended): `MonthStart` = first day of month (e.g., `2026-01-01`)
- **Text column**: `MonthKey` = `YYYY-MM` (e.g., `2026-01`)

If the list only stores `December`, the app cannot correctly distinguish **December 2025 vs December 2026** for filtering and net changes.

---

## Web Research Summary (best-practice guidance)

- **Resolve SharePoint site by hostname + relative path** using Graph “get by path”:  
  `GET /sites/{hostname}:/{relative-path}`  
  Docs: `https://learn.microsoft.com/en-us/graph/api/site-getbypath?view=graph-rest-1.0`

- **Read list items and include column values** by expanding the `fields` facet:  
  `GET /sites/{site-id}/lists/{list-id}/items?expand=fields`  
  Docs (single item examples, same `expand=fields` concept): `https://learn.microsoft.com/en-us/graph/api/listitem-get?view=graph-rest-1.0&tabs=http`

- **Least privilege for SharePoint access**: prefer “Selected” scopes (site/list scoped access) instead of tenant-wide Sites.\*.  
  Selected scopes require: (1) Entra consent, (2) explicit resource permission assignment, (3) token with the Selected scope.  
  Docs: `https://learn.microsoft.com/en-us/graph/permissions-selected-overview`

---

## Recommended Architecture (matches this repo’s security pattern)

### Key decision
**Do not call Microsoft Graph from the browser.**  
Keep Graph access entirely server-side (Nitro) and store credentials in `.env` + `runtimeConfig`, similar to the Phase 8 Odoo integration.

### Auth approach
Use **application permissions (client credentials)** from Nitro:

- Pros: no user sign-in needed; consistent server-to-server reads
- Cons: requires admin consent + app secret management

### Permissions approach (least privilege)
Use one of:

- **Preferred**: `Lists.SelectedOperations.Selected` + grant access to the specific **list**
- **Simpler**: `Sites.Selected` + grant access to the specific **site**
- **Fallback** (broad): `Sites.Read.All` (works but is tenant-wide; avoid if possible)

For the “Selected” option, you must also explicitly grant the app a role on the target resource via Graph permissions APIs (documented in the Selected permissions overview).

---

## Implementation Steps (server + API + UI)

### 1) Identify the Site and List

From your SharePoint URL:
`https://rampslogistics.sharepoint.com/Lists/Global%20Expenses%20Draft/AllItems.aspx`

- **Hostname**: `rampslogistics.sharepoint.com`
- **Likely site**: tenant root site (common for `/Lists/...` URLs)  
  If it’s not root, it will be under a site path like `/sites/<SiteName>/Lists/...`.

**Discovery options (one-time setup):**

- **Site ID**
  - Root site: use `/sites/root`
  - Or use “get by path”:  
    `GET https://graph.microsoft.com/v1.0/sites/rampslogistics.sharepoint.com:/{relative-path}`

- **List ID**
  - List by name (recommended for discovery):  
    `GET /sites/{site-id}/lists` and find `displayName == "Global Expenses Draft"`
  - Store `siteId` and `listId` in environment variables to avoid repeated discovery at runtime.

### 2) Create Entra ID App Registration (Graph reader)

- Create an app registration for the HR Dashboard backend integration.
- Create a **client secret** (or use a certificate; secret is fine for MVP).
- Record:
  - Tenant (Directory) ID
  - Client ID
  - Client Secret

### 3) Configure Microsoft Graph Permissions

Recommended:
- Add **Application** permission: `Lists.SelectedOperations.Selected` (or `Sites.Selected`)
- Grant **Admin consent**.

Then grant the app access to the specific list/site (Selected permissions require explicit assignment):
- For list-level access, assign role `read` on the list via:
  - `POST /sites/{siteId}/lists/{listId}/permissions` (request body includes app id + roles)
  - See Selected permissions overview for the required steps and roles.

### 4) Add configuration to `hr-dashboard/.env` and `runtimeConfig`

Add server-only values (names are suggestions; align with your conventions):

- `GRAPH_TENANT_ID=...`
- `GRAPH_CLIENT_ID=...`
- `GRAPH_CLIENT_SECRET=...`
- `SP_HOSTNAME=rampslogistics.sharepoint.com`
- `SP_SITE_ID=...` *(optional but recommended)*
- `SP_LIST_ID=...` *(recommended)*

If you don’t want to store IDs, you can store:
- `SP_SITE_PATH=/` or `/sites/<SiteName>`
- `SP_LIST_NAME=Global Expenses Draft`

but IDs are more robust and faster at runtime.

### 5) Implement a minimal Graph client (Nitro)

Create a server utility (example file names):
- `hr-dashboard/server/utils/graph.ts`

Responsibilities:
- Acquire token using client credentials:
  - `POST https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token`
  - `grant_type=client_credentials`
  - `scope=https://graph.microsoft.com/.default`
- Cache the token in-memory until expiry.
- Provide a thin `graphFetch(path)` wrapper:
  - Base: `https://graph.microsoft.com/v1.0`
  - Adds `Authorization: Bearer <token>`
  - Handles non-2xx responses with a clean error message.

### 6) Load expenses from the SharePoint list

Create:
- `hr-dashboard/server/utils/sharepointExpenses.ts`

Use Graph list items endpoint and expand fields:

- `GET /sites/{site-id}/lists/{list-id}/items?expand=fields`
- Prefer selecting only required columns (when possible) to reduce payload size.
- Support pagination using `@odata.nextLink` until all items are loaded (list size is likely small, but implement pagination anyway).

Normalize to the existing `ExpensesSnapshot` shape used by the UI:

- Group by \(monthKey, country\)
- Sum numeric columns (in case the list has multiple rows per country/month)
- Sort countries by total descending (current behavior)

### 7) Add month filtering + net change calculation at the API layer

Update `GET /api/expenses` to support:

- **Default**: no query param → return latest month snapshot
- `?month=YYYY-MM` (or `?monthStart=YYYY-MM-01`) → return that month snapshot
- `?compareTo=YYYY-MM` (optional) → include deltas vs another month

Recommended response shape (minimal addition while preserving current UI compatibility):

- `month`: string | null (label for selected month)
- `items`: current month breakdown
- `availableMonths`: string[] (sorted newest → oldest, in `YYYY-MM` form)
- `previousMonth`: string | null (auto-detected previous month)
- `deltas`: optional array aligned by country, with per-field and total deltas

Net change logic:
- Pick baseline month:
  - If `compareTo` provided: use that
  - Else: use the immediately previous available month
- Build maps by country for current and baseline
- For each country in union set:
  - \(\Delta = current - baseline\) per field and total
- Missing country values default to 0.

### 8) Update the dashboard UX (keep visuals, add controls)

Both `app/pages/index.vue` and `app/pages/odoo/index.vue` should:

- Fetch available months (either from `/api/expenses` response or a lightweight `/api/expenses/months`)
- Add:
  - Month dropdown (default latest)
  - Optional toggle: “Show net changes”
  - Optional baseline selector (advanced; can be deferred)

Rendering:
- When net changes are enabled, display deltas alongside the existing amounts (either in `ExpenseCountryCard` or as an additional row/section).

---

## Operational Considerations

### Content approval edge case
Microsoft Graph notes that if a SharePoint list has **content approval** enabled, application access may require higher permissions to read non-approved items. If you see missing items, check list settings and permissions.

### Caching
Because the list updates monthly:
- Cache loaded list items / computed snapshots for a short TTL (e.g., 5–30 minutes) in the Nitro process.
- Provide a simple manual bypass for admins (optional) like `?noCache=1` (can be added later).

---

## Acceptance Criteria (Phase 9 complete)

- `/api/expenses` reads from the SharePoint list via Microsoft Graph (no CSV dependency required for production).
- Dashboard shows the **most recent month** by default.
- User can select a prior month and the breakdown updates.
- Net changes can be displayed comparing selected month vs previous month (or selected baseline), with correct deltas for all expense fields and totals.
- No Graph secrets leak to the client bundle (server-only runtime config).

---

## Demo / Test Plan

- Validate Graph connectivity from the server:
  - Token acquisition works
  - Site/list IDs resolve correctly (if using discovery)
  - Items load with `expand=fields`
- Verify month list:
  - Months are parsed consistently (`YYYY-MM`), newest first
  - Latest month selection matches the most recent uploaded month
- Verify math:
  - Per-country totals match sum of components
  - Net change deltas match \(current - baseline\)
- Verify UI:
  - Month dropdown changes the shown month
  - Net change toggle adds/removes delta display without breaking layout

---

## Implementation Notes (as-built)

### Data source

- Global expenses now load from the SharePoint list **Global Expenses Draft** via Microsoft Graph (server-side).
- The UI renders from `GET /api/expenses` (same endpoint as before), but the payload now includes month metadata and (optionally) deltas.

### Endpoints

- `GET /api/expenses`
  - **Default**: latest month from SharePoint.
  - **Query params**:
    - `month=YYYY-MM` → return that month.
    - `compareTo=YYYY-MM` → include `deltas` comparing current month vs `compareTo`.
  - **Response fields** (high-signal):
    - `month`, `monthKey`
    - `items[]`
    - `availableMonths[]`, `monthLabels{}`, `previousMonth`
    - `compareTo`, `deltas[]` (only when comparing)
    - `source`: `"sharepoint"` or `"csv"`
    - `warning` (only when SharePoint read fails and CSV fallback is used)

- `GET /api/expenses/fields` (dev/debug)
  - Returns one list item’s `fields` keys to help verify SharePoint internal column names.
  - Useful when SharePoint display column names differ from the Graph `fields` keys.

### Environment variables (server-only)

Configured in `hr-dashboard/.env` and consumed via `runtimeConfig`:

- Microsoft Graph (client credentials)
  - `GRAPH_TENANT_ID`
  - `GRAPH_CLIENT_ID`
  - `GRAPH_CLIENT_SECRET`

- SharePoint list targeting
  - `SP_HOSTNAME` (e.g. `rampslogistics.sharepoint.com`)
  - `SP_SITE_PATH` (defaults to `/` / root site)
  - `SP_LIST_ID` (GUID)
  - `SP_CACHE_TTL_MS` (production cache TTL)

### SharePoint column mapping (Graph `fields` keys)

The dashboard labels match the SharePoint list display columns, but the Graph API uses internal `fields` keys.
As currently implemented (verified via `GET /api/expenses/fields`):

- **Gross Salary** ← `Salaries_x0028_inclusiveofPAYE_x`
- **PAYE** ← `PAYE`
- **Overtime** ← `Overtime`
- **VC** ← `VC`
- **Health Surcharge** ← `OtherAllowances`
- **NIS (Company)** ← `NIS_x0028_Company_x0029_`
- **Total Outgoing Expenses** ← `Total`

Important: **Totals are not calculated by the app**. The visualization displays the list’s **Total Outgoing Expenses** value.

### Caching behavior

- **Dev**: SharePoint expenses cache is disabled (TTL \(= 0\)) so list edits reflect on reload.
- **Prod**: set `SP_CACHE_TTL_MS` to control how quickly list updates appear (default 10 minutes).

### Troubleshooting checklist

- `/api/expenses` returns `source: "sharepoint"` when the Graph call succeeds.
- If `/api/expenses` returns `source: "csv"` with a `warning`, Graph/permissions are failing and the API fell back to CSV.
- If a column shows `0` unexpectedly, verify the internal field key via `GET /api/expenses/fields` and update the mapping in `hr-dashboard/server/utils/sharepointExpenses.ts`.

---

## Addendum — Employee Compensation SharePoint List (as-built)

### Objective

Add a server-side Microsoft Graph integration to a second SharePoint list (**Job Letter Salary Info**) and render compensation fields on the Employee Profile pages.

### Endpoints

- `GET /api/compensation?name=<employee name>`
  - Looks up a single employee’s compensation by exact name match (case/whitespace normalized).
  - Returns `null` if no match or if SharePoint config is missing.

- `GET /api/compensation/fields` (dev/debug)
  - Returns a union of observed Graph `fields` keys (sampled from first 50 items).
  - Used to confirm internal field names.

- `GET /api/sharepoint/root-lists` (dev/debug)
  - Lists available lists on the root site to confirm list IDs / display names.

### Environment variables (server-only)

Configured in `hr-dashboard/.env` and consumed via `runtimeConfig.sharepointSalary`:

- `NUXT_SHAREPOINT_SITE_ID`
  - Note: in our tenant, the salary list is on the **root site**, so `root` is a valid site target.
- `NUXT_SHAREPOINT_SALARY_LIST_ID` (GUID)
- `NUXT_SHAREPOINT_SALARY_CACHE_TTL_MS`

### Field mapping (Graph `fields` keys)

As observed via `GET /api/compensation/fields`, the salary list uses:

- **Name** ← `Name`
- **Monthly Salary** ← `Salary`
- **Allowance** ← `Allowance`
- **Gross Salary** ← `GrossSalary`
- **Currency**: not present in observed `fields` keys at time of implementation (may require adding/populating the column).

### UI integration

- CSV employee profile: `hr-dashboard/app/pages/employees/[employeeKey].vue`
- Odoo employee profile: `hr-dashboard/app/pages/odoo/employees/[employeeKey].vue`

Both pages request compensation from `GET /api/compensation` and display a **Compensation** section (with the employee name omitted to avoid duplication in the profile header).

### Permissions (Selected scopes)

If using `Lists.SelectedOperations.Selected`, the app must be explicitly granted access to the salary list.
Graph Explorer (admin account) grant request:

- `POST https://graph.microsoft.com/v1.0/sites/root/lists/<NUXT_SHAREPOINT_SALARY_LIST_ID>/permissions`

Body:

```json
{
  "roles": ["read"],
  "grantedToIdentities": [
    {
      "application": {
        "id": "<GRAPH_CLIENT_ID>",
        "displayName": "HR Dashboard"
      }
    }
  ]
}
```