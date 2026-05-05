PHASE 1

# 🧩 Recruitment page — Add KPI Section to Recruitment & Onboarding Page

## 🎯 Objective
Add a compact KPI card row to the top of the Recruitment & Onboarding page to provide a high-level operational summary for HR users.

This page is a workflow tracker, not a dashboard. The KPI cards should help users quickly understand workload and priorities before interacting with the detailed tables below.

## 🧠 Context (CRITICAL)
This page is used by HR to manage:
- vacancies
- candidate pipeline
- onboarding
- offboarding
- check-ins

The KPI cards should:
- show simple counts only
- highlight what needs attention
- NOT include charts or complex visuals
- feel compact and professional, not oversized or dashboard-heavy

## 📍 Placement
Insert the KPI section:
- Directly below the page title + subtitle
- Above the sticky "JUMP TO" navigation bar

Layout order:
Page Title  
Subtitle  

[KPI CARDS ROW]  

Sticky Jump Navigation  

Critical Vacancies  
Recruitment & Onboarding  
New Hires  
Offboarding  
Upcoming Check-ins  
Recent Separations  

## 🧱 KPI Cards (4 TOTAL — DO NOT ADD MORE)
Create exactly 4 KPI cards:
1. Critical Vacancies
2. Candidates in Recruitment Pipeline
3. New Hires
4. Check-ins Due

## 📊 Data Logic
Use existing page data:
- Critical Vacancies → count of vacancy cards in "Critical Vacancies" section
- Candidates in Recruitment Pipeline → total candidates currently in recruitment stages (exclude rejected/hired if applicable)
- New Hires → count filtered by selected month (same logic as New Hires table)
- Check-ins Due → count of onboarding check-ins due within next 14 days

## 🎨 UI / Design Requirements

### Grid Layout
- Use: grid grid-cols-4
- Gap: gap-4 or gap-5
- Responsive:
  - Tablet: grid-cols-2
  - Mobile: grid-cols-1

### Card Styling
- Background: white
- Border: subtle (border border-gray-200)
- Border radius: rounded-xl
- Padding: p-4 or p-5 (NOT large padding)
- No heavy shadows (very subtle only if used)
- All cards must be equal height

### Typography

Label (Title):
- Uppercase
- text-xs
- font-medium
- tracking-wide
- text-gray-500

Value (Main Number):
- text-2xl
- font-semibold
- text-gray-900

Subtext (Context Line):
- text-sm
- text-gray-500

## 🧾 Card Content Format

Each card should follow:

LABEL (UPPERCASE)  
NUMBER  
CONTEXT LINE  

## 🧾 Example Content

Critical Vacancies  
CRITICAL VACANCIES  
8  
Open roles  

Candidates in Recruitment Pipeline  
CANDIDATES IN RECRUITMENT PIPELINE  
14  
Active candidates  

New Hires  
NEW HIRES  
2  
This month  

Check-ins Due  
CHECK-INS DUE  
6  
Next 14 days  

## ⚠️ Constraints (VERY IMPORTANT)

DO NOT:
- Add charts or graphs
- Use oversized dashboard-style KPI cards
- Add icons unless already consistently used
- Add dropdowns or interactivity inside KPI cards
- Modify existing sections or tables

DO:
- Keep the design compact and clean
- Align spacing with the rest of the page
- Match container width and padding
- Prioritize readability and fast scanning

## 🧩 Integration Notes
- Ensure KPI row aligns with page container width
- Maintain consistent spacing between KPI row and sticky nav
- Do not disrupt existing filters or section structure

## ✅ Expected Outcome
A clean, compact KPI strip that:
- gives instant overview of recruitment workload
- improves usability without clutter
- aligns with dashboard design language
- preserves the page’s role as a workflow tracker

________________________________________________________________________________________________________________________


PHASE 2 

# Cursor / Claude Code Prompt — Rebuild HR Dashboard Complete Report PDF

## Objective

Rework the generated **HR Dashboard Complete Report PDF** so it no longer feels like a dashboard screenshot/export. It should feel like a polished, official **HR Workforce & Operations Report**, similar in quality and professionalism to the enhanced Employee Profile PDF template already implemented.

