import { createError, getRouterParam, setHeader } from 'h3'
import { getEmployeeByKey } from '../../../utils/employees'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { inflateSync, deflateSync } from 'node:zlib'

function pdfEscapeText(input: string) {
  return input.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

type PngDecoded = {
  width: number
  height: number
  rgb: Buffer
  alpha?: Buffer
}

let cachedLogo: PngDecoded | null = null

function paethPredictor(a: number, b: number, c: number) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

function decodePng(buffer: Buffer): PngDecoded {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(sig)) {
    throw new Error('Invalid PNG signature')
  }

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  let interlace = 0
  const idatParts: Buffer[] = []

  while (offset + 8 <= buffer.length) {
    const len = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const dataStart = offset + 8
    const dataEnd = dataStart + len
    if (dataEnd + 4 > buffer.length) break
    const data = buffer.subarray(dataStart, dataEnd)

    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data.readUInt8(8)
      colorType = data.readUInt8(9)
      interlace = data.readUInt8(12)
    } else if (type === 'IDAT') {
      idatParts.push(Buffer.from(data))
    } else if (type === 'IEND') {
      break
    }

    offset = dataEnd + 4
  }

  if (!width || !height) throw new Error('PNG missing IHDR')
  if (interlace !== 0) throw new Error('Unsupported PNG interlace')
  if (bitDepth !== 8) throw new Error('Unsupported PNG bit depth')
  if (colorType !== 2 && colorType !== 6) throw new Error('Unsupported PNG color type')

  const channels = colorType === 6 ? 4 : 3
  const bpp = channels
  const stride = width * bpp

  const compressed = Buffer.concat(idatParts)
  const inflated = inflateSync(compressed)

  const expectedMin = height * (1 + stride)
  if (inflated.length < expectedMin) throw new Error('Corrupt PNG data')

  const recon = Buffer.alloc(height * stride)

  let inOff = 0
  let outOff = 0

  for (let y = 0; y < height; y++) {
    const filter = inflated.readUInt8(inOff)
    inOff += 1

    for (let x = 0; x < stride; x++) {
      const raw = inflated.readUInt8(inOff + x)
      const left = x >= bpp ? recon[outOff + x - bpp] : 0
      const up = y > 0 ? recon[outOff - stride + x] : 0
      const upLeft = y > 0 && x >= bpp ? recon[outOff - stride + x - bpp] : 0

      let val = 0
      if (filter === 0) val = raw
      else if (filter === 1) val = (raw + left) & 0xff
      else if (filter === 2) val = (raw + up) & 0xff
      else if (filter === 3) val = (raw + Math.floor((left + up) / 2)) & 0xff
      else if (filter === 4) val = (raw + paethPredictor(left, up, upLeft)) & 0xff
      else throw new Error(`Unsupported PNG filter: ${filter}`)

      recon[outOff + x] = val
    }

    inOff += stride
    outOff += stride
  }

  if (channels === 3) {
    return { width, height, rgb: recon }
  }

  const rgb = Buffer.alloc(width * height * 3)
  const alpha = Buffer.alloc(width * height)
  for (let i = 0, p = 0, a = 0; i < recon.length; i += 4, p += 3, a += 1) {
    rgb[p] = recon[i]
    rgb[p + 1] = recon[i + 1]
    rgb[p + 2] = recon[i + 2]
    alpha[a] = recon[i + 3]
  }

  return { width, height, rgb, alpha }
}

async function loadLogo(): Promise<PngDecoded | null> {
  if (cachedLogo) return cachedLogo
  const logoPath = fileURLToPath(new URL('../../../../logo-white-2.png', import.meta.url))
  try {
    const buf = await readFile(logoPath)
    cachedLogo = decodePng(buf)
    return cachedLogo
  } catch {
    return null
  }
}

function wrapText(text: string, maxChars: number) {
  const t = text.trim()
  if (!t) return ['—']
  if (t.length <= maxChars) return [t]
  const out: string[] = []
  const words = t.split(/\s+/)
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (next.length <= maxChars) {
      line = next
      continue
    }
    if (line) out.push(line)
    line = w
  }
  if (line) out.push(line)
  return out.length ? out : ['—']
}

