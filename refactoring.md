HR Dashboard
Short descriptive subheading
Horizontal section nav

--------------------------------------------------
Workforce Snapshot
KPI cards
--------------------------------------------------
Geographical Distribution
Country headcount chart
--------------------------------------------------
Workforce Movement
Headcount over time (wider)
Additions over time
Separations over time
--------------------------------------------------
Workforce Composition
Permanent vs Contracted
Gender Breakdown
Average Age by Country
--------------------------------------------------
Cost Overview
Expense summary cards / country cost cards
--------------------------------------------------

We want to adjust the HR Dashboard home page layout for better readability and navigation while keeping the existing functionality and visuals intact. This is a layout and UX refinement task, not a redesign of the data model or business logic. Please preserve all existing chart logic, filters, data bindings, styling system, and current routes in the side navigation. Only reorganize and polish the home page structure so it is easier to scan and use frequently in HR meetings.

Goals:
- Make the home page easier to read at a glance
- Give the page a clearer visual hierarchy
- Help users know what is on the page and what to scroll for
- Keep the finish professional, clean, and executive-friendly
- Do not break any existing components, calculations, or navigation

Overall page structure:
1. Page header
2. Horizontal section navigation
3. Workforce Snapshot section
4. Geographical Distribution section
5. Workforce Movement section
6. Workforce Composition section
7. Cost Overview section

Header:
- Keep the page title as “HR Dashboard”
- Add a short explanatory subtitle under the title
- Use a concise professional line such as:
  “Company-wide workforce, movement, composition, and cost insights.”
- Keep spacing clean and aligned with the dashboard grid

Horizontal section navigation:
- Add a horizontal nav below the header
- This nav is for quick in-page movement across the major dashboard sections
- It should help users jump directly to the section they want during frequent use and meetings
- Use section anchors on the section headings to implement this behavior
- Clicking each nav item should smoothly scroll to the relevant section on the page
- The nav items should be:
  - Workforce Snapshot
  - Geographical Distribution
  - Workforce Movement
  - Workforce Composition
  - Cost Overview
- Make the nav feel lightweight and professional, not like tabs switching content
- It should be an in-page anchor navigation, not route navigation
- If possible, keep it sticky at the top while scrolling, as long as that does not interfere with the existing layout

Section styling:
- Each section should have:
  - a clear heading
  - a short static helper line under the heading explaining what the user is looking at
  - consistent spacing before and after the section
  - a subtle line divider between sections
- Use understated dividers and spacing rather than heavy visual separators
- Keep all section titles and helper text visually consistent

Section 1: Workforce Snapshot
- Place this first after the horizontal section nav
- Keep the KPI cards here
- This section should be the quick executive overview
- Include a helper line such as:
  “High-level workforce metrics for the current view.”
- Keep the KPI row clean and balanced
- Include Net Change as one of the KPI cards if it is not already present
- Use the formula:
  Net Change = Additions - Separations
- Display it clearly as a signed value such as +2, -1, or 0
- Subtitle can say “for selected month” or “this month” depending on existing logic

Section 2: Geographical Distribution
- Place this directly after Workforce Snapshot
- Keep the geographical headcount visualization in this section
- Change the current layout to a vertical bar chart presentation rather than horizontal bars
- Use more spacing between bars so the section feels cleaner and less cramped
- The reason for this change is that horizontal bars will take up too much space and feel cramped in the target layout
- Keep the chart readable and visually tidy
- Add a helper line such as:
  “Employee headcount by location.”
- Preserve existing data values and behavior

Section 3: Workforce Movement
- Place this after Geographical Distribution
- Group all movement-related trend visuals together in one row
- This row should contain:
  - Headcount Over Time
  - Employee Additions Over Time
  - Employee Separations Over Time
- The Headcount Over Time chart should have greater width than the other two because it has more points and is the primary trend view
- Keep Additions and Separations visually aligned with each other
- Add a helper line such as:
  “Track overall workforce trend, hiring activity, and separations over time.”
- Preserve all current chart functionality and timeseries logic

Section 4: Workforce Composition
- Place this after Workforce Movement
- Group composition-related visuals together
- Layout should be:
  - Permanent vs Contracted donut chart
  - Gender Breakdown donut chart
  - Average Age by Country chart spanning the full width below them
- Keep the two donut charts side by side
- Keep Average Age by Country at approximately its current full-width presentation
- Add a helper line such as:
  “Review workforce makeup by employment type, gender, and average age.”
- Preserve legends, filters, and existing chart data logic

Section 5: Cost Overview
- Place this last
- Keep the cost cards and current cost-related content in this section
- Add a helper line such as:
  “Review payroll and related workforce costs by country.”
- Preserve existing month and currency controls where they already apply
- Do not convert page-level filters into global filters if they only apply to this section or certain visuals

Filter behavior:
- Month filters are only applicable to a few visuals
- Do not add one misleading global month filter at the top of the page
- Keep filters local to the visuals or sections they actually control
- Make sure the UI clearly communicates when a filter is chart-specific
- Preserve all existing filtering logic and scope

Implementation requirements:
- Use section anchors on the section headings for in-page navigation
- Wire the horizontal nav items to those anchors
- Use smooth scrolling behavior if available
- Do not break existing component imports, chart rendering, state handling, routes, or API/data connections
- Preserve responsiveness
- Preserve the side navigation and all route behavior exactly as-is
- Preserve the professional visual style of the application
- Keep the page clean, aligned, and consistent across section cards
- Standardize section spacing, heading spacing, and card alignment where needed

Important:
- This is a layout refinement of the HR Dashboard home page only
- Do not rewrite unrelated pages
- Do not remove any core visualizations
- Do not alter the underlying chart calculations except adding Net Change if needed using:
  Net Change = Additions - Separations
- Focus on information architecture, spacing, grouping, and in-page navigation
- Make changes in a way that is safe and minimally disruptive to the existing codebase