This report is generated with **Playwright**, so the solution should use a dedicated print/report template rather than printing the live dashboard UI directly.

---

## Core Principle

The PDF should be a **document-first technical HR report**, not a web UI export.

Use:
- clean report sections
- official document styling
- compact spacing
- tables and structured summaries
- page headers/footers
- clear hierarchy
- print-safe CSS

Avoid:
- app navigation
- buttons
- dropdowns
- sticky nav
- dashboard cards copied directly
- UI controls
- loading states
- interactive widgets
- raw dashboard screenshots

---

## Existing Context

The current complete report PDF includes rough sections such as:
- workforce overview
- expenses
- separations
- recruitment
- critical vacancies
- disciplinary

The formatting is currently too loose and does not match the polished employee profile PDF.

The new report should use the latest dashboard structure and include only the required report content.

---

# Required Report Content

## From Home / HR Dashboard

Only include:

1. KPI summary cards/data
2. Geographical Distribution
3. Cost Overview

Do **not** include:
- headcount over time chart
- employee additions over time chart
- employee separations over time chart
- gender breakdown
- average age by country
- any other home dashboard visuals not listed above

---

## From Recruitment & Onboarding

Include:
1. Critical vacancies grouped by country
2. Candidates in recruitment pipeline
3. New hires
4. Offboarding / separations where relevant
5. Recent separations

Do **not** include:
- Upcoming Onboarding Check-ins

Important:
- Vacancies must be grouped by country.
- Do not render vacancy cards as UI cards in the PDF.
- Convert them into compact grouped report sections or tables.

---

## From Contract Management

Include:
1. Contract changes / approvals
2. Expired contracts
3. Past probation dates
4. Pending actions

Important:
- Expired contracts should be displayed together.
- Past probations should be displayed together.
- Pending actions should be displayed separately.
- Do not mix expired contracts and past probations into one unclear table unless there is a clear type column and the section is explicitly “Pending Actions.”
- Prefer separate subsections for clarity.

Suggested structure:
- Contract Changes
- Expired Contracts
- Past Probations
- Pending Actions

---

## From Progressive Discipline

Include:
1. Short process/policy summary
2. Only the cases selected by the user for inclusion in the report

Important:
- The user selects which cases are included in the report using the existing “Include in Report” logic.
- Only include selected cases.
- Do not include unchecked cases.
- Do not include the checkbox column in the PDF.
- Do not include UI controls.

---

# Recommended Report Structure

## Page 1 — Cover Page

Create a clean cover page.

Content:
- Ramps Logistics logo
- Report title: `HR Workforce & Operations Report`
- Subtitle: `Dashboard-generated HR report`
- Generated date/time
- Reporting month/period where available
- Data source note:
  `Data sourced from Odoo/Laser HR dashboard modules and dashboard-managed records.`
- Optional confidentiality note:
  `Confidential — For internal HR and management use only.`

The cover page should feel official and polished.

---

## Page 2 — Executive Summary

This page should summarize the most important counts and operational signals.

### Section: Workforce KPI Summary

Include flattened KPI blocks, not dashboard cards.

Required KPIs:
- Headcount
- Net Change
- Employee Additions
- Employee Separations

Recommended layout:
- 4 compact metric blocks in a row or 2x2 grid depending on print width

Example:

HEADCOUNT  
295  
RAMPS 263 | EDO 32  
Consultants 0 | Independent contractors 0

NET CHANGE  
+1  
Current month: Apr 2026

EMPLOYEE ADDITIONS  
2  
Current month: Apr 2026

EMPLOYEE SEPARATIONS  
1  
Current month: Apr 2026

### Section: Report Highlights

Add a short generated/templated bullet list.

Examples:
- Workforce is concentrated in Trinidad & Tobago.
- Net workforce movement for the month is positive/negative/neutral.
- Highest payroll/workforce cost country is Trinidad & Tobago.
- Pending contract/probation actions require follow-up.
- Selected disciplinary cases are included later in this report.

Keep this section short: 4–6 bullets maximum.

---