function buildProfilePdf(input: {
  title: string
  subtitle: string
  logo?: PngDecoded | null
  sections: Array<{ title: string; rows: Array<{ label: string; value: string }> }>
  generatedAtIso: string
}) {
  // Minimal PDF 1-page document with boxed layout and two fonts.
  const header = Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'binary')

  const pageW = 612
  const pageH = 792
  const margin = 48
  const gap = 16
  const colW = Math.floor((pageW - margin * 2 - gap) / 2)
  const row1H = 160
  const row2H = 252
  const row1TopY = pageH - margin - 80
  const row2TopY = row1TopY - row1H - gap

  const x1 = margin
  const x2 = margin + colW + gap

  const cmd: string[] = []

  function rect(x: number, yTop: number, w: number, h: number) {
    const y = yTop - h
    cmd.push('q')
    cmd.push('1 w')
    cmd.push('0.20 0.24 0.32 RG') // stroke color (slate-ish)
    cmd.push(`${x} ${y} ${w} ${h} re`)
    cmd.push('S')
    cmd.push('Q')
  }

  function text(font: 'F1' | 'F2', size: number, x: number, y: number, value: string) {
    const t = pdfEscapeText(value)
    cmd.push('BT')
    cmd.push(`/${font} ${size} Tf`)
    cmd.push('0 0 0 rg')
    cmd.push(`${x} ${y} Td`)
    cmd.push(`(${t}) Tj`)
    cmd.push('ET')
  }

  function grayText(font: 'F1' | 'F2', size: number, x: number, y: number, value: string) {
    const t = pdfEscapeText(value)
    cmd.push('BT')
    cmd.push(`/${font} ${size} Tf`)
    cmd.push('0.60 0.64 0.72 rg')
    cmd.push(`${x} ${y} Td`)
    cmd.push(`(${t}) Tj`)
    cmd.push('ET')
  }

  // Header
  const logoTargetH = 26
  const logoW =
    input.logo && input.logo.height ? Math.round((input.logo.width * logoTargetH) / input.logo.height) : 0
  const headerX = margin + (logoW ? logoW + 12 : 0)
  const titleY = pageH - margin + 2
  const subtitleY = pageH - margin - 18

  if (input.logo && logoW) {
    const logoX = margin
    const logoY = titleY - logoTargetH + 4
    cmd.push('q')
    cmd.push(`${logoW} 0 0 ${logoTargetH} ${logoX} ${logoY} cm`)
    cmd.push('/Im1 Do')
    cmd.push('Q')
  }

  text('F2', 18, headerX, titleY, input.title)
  grayText('F1', 11, headerX, subtitleY, input.subtitle)

  // Boxes (2x2)
  rect(x1, row1TopY, colW, row1H)
  rect(x2, row1TopY, colW, row1H)
  rect(x1, row2TopY, colW, row2H)
  rect(x2, row2TopY, colW, row2H)

  const boxes = [
    { x: x1, topY: row1TopY, w: colW, h: row1H },
    { x: x2, topY: row1TopY, w: colW, h: row1H },
    { x: x1, topY: row2TopY, w: colW, h: row2H },
    { x: x2, topY: row2TopY, w: colW, h: row2H }
  ]

  // Section content
  for (let i = 0; i < Math.min(input.sections.length, boxes.length); i++) {
    const s = input.sections[i]
    const b = boxes[i]
    const pad = 14
    const titleY = b.topY - 22
    text('F2', 12, b.x + pad, titleY, s.title)

    let cursorY = titleY - 20
    const labelX = b.x + pad
    const valueX = b.x + pad + 140
    const maxValueChars = 26

    for (const r of s.rows) {
      if (cursorY < b.topY - b.h + 18) break
      grayText('F1', 9, labelX, cursorY, r.label)
      const wrapped = wrapText(r.value, maxValueChars)
      for (let wi = 0; wi < wrapped.length; wi++) {
        if (cursorY < b.topY - b.h + 18) break
        text('F1', 10, valueX, cursorY, wrapped[wi])
        if (wi < wrapped.length - 1) cursorY -= 12
      }
      cursorY -= 16
    }
  }

  // Footer
  grayText('F1', 9, margin, margin - 6, `Generated: ${input.generatedAtIso}`)

  const contentStream = Buffer.from(cmd.join('\n') + '\n', 'utf8')
  const contentLen = contentStream.length

  const hasLogo = Boolean(input.logo && input.logo.width && input.logo.height && input.logo.rgb.length > 0)
  const hasAlpha = Boolean(hasLogo && input.logo?.alpha && input.logo.alpha.length > 0)

  const objectBuffers: Buffer[] = []

  const obj1 = Buffer.from('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n', 'ascii')
  const obj2 = Buffer.from('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n', 'ascii')

  const xObjectPart = hasLogo ? ' /XObject << /Im1 7 0 R >>' : ''
  const obj3 = Buffer.from(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 4 0 R /F2 6 0 R >>${xObjectPart} >> /Contents 5 0 R >>\nendobj\n`,
    'ascii'
  )

  const obj4 = Buffer.from('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n', 'ascii')
  const obj6 = Buffer.from('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n', 'ascii')

  const obj5Head = Buffer.from(`5 0 obj\n<< /Length ${contentLen} >>\nstream\n`, 'ascii')
  const obj5Tail = Buffer.from('\nendstream\nendobj\n', 'ascii')
  const obj5 = Buffer.concat([obj5Head, contentStream, obj5Tail])

  objectBuffers.push(obj1, obj2, obj3, obj4, obj5, obj6)

  if (hasLogo) {
    const rgbCompressed = deflateSync(input.logo!.rgb)
    const smaskPart = hasAlpha ? ' /SMask 8 0 R' : ''
    const obj7Head = Buffer.from(
      `7 0 obj\n<< /Type /XObject /Subtype /Image /Width ${input.logo!.width} /Height ${input.logo!.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${rgbCompressed.length}${smaskPart} >>\nstream\n`,
      'ascii'
    )
    const obj7Tail = Buffer.from('\nendstream\nendobj\n', 'ascii')
    const obj7 = Buffer.concat([obj7Head, rgbCompressed, obj7Tail])
    objectBuffers.push(obj7)

    if (hasAlpha) {
      const aCompressed = deflateSync(input.logo!.alpha!)
      const obj8Head = Buffer.from(
        `8 0 obj\n<< /Type /XObject /Subtype /Image /Width ${input.logo!.width} /Height ${input.logo!.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${aCompressed.length} >>\nstream\n`,
        'ascii'
      )
      const obj8Tail = Buffer.from('\nendstream\nendobj\n', 'ascii')
      const obj8 = Buffer.concat([obj8Head, aCompressed, obj8Tail])
      objectBuffers.push(obj8)
    }
  }

  const offsets: number[] = [0] // xref index 0 is the free object
  let cursor = header.length
  for (const b of objectBuffers) {
    offsets.push(cursor)
    cursor += b.length
  }

  const xrefStart = cursor
  const xrefLines: string[] = []
  xrefLines.push(`xref\n0 ${objectBuffers.length + 1}\n`)
  xrefLines.push('0000000000 65535 f \n')
  for (let i = 1; i < offsets.length; i++) {
    xrefLines.push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`)
  }
  const xref = Buffer.from(xrefLines.join(''), 'ascii')

  const trailer = Buffer.from(
    `trailer\n<< /Size ${objectBuffers.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`,
    'ascii'
  )

  return Buffer.concat([header, ...objectBuffers, xref, trailer])
}

