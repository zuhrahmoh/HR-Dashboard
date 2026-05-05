import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-chromium'
import { formatYmdDateOrDash } from '~/utils/dates'
import type { Employee } from './employees'
import type { EmployeeCompensation } from './sharepointCompensation'
import type { OdooDisciplinaryCaseRow } from './odooDisciplinaryCases'

export type EmployeeProfilePrintPayload = {
  employee: Employee
  compensation: EmployeeCompensation | null
  disciplinaryCases: OdooDisciplinaryCaseRow[]
  generatedAtIso: string
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function dashify(value: unknown): string {
  const t = String(value ?? '').trim()
  return t ? escapeHtml(t) : '—'
}

function hasText(value: unknown): boolean {
  return String(value ?? '').trim().length > 0
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '—'
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return escapeHtml((a + b).toUpperCase()) || '—'
}

function titleCaseType(raw: string | undefined): string {
  const s = (raw ?? '').trim()
  if (!s) return ''
  return s
    .split(/\s+/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function formatMoney(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return '—'
  const code = (currency || '').trim().toUpperCase()
  try {
    if (code && /^[A-Z]{3}$/.test(code)) {
      return escapeHtml(new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(amount))
    }
  } catch {}
  return escapeHtml(new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount))
}

function formatGeneratedLine(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return escapeHtml(iso)
  return escapeHtml(
    d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      hour12: false
    }) + ' UTC'
  )
}

function formatLoggedDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return dashify(iso)
  return escapeHtml(
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
  )
}

export async function loadEmployeeProfileLogoDataUrl(): Promise<string | null> {
  const candidates = [
    join(process.cwd(), 'public/Ramps-Logo-Colored.png'),
    join(process.cwd(), '.output/public/Ramps-Logo-Colored.png'),
    fileURLToPath(new URL('../../public/Ramps-Logo-Colored.png', import.meta.url))
  ]
  for (const logoPath of candidates) {
    try {
      if (!existsSync(logoPath)) continue
      const buf = await readFile(logoPath)
      return `data:image/png;base64,${buf.toString('base64')}`
    } catch {
      /* try next */
    }
  }
  return null
}