## Section 1 — Workforce Snapshot

Include:
- KPI summary reference if not already on executive summary
- Geographical Distribution

### Geographical Distribution

Use a print-friendly format.

Preferred:
- horizontal bar-style table if already easy to render
- or a clean table if charts are difficult in Playwright

Recommended table columns:
- Country
- Headcount
- % of Total
- Permanent
- Contracted
- Interns

If the stacked breakdown is available, include it in the table. If not, include country and headcount only.

Do not include interactive legends or hover-only details.

---

## Section 2 — Cost Overview

Include country cost overview from the dashboard.

Format:
- Group by country
- Sort by total outgoing spend descending
- Use compact country cost blocks or tables

For each country include:
- Country
- Month
- Total outgoing
- Breakdown rows:
  - Gross Salary
  - Overtime
  - VC
  - NIS (Company)
  - Medical Plan / Other categories where applicable

Recommended table format:

Country: Trinidad & Tobago  
Month: February 2026  
Total Outgoing: USD 512,035.00

| Category | Percent | Amount |
|---|---:|---:|
| Gross Salary | 86% | USD 440,129.42 |
| Overtime | 7% | USD 33,517.70 |
| VC | <1% | USD 4,728.26 |
| NIS (Company) | 7% | USD 33,659.62 |

For smaller countries with no breakdown, use compact rows:
| Country | Month | Total Outgoing |

Do not include dashboard controls like:
- month dropdown
- currency dropdown
- show net changes checkbox

Only show selected/current report period values.

---

## Section 3 — Recruitment & Onboarding

Do not include onboarding check-ins.

### 3.1 Critical Vacancies

Vacancies must be grouped by country.

Preferred format:

Trinidad & Tobago  
| Role | Department | Priority |
|---|---|---|
| Legal Officer | Risk & Compliance | Medium |
| Marketing Strategist | Business Development | Medium |

USA  
| Role | Department | Priority |
|---|---|---|
| Warehouse Coordinator | Customer Experience | Medium |

If a country has no vacancies, omit it.

At the top of the subsection, include summary:
- Total vacancies
- High priority count if available
- Medium/low priority count if available

### 3.2 Candidates in Recruitment Pipeline

Include candidates currently in the recruitment pipeline.

Table columns:
- Candidate
- Position
- Country
- Stage
- Notes

If none:
`No candidates in recruitment pipeline.`

### 3.3 New Hires

Table columns:
- Name
- Position
- Country
- Start Date
- Tenure

Group by country if there are enough records; otherwise one table is fine.

### 3.4 Offboarding

Table columns:
- Name
- Country
- Departure Reason
- Status
- Last Working Day

Do not include checklist dropdowns.

### 3.5 Recent Separations

Table columns:
- Name
- Department
- Position
- Country
- Start Date
- Separation Date
- Type

If none:
`No recent separations for the selected month.`

---

## Section 4 — Contract Management

This section should be structured for action and risk clarity.

### 4.1 Contract Changes

Include contract changes / approval-required records.

Table columns:
- Employee
- Country
- Department
- Position
- Change Type
- Status
- Description

If none:
`No contract changes awaiting review.`

### 4.2 Expired Contracts

Display expired contracts together.

Definition:
- Contract end date is before today/current report date
- Contract expiry action is not completed/actioned, if that status exists

Table columns:
- Employee
- Department
- Position
- Reporting To
- End Date
- Status
- Time Overdue

Group by country if there are many records; otherwise a single table is acceptable.

### 4.3 Past Probations

Display past probation dates together.

Definition:
- Probation end date is before today/current report date
- Probation action is not completed/actioned, if that status exists

Table columns:
- Employee
- Department
- Position
- Reporting To
- Probation End Date
- Status
- Time Overdue

Group by country if there are many records; otherwise a single table is acceptable.

### 4.4 Pending Actions

Display pending actions separately.

This should include a summary of all unresolved overdue items:
- overdue contracts
- overdue probations

Recommended summary:
- Total pending actions
- Number of contract items
- Number of probation items

Then table:

| Type | Employee | Country | Department | End Date | Status | Time Overdue |
|---|---|---|---|---|---|---|

