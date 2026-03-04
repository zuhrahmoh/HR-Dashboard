# Phase 14 Plan — Generate Complete Dashboard PDF Report

## Objective
Add a feature that generates a **single, professional PDF report** containing the dashboard pages.

- **Home**: `/odoo` (all visuals)
- **Recruitment & Onboarding**: `/recruitment`
- **Contract Management**: `/contracts`
- **Medical Enrollments & EAP**: `/medical-enrollments-eap`
- **Progressive Discipline**: `/disciplinary`

**Not included**:

- Employees listing: `/odoo/employees`
- Employee profile pages: `/odoo/employees/:employeeKey`

The feature must be accessible from a button at the bottom of the side navigation bar labelled **“Generate complete report”** and the PDF should paginate cleanly (no broken layout, no clipped content, minimal awkward splits).

---

## Current project structure (relevant)
- Nuxt app lives in `hr-dashboard/` (Nuxt 4 + Nitro, Tailwind).
- Sidebar/navigation is implemented directly in `hr-dashboard/app/layouts/default.vue`.
- The pages to include are Vue SFCs under `hr-dashboard/app/pages/`.
- The “Home” charts are rendered as **HTML/SVG** components (good for print/PDF capture).
- There is an existing employee PDF endpoint (`GET /api/odoo/employees/:employeeKey/pdf`) that builds a PDF via a custom layout utility. That approach is **not** suitable for “PDF of dashboard pages” because it does not render the actual dashboard HTML/layout.

---

## Recommended approach
Use **server-side, headless Chromium** to render the real dashboard pages and export them to PDF.

Why:
- Highest fidelity to “how everything is displayed on the dashboard”.
- Consistent pagination across browsers.
- Avoids client-side screenshot libraries (which often struggle with page breaks, long tables, fonts, and charts).

Implementation options:
- **Playwright (recommended)**: reliable, modern API for `page.pdf()`, good stability for automated rendering.
- **Puppeteer (also viable)**: similarly supports `page.pdf()`; widely used for report generation.

The plan below assumes **Playwright (Chromium-only) + pdf-lib** for merging.

---

## UX requirements
### Sidebar button
- Location: sidebar (`hr-dashboard/app/layouts/default.vue`), directly under the menu items (no scrolling required).
- Button:
  - **Generate complete report** → downloads PDF

---

## PDF requirements (format & pagination)
### Output formatting (professional)
- A4 (or Letter if preferred later) with consistent margins.
- Include **generated timestamp** in header or footer.
- Include **page numbers** in footer.
- Preserve dashboard styling (excluding the dark theme, keep default light background on page) and ensuring exact colors and appropriate outlining and dropshadows for visuals.

### Pagination rules (avoid ugly splits)
Use print CSS to help the browser paginate:
- Prevent splitting “cards/sections” where possible: `break-inside: avoid`.
- Avoid clipping caused by scroll containers:
  - remove/override `overflow-x-auto` / `overflow-hidden` for print mode so tables are not cut off.
- Use `printBackground: true` in PDF generation and add:
  - `-webkit-print-color-adjust: exact;`
  - `print-color-adjust: exact;`

Reference:
- Playwright: `page.pdf()` API (`https://playwright.dev/docs/api/class-page#page-pdf`)
- Puppeteer PDF notes (print media, color adjust): `https://pptr.dev/api/puppeteer.page.pdf`
- CSS pagination: `break-inside` (`https://developer.mozilla.org/en-US/docs/Web/CSS/break-inside`)

---

## Implementation plan

### A) Add a “report mode” for clean printing
Introduce a query flag used only for PDF generation:
- `?report=1`

In report mode:
- Disable UI that only makes sense interactively (optional), or keep it but ensure it doesn’t affect layout.
- Ensure long tables are printable (no horizontal clipping).
- Apply print-friendly CSS overrides only when `report=1` and/or in `@media print`.

Suggested implementation pattern:
- In `default.vue`, compute `const isReportMode = computed(() => route.query.report === '1')`
- Apply a `data-report="1"` attribute on a root wrapper when `isReportMode` is true.
- In CSS, scope overrides to `[data-report="1"]` and/or `@media print`.

Home visuals requirement (“display all home page visuals”):
- The Home page currently has toggles that switch between donut/trend views.
- To guarantee “all visuals” appear in the PDF, implement:
  - **Option 1 (recommended)**: add query params for Home render state, e.g. `?report=1&home=all` that forces both “overview” and “trend” charts to be rendered (stacked).
 