export default defineEventHandler(async (event) => {
  const employeeKey = getRouterParam(event, 'employeeKey')
  if (!employeeKey) {
    throw createError({ statusCode: 400, statusMessage: 'employeeKey is required' })
  }

  const employee = await getEmployeeByKey(employeeKey)
  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const generatedAtIso = new Date().toISOString()
  const logo = await loadLogo()
  const pdf = buildProfilePdf({
    title: 'Employee Profile',
    subtitle: employee.name || '—',
    logo,
    generatedAtIso,
    sections: [
      {
        title: 'Personal',
        rows: [
          { label: 'Name', value: employee.name || '—' },
          { label: 'Gender', value: employee.gender || '—' }
        ]
      },
      {
        title: 'Organization',
        rows: [
          { label: 'Department', value: employee.department || '—' },
          { label: 'Position', value: employee.position || '—' },
          { label: 'Reporting To', value: employee.reportingTo || '—' },
          { label: 'Country Assigned', value: employee.countryAssigned || '—' }
        ]
      },
      {
        title: 'Employment',
        rows: [
          { label: 'Employee Key', value: employee.employeeKey },
          { label: 'Status', value: employee.employeeStatus || '—' },
          { label: 'Start Date', value: employee.startDate || '—' },
          { label: 'Contract/Prob. End', value: employee.contractOrProbationEndDate || '—' },
          { label: 'Employee Type', value: employee.employeeType || '—' },
          { label: 'Employment Status', value: employee.employmentStatus || '—' }
        ]
      },
      {
        title: 'Compensation',
        rows: [
          { label: 'Monthly Salary', value: employee.monthlySalary || '—' },
          { label: 'Allowances', value: employee.allowances || '—' },
          { label: 'Gross Salary', value: employee.grossSalary || '—' },
          { label: 'Type of Allowance', value: employee.typeOfAllowance || '—' }
        ]
      }
    ]
  })

  setHeader(event, 'content-type', 'application/pdf')
  setHeader(event, 'content-disposition', `attachment; filename="employee-${employeeKey}.pdf"`)
  return pdf
})