Type values:
- Contract
- Probation

Important:
- Do not blur expired contracts and past probation dates without clear labeling.
- If both expired contracts and past probations exist, keep them understandable.

---

## Section 5 — Progressive Discipline

Include only selected cases.

### 5.1 Process Summary

Short version only:

Progressive discipline follows a 3-stage process:
1. Investigation and matter acknowledgement
2. Disciplinary review and recommendation
3. Final outcome and resolution

Do not include the full long UI instructional text unless required.

### 5.2 Selected Cases

Only include cases where `includeInReport === true` or equivalent.

Table columns:
- Employee
- Country
- Summary
- Status
- Created Date

Do not include:
- checkbox column
- “Include in report” UI text
- unselected cases

If no cases selected:
`No progressive discipline cases were selected for inclusion in this report.`

---

# Layout and Visual Design Requirements

The report should visually match the quality of the enhanced Employee Profile PDF.

Use:
- A4 portrait
- official document styling
- white background
- dark navy / charcoal text
- muted gray labels
- thin section dividers
- compact tables
- minimal borders
- consistent spacing
- professional typography

Avoid:
- dashboard gradients copied directly from the web UI
- app nav
- buttons
- dropdowns
- colored UI card shadows
- large rounded dashboard cards
- excessive whitespace
- anything interactive

It is okay to use subtle accent color:
- Ramps navy
- soft magenta/purple accent line
- light gray table headers

But keep it print-friendly.

---

# Header / Footer Requirements

Every report page after the cover should include:

Header:
- Ramps Logistics logo or wordmark
- Report title: `HR Workforce & Operations Report`
- Section title if helpful

Footer:
- Generated timestamp
- Page number
- Confidential/internal note

Example footer:
`Generated: 28 Apr 2026, 14:02 UTC | Confidential | Page 3 of 12`

---

# Pagination Rules

Use CSS page-break controls for Playwright.

Major sections should start on new pages where practical:
- Executive Summary
- Workforce Snapshot
- Cost Overview
- Recruitment & Onboarding
- Contract Management
- Progressive Discipline

Use:
- `break-before: page`
- `break-inside: avoid`
- `page-break-inside: avoid`

Avoid splitting:
- section headers from their first table
- table headers from table rows
- small summary blocks
- country groups

For long tables:
- allow table rows to continue across pages
- repeat table headers if feasible
- keep row styling simple and print-safe

---

# Print CSS Requirements

Add or update print-specific CSS.

Recommended:

```css
@page {
  size: A4;
  margin: 18mm 16mm;
}

body {
  background: #fff;
  color: #0b1b3a;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11px;
  line-height: 1.35;
}

.report-page {
  page-break-after: always;
}

.section {
  break-inside: avoid;
  margin-bottom: 18px;
}

.section-break {
  break-before: page;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10.5px;
}

thead {
  display: table-header-group;
}

tr {
  break-inside: avoid;
}

th {
  background: #f3f6fa;
  color: #0b1b3a;
  font-weight: 700;
  text-align: left;
  padding: 7px 8px;
  border-bottom: 1px solid #cbd5e1;
}

td {
  padding: 7px 8px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.metric-block {
  border: 1px solid #dbe3ef;
  border-left: 3px solid #1f3f8f;
  padding: 10px;
  break-inside: avoid;
}

.metric-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: #64748b;
  font-weight: 700;
}

.metric-value {
  font-size: 22px;
  font-weight: 700;
  margin-top: 4px;
}

.metric-note {
  color: #64748b;
  margin-top: 3px;
}

```
_______________________________________________________________________________________________________________________


PHASE 3 

Cursor Prompt — Polish HR Workforce & Operations Report PDF

Objective

Refine the existing Playwright-generated HR Workforce & Operations Report PDF so it feels like a polished, official HR report, not a dashboard export.

Keep the current structure and logic, but improve:
- layout consistency
- data aggregation accuracy
- visual hierarchy
- report-style formatting
- pagination quality
- table readability
- section summaries

Do not rebuild from scratch. This is a refinement pass on the existing report template.