### B) Server endpoint that generates the PDF
Add a Nitro API route, e.g.:
- `GET /api/reports/complete`

Responsibilities:
- Launch headless Chromium.
- Render the required pages (with `?report=1`).
- Export each route to PDF (A4, background, header/footer).
- Merge the PDFs into one buffer.
- Return as `application/pdf` with `content-disposition: attachment`.

Recommended route list:
- `/odoo?report=1&home=all` (or `/odoo?report=1` plus a second variant)
- `/recruitment?report=1`
- `/contracts?report=1`
- `/medical-enrollments-eap?report=1`
- `/disciplinary?report=1`

Origin/base URL handling:
- In the API handler, derive the origin from the incoming request (so it works in dev and prod), then build absolute URLs for the headless browser to visit.

Waiting for “fully rendered”:
- Use `page.goto(url, { waitUntil: 'networkidle' })` (or equivalent) to reduce partially-rendered captures.
- Set an explicit viewport (e.g. 1440×900) so responsive layouts are stable.

PDF options (typical):
- `format: 'A4'`
- `printBackground: true`
- `margin: { top, right, bottom, left }`
- `displayHeaderFooter: true` with templates for:
  - Header: report title / section title
  - Footer: generated date + page number

Merging:
- Use `pdf-lib` to merge the per-route PDFs into a single PDF.

### C) Frontend wiring (download)
Update `hr-dashboard/app/layouts/default.vue`:
- Add a button at the bottom of the sidebar.
- On click, call `GET /api/reports/complete`.
- Download the binary response as a `.pdf`.

### D) Dependencies and deployment notes
Add dependencies (one of the following sets):

- **Playwright approach**
  - `playwright-chromium` (Chromium-only; smaller than full `playwright`)
  - `pdf-lib` (merge PDFs)

- **Puppeteer approach**
  - `puppeteer` (bundles Chromium) or `puppeteer-core` + a managed Chrome
  - `pdf-lib`

Deployment considerations (Railway, without a Dockerfile):
- **Chromium + OS libraries still need to exist at runtime**. Without a Dockerfile, you must add them via Railway’s build system configuration (Nixpacks/Railpack).
- **Browser download during build**: Playwright downloads Chromium. This can fail on some hosts due to network/DNS quirks; plan mitigations (below).
- **Fonts**: the app imports Inter from Google Fonts. If outbound internet is restricted or flaky, PDF typography may vary; consider bundling fonts later if needed for consistency.

Recommended Railway setup (no Dockerfile):
- Set the Railway service root directory to `hr-dashboard/`.
- Add `hr-dashboard/nixpacks.toml` to the repo (Railway will pick it up for build customization).
- Install OS packages required for Chromium (Playwright provides `--with-deps`, but on Railway it’s often more reliable to install deps via `aptPkgs`).
- Run a build step that installs Chromium via Playwright.

Included file:
- `hr-dashboard/nixpacks.toml`

### Railway deployment steps (recommended)
1. Create a new Railway project and add:
   - **Service A**: HR Dashboard app (this repo, root directory `hr-dashboard/`)
   - **Service B**: Railway managed Postgres
2. Configure Service A:
   - **Build command**: handled by Nixpacks (`hr-dashboard/nixpacks.toml`)
   - **Start command**:
     - `node .output/server/index.mjs`
3. Configure environment variables on Service A:
   - **Database**
     - `DATABASE_URL`
   - **Odoo**
     - `ODOO_URL`
     - `ODOO_USERNAME`
     - `ODOO_PASSWORD`
     - `ODOO_DB` (optional depending on your Odoo)
     - `ODOO_INSECURE_TLS` (`1`/`0`)
     - `ODOO_CACHE_TTL_MS` (optional)
   - **Microsoft Graph / SharePoint** (only if you use these pages/features)
     - `GRAPH_TENANT_ID`
     - `GRAPH_CLIENT_ID`
     - `GRAPH_CLIENT_SECRET`
     - `SP_HOSTNAME`
     - `SP_SITE_ID` or `SP_SITE_PATH`
     - `SP_LIST_ID`
     - `SP_CACHE_TTL_MS` (optional)
     - `NUXT_SHAREPOINT_SITE_ID`
     - `NUXT_SHAREPOINT_SALARY_LIST_ID`
     - `NUXT_SHAREPOINT_SALARY_CACHE_TTL_MS` (optional)
   - **Playwright build stability (recommended)**
     - `NODE_OPTIONS=--dns-result-order=ipv4first`