export function buildEmployeeProfilePrintHtml(
  payload: EmployeeProfilePrintPayload & { logoDataUrl?: string | null }
): string {
  const { employee, compensation, disciplinaryCases, generatedAtIso } = payload
  const logoDataUrl = payload.logoDataUrl ?? null

  const emp = employee
  const statusLine = [emp.employeeStatus?.trim(), titleCaseType(emp.employeeType)].filter(Boolean).join(' • ')
  const statusLineHtml = dashify(statusLine || '—')

  const currency = compensation?.currency ?? null

  const summaryRows: Array<{ label: string; value: string }> = [
    hasText(emp.department) ? { label: 'Department', value: dashify(emp.department) } : null,
    hasText(emp.companyName) ? { label: 'Company', value: dashify(emp.companyName) } : null,
    hasText(emp.countryAssigned) ? { label: 'Country', value: dashify(emp.countryAssigned) } : null,
    hasText(emp.reportingTo) ? { label: 'Reporting To', value: dashify(emp.reportingTo) } : null,
    hasText(emp.elt) ? { label: 'ELT', value: dashify(emp.elt) } : null
  ].filter((r): r is { label: string; value: string } => r != null)

  const compRows: Array<{ label: string; value: string }> = []
  if (currency?.trim()) {
    compRows.push({ label: 'Currency', value: escapeHtml(currency.trim()) })
  }
  const monthly = compensation?.monthlySalary
  if (monthly != null && Number.isFinite(monthly)) {
    compRows.push({ label: 'Monthly Salary', value: formatMoney(monthly, currency) })
  }
  const gross = compensation?.grossSalary
  if (gross != null && Number.isFinite(gross)) {
    compRows.push({ label: 'Gross Salary', value: formatMoney(gross, currency) })
  }
  const allowance = compensation?.allowance
  if (allowance != null && Number.isFinite(allowance)) {
    compRows.push({ label: 'Allowance', value: formatMoney(allowance, currency) })
  }
  if (
    emp.amountIncreasedBy != null &&
    Number.isFinite(emp.amountIncreasedBy) &&
    emp.amountIncreasedBy !== 0
  ) {
    compRows.push({
      label: 'Amount Increased By',
      value: formatMoney(emp.amountIncreasedBy, currency)
    })
  }
  if (hasText(emp.dateLastSalaryChange)) {
    compRows.push({
      label: 'Date of Last Salary Change',
      value: escapeHtml(formatYmdDateOrDash(emp.dateLastSalaryChange))
    })
  }

  const disciplinaryRowsHtml =
    disciplinaryCases.length === 0
      ? `<p class="ep-muted ep-empty">No disciplinary cases recorded.</p>`
      : `<table class="ep-table ep-disc-table">
          <thead>
            <tr>
              <th>Summary</th>
              <th>Status</th>
              <th class="ep-nowrap">Logged</th>
            </tr>
          </thead>
          <tbody>
            ${disciplinaryCases
              .map(
                (c) =>
                  `<tr>
                  <td>${dashify(c.summary)}</td>
                  <td>${dashify(c.status)}</td>
                  <td class="ep-nowrap">${formatLoggedDate(c.createdAt)}</td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>`

  const logoBlock = logoDataUrl
    ? `<img class="ep-logo" src="${logoDataUrl}" alt="" width="140" height="auto" />`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml('Employee Profile — ' + (emp.name || '').trim())}</title>
  <style>
    @page { size: A4 portrait; margin: 22mm 20mm 24mm 20mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #0f172a;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.35;
    }
    .ep-doc { max-width: 100%; padding: 0 4mm; }
    .ep-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 12px;
      margin-bottom: 14px;
      border-bottom: 1px solid #cbd5e1;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .ep-logo { max-height: 36px; width: auto; display: block; }
    .ep-header-right { text-align: right; flex: 1; min-width: 0; }
    .ep-title { font-size: 17pt; font-weight: 700; margin: 0; letter-spacing: -0.02em; color: #0f172a; }
    .ep-subtitle { font-size: 9.5pt; color: #64748b; margin: 4px 0 0 0; font-weight: 400; }
    .ep-meta { font-size: 9pt; color: #64748b; margin-top: 8px; }
    .ep-meta span { display: block; }

    .ep-section { margin-bottom: 14px; }
    .ep-hero-section {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .ep-section-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px 0;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
    }

    .ep-hero {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 6px;
    }
    .ep-avatar {
      width: 44px;
      height: 44px;
      border-radius: 999px;
      background: #1e3a5f;
      color: #fff;
      font-weight: 700;
      font-size: 13pt;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ep-hero-text h2 { margin: 0; font-size: 15pt; font-weight: 700; color: #0f172a; }
    .ep-hero-text .ep-position { margin: 2px 0 0 0; font-size: 10pt; color: #334155; }
    .ep-hero-text .ep-tags { margin: 6px 0 0 0; font-size: 9.5pt; color: #334155; font-weight: 600; }

    .ep-kv-table { width: 100%; border-collapse: collapse; }
    .ep-kv-table td { padding: 5px 0; vertical-align: top; border-bottom: 1px solid #f1f5f9; }
    .ep-kv-table td:first-child { color: #64748b; width: 38%; font-size: 9.5pt; }
    .ep-kv-table td:last-child { text-align: right; font-weight: 500; color: #0f172a; font-size: 10pt; }

    .ep-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 28px; align-items: start; }
    .ep-col-title { font-size: 9.5pt; font-weight: 700; color: #475569; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.04em; }
    .ep-field { margin-bottom: 10px; }
    .ep-field:last-child { margin-bottom: 0; }
    .ep-field dt { margin: 0; font-size: 9pt; color: #64748b; }
    .ep-field dd { margin: 2px 0 0 0; font-size: 10pt; color: #0f172a; font-weight: 500; }

    .ep-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
    .ep-table th, .ep-table td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .ep-table th { font-size: 9pt; color: #64748b; font-weight: 600; background: #f8fafc; }
    .ep-disc-table td:first-child { max-width: 45%; }
    .ep-nowrap { white-space: nowrap; }
    .ep-muted { color: #64748b; }
    .ep-empty { margin: 6px 0 0 0; font-size: 10pt; }
  </style>
</head>
<body>
  <div class="ep-doc">
    <header class="ep-header">
      <div class="ep-header-left">${logoBlock}</div>
      <div class="ep-header-right">
        <h1 class="ep-title">Employee Profile</h1>
        <p class="ep-subtitle">HR Employee Record</p>
        <div class="ep-meta">
          <span>Generated: ${formatGeneratedLine(generatedAtIso)}</span>
        </div>
      </div>
    </header>

    <section class="ep-section ep-hero-section">
      <div class="ep-hero">
        <div class="ep-avatar">${initialsFromName(emp.name)}</div>
        <div class="ep-hero-text">
          <h2>${dashify(emp.name)}</h2>
          <p class="ep-position">${dashify(emp.position)}</p>
          <p class="ep-tags">${statusLineHtml}</p>
        </div>
      </div>
    </section>

    <section class="ep-section">
      <h3 class="ep-section-title">Employee Summary</h3>
      ${
        summaryRows.length
          ? `<table class="ep-kv-table">
        ${summaryRows.map((r) => `<tr><td>${escapeHtml(r.label)}</td><td>${r.value}</td></tr>`).join('')}
      </table>`
          : `<p class="ep-muted ep-empty">No summary fields available.</p>`
      }
    </section>

    <section class="ep-section">
      <h3 class="ep-section-title">Contact &amp; Employment</h3>
      <div class="ep-two-col">
        <div>
          <p class="ep-col-title">Contact</p>
          <dl class="ep-field-list">
            ${hasText(emp.workEmail) ? `<div class="ep-field"><dt>Work Email</dt><dd>${dashify(emp.workEmail)}</dd></div>` : ''}
            ${hasText(emp.workPhone) ? `<div class="ep-field"><dt>Work Phone</dt><dd>${dashify(emp.workPhone)}</dd></div>` : ''}
            ${hasText(emp.personalPhone) ? `<div class="ep-field"><dt>Personal Phone</dt><dd>${dashify(emp.personalPhone)}</dd></div>` : ''}
            ${hasText(emp.gender) ? `<div class="ep-field"><dt>Gender</dt><dd>${dashify(emp.gender)}</dd></div>` : ''}
          </dl>
        </div>
        <div>
          <p class="ep-col-title">Employment</p>
          <dl class="ep-field-list">
            ${
              emp.startDate?.trim()
                ? `<div class="ep-field"><dt>Start Date</dt><dd>${escapeHtml(formatYmdDateOrDash(emp.startDate))}</dd></div>`
                : ''
            }
            ${hasText(emp.tenure) ? `<div class="ep-field"><dt>Tenure</dt><dd>${dashify(emp.tenure)}</dd></div>` : ''}
            ${
              hasText(emp.probationEndDate)
                ? `<div class="ep-field"><dt>Probation End</dt><dd>${escapeHtml(formatYmdDateOrDash(emp.probationEndDate ?? null))}</dd></div>`
                : ''
            }
            ${hasText(titleCaseType(emp.employeeType)) ? `<div class="ep-field"><dt>Employee Type</dt><dd>${dashify(titleCaseType(emp.employeeType))}</dd></div>` : ''}
          </dl>
        </div>
      </div>
    </section>

    <section class="ep-section">
      <h3 class="ep-section-title">Compensation</h3>
      ${
        compRows.length
          ? `<table class="ep-kv-table">
        ${compRows.map((r) => `<tr><td>${escapeHtml(r.label)}</td><td>${r.value}</td></tr>`).join('')}
      </table>`
          : `<p class="ep-muted ep-empty">No compensation details on file.</p>`
      }
    </section>

    <section class="ep-section">
      <h3 class="ep-section-title">Disciplinary Cases</h3>
      ${disciplinaryRowsHtml}
    </section>
  </div>
</body>
</html>`
}

export async function renderEmployeeProfilePdf(payload: EmployeeProfilePrintPayload): Promise<Buffer> {
  const logoDataUrl = await loadEmployeeProfileLogoDataUrl()
  const html = buildEmployeeProfilePrintHtml({ ...payload, logoDataUrl })

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage']
  })

  try {
    const page = await browser.newPage({
      viewport: { width: 816, height: 1056 }
    })
    await page.setContent(html, { waitUntil: 'load', timeout: 60_000 })
    try {
      await page.evaluate(async () => {
        const fonts = (globalThis as any).document?.fonts
        if (fonts?.ready) await fonts.ready
      })
    } catch {
      /* ignore */
    }

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    })
    await page.close()
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
