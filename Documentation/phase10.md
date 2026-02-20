# Phase 10 Summary — Employee Profile Documents (Odoo `ir.attachment`) + Profile Layout Updates

## Objective

Enhance the Odoo-backed Employee Profile page to:

- Match the target **profile layout** (including right-aligned actions and improved spacing).
- Add an **Employee Documents** section that lists employee-related files from Odoo’s `ir.attachment`.
- Support **uploading**, **downloading**, and **deleting** documents (stored in `ir.attachment`) in a scalable way that performs well on test and production servers.

Scope for this phase is the **Odoo pages** under `/odoo/*` (CSV baseline pages are unchanged).

---

## Major deliverables shipped

### A) Odoo attachments integration (server-side)

Implemented a small server utility to interact with Odoo’s `ir.attachment` model using the existing JSON-RPC client.

- **Model**: `ir.attachment`
- **Linking strategy**: attachments are associated to an employee using:
  - `res_model = "hr.employee"`
  - `res_id = <employee id>`
- **Employee key format**: supports only Odoo employee keys (`employeeKey` must start with `odoo-`).

Key file:

- `hr-dashboard/server/utils/odooAttachments.ts`

Functions added:

- `listEmployeeAttachments(employeeKey)`
  - Uses `search_read` and returns **metadata only** (no binary file payload).
  - Fields returned: `id`, `name`, `mimetype`, `file_size`, `create_date`, `write_date`
  - Sorted: newest first (`create_date desc`)
  - Limit: `200`
- `createEmployeeAttachment({ employeeKey, filename, mimeType, data })`
  - Creates a new `ir.attachment` record with `type: "binary"` and `datas` base64-encoded.
  - Enforces a server-side size limit: **25MB**.
- `getEmployeeAttachmentContent({ employeeKey, attachmentId })`
  - Fetches the attachment binary (`datas`) only when downloading.
  - Ensures the attachment belongs to the employee (`res_model/res_id` match).
- `deleteEmployeeAttachment({ employeeKey, attachmentId })`
  - Deletes via `unlink` only after verifying the attachment belongs to the employee.

Why this approach (performance and scalability):

- **List endpoint never reads `datas`**, which keeps responses fast even as document counts grow.
- Binary reads are isolated to the download endpoint to avoid large payloads on initial page load.

---

### B) New Nitro API endpoints (documents)

Added dedicated endpoints under the Odoo employee namespace.

#### List documents

- `GET /api/odoo/employees/:employeeKey/attachments`
  - File: `hr-dashboard/server/api/odoo/employees/[employeeKey]/attachments.get.ts`
  - Returns: `OdooAttachmentListItem[]` (metadata only)

#### Upload a document

- `POST /api/odoo/employees/:employeeKey/attachments`
  - File: `hr-dashboard/server/api/odoo/employees/[employeeKey]/attachments.post.ts`
  - Request: `multipart/form-data`
    - form field name: `file`
  - Stores in Odoo `ir.attachment` linked to `hr.employee`

#### Download a document

- `GET /api/odoo/employees/:employeeKey/attachments/:attachmentId`
  - File: `hr-dashboard/server/api/odoo/employees/[employeeKey]/attachments/[attachmentId].get.ts`
  - Returns: raw bytes with headers:
    - `content-type`: attachment mimetype (or `application/octet-stream`)
    - `content-disposition`: `attachment; filename="..."`
    - `cache-control`: `private, max-age=60`

#### Delete a document

- `DELETE /api/odoo/employees/:employeeKey/attachments/:attachmentId`
  - File: `hr-dashboard/server/api/odoo/employees/[employeeKey]/attachments/[attachmentId].delete.ts`
  - Ensures the attachment belongs to the employee before deletion.

Notes:

- All endpoints use the existing server-only Odoo credentials/config (see Phase 8).
- Employee key parsing is strict (`odoo-<id>`), which prevents cross-source confusion.

---

### C) Employee Profile UI updates (layout + documents)

Updated the Odoo employee profile page to match the intended layout and incorporate documents management.

Key file:

- `hr-dashboard/app/pages/odoo/employees/[employeeKey].vue`

Changes:

- **Top-right actions**
  - `Download PDF` remains.
  - Added `Upload Document` directly under it.
- **Employee Documents**
  - Added a full-width bottom section (`lg:col-span-2`) for documents.
  - Documents list is scrollable to support growth:
    - `max-h-96` + `overflow-auto`
  - Per document row:
    - `Download` button (calls download endpoint)
    - Trash icon button to **Delete** (calls delete endpoint)
  - Upload workflow:
    - Hidden file input triggered by the Upload button
    - Uses `FormData` and POSTs to the upload endpoint
    - Refreshes the list after upload
  - Delete workflow:
    - Confirmation prompt
    - Calls `DELETE` endpoint and refreshes the list
- **Talent display**
  - Removed the full Talent section card.
  - Talent rating is displayed compactly on the right side of the name/position panel.

---

## UI Refinements

Small UI adjustments made during implementation to better match the target layout and improve readability:

### Employee Profile (Odoo)

- Removed the “talent scale” text line to reduce visual clutter.
- Increased the talent label/value font sizes slightly for readability.
- Adjusted spacing around the status/type pills (minor margin tuning).

### Recruitment page (Critical Vacancies)

- Reduced Critical Vacancies card width on large screens by increasing grid columns:
  - `md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4`
- Reduced card padding slightly (`p-4` → `p-3`) to cut excessive blank space.

### Odoo Home (Separations + Additions)

- Added a “View trends” toggle button (with a Back button) to switch:
  - Employee Separations donut → yearly line chart (with optional type overlay)
  - Employee Additions donut → yearly line chart
- Updated the “View trends” / Back buttons to a lighter visual style for readability.

---

## Test plan (manual)

- Open an Odoo employee profile: `/odoo/employees/odoo-<id>`
- Verify the page loads and the Documents section appears.
- Upload a small file using **Upload Document**:
  - Confirm it appears in the Documents list after upload.
  - Confirm it is visible in Odoo under the employee’s attachments (via Odoo UI).
- Download the uploaded file using **Download**:
  - Confirm the downloaded file content matches.
- Delete the uploaded file using the trash icon:
  - Confirm it disappears from the list.
  - Confirm it is removed from Odoo (via Odoo UI).

---

## Operational considerations (test → production)

- **Performance**: listing returns only metadata; binary loads happen only when downloading.
- **Limits**: uploads are capped at **25MB** server-side.
- **Safety**: download/delete endpoints verify the attachment belongs to the current employee before acting.
- **Consistency**: the implementation uses the same Odoo JSON-RPC client and runtime configuration already used in production-readiness work (Phase 8).