Keep Existing Report Structure

Maintain this exact section order:

1. Cover Page
2. Executive Summary
3. Workforce Snapshot
4. Cost Overview
5. Recruitment & Onboarding
6. Contract Management
7. Progressive Discipline

Keep:
- existing Playwright rendering approach
- existing report route/template
- existing data sources
- current section grouping logic where it is already correct
- selected Progressive Discipline case logic
- Recruitment vacancies grouped by country
- Contract Management split into Contract Changes, Expired Contracts, Past Probations, and Pending Actions

Do not include:
- web app navigation
- dashboard buttons
- dropdowns
- sticky nav
- live UI controls
- home dashboard line charts
- workforce movement charts
- gender breakdown
- average age chart
- upcoming onboarding check-ins

Home dashboard content allowed in report:
- KPI summary
- Geographical Distribution
- Cost Overview

1. Executive Summary — KPI Grid Fix

Problem:
The Executive Summary KPI area currently feels like raw stacked blocks or dashboard UI cards.

Required fix:
Convert the KPI area into a clean report-style metric grid.

Metrics to include:
- Headcount
- Net Change
- Employee Additions
- Employee Separations

Preferred layout:
- 4-column grid across the page
- If print width is tight, use a 2x2 grid
- All blocks equal height
- All labels, values, and context lines aligned consistently

Each metric block should contain:
- small uppercase label
- strong value
- compact supporting context line

Example content:
HEADCOUNT
296
RAMPS 264 | EDO 32

NET CHANGE
+1
April 2026

EMPLOYEE ADDITIONS
3
April 2026

EMPLOYEE SEPARATIONS
2
April 2026

Styling:
- thin border
- compact padding
- no heavy shadow
- no large rounded dashboard cards
- no oversized padding
- no gradients
- no uneven stacking
- report-document feel

2. Fix Total Global Spend Aggregation

Problem:
Cost Overview currently shows TOTAL GLOBAL SPEND as USD 0 even though country totals exist.

Required fix:
Calculate Total Global Spend as the sum of all valid country Total Outgoing amounts for the selected reporting period.

Include country totals such as:
- Trinidad & Tobago
- Guyana
- Suriname
- Mexico
- Colombia
- USA if present, even if zero

Ignore:
- null
- undefined
- NaN
- invalid currency strings that cannot be parsed

Expected:
Total Global Spend should equal the sum of the displayed country totals, not 0.

Formatting:
- Use the selected report currency
- Format with thousands separators
- Example: USD 637,XXX

Also verify:
- “Across X countries” reflects the number of countries included in the cost dataset
- Highest Spend Country is still calculated correctly
- Highest Spend Country should not be affected by countries with missing or zero totals unless zero is genuinely the highest due to all others being zero

3. Cost Overview — Make It Report-Style

Problem:
The Cost Overview still feels like dashboard cards stacked into the PDF.

Required fix:
Flatten the Cost Overview into report-style tables.

Preferred approach:
Use a unified grouped table, or simple country subsections without dashboard card styling.

Option A — Preferred unified table:
Columns:
- Country
- Category
- Percent
- Amount

Example:
Country: Trinidad & Tobago
Category: Gross Salary
Percent: 86%
Amount: USD 440,129

Then Overtime, VC, NIS, Total Outgoing, etc.

Option B — Acceptable grouped country tables:
For each country:
- Country heading
- Period/month
- compact table underneath

Example:
Trinidad & Tobago — 2026-02

Category | Percent | Amount
Gross Salary | 86% | USD 440,129
Overtime | 7% | USD 33,518
VC | <1% | USD 4,728
NIS (Company) | 7% | USD 33,660
Total Outgoing | 100% | USD 512,035

Styling:
- remove dashboard-card feel
- no shadow containers
- no large rounded cards
- compact table rows
- thin dividers
- light gray table headers
- bold Total Outgoing rows
- countries sorted by Total Outgoing descending

Do not include:
- month dropdown
- currency dropdown
- show net changes checkbox
- bars copied from UI
- interactive controls

4. Add Contract Risk Summary

Problem:
Contract Management is structurally correct but too dense. It jumps into detailed tables without giving management a quick risk summary.

Required fix:
Add a Contract Risk Summary near the start of the Contract Management section, before detailed contract tables.

Section title:
CONTRACT RISK SUMMARY

Include:
- Total Pending Actions
- Expired Contracts
- Past Probations
- Contract Changes Awaiting Approval
- Top Risk Countries if derivable

Example:
Total Pending Actions: 24
Expired Contracts: 13
Past Probations: 11
Contract Changes Awaiting Approval: 2

Top Risk Countries:
- Trinidad & Tobago: 10 pending items
- Guyana: 6 pending items
- Suriname: 6 pending items

Definition:
Pending Actions = overdue unresolved contract items + overdue unresolved probation items.

Top Risk Countries:
Aggregate by country across expired contracts and past probations.

Styling:
- compact report summary
- small metric grid or simple summary table
- not dashboard KPI cards
- no large colored cards
- no heavy visual styling

Purpose:
Give the reader immediate contract risk context before long tables.

5. Pending Actions Section Refinement

Keep the Pending Actions section.

Keep:
- Total Pending
- Contract Items
- Probation Items
- Combined table with Type column

Improve:
- Make the summary more report-like
- Reduce UI-like badge styling
- Keep Type as plain text or very subtle label
- Make Time Overdue bold and optionally muted red
- Do not make every type label look like a web app pill

Pending Actions table columns:
- Type
- Employee
- Country
- Department
- End Date
- Time Overdue

Type values:
- Contract
- Probation

Styling:
- Type can be plain text or subtle outlined label
- Time Overdue can be bold red text
- avoid heavy colored badges
- avoid dashboard pill styling

6. Reduce UI-Like Styling Globally

Problem:
Some parts of the report still feel copied from the dashboard UI.

Required fix:
Move the entire PDF toward official document styling.

Reduce or remove:
- large rounded cards
- drop shadows
- gradient backgrounds
- button-like elements
- bright UI chips
- heavy badges
- excessive colored backgrounds
- dashboard-style containers

Use instead:
- white background
- dark navy / charcoal text
- muted gray labels
- thin dividers
- compact spacing
- simple section headings
- light gray table headers
- subtle accent line for major section titles
- minimal accent color

Accent color guidance:
- Navy for structure
- Muted magenta/purple only as a subtle section accent
- Red only for overdue/pending risk
- Blue/purple labels only where type distinction is needed

7. Header and Footer Simplification

Problem:
Headers and footers are correct but a little heavy and system-generated.

Required fix:
Make header/footer smaller and more minimal.

Header:
- report title on left
- current section name on right
- small text
- no heavy section title duplication

Footer:
Use one line:
Generated: [timestamp] | Confidential — Internal use only | Page X of Y

Do not:
- use large repeating headers
- let footer consume too much vertical space
- let header/footer compete with report content

8. Add Insight Layer to Key Sections

Problem:
The report is mostly data tables. It needs light interpretation so it feels like a report, not a data dump.

Required fix:
Add short factual insight bullets to key sections where data is already available.

Executive Summary:
Keep report highlights, refine if needed.

Workforce Snapshot:
Add 2–3 factual bullets, such as:
- Trinidad & Tobago accounts for 64% of total headcount.
- Permanent employees represent 82% of the workforce.
- RAMPS accounts for 264 employees; EDO accounts for 32.

Cost Overview:
Add 1–2 factual bullets, such as:
- Trinidad & Tobago has the highest workforce cost for the reporting period.
- Gross salary is the largest cost category across major countries.

Contract Management:
Add 2–3 factual bullets, such as:
- Total pending contract/probation actions: 24.
- Expired contracts account for 13 pending items.
- Past probations account for 11 pending items.
- Top risk country: [country], if derivable.

Rules:
- factual only
- no unsupported assumptions
- no generic filler
- keep bullets short

9. Recruitment Section Improvements

Keep:
- Critical vacancies grouped by country
- Candidates in Recruitment Pipeline
- New Hires
- Offboarding
- Recent Separations

Do not include:
- Upcoming Onboarding Check-ins

Improve pagination:
- Do not force Candidates in Recruitment Pipeline onto its own mostly-empty page if it is empty
- If empty, show a short inline empty state and allow the next subsection to follow on the same page
- Combine small subsections where they fit
- Avoid pages with only one empty message

Recruitment formatting:
Critical Vacancies:
- grouped by country
- compact tables
- include total vacancies and priority summary

Candidates in Recruitment Pipeline:
- table only if candidates exist
- otherwise show “No candidates in recruitment pipeline.”

New Hires:
- table with Name, Position, Country, Start Date, Tenure
- group by country if helpful

Offboarding:
- table with Name, Country, Department, Position, Departure Reason, Last Working Day
- no checklist dropdowns

Recent Separations:
- table with Name, Department, Position, Country, Start Date, Separation Date, Type
- if none, show empty state

10. Page Break and Table Rules

Use print-safe page-break controls.

Rules:
- Major sections may start on new pages
- Avoid splitting section heading from first table
- Avoid splitting small summary blocks
- Avoid splitting individual table rows
- Allow long tables to flow across pages
- Repeat table headers on new pages where supported
- Avoid giant blank gaps caused by overusing break-inside: avoid

Suggested CSS guidance:
- .section-break should use break-before: page
- .avoid-break should use break-inside: avoid and page-break-inside: avoid
- thead should use display: table-header-group
- tr should use break-inside: avoid

Important:
Do not put break-inside: avoid on very large tables or large section containers, because that can create excessive blank space. Use it only for:
- headings with their intro text
- small summary blocks
- metric grids
- individual rows
- small country groups

11. Table Formatting Standards

Apply consistent table styling across the report.

Global table rules:
- font size around 10 to 11px
- compact cell padding
- thin row borders
- light gray header background
- bold total rows
- consistent column alignment

Right-align:
- counts
- percentages
- currency
- time overdue
- totals

Left-align:
- names
- departments
- positions
- descriptions
- countries

Wrapping:
- allow wrapping for long names, departments, positions, descriptions
- avoid awkward narrow columns where possible
- do not let long descriptions destroy table layout

12. Data Fallback Rules

Use robust fallbacks throughout.

Missing values:
- text: —
- number: — unless it is truly zero
- date: —
- currency: —

Empty states:
- No candidates in recruitment pipeline.
- No contract changes awaiting review.
- No recent separations for the selected month.
- No progressive discipline cases were selected for inclusion in this report.

Do not render empty tables unless the headers add value.

13. Specific Validation Checklist

Before finishing, verify:

1. Total Global Spend is not USD 0 if country totals exist.
2. Total Global Spend equals sum of displayed country totals.
3. Executive Summary metrics match dashboard/source values.
4. Workforce Snapshot totals reconcile:
   - headcount total
   - permanent count
   - contracted count
   - intern count
   - country totals
5. Recruitment excludes Upcoming Onboarding Check-ins.
6. Vacancies are grouped by country.
7. Progressive Discipline includes only selected cases.
8. Contract Management includes:
   - Contract Changes
   - Contract Risk Summary
   - Expired Contracts
   - Past Probations
   - Pending Actions
9. Expired Contracts and Past Probations are not mixed without clear labeling.
10. Pending Actions count equals expired contract items plus past probation items, unless business logic intentionally excludes duplicates.
11. Header/footer is minimal and consistent.
12. Report does not include dashboard UI controls or charts that were explicitly excluded.

14. Final Expected Result

The final PDF should feel like a polished official HR operations report.

It should have:
- clean cover page
- professional executive summary
- aligned KPI metric grid
- corrected global cost total
- report-style cost tables
- workforce distribution table
- recruitment grouped by country
- contract risk summary before detailed tables
- expired contracts grouped separately
- past probations grouped separately
- pending actions summarized separately
- selected progressive discipline cases only
- no dashboard UI chrome
- no interactive controls
- reduced card-like styling
- improved pagination
- fewer awkward empty pages
- consistent headers and footers
- compact, official document styling

The quality level should match the enhanced Employee Profile PDF, but with broader report structure and management-level summaries.