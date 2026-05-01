import { PDFDocument } from 'pdf-lib'
import { chromium } from 'playwright-chromium'
import { createError, getHeader, getQuery, setHeader, type H3Event } from 'h3'
import { loadEmployeesFromOdoo } from '../../utils/odooEmployees'

function firstHeaderValue(value: string | undefined) {
  if (!value) return ''
  return value.split(',')[0]!.trim()
}

function requestOrigin(event: H3Event) {
  const proto = firstHeaderValue(getHeader(event, 'x-forwarded-proto') || '') || 'http'
  const host = firstHeaderValue(getHeader(event, 'x-forwarded-host') || '') || getHeader(event, 'host') || ''
  if (!host) throw createError({ statusCode: 400, statusMessage: 'Missing Host header' })
  return `${proto}://${host}`
}

function isoNowForFooter() {
  const d = new Date()
  const iso = d.toISOString()
  return iso.replace('T', ' ').replace(/\.\d+Z$/, ' UTC')
}

type Section = {
  title: string
  path: string
  noHeaderFooter?: boolean
}

export default defineEventHandler(async (event) => {
  const origin = requestOrigin(event)
  const generatedAt = isoNowForFooter()
  const cookieHeader = getHeader(event, 'cookie') || ''
  const q = getQuery(event)
  const reportMonthRaw = typeof q.reportMonth === 'string' ? q.reportMonth.trim() : ''
  const reportMonth = /^\d{4}-\d{2}$/.test(reportMonthRaw) ? reportMonthRaw : ''
  const overlayCss = `
    #__nuxt_devtools__, #__nuxt_devtools_container__, #nuxt-devtools-container, #nuxt-devtools-anchor,
    .nuxt-devtools-container, .nuxt-devtools-anchor, .vue-devtools__anchor, [data-v-inspector] { display: none !important; }
  `

  const monthQs = reportMonth ? `&reportMonth=${encodeURIComponent(reportMonth)}` : ''

  const sections: Section[] = [
    { title: 'Cover', path: `/report/cover?report=1${monthQs}`, noHeaderFooter: true },
    { title: 'Executive Summary', path: `/report/summary?report=1${monthQs}` },
    { title: 'Workforce Snapshot', path: `/report/workforce?report=1${monthQs}` },
    { title: 'Cost Overview', path: `/report/expenses?report=1${monthQs}` },
    { title: 'Recruitment & Onboarding', path: `/report/recruitment?report=1${monthQs}` },
    { title: 'Contract Management', path: `/report/contracts?report=1${monthQs}` },
    { title: 'Progressive Discipline', path: `/report/disciplinary?report=1${monthQs}` }
  ]

  // Warm the shared Odoo employees cache once so every report section that hits
  // /api/odoo/* reuses the same in-memory snapshot during SSR.
  await loadEmployeesFromOdoo({ includeInactive: true })

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage']
  })

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: cookieHeader ? { cookie: cookieHeader } : undefined
    })

    const pdfParts: Uint8Array[] = []

    for (const s of sections) {
      const page = await context.newPage()
      const url = `${origin}${s.path}`

      await page.emulateMedia({ media: 'screen' })
      // `domcontentloaded` is enough — we still gate PDF generation on
      // `[data-report-ready="1"]`, which only flips once SSR data resolves.
      // `networkidle` would also wait on dev-only sockets (HMR) and noop pings.
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 })
      await page.addStyleTag({ content: overlayCss })
      await page.waitForSelector('[data-report-ready="1"]', { timeout: 90_000 })

      try {
        await page.evaluate(async () => {
          // @ts-ignore
          if (document?.fonts?.ready) await document.fonts.ready
        })
      } catch {
        // Ignore font readiness issues; PDF generation still proceeds.
      }

      await page.evaluate(async () => {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      })

      const headerTemplate = s.noHeaderFooter
        ? '<span></span>'
        : `
          <div style="font-size:9px; padding:0 14px; width:100%; display:flex; align-items:center; justify-content:space-between; color:#0f172a;">
            <div style="font-weight:600;">HR Workforce &amp; Operations Report</div>
            <div style="font-weight:600; color:#475569;">${s.title}</div>
          </div>
        `

      const footerTemplate = s.noHeaderFooter
        ? '<span></span>'
        : `
          <div style="font-size:8px; padding:0 14px; width:100%; display:flex; align-items:center; justify-content:space-between; color:#475569;">
            <div>Generated: ${generatedAt} &nbsp;|&nbsp; Confidential — Internal use only</div>
            <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
          </div>
        `

      const pdf = await page.pdf({
        format: 'A4',
        landscape: false,
        printBackground: true,
        displayHeaderFooter: !s.noHeaderFooter,
        headerTemplate,
        footerTemplate,
        margin: s.noHeaderFooter
          ? { top: '12px', right: '12px', bottom: '12px', left: '12px' }
          : { top: '48px', right: '28px', bottom: '48px', left: '28px' }
      })

      pdfParts.push(pdf)
      await page.close()
    }

    const merged = await PDFDocument.create()
    for (const part of pdfParts) {
      const doc = await PDFDocument.load(part)
      const pages = await merged.copyPages(doc, doc.getPageIndices())
      for (const p of pages) merged.addPage(p)
    }

    const mergedBytes = await merged.save()
    const buf = Buffer.from(mergedBytes)

    setHeader(event, 'content-type', 'application/pdf')
    setHeader(event, 'content-disposition', 'attachment; filename="hr-workforce-operations-report.pdf"')
    setHeader(event, 'cache-control', 'no-store')
    return buf
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate report.'
    throw createError({ statusCode: 500, statusMessage: msg })
  } finally {
    await browser.close()
  }
})
