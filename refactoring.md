PHASE 1

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
- Keep the short explanatory subtitle under the title and any extra sentences that may be useful
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
- Subtitle can say Current month” depending on existing logic

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





PHASE 2

Refine the HR Dashboard home page layout again to improve first-screen information density and give it a more professional, executive dashboard feel. Keep the current section-based structure and preserve all existing logic, data bindings, charts, filters, routes, and component functionality. This is a layout and presentation refinement only.

Primary goal:
Make the first viewport feel more useful and information-rich by showing both the KPI summary and a major visualization immediately, while keeping the page clean, readable, and professional.

Important constraints:
- Do not break any existing functionality
- Do not remove any core visualizations
- Do not change chart calculations or data logic
- Do not alter the side navigation routes or behavior
- Preserve responsiveness
- Preserve the horizontal section nav with anchor-based scrolling
- Keep the page professional and executive-friendly, not playful or overly spacious

High-level direction:
The current page is better organized, but the upper half still feels too vertically spaced and too light in information density. We want it to feel more like a polished operational dashboard and less like a long stacked report.

What to change:

1. Tighten the top area
- Reduce excess vertical spacing between:
  - page title and subtitle
  - subtitle and horizontal section nav
  - nav and first section
  - section title, helper line, and cards
- Keep spacing clean, but make the upper section more compact and information-dense

2. Keep the header and compact nav
- Keep:
  - “HR Dashboard”
  - short subtitle
  - horizontal section nav with anchor links
- The section nav should remain a lightweight in-page navigation aid, not a dominant visual element
- Keep anchor scrolling behavior intact
- If already sticky, preserve that behavior as long as it works cleanly

3. Change the top content composition
We no longer want the first viewport to be only the Workforce Snapshot section followed by a large section break before the first chart.

Instead, restructure the top dashboard area so the first viewport includes:
- the KPI strip
- a primary visualization
- optionally a secondary supporting visualization

Preferred layout:
- Workforce Snapshot heading + helper text
- KPI row
- Immediately below that, a chart row with:
  - Headcount Over Time as the dominant/hero chart
  - Geographical Distribution as a smaller secondary chart beside it

Recommended desktop proportion:
- Headcount Over Time: about 7/12 or 8/12 width
- Geographical Distribution: about 4/12 or 5/12 width

This top area should feel like a strong dashboard landing view.

4. Move Geographical Distribution out of its current early full-width treatment
- Do not keep Geographical Distribution as a large standalone full-width section directly under the KPI strip
- Instead, integrate it into the top chart row beside Headcount Over Time
- It should still retain its own section heading or card title, but it should behave as a secondary top-level supporting chart rather than consuming a full early row by itself

5. Keep Headcount Over Time as the hero visualization
- This should be the most important chart in the first viewport
- It should visually dominate the top chart row
- Keep its current logic/data exactly as-is
- Tighten internal chart/card padding if needed so it fills its container better and feels less airy

6. Refine Geographical Distribution styling
The current vertical bar approach is okay for layout, but the chart needs to feel more polished and analytical.
Please improve it by:
- reducing excess empty space inside the card
- tightening the plot area
- ensuring the bars feel grounded and aligned
- improving spacing between bars and labels
- using subtle chart structure like a visible baseline and light grid if appropriate
- preserving the existing data and labels
- keeping it compact enough to work as a secondary chart in the top area

7. Reposition the remaining sections below the top dashboard area
After the combined KPI + top chart area, the rest of the page should flow like this:

A. Workforce Movement
- Only the two supporting trend charts here:
  - Employee Additions Over Time
  - Employee Separations Over Time
- These should now sit together as a pair because Headcount Over Time has moved into the top area
- Keep them aligned and balanced

B. Workforce Composition
- Permanent vs Contracted
- Gender Breakdown
- Average Age by Country

C. Cost Overview
- Keep the existing cards and controls

8. Reduce “chapter-like” section spacing
The current layout feels a bit too much like:
divider → title → helper text → large empty gap → content
We want a more continuous, high-utility dashboard rhythm.
Please:
- tighten section spacing
- keep dividers subtle
- reduce excessive top/bottom whitespace inside cards and around headings
- maintain readability without making it cramped

9. Improve card density and consistency
Across KPI cards and chart cards:
- slightly reduce oversized padding where appropriate
- standardize title spacing and internal alignment
- ensure cards feel information-rich without feeling busy
- keep the visual style mature and professional

10. Keep helper text, but shorten and tighten it
Use concise helper lines under section headings. Suggested versions:
- Workforce Snapshot: “Current workforce metrics.”
- Workforce Movement: “Hiring and separation trends over time.”
- Workforce Composition: “Employment type, gender, and age mix.”
- Cost Overview: “Payroll and workforce costs by country.”

For the top chart row:
- Headcount Over Time card can stand without extra descriptive text if the title is clear
- Geographical Distribution card helper text can be very short, e.g. “Headcount by location.”

11. Preserve filters exactly where they apply
- Do not introduce misleading global filters
- Keep month/currency or other controls local to the visuals/sections they belong to
- Preserve all current filter behavior and scope

12. Implementation notes
- Preserve the horizontal nav anchor functionality
- Preserve all section ids/anchors or update them safely if needed
- Keep the page responsive
- On smaller screens, stack the KPI row and charts in a sensible order
- On desktop, prioritize an efficient first viewport and stronger information density

Desired final feel:
The dashboard should feel like a polished internal analytics product used frequently in HR meetings:
- confident
- efficient
- professional
- information-dense in the first screen
- clean, but not overly sparse
- more like an executive dashboard, less like a long report page

Summary of desired desktop order:
1. Header
2. Compact horizontal anchor nav
3. Workforce Snapshot heading + helper text
4. KPI row
5. Top chart row:
   - Headcount Over Time (hero)
   - Geographical Distribution (secondary)
6. Workforce Movement:
   - Employee Additions Over Time
   - Employee Separations Over Time
7. Workforce Composition:
   - Permanent vs Contracted
   - Gender Breakdown
   - Average Age by Country
8. Cost Overview

Please implement this as a safe layout refinement pass using the current codebase and components wherever possible.



PHASE 3

Refine the top dashboard area of the HR Dashboard home page to better match how the HR team actually uses the page in meetings. Preserve all existing functionality, data bindings, filters, routes, and responsiveness. This is a presentation and layout refinement only.

Important constraints:
- Do not break any existing logic or chart functionality
- Do not remove any core visualizations
- Do not introduce scrolling inside charts or cards
- All charts must fit cleanly within their containers
- Preserve the sticky horizontal section nav with anchor-based scrolling
- Preserve the side navigation and all current route behavior
- Keep the design professional, compact, and executive-friendly

Top area changes:
1. Keep the current top structure:
- Header
- Subtitle
- Sticky horizontal section nav
- Workforce Snapshot section with KPI cards
- Top chart row beneath the KPI cards

2. Reduce the visual size of the sticky horizontal section nav
- Make the sticky nav feel lighter and less dominant
- Reduce its height and vertical padding
- Tighten the spacing between items
- Keep it clearly usable and readable
- Preserve its anchor-link behavior to move to dashboard sections

3. Reduce the size of the KPI cards
- Make the KPI row more compact and less oversized
- Reduce card height and internal vertical padding
- Slightly tighten spacing between title, value, icon, and supporting text
- Keep the values readable and prominent
- Maintain the professional visual treatment and existing logic

Top chart row layout:
4. In the top chart row, place:
- Geographical Distribution on the left
- Headcount Over Time on the right

This is intentional because the HR team prioritizes seeing geographic headcount first when using the dashboard.

5. Keep Headcount Over Time as the larger chart
- Even though it moves to the right, it should still be the wider card
- Recommended desktop proportion:
  - Geographical Distribution: narrower secondary card on the left
  - Headcount Over Time: wider hero card on the right

Geographical Distribution chart changes:
6. Change Geographical Distribution back to a horizontal ranked bar chart
- This chart must fit fully inside its card
- Internal scrolling is not allowed
- Horizontal scrolling is not allowed
- Vertical scrolling is not allowed
- The visualization must render cleanly inside the container at all times

7. Optimize the horizontal bar chart to fit the smaller card
- Sort locations in descending order by headcount
- Use a compact but readable bar layout
- Keep labels readable
- Keep values readable
- Use spacing and chart sizing that allow all locations to display within the card
- If necessary, tighten internal margins and chart padding to make the chart fit properly
- Preserve all current data and labels
- Keep the visual style analytical and polished

8. Ensure the Geographical Distribution card feels finished and professional
- Remove any need for internal chart panning/scrolling
- Make the chart feel grounded and structured
- Use a clean baseline/grid treatment if helpful
- Keep the helper text concise
- Example helper text:
  “Headcount by location. Excludes archived employees.”

Headcount Over Time chart changes:
9. Keep Headcount Over Time on the right as the wider chart
- Preserve all existing data logic and interactions
- Tighten the y-axis domain so the line variation is easier to read
- Do not force the axis to start at zero
- Use a more appropriate lower bound based on the actual headcount range so the points are more distributed and readable
- Keep the chart honest and readable, not exaggerated
- Keep the chart filling its container well with reduced dead space if possible

10. Tighten the internal spacing of both top-row chart cards
- Reduce excess whitespace inside the cards
- Make the charts fill their available space more effectively
- Keep titles and helper text aligned consistently

Visual density and finish:
11. Preserve the current overall page structure and section ordering below the top row
- Workforce Movement
- Workforce Composition
- Cost Overview
Keep those sections intact unless minor spacing refinements are needed for consistency

12. Improve professionalism through density, not clutter
- The page should feel more compact and useful
- Avoid playful or overly spacious presentation
- Avoid overcrowding
- Use tighter spacing, cleaner alignment, and better chart fit to achieve a polished dashboard feel

Summary of desired top layout:
- Header
- Subtitle
- Compact sticky horizontal anchor nav
- Workforce Snapshot heading + helper text
- More compact KPI row
- Top chart row:
  - Left: Geographical Distribution (horizontal ranked bars, no internal scrolling, fully contained)
  - Right: Headcount Over Time (wider chart, tighter y-axis range, improved readability)

Please implement this as a safe refinement pass using the existing components and styling system wherever possible.





PHASE 4

Refine the HR Dashboard home page again to move it from a clean prototype feel to a more professional, compact, production-style HR analytics dashboard. Preserve all existing logic, data bindings, routes, auth integration, filters, and responsiveness. This is a layout, chart presentation, and information-density refinement pass only.

Context for this change:
The current version is structurally better than before, but it still feels too oversized and “zoomed in.” The line charts and some chart cards are taking up too much visual space, which makes the dashboard feel juvenile rather than executive. The goal is not to overload the user with more charts. The goal is to make the existing visuals work harder, be more compact, and feel more like a polished HR operations dashboard similar in density and professionalism to the reference layout we discussed. Keep the sticky section nav because it is important for guiding the user through the page.

Critical constraints:
- Do not break any existing logic, calculations, or data bindings
- Do not change existing route behavior or side navigation behavior
- Do not remove the sticky horizontal section nav
- Do not change the top spacing / header area significantly; that spacing is already in a good place
- Do not include a welcome message in this implementation pass
- Do not add scrolling inside charts or cards
- All charts must fit cleanly inside their containers
- Preserve responsiveness
- Preserve auth-related behavior and any Entra/Microsoft user context already in place
- Keep all interactions feeling polished and professional

Overall design intent:
- Reduce visual bloat
- Increase information density
- Make charts look more compact and professional
- Make the dashboard feel less like large stacked report blocks and more like a serious internal analytics product
- Keep first-glance clarity
- Avoid clutter
- Match the tone of a mature HR dashboard, not a playful or childlike interface

KEEP:
- sticky horizontal section nav with anchor behavior
- top-level section structure
- Net Change KPI
- Employee Separations KPI
- Employee Additions KPI
- Gender breakdown visualization
- Age breakdown by gender per country visualization
- the small supporting counts for consultants and independent contractors in headcount-related logic

REMOVE / RETIRE:
- the current average age KPI card
- the current standalone “Permanent vs Contracted” donut chart

REPLACE / REWORK:
- Replace the current Total Headcount KPI card with a more visual headcount-distribution KPI inspired by the sample dashboard
- Rework Geographical Distribution into a stacked horizontal bar chart
- Resize/restyle all line charts to feel more compact and professional
- Rework composition layout so the remaining visuals no longer feel oversized

Detailed implementation requirements:

1. Preserve the page shell and top behavior
- Keep the existing page shell, side nav, and sticky section nav
- Keep the header/subtitle area approximately as it is now
- Do not expand the heading area or add large new blocks there
- The sticky section nav remains an important guiding element and must stay

2. KPI row redesign
Current problem:
The KPI row is too oversized, and one of the KPI cards is not useful enough relative to the space it takes.

New KPI row should prioritize only the most useful items:
- Headcount distribution KPI (new visual KPI replacing the current total headcount card)
- Net Change KPI
- Employee Separations KPI
- Employee Additions KPI

Remove:
- Company-wide average age KPI card

Do not add gender as a KPI card.

The KPI row should become more compact:
- reduce card height
- reduce internal vertical padding
- keep typography strong but not oversized
- make the row feel tighter and more executive

3. New headcount distribution KPI
Replace the current total headcount KPI card with a more visual summary card inspired by the reference dashboard’s semi-circular jobs overview.

Requirements:
- Use a semi-circular chart / half-donut / gauge-like composition
- It should show the breakdown of employee types:
  - Permanent
  - Contracted
  - Interns
- The center or focal area should still clearly communicate the total headcount
- Preserve the existing small supporting counts for:
  - Consultants
  - Independent contractors
These supporting counts must remain in the UI and remain driven by the existing logic, even if currently zero.

Additional functionality:
- Add a small, subtle filter control within this KPI card so the headcount distribution can be filtered by country
- This should be a compact professional control, not oversized
- Reuse existing data patterns if possible
- Preserve existing logic and avoid introducing misleading filter behavior

Visual intent:
- The card should feel like a richer KPI, not a full chart card
- It should occupy a similar footprint to a KPI card, not the height of a major visualization
- It should feel polished, minimal, and informative

4. Geographical Distribution chart redesign
Current problem:
The current bar chart feels weak and wasteful in its use of space. Bars are too thin and too spaced out. The chart is not doing enough analytical work.

New direction:
Transform Geographical Distribution into a stacked horizontal bar chart.

Requirements:
- Each country should have one horizontal stacked bar
- The stacks should represent:
  - Permanent
  - Contracted
  - Interns
- The total length of the bar still represents total headcount for that country
- Keep the visible total country values readable
- Sort countries by total headcount descending, unless there is a strong existing business reason not to
- The chart must fully fit inside its card/container
- No internal scrolling
- No horizontal scrolling
- No vertical scrolling

Interactivity:
- On hover over each stack segment, show a tooltip with the count for that employee type in that country
- Tooltip behavior should feel polished and modern, similar to interactive analytics dashboards
- Keep the tooltip content clean and useful

Visual styling:
- Make the bars more substantial and rectangular, not thin line-like bars
- Rounded corners are okay if subtle
- Reduce wasted vertical space
- Use tighter but still readable row spacing
- Make the chart feel more like a professional analytics component and less like a basic placeholder chart

This chart now also serves as a workforce-type breakdown by geography, so it should reduce the need for a separate permanent-vs-contracted chart elsewhere.

5. Retire the standalone Permanent vs Contracted donut
Because workforce-type breakdown will now exist in:
- the new headcount distribution KPI
- the stacked geographical distribution chart

Remove the current “Permanent vs Contracted” donut chart from the Workforce Composition section.

Do not leave an awkward gap after removing it. Reflow the section cleanly.

6. Workforce Composition section re-layout
Keep:
- Gender Breakdown
- Average age by gender per country chart

But change the layout so it feels more compact and less oversized.

Requirements:
- These remaining composition visuals should sit in a tighter, more balanced layout
- The age-by-country chart should no longer stretch across the entire page width
- Reduce its footprint and visual dominance
- Recompose the section so the visuals can sit more naturally on one line or in a more compact arrangement depending on screen width
- The goal is to reduce the childish oversized feel and make the section feel more intentional

Important:
- Preserve the existing gender breakdown logic
- Preserve the existing age-by-country logic
- This is a presentation/layout refinement, not a data change

7. Line chart redesign and resizing
Applies to:
- Headcount Over Time
- Employee Additions Over Time
- Employee Separations Over Time

Current problem:
They are too large, too zoomed in, and visually dominate too much space. They feel oversized and childish.

New direction:
Make all line charts feel more like the compact, polished chart style in the reference dashboard.

Requirements:
- Significantly reduce their visual height and overall footprint
- Tighten card padding and chart margins
- Make the chart cards feel denser and more professional
- Reduce the sense that the chart is “blown up” in the user’s space
- Keep them readable and useful, but more compact and controlled

Styling guidance:
- Aim for a more refined analytics-card presentation
- The plot area should feel balanced inside the card, not oversized
- Use subtler area fills / line treatments if appropriate
- Avoid exaggerated chart dominance
- Keep titles readable but not oversized
- Ensure the charts look intentional at a smaller scale

Headcount Over Time:
- Keep the tightened y-axis logic already discussed: do not force zero if a tighter, honest domain improves readability
- Keep the chart professional and not overly dramatized

Additions and Separations charts:
- Match the more compact visual language of the headcount trend card
- They should feel like secondary supporting analytics cards, not giant poster charts

8. Top section composition
Keep the current top-area idea that the user sees KPI + charts early, but make it more compact and mature.

