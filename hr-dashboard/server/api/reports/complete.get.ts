import { PDFDocument } from 'pdf-lib'
import { chromium } from 'playwright-chromium'
import { createError, getHeader, getQuery, setHeader, type H3Event } from 'h3'

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
  const sections: Array<{ title: string; path: string }> = [
    { title: 'Workforce overview', path: `/report/workforce?report=1${monthQs}` },
    { title: 'Expenses', path: `/report/expenses?report=1${monthQs}` },
    { title: 'Separations', path: `/report/separations?report=1${monthQs}` },
    { title: 'Recruitment', path: `/report/recruitment?report=1${monthQs}` },
    { title: 'Critical vacancies', path: `/report/vacancies?report=1${monthQs}` },
    { title: 'Disciplinary', path: `/report/disciplinary?report=1${monthQs}` }
  ]

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
      await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 })
      await page.waitForLoadState('domcontentloaded')
      await page.addStyleTag({ content: overlayCss })
      await page.waitForSelector('[data-report-ready="1"]', { timeout: 120_000 })

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

      const headerTemplate = `
        <div style="font-size:9px; padding:0 12px; width:100%; display:flex; align-items:center; justify-content:space-between; color:#0f172a;">
          <div style="font-weight:600;">HR Dashboard — Complete Report</div>
          <div style="font-weight:600;">${s.title}</div>
        </div>
      `

      const footerTemplate = `
        <div style="font-size:8px; padding:0 12px; width:100%; display:flex; align-items:center; justify-content:space-between; color:#334155;">
          <div>Generated: ${generatedAt}</div>
          <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
        </div>
      `

      const pdf = await page.pdf({
        format: 'A4',
        landscape: false,
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate,
        footerTemplate,
        margin: { top: '48px', right: '28px', bottom: '48px', left: '28px' }
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
    setHeader(event, 'content-disposition', 'attachment; filename="hr-dashboard-complete-report.pdf"')
    setHeader(event, 'cache-control', 'no-store')
    return buf
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate report.'
    throw createError({ statusCode: 500, statusMessage: msg })
  } finally {
    await browser.close()
  }
})

