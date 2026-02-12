# HR Dashboard (MVP) — Nuxt 4  
## Full Project Context, Specifications & Roadmap (tasks.md)

---

## 0. Project Summary

This project is an **HR Analytics & Operations Dashboard** built with **Nuxt 4**.  
It visualizes HR data from local CSV files and supports lightweight HR workflows using locally persisted JSON files.

The dashboard is **not an HRIS**. It is a decision-support MVP designed to:
- make HR data readable and demo-ready
- support manual HR tracking workflows
- act as a bridge before SharePoint or database integration

---

## 1. Core Constraints & Decisions

### Data Storage
- `employees.csv` → authoritative employee data (read-only)
- `expenses.csv` → authoritative expense data (read-only)
- Local JSON files → user-entered operational data
- No database
- No SharePoint integration (yet)

### Employee Status
- Only two valid values:
  - `Active`
  - `Resigned`

### Notes
- Notes are allowed **only** for **C Players** on the Performance page
- No notes fields on:
  - recruitment
  - vacancies
  - new hires
  - disciplinary forms

---

## 2. Tech Stack

- Nuxt 4
- TypeScript
- Nitro server engine (`/server/api`)
- TailwindCSS
- Pinia (state management)
- Charting library (ECharts or Chart.js)
- Local file persistence for JSON

---

## 3. Data Files & Locations

- Specify on your own.


---

## 4. employeeKey (Internal Identifier)

### Purpose
employeeKey exists purely to:
- enable stable routing to employee profiles
- persist C Player notes reliably
- avoid collisions when employees share names

It does **not** replace CSV data.

### Generation Strategy
- Fields used:
  - Name
  - Department
  - Position
  - Start Date
  - Country Assigned
- Normalize all fields:
  - lowercase
  - trim whitespace
  - normalize date to YYYY-MM-DD
- Concatenate with delimiter:
name|department|position|startDate|country
- Hash string (SHA-1 or MD5)
- Truncate to 10–12 characters
- Handle collisions deterministically if they occur

---

## 5. Pages & Functional Specs

---

### 5.1 Home (Analytics) — `/`

#### A) Geographical Headcount
- Bar chart
- X-axis: Country Assigned
- Y-axis: Headcount
- Exclude resigned employees

#### B) Global Expense Breakdown
- Cards per country
- Source: `global_expenses.csv`
- Each card shows:
- country name
- expense breakdown totals (direct CSV mapping)

#### C) Employee Separations
- Donut / progress ring
- R = employees where `Employee Status == Resigned`
- T = total employees in CSV
- Center label shows R
- Progress = R / T

#### D) Talent Density
- Two stacked bar charts:
- Leaders
- Players
- Classification from rating string:
- contains `Leader` → Leaders
- contains `Player` → Players
- Exclude resigned employees
- Rating buckets:
- Players: A, B+, B, B-, C
- Leaders: A, B+, B, B-

#### E) Upcoming Contracts
- Table of employees whose contract/probation ends in ≤ 30 days
- Exclude resigned employees
- Sort by soonest end date

---

### 5.2 Employees — `/employees`

- Table listing employees
- Search by name
- Optional filters:
- Country
- Department
- Status
- Row click → `/employees/:employeeKey`

---

### 5.3 Employee Profile — `/employees/:employeeKey`

Read-only view.

Includes:
- Personal info
- Org info
- Employment info
- Compensation info

Excludes:
- Edit profile
- Compliance/documents
- Disciplinary records

---

### 5.4 Recruitment & Onboarding — `/recruitment`

#### A) Critical Vacancies (cards)
- Stored in `vacancies.json`
- Fields:
- Position Title
- Department
- Country
- Priority

#### B) Critical Recruitment
- Stored in `critical-recruitment.json`
- Fields:
- Candidate Name
- Position
- Country
- Stage

#### C) New Hires
- Stored in `new-hires.json`
- Fields:
- Name
- Position
- Country
- Start Date
- Status

#### D) Recent Separations
- From `employees.csv`
- Employees where `Employee Status == Resigned`

No notes fields anywhere on this page.

---

### 5.5 Performance — `/performance`

#### C Players Table
- Source: `employees.csv`
- Exclude resigned employees
- Filter: rating == `C Player`
- Display general employee info

#### Notes (Allowed)
- Notes per C Player
- Stored in `c-player-notes.json`
- Keyed by `employeeKey`
- Visible only on this page

---

### 5.6 Disciplinary Matters — `/disciplinary`

- Stored in `disciplinary-cases.json`
- User-entered
- Employee Name is free text
- Fields:
- Employee Name
- Case Type
- Summary
- Status
- Created Date
- No notes fields

---

## 6. Server API (Nitro)

### CSV APIs
- `GET /api/employees`
- `GET /api/employees/:employeeKey`
- `GET /api/analytics/home`
- `GET /api/expenses`

### JSON CRUD APIs
- `/api/vacancies`
- `/api/critical-recruitment`
- `/api/new-hires`
- `/api/disciplinary`
- `/api/c-player-notes/:employeeKey`

### File I/O Rules
- Validate payloads
- Atomic writes (temp file → rename)
- Last-write-wins (MVP)

---

## 7. Component Architecture

### Layout
- AppShell (sidebar + main content)

### Reusable Components
- HeadcountBarChart
- ExpenseCountryCard
- SeparationsDonut
- TalentDensityStackedBar
- UpcomingContractsTable
- EmployeeTable
- FormModal
- CPlayerNotesEditor

---

## 8. Roadmap (Demo-Friendly Phases)

### Phase 0 — Foundation
- Nuxt 4 scaffold
- Tailwind
- Layout + routes
- Demo: navigation shell

### Phase 1 — Employee Data Pipeline
- Parse employees.csv
- Generate employeeKey
- Employee list + profile
- Demo: profile routing

### Phase 2 — Analytics Part 1
- Headcount bar chart
- Separations donut
- Demo: workforce + resignations

### Phase 3 — Expenses
- Parse global_expenses.csv
- Country expense cards
- Demo: expense visibility

### Phase 4 — Talent & Risk
- Talent density stacked bars
- Upcoming contracts table
- Demo: talent distribution + risk

### Phase 5 — Recruitment & Onboarding
- JSON CRUD
- Vacancies, recruitment, new hires
- Recent separations table
- Demo: user-entered workflows

### Phase 6 — Performance
- C Players table
- Persistent notes
- Demo: performance tracking

### Phase 7 — Disciplinary
- CRUD cases
- Status tracking
- Demo: disciplinary logging

### Phase 8 — Polish
- Empty states
- Loading states
- Error handling
- Demo-ready UI

---

## 9. Testing Checklist

- employeeKey deterministic generation
- CSV parsing & normalization
- Resigned employees excluded where required
- Date window logic (30 days)
- Rating parsing (Leader vs Player)
- JSON persistence survives reloads

---

## 10. Out of Scope (MVP)

- Writing back to CSV
- Database integration
- SharePoint integration
- Authentication / roles
- Workflow automation
- Historical analytics

---

## 11. Future Enhancements (Post-MVP)

- Replace JSON with SharePoint lists
- Replace CSV with HRIS export
- Add RBAC
- Add exports (PDF/CSV)
- Add trend analytics

---

## 12. Acceptance Criteria for MVP Completion

- Home dashboard reconciles numerically
- Visuals match defined rules
- User-entered data persists locally
- C Player notes persist correctly
- No assumptions or inferred logic beyond spec

---