Top area should still include:
- KPI row
- Geographical Distribution
- Headcount Over Time

But:
- reduce the footprint of the chart cards
- reduce the sense of oversized empty plotting area
- keep the hierarchy clear
- preserve the HR-driven priority that Geographical Distribution appears first in the visual scanning order

If needed, improve the card proportions so this top section feels more like a professional dashboard grid and less like large report tiles.

9. Workforce Movement section
Keep:
- Employee Additions Over Time
- Employee Separations Over Time

But:
- make both cards more compact
- reduce chart height
- tighten spacing
- align them visually with the new denser dashboard style

10. Cost Overview section
Keep the Cost Overview logic and cards.

Minor refinements are okay if needed for consistency:
- slightly tighten spacing if useful
- maintain current controls and behavior
- do not redesign this section aggressively unless needed to harmonize density and spacing

11. Visual tone and polish
This is important:
The dashboard currently risks feeling childlike because too many things are oversized relative to the information they contain.

Use the following principles:
- more compact chart footprints
- tighter card padding
- better information-to-space ratio
- mature spacing
- clearer hierarchy
- professional restraint
- avoid oversized plotting areas
- avoid making individual visuals feel inflated

Do not solve this by cramming in more charts.
Solve it by making the existing charts:
- smaller
- more efficient
- more polished
- more informative

12. Data / logic preservation notes
- Keep current logic for consultants and independent contractors in the headcount-related displays
- Preserve employee-type logic used in permanent/contracted breakdown and extend it into the new stacked geographical chart and headcount KPI
- Keep all current filters/scopes intact unless specifically adding the country filter to the new headcount distribution KPI
- Any new tooltip behavior must reflect actual underlying counts
- Do not hardcode display-only numbers if the underlying logic already exists

Desired final effect:
The dashboard should feel like a serious, well-designed internal HR analytics dashboard:
- compact
- polished
- easier to scan
- more data-dense
- less oversized
- less “toy-like”
- more aligned with the professional reference dashboard
- still guided by the sticky nav and section structure
- still calm and readable, but no longer overly zoomed in

Summary of the intended new structure:
- Keep sticky nav and top shell
- KPI row becomes 4 KPIs:
  - Headcount distribution KPI (new semi-circular breakdown with country filter)
  - Net Change
  - Employee Separations
  - Employee Additions
- Top analytical area includes:
  - Geographical Distribution as stacked horizontal bars with tooltips
  - Headcount Over Time in a more compact, professional line-chart style
- Workforce Movement keeps:
  - Additions trend
  - Separations trend
  both restyled smaller and more polished
- Workforce Composition keeps:
  - Gender Breakdown
  - Average age by gender per country
  arranged more compactly
- Remove the standalone Permanent vs Contracted donut
- Keep Cost Overview as-is with only minor density harmonization if needed

Please implement this as a careful refinement pass using the existing component architecture and styling system wherever possible.


________________________________________________________________________________________________________________________


PHASE 5 - EMPLOYEE PROFILE PDF FORMAT

Build a dedicated printable Employee Profile page/template for PDF generation using Playwright. Do not print the live web UI as-is. Instead, create a clean print-specific HTML/CSS layout that uses the same employee data but is styled like a professional HR record document.

Goal:
The final PDF should look like an official, compact, printable employee profile document — not like a screenshot of the dashboard/web app. It should be clean, structured, easy to scan, and suitable for HR records.

Context:
We already have an Employee Profile page in the web app, but the downloadable PDF should be a dedicated print layout. Employee Documents must NOT be included in the PDF. The current profile page includes interactive UI and dashboard-like cards, which are not appropriate for print. The PDF should have a document-style layout with strong alignment, thin dividers, compact spacing, and no app-like chrome.

Critical requirements:
- Build a separate printable template/component/page for PDF generation
- Use the same employee profile data already available in the app
- Exclude Employee Documents entirely from the PDF
- Exclude upload buttons, refresh buttons, nav elements, sticky UI, dashboard cards, and other interactive controls
- Keep the content compact enough to fit on one page when possible
- Allow a second page only if sections like disciplinary cases become long
- Optimize for Playwright `page.pdf()` output
- Use A4 portrait
- Use print-first styling
- Ensure the layout renders cleanly in Chromium/Playwright

Do NOT:
- Do not simply call `page.pdf()` on the live employee profile route
- Do not include app shell UI
- Do not include side nav
- Do not include “Back to Employees”
- Do not include Upload Document or Refresh buttons
- Do not include Employee Documents section
- Do not keep large rounded dashboard cards/shadows from the app UI
- Do not make the PDF look like a web page export