4. Deploy Service A.
5. Verify:
   - App loads normally.
   - `GET /api/reports/complete` downloads a PDF.

```toml
[phases.setup]
aptPkgs = [
  "...",
  "ca-certificates",
  "fonts-liberation",
  "libnss3",
  "libatk-bridge2.0-0",
  "libgtk-3-0",
  "libx11-xcb1",
  "libxcomposite1",
  "libxdamage1",
  "libxrandr2",
  "libgbm1",
  "libasound2",
  "libdrm2",
  "libxshmfence1"
]

[phases.build]
cmds = [
  "npm ci",
  "PLAYWRIGHT_BROWSERS_PATH=0 NODE_OPTIONS=--dns-result-order=ipv4first npx playwright install chromium",
  "npm run build"
]
```

Mitigations if Chromium download is unreliable on Railway:
- Prefer `playwright-chromium` (smaller) instead of full `playwright`.
- Force IPv4 DNS ordering (shown above).
- If builds still intermittently fail, the fallback is deploying the app with a Dockerfile based on the Playwright image (most reliable), but that is optional unless you hit these failures.

---

## Acceptance criteria
- A sidebar button exists under the menu items:
  - **Generate complete report** (PDF)
- Clicking it downloads a **single PDF** containing:
  - Home (`/odoo`) visuals
  - Recruitment, Contracts, Medical, Disciplinary pages
  - No Employees list/profile content
- PDF pagination is clean:
  - No content clipped due to scroll containers
  - Minimal awkward splits of cards/tables
  - Consistent margins and professional header/footer (timestamp + page numbers)
- Dashboard styling is preserved (colors included, but not dark background).

---

## Risks & mitigations
- **Long table clipping**: current UI uses `overflow-x-auto` wrappers.
  - Mitigation: print/report CSS overrides to remove overflow and allow tables to flow.
- **Runtime cost / latency**: headless rendering can be slow.
  - Mitigation: keep a single browser instance per request; consider caching the PDF for a short TTL later if needed.
- **Data-dependent failures** (Odoo/Graph unavailable) create “error boxes” in the rendered pages.
  - Mitigation: the PDF generator should still return a PDF; optionally add a cover note if any sections failed to load.



# REFACTORING PROMPT

Goal:
Improve ONLY the generated PDF export layout (not the normal dashboard UI). The current export is produced by Playwright rendering Nuxt pages with ?report=1 and calling page.pdf(A4 landscape) per route, then merging with pdf-lib. The PDF currently looks like a “dashboard screenshot” and feels dense: charts/tables are too large, lots of grey, and lacks executive-style summary blocks. See current generated report: hr-dashboard-complete-report-2026-02-25.pdf (dense dashboard capture) and target style inspiration: ELT HR Report_Sep-Oct 25.pdf (clean KPI tiles, donut, spacing, colored accents, short narrative summaries).

Tasks:

1) Create a dedicated report-only theme/layout activated by ?report=1.
   - Must not affect standard dashboard styles.
   - Implement by scoping CSS to something like:
     <body class="report-mode"> or <div data-report="1">
   - Ensure all report-only styles live in e.g. assets/css/report.css and only load/apply when route.query.report === '1'.

2) Add a report “cover + executive summary” page at the start of the exported PDF.
   - New route: /report/complete (or /report/summary) rendered only for export mode.
   - Contains:
     - Report title, month, generation timestamp
     - KPI tiles: total headcount, net change (additions-separations), # countries, key recruitment counts (critical vacancies), # active discipline cases
     - 3–6 bullet executive insights computed from existing API data (no LLM; deterministic rules).
   - Make it visually similar to the ELT report style: large KPI number cards, clear typography, accent color headers.

3) Improve readability on the existing exported pages (Home, Recruitment, Disciplinary) WITHOUT altering interactive pages:
   - In report-mode:
     - Reduce chart sizes ~15–25%
     - Reduce card padding slightly
     - Force 2-column grids where appropriate (avoid long vertical scroll)
     - Prevent tables from spanning too wide; wrap long notes; clamp to 2 lines with ellipsis and show full text only if needed (tooltips not useful in PDF)
     - Remove extra UI controls (filters, toggles) already hidden; also hide empty sections if “No data” to reduce clutter
     - Use subtle color accents for section headers + KPI tiles (not overly saturated)
     - Ensure consistent margins and alignment across pages

4) Make tables export-friendly:
   - For report-mode:
     - Disable virtualization/pagination; render “top N” rows (e.g., first 10–20) plus a “See dashboard for full list” note.
     - Apply print CSS:
       - table-layout: fixed;
       - word-break: break-word;
       - max-width constraints per column
     - Avoid internal scroll containers in PDF (no overflow: auto for report-mode).

5) Playwright/PDF settings upgrades:
   - Ensure fonts render crisp and consistent.
   - Wait for charts to finish rendering before pdf() is called:
     - use page.waitForFunction(...) checking a window flag set when charts mounted
     - or wait for specific selectors (e.g., [data-chart-ready="true"])
   - Use consistent headers/footers with the section title:
     - Left: “HR Dashboard — Complete Report”
     - Right: page number + section name
   - Maintain A4 landscape, printBackground true.

6) Update server/api/reports/complete.get.ts to export the new cover/summary page first, then Home, Recruitment, Disciplinary.
   - Keep pdf-lib merge.
   - Add per-route metadata for header/footer section name.

Implementation notes:
- Do NOT change normal dashboard look.
- All style/layout changes must be conditional on report-mode query param.
- Introduce report-only components if needed: <ReportKpiTile/>, <ReportSectionHeader/>, <ReportSummaryBullets/>.
- Use the existing data sources already used by the dashboard pages; the report summary page can call the same backend services and compute metrics, but ensure what is generated is always consistent with what is displayed on the dashboard.

Deliverables:
- report-mode CSS + mechanism to enable it
- new /report/summary page
- updated Playwright endpoint ordering + improved wait strategy
- refactors in the report-mode layouts of the 3 pages to scale visuals, improve spacing, make tables print-safe



Additional: A few concrete “rules-based” executive insights to implement

(These make the report feel like the ELT example with narrative interpretation like in HR Overview 1, without needing AI.)

Executive insight rules (deterministic):
- If net change (additions - separations) > 0: “Workforce grew by X net this month.”
- If additions == 0: “No new hires recorded for the month.”
- If separations == 0: “No separations recorded for the month.”
- Top country by headcount: “Largest hub remains {country} ({count}, {pct}%).”
- If critical vacancies > 0: “{n} critical vacancies tracked; top priority roles: {top 3}.”
- If discipline cases > 0: “{n} active disciplinary cases; most common stage: {stage}.”
- Expenses: “Highest spend country this month: {country} (${total}).”



## Implementation notes- “Refactoring prompt” changes

Added an executive cover/summary page
- New route: app/pages/report/summary.vue
- Uses the same endpoints as the dashboard (/api/odoo/analytics/home, /api/vacancies, /api/disciplinary, /api/expenses)
- Includes large KPI tiles + deterministic executive insights (rules-based, no AI)

Introduced report-only building blocks
app/components/ReportKpiTile.vue
app/components/ReportSectionHeader.vue
app/components/ReportSummaryBullets.vue

Upgraded Playwright export behavior
server/api/reports/complete.get.ts now exports in this order:
1) Executive Summary
2) Home
3) Recruitment
4) Disciplinary
Waits for a reliable readiness marker before printing:
await page.waitForSelector('[data-report-ready="1"]', …)
plus a small extra “settle” wait (2 animation frames) for charts/layout

Added data-report-ready="1" markers to exported pages
app/pages/odoo/index.vue
app/pages/recruitment.vue
app/pages/disciplinary.vue
(and the new summary page)

Cleaned report-mode Recruitment + Disciplinary output (executive-friendly)
Recruitment report-mode now excludes New Hires / Offboarding / Recent Separations (and removes leftover <hr> gaps)
Report-mode tables/notes improved:
Top-N limiting (vacancies + candidates + cases)
2-line clamp for long recruitment notes (PDF-friendly)

Removed “orphan” filter/label text in PDFs
Updated assets/css/tailwind.css to hide label:has(input/select/textarea) in report-mode, so you don’t get stray text like “Month / Currency / Stage” without the control.