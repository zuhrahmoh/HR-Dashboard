# Phase 12 Summary — Medical Enrollments & EAP + New Hire Onboarding Checklist

## Objective

Extend the HR Dashboard with:

- A new **Medical Enrollments and EAP** page containing two structured tables matching the provided designs.
- A per-employee **Onboarding Checklist** for **New Hires** on the Recruitment page (expandable mini to-do list with persistent check-offs).

This phase is complete when:

- The new page is accessible from the sidebar and supports CRUD for both tables via JSON-backed APIs.
- The Recruitment **New Hires** table has an **Onboarding Checklist** column with an expandable task list per employee.
- Checklist items can be checked/unchecked and persist in the browser, with completed items visually crossed off.

---

## Delivered

### A) New page: Medical Enrollments and EAP

- **Route**: `/medical-enrollments-eap`
- **Page file**: `hr-dashboard/app/pages/medical-enrollments-eap.vue`
- **Navigation**: sidebar entry added in `hr-dashboard/app/layouts/default.vue`

#### Medical Enrollments table

- **Component**: `hr-dashboard/app/components/MedicalEnrollmentsTable.vue`
- **Persistence**: JSON-backed CRUD via Nitro API (see endpoints below)
- **Stage labels**: stored/displayed without numeric prefixes (e.g. `10.1`) while remaining compatible with any previously saved numbered values.

#### EAP table

- **Component**: `hr-dashboard/app/components/EapReferralsTable.vue`
- **Reason categories** updated to:
  - Stress Management
  - Underperformance
  - Leadership Issues
  - Personal Struggles
- **Follow-up date columns** removed from the UI (and forms) to match the updated table structure.

---

### B) JSON-backed APIs + data stores (Medical + EAP)

#### Data files

- `hr-dashboard/data/medical-enrollments.json`
- `hr-dashboard/data/eap-referrals.json`

#### Medical Enrollments endpoints

- `GET /api/medical-enrollments`
- `POST /api/medical-enrollments`
- `PUT /api/medical-enrollments/:id`
- `DELETE /api/medical-enrollments/:id`

Files:

- `hr-dashboard/server/api/medical-enrollments.get.ts`
- `hr-dashboard/server/api/medical-enrollments.post.ts`
- `hr-dashboard/server/api/medical-enrollments/[id].put.ts`
- `hr-dashboard/server/api/medical-enrollments/[id].delete.ts`

#### EAP endpoints

- `GET /api/eap-referrals`
- `POST /api/eap-referrals`
- `PUT /api/eap-referrals/:id`
- `DELETE /api/eap-referrals/:id`

Files:

- `hr-dashboard/server/api/eap-referrals.get.ts`
- `hr-dashboard/server/api/eap-referrals.post.ts`
- `hr-dashboard/server/api/eap-referrals/[id].put.ts`
- `hr-dashboard/server/api/eap-referrals/[id].delete.ts`

---

### C) Date input UX improvements (calendar popout + typing)

To support both typing and a consistent calendar picker across browsers:

- Added `hr-dashboard/app/components/DateInput.vue`
  - Supports typing `YYYY-MM-DD`
  - Includes a calendar button with popout picker
  - Popout is teleported to `body` so it is not clipped by table scroll containers

Integrated into:

- Medical Enrollments date fields
- EAP date fields
- Other pages that already used `DateInput` (e.g. Offboarding form in Recruitment)

---

### D) Recruitment: New Hire Onboarding Checklist

On `hr-dashboard/app/pages/recruitment.vue`:

- Added an **Onboarding Checklist** column to the **New Hires** table.
- Each new hire row includes a **Checklist** button showing progress `done/total`.
- Clicking expands a mini checklist (to-do list) for that employee.
- Checking items:
  - Marks the checkbox as checked
  - Crosses off the item text
  - Persists in **browser localStorage** (per employee + start date)

Checklist items (from the provided screenshot):

- HR Orientation
- HSSEF Orientation
- Received Laptop, Mouse, Bag, Headset, etc
- Received Welcome Package inclusive of welcome note
- Walkaround the Office to meet various departments by HR rep
- Received Security Codes to the Office(s)
- Got access to LASER modules and was shown how to use it
- Addition to Company Phone Plan
- Was added to the Ramps WhatsApp Group for the country
- Was added to the other relevant Ramps What's App Groups
- Nectar Profile Created
- Add to the New Employee Teams Chat
- Was added to the Ramps Email Group for the country
- Checked my Email and Teams to make sure it works properly
- Completed Payroll Form
- Completed Employee Information Update Form
- Reviewed and signed HR Onboarding Policies
- Reviewed the HSSEQ policy

---

## Notes / Behavior

- **Checklist persistence**: stored locally in the browser (intentionally lightweight) and does not require backend changes.
- **Table consistency**: all new tables follow the existing dashboard pattern (Tailwind styling, bordered containers, horizontal overflow handling).

---

### E) Employee Profile PDF export (Odoo) formatting refactor

Improved the **Employee PDF download** on the Odoo employee page to produce a more formal, consistent, professional layout.

- **Endpoint**: `GET /api/odoo/employees/:employeeKey/pdf`
- **Title**: changed from `Employee Profile (Odoo)` to `Employee Profile`
- **Primary card**:
  - Removed initials rendering
  - Reworked layout to prevent any container overlap with the employee name/job title
  - Consolidated key info into a single, consistent shaded panel
- **Consistent containers**: added the shaded backdrop style to the other sections for a uniform look (Contact, Employment, Talent)
- **Blank values**: any empty/blank fields now render as an **em dash** (`—`) rather than leaving a visually empty value
- **Employee Type**: auto-capitalizes the first letter (e.g. `contract` → `Contract`)
- **Footer**: `Generated:` timestamp formatting stabilized and positioned so it does not overlap section content

Files:

- `hr-dashboard/server/utils/profilePdf.ts`
- `hr-dashboard/server/api/odoo/employees/[employeeKey]/pdf.get.ts`

---

### F) Analytics dashboard visualization sizing + headcount chart refinements

To keep the top dashboard row visually stable (no resizing/jumping) when switching between overview and expanded trend views:

- **Top-row cards fixed height**: set to `h-[20rem]` for the 3 KPI cards (Headcount / Separations / Additions).
  - `hr-dashboard/app/pages/index.vue`
  - `hr-dashboard/app/pages/odoo/index.vue`
- **Trend plots compacted to fit the fixed card height**:
  - Reduced plot height from `h-56` to `h-40`
  - Reduced vertical spacing (`mt-4` → `mt-2`)
  - `hr-dashboard/app/components/SeparationsYearLineChart.vue`
  - `hr-dashboard/app/components/AdditionsYearLineChart.vue`
- **Overview donut panels compacted** so they also fit within the fixed-height cards without overflow:
  - Smaller donut size (`h-40 w-40` → `h-36 w-36`) and tighter layout spacing
  - `hr-dashboard/app/components/SeparationsDonut.vue`
  - `hr-dashboard/app/components/AdditionsDonut.vue`
- **Headcount bar chart UI**:
  - Bars rendered as **thin horizontal** tracks
  - Uses the **branch abbreviations** (`TT, GUY, HOU, SUR, EDO GUY, EDO TT, MEX, COL`)
  - Rows are vertically distributed to reduce awkward bottom whitespace
  - Removed the extra dark inner container backdrop so it sits cleanly on the card background
  - `hr-dashboard/app/components/HeadcountBarChart.vue`
- **Headcount chart spacing**: added a small top offset below the heading/description for readability.
  - `hr-dashboard/app/pages/index.vue`
  - `hr-dashboard/app/pages/odoo/index.vue`

---

### G) Country/branch classification (8 fixed branches) + analytics alignment

Employees are now classified into **exactly 8 branch categories** (no extras) by parsing the Odoo **Company** and **Work Address** fields:

- Trinidad and Tobago
- Guyana
- Houston
- Suriname
- El Dorado Offshore GY
- El Dorado Offshore TT
- Mexico
- Colombia

#### Branch classification logic

- Added a dedicated classifier that normalizes strings (including diacritics via Unicode `NFKD`) and applies keyword/token matching so values like `México`, dash variants, and inconsistent capitalization still classify correctly.
- **Source fields**: company name + work address, with a country fallback as a last resort.

Files:

- `hr-dashboard/server/utils/branchClassification.ts`

#### Odoo employee ingestion changes

- Odoo ingestion now reads `company_id` and work address-related fields and uses the branch classifier to set `employee.countryAssigned` to one of the 8 fixed categories.
- Stored additional fields on the employee model:
  - `companyName`
  - `workAddress` (used for classification, but intentionally not displayed in the UI)

Files:

- `hr-dashboard/server/utils/odooEmployees.ts`
- `hr-dashboard/server/utils/employees.ts` (type updated)

#### Employee UI + filters updated to use branch categories

- Employee profile now shows **Company** and the classified **Country** (branch category).
- The Odoo Employees list country filter is constrained to the 8 branch categories and displayed in the fixed branch order.
- Work address is **excluded from the UI** (kept in the model for parsing/classification only).

Files:

- `hr-dashboard/app/pages/odoo/employees/[employeeKey].vue`
- `hr-dashboard/app/pages/odoo/employees/index.vue`

#### Analytics API: always return all 8 branches (ordered)

- Odoo analytics now always returns data points for all 8 branches in the defined order:
  - `headcountByCountry`
  - `genderBreakdown.byCountry`
  - `avgAgeByCountryGender`
- Missing data is represented as:
  - `0` for counts
  - `null` for average ages (rendered as `—` in the UI)
  - Ensures branches like **Colombia** appear even when there isn't enough age data yet.

File:

- `hr-dashboard/server/api/odoo/analytics/home.get.ts`

#### Visualization labels (abbreviations)

- Charts use the branch abbreviations for readability:
  - `TT, GUY, HOU, SUR, EDO GUY, EDO TT, MEX, COL`

Files:

- `hr-dashboard/app/components/HeadcountBarChart.vue`
- `hr-dashboard/app/components/AverageAgeGroupedBarChart.vue`

---

### H) Odoo duplicate-profile suppression (scalable de-duplication)

To prevent duplicate employee profiles in Odoo (active or archived) from inflating **headcount**, **employee listings**, or **separation-related analytics**, de-duplication is now applied **server-side at ingestion time**.

#### What this fixes

- **Employees (Odoo) list** only shows one canonical profile per person (the “main” profile).
- **Headcount** is calculated from canonical profiles only.
- **Separations** (archived profiles) are not over-counted when archived duplicates exist — only the canonical profile is counted.
- The mechanism is intended to remain effective when switching to other Odoo instances that may also contain duplicates.

#### Matching / grouping rules (conservative)

Profiles are grouped as duplicates when any of the following match:

- **Exact normalized name** match (case/whitespace/punctuation-insensitive).
- **Email match** (work or personal email).
- **Conservative near-duplicate name variants** (e.g., a trailing typo character like `RAMPERSADQ` or a trailing single-letter token) **only when**:
  - the “base” name exists as a full record, and
  - the variant is relatively sparse compared to the base (to reduce false positives).

#### Canonical “main profile” selection

Within each duplicate group, the canonical record is selected as the one with the **highest populated-field score** (i.e., the most complete profile). If there is a tie, **Active** status is used as a tie-breaker, then the higher Odoo ID.

#### Implementation location

De-duplication is applied inside `loadEmployeesFromOdoo`, before caching/returning employees, so all downstream endpoints inherit the behavior automatically.

Files:

- `hr-dashboard/server/utils/dedupeOdooEmployees.ts` (new)
- `hr-dashboard/server/utils/odooEmployees.ts` (applies de-duplication before caching/returning)

---

### I) Global Expense Breakdown — currency filter + formatting/overflow fixes

Added a currency selector to the **Global Expense Breakdown** section so SharePoint expenses (stored in USD) can be viewed in other currencies via client-side conversion.

#### Currency filter (Dashboard + Odoo Dashboard)

- Added a **Currency** dropdown with:
  - `USD, TTD, GYD, SRD, MXN, COP`
- Conversion uses the provided standard rates (USD base) and is applied to:
  - Country totals
  - All detailed line items (Gross Salary, PAYE, Overtime, VC, Health Surcharge, NIS)
  - Net-change deltas (when “Show net changes” is enabled)

Files:

- `hr-dashboard/app/pages/index.vue`
- `hr-dashboard/app/pages/odoo/index.vue`
- `hr-dashboard/app/components/ExpenseCountryCard.vue` (receives `currency` prop for consistent formatting)

#### Consistent currency label (USD included)

- Updated formatting so **USD also shows its code** (e.g. `USD 1,234.00`) to match how non-USD currencies display.

#### Large-value overflow prevention (e.g. GYD)

When higher-magnitude currencies are selected, values can become wide. To prevent clipping:

- Reduced the value font sizing within the expense cards.
- Adjusted the breakdown grid so the value column can shrink/wrap safely (avoids `max-content` forcing overflow).
- Added a normalization step in formatting:
  - If the fully formatted currency string is “too long”, the UI falls back to a **compact currency format** (e.g. `GYD 1.2M`) so values remain visible.