Build approach:
Create a dedicated print route or print-only template that can receive/populate employee data and render it in a clean document layout. Use minimal, print-friendly HTML and CSS.

Desired page structure:

1. Header
At the top of the page:
- company logo on the left
- document title on the right: “Employee Profile”
- optional subtitle under the title: “HR Employee Record”
- generated date
- optionally employee ID if available

Header should have:
- horizontal alignment
- thin bottom divider
- compact spacing
- official document feel

2. Employee identity / hero section
Below the header:
- small circular avatar with employee initials
- full employee name
- job title
- status + employment type rendered as simple print tags/chips (e.g. Active, Permanent)

This section should be visually strong but compact, not oversized.

3. Employee Summary section
Include as a clean key-value grid:
- Department
- Company
- Country
- Reporting To
- ELT

Use a structured layout with labels on the left and values aligned neatly on the right.

4. Contact + Employment section
Use a two-column layout.

Left column:
- Work Email
- Work Phone
- Personal Phone
- Gender

Right column:
- Start Date
- Tenure
- Probation End
- Employee Type / category if available and useful

This section should be balanced and readable, with no UI-card feel.

5. Compensation section
Show as a compact structured grid/table:
- Currency
- Monthly Salary
- Gross Salary
- Allowance
- Amount Increased By
- Date of Last Salary Change

Keep it highly legible and compact.

6. Disciplinary Cases section
Include only if the section exists in the data model.
Format as a clean table with columns:
- Summary
- Status
- Logged

If there are no disciplinary cases, show:
- “No disciplinary cases recorded.”

Do not include employee documents under any circumstance.

Visual style requirements:
- white background
- dark navy/charcoal text
- muted grey for labels
- thin grey dividers
- compact spacing
- strong typographic hierarchy
- no heavy shadows
- no dashboard card styling
- minimal borders only where needed
- clean print-document aesthetic

Typography and spacing guidance:
- use a professional, readable sans-serif stack
- strong title hierarchy
- section headings should be compact and bold
- labels should be muted
- values should be darker and slightly emphasized
- keep sections close enough to fit the page well
- avoid oversized whitespace

Recommended print settings:
- A4 portrait
- page margins around 18mm–20mm
- avoid edge-to-edge layout
- optimize for Chromium Playwright PDF rendering

Implementation details:
1. Create a dedicated print template/page/component
2. Feed it the employee data already available in the app
3. Add print-specific CSS
4. Generate the PDF from that print template with Playwright
5. Ensure the result is stable and visually consistent

Suggested layout example:

HEADER
[Logo]                                         Employee Profile
                                               HR Employee Record
                                               Generated: 21 Apr 2026

EMPLOYEE HERO
[SR]  Sajdah Al Razi
      Software Engineer
      Active • Permanent

SECTION: Employee Summary
Department ................. Research & Development
Company .................... Ramps Logistics Limited
Country .................... Trinidad and Tobago
Reporting To ............... Kiran Deosingh
ELT ........................ Kiran Deosingh

SECTION: Contact / Employment
Work Email ................. sajdah.alrazi@rampslogistics.com
Work Phone ................. +1868 627-5664
Personal Phone ............. +1868 282-1061
Gender ..................... Female

Start Date ................. 01 Oct 2025
Tenure ..................... 0 Years 6 Months 20 Days
Probation End .............. 01 Apr 2026

SECTION: Compensation
Currency ................... —
Monthly Salary ............. $10,000.00
Allowance .................. —
Gross Salary ............... $10,000.00
Last Salary Change ......... —
Amount Increased By ........ $0.00

SECTION: Disciplinary Cases
Summary            Status            Logged
test case          Investigation     14 Apr 2026

Technical expectations:
- use semantic HTML where practical
- keep table rendering reliable in Chromium
- avoid CSS that can be flaky in PDF rendering
- ensure page breaks are controlled
- keep sections together when possible
- use print-safe CSS
- add `@page` rules
- add page-break handling so a section does not split awkwardly if possible

Add helpful fallback behavior:
- if a value is missing, render a dash “—”
- if disciplinary cases are empty, render the empty state sentence
- initials should be derived from employee name if avatar image is not used

Please implement:
- the print template/page
- the CSS for print layout
- the Playwright-friendly rendering setup
- any small utilities needed to format dates, currency, and fallback values

The final result should look like a polished HR record document, not a web app screen capture.