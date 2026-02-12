import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { inflateSync, deflateSync } from 'node:zlib'

function pdfEscapeText(input: string) {
  return input.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

export type PngDecoded = {
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

export async function loadLogo(): Promise<PngDecoded | null> {
  if (cachedLogo) return cachedLogo
  const logoPath = fileURLToPath(new URL('../../logo-white-2.png', import.meta.url))
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

export function buildProfilePdf(input: {
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
  const logoW = input.logo && input.logo.height ? Math.round((input.logo.width * logoTargetH) / input.logo.height) : 0
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

const K = 0.5522847498

function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const a = r * (1 - K)
  const b = r * K
  return [
    `${x + r} ${y} m`,
    `${x + w - r} ${y} l`,
    `${x + w - a} ${y} ${x + w} ${y + b} ${x + w} ${y + r} c`,
    `${x + w} ${y + h - r} l`,
    `${x + w} ${y + h - b} ${x + w - a} ${y + h} ${x + w - r} ${y + h} c`,
    `${x + r} ${y + h} l`,
    `${x + b} ${y + h} ${x} ${y + h - b} ${x} ${y + h - r} c`,
    `${x} ${y + r} l`,
    `${x} ${y + b} ${x + b} ${y} ${x + r} ${y} c`,
    'h'
  ].join('\n')
}

function drawRoundedCard(
  cmd: string[],
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  shadowOffset: number
) {
  const path = roundedRectPath(x, y, w, h, r)
  const pathShadow = roundedRectPath(x + shadowOffset, y - shadowOffset, w, h, r)
  cmd.push('q')
  cmd.push('0.88 0.88 0.90 rg')
  cmd.push(pathShadow)
  cmd.push('f')
  cmd.push('Q')
  cmd.push('q')
  cmd.push('1 1 1 rg')
  cmd.push(path)
  cmd.push('f')
  cmd.push('0.85 0.85 0.88 RG')
  cmd.push('0.5 w')
  cmd.push(path)
  cmd.push('S')
  cmd.push('Q')
}

function drawShadedBox(cmd: string[], x: number, y: number, w: number, h: number, r: number) {
  const path = roundedRectPath(x, y, w, h, r)
  cmd.push('q')
  cmd.push('0.94 0.94 0.96 rg')
  cmd.push(path)
  cmd.push('f')
  cmd.push('Q')
}

export type ProfileCardInput = {
  title: string
  subtitle: string
  logo?: PngDecoded | null
  generatedAtIso: string
  primary: {
    initials: string
    name: string
    position: string
    employeeStatus: string
    employeeType: string
    department: string
    countryAssigned: string
    reportingTo: string
  }
  contact: { workEmail: string; workPhone: string; personalPhone: string }
  employment: {
    startDate: string
    tenure: string
    contractOrProbationEnd: string
    gender: string
    employeeKey: string
  }
  talent: { talentRating: string }
}

export function buildProfilePdfCardLayout(input: ProfileCardInput): Buffer {
  const header = Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'binary')
  const pageW = 612
  const pageH = 792
  const margin = 40
  const radius = 10
  const shadowOff = 4

  const contentTopY = pageH - margin - 56
  const gap = 24
  const row1H = 168
  const row2H = 108
  const row3H = 78
  const row4H = 58
  const fullW = pageW - margin * 2

  const card1Y = contentTopY - row1H
  const card2Y = card1Y - gap - row2H
  const card3Y = card2Y - gap - row3H
  const card4Y = card3Y - gap - row4H

  const cmd: string[] = []

  function text(font: 'F1' | 'F2', size: number, x: number, y: number, value: string) {
    const t = pdfEscapeText(value)
    cmd.push('BT')
    cmd.push(`/${font} ${size} Tf`)
    cmd.push('0.15 0.15 0.18 rg')
    cmd.push(`${x} ${y} Td`)
    cmd.push(`(${t}) Tj`)
    cmd.push('ET')
  }

  function grayText(font: 'F1' | 'F2', size: number, x: number, y: number, value: string) {
    const t = pdfEscapeText(value)
    cmd.push('BT')
    cmd.push(`/${font} ${size} Tf`)
    cmd.push('0.45 0.48 0.55 rg')
    cmd.push(`${x} ${y} Td`)
    cmd.push(`(${t}) Tj`)
    cmd.push('ET')
  }

  const logoTargetH = 24
  const logoW =
    input.logo && input.logo.height
      ? Math.round((input.logo.width * logoTargetH) / input.logo.height)
      : 0
  const headerX = margin + (logoW ? logoW + 10 : 0)
  const titleY = pageH - margin + 2
  const subtitleY = pageH - margin - 16

  if (input.logo && logoW) {
    const logoX = margin
    const logoY = titleY - logoTargetH + 2
    cmd.push('q')
    cmd.push(`${logoW} 0 0 ${logoTargetH} ${logoX} ${logoY} cm`)
    cmd.push('/Im1 Do')
    cmd.push('Q')
  }

  text('F2', 16, headerX, titleY, input.title)
  grayText('F1', 10, headerX, subtitleY, input.subtitle)

  drawRoundedCard(cmd, margin, card1Y, fullW, row1H, radius, shadowOff)
  drawRoundedCard(cmd, margin, card2Y, fullW, row2H, radius, shadowOff)
  drawRoundedCard(cmd, margin, card3Y, fullW, row3H, radius, shadowOff)
  drawRoundedCard(cmd, margin, card4Y, fullW, row4H, radius, shadowOff)

  const pad = 18
  const lineGap = 18
  const rowGap = 14

  function row(
    font: 'F1' | 'F2',
    label: string,
    value: string,
    lx: number,
    vx: number,
    y: number,
    lineSpacing: number
  ) {
    grayText(font, 9, lx, y, label)
    const v = value || '—'
    const lines = wrapText(v, 40)
    text(font, 10, vx, y, lines[0])
    return y - lineSpacing
  }

  const primaryLeft = margin + pad
  const primaryRight = margin + fullW - pad
  let y = card1Y + row1H - 22
  text('F2', 11, primaryLeft, y, input.primary.initials)
  y -= 16
  text('F2', 12, primaryLeft + 24, y, input.primary.name)
  grayText('F1', 9, primaryLeft + 24, y - 12, input.primary.position || '—')
  y -= 28
  text('F1', 9, primaryLeft, y, input.primary.employeeStatus || '—')
  if (input.primary.employeeType) {
    text('F1', 9, primaryLeft + 44, y, input.primary.employeeType)
  }
  y -= 28
  const boxInset = 10
  const boxX = primaryLeft + boxInset
  const boxW = fullW - pad * 2 - boxInset * 2
  const boxH = 72
  const boxY = y - boxH
  drawShadedBox(cmd, boxX, boxY, boxW, boxH, 6)
  y = boxY + boxH - 16
  y = row('F1', 'Department', input.primary.department, primaryLeft + boxInset + 8, primaryRight - boxInset - 120, y, rowGap)
  y = row('F1', 'Country', input.primary.countryAssigned, primaryLeft + boxInset + 8, primaryRight - boxInset - 120, y, rowGap)
  row('F1', 'Reporting To', input.primary.reportingTo, primaryLeft + boxInset + 8, primaryRight - boxInset - 120, y, rowGap)

  const contactLeft = margin + pad
  y = card2Y + row2H - 24
  text('F2', 12, contactLeft, y, 'Contact')
  y -= lineGap
  y = row('F1', 'Work Email', input.contact.workEmail, contactLeft, contactLeft + 90, y, rowGap)
  y = row('F1', 'Work Phone', input.contact.workPhone, contactLeft, contactLeft + 90, y, rowGap)
  row('F1', 'Personal Phone', input.contact.personalPhone, contactLeft, contactLeft + 90, y, rowGap)

  const empLeft = margin + pad
  y = card3Y + row3H - 24
  text('F2', 12, empLeft, y, 'Employment')
  y -= lineGap
  const empW = fullW - pad * 2
  const seg = empW / 5
  const empX1 = empLeft
  const empX2 = empLeft + seg
  const empX3 = empLeft + seg * 2
  const empX4 = empLeft + seg * 3
  const empX5 = empLeft + seg * 4
  grayText('F1', 9, empX1, y, 'Start Date')
  text('F1', 10, empX1, y - 12, wrapText(input.employment.startDate, 12)[0])
  grayText('F1', 9, empX2, y, 'Tenure')
  text('F1', 10, empX2, y - 12, wrapText(input.employment.tenure, 12)[0])
  grayText('F1', 9, empX3, y, 'Contract/Probation End')
  text('F1', 10, empX3, y - 12, wrapText(input.employment.contractOrProbationEnd, 12)[0])
  grayText('F1', 9, empX4, y, 'Gender')
  text('F1', 10, empX4, y - 12, wrapText(input.employment.gender, 10)[0])
  grayText('F1', 9, empX5, y, 'Employee Key')
  text('F1', 10, empX5, y - 12, wrapText(input.employment.employeeKey, 14)[0])

  const talentLeft = margin + pad
  y = card4Y + row4H - 20
  text('F2', 12, talentLeft, y, 'Talent')
  y -= lineGap
  grayText('F1', 10, talentLeft, y, 'Rating')
  text('F1', 10, talentLeft + 44, y, input.talent.talentRating || '—')

  grayText('F1', 8, margin, margin - 4, `Generated: ${input.generatedAtIso}`)

  const contentStream = Buffer.from(cmd.join('\n') + '\n', 'utf8')
  const contentLen = contentStream.length
  const hasLogo = Boolean(
    input.logo && input.logo.width && input.logo.height && input.logo.rgb.length > 0
  )
  const hasAlpha = Boolean(hasLogo && input.logo?.alpha && input.logo.alpha.length > 0)

  const obj5 = Buffer.concat([
    Buffer.from(`5 0 obj\n<< /Length ${contentLen} >>\nstream\n`, 'ascii'),
    contentStream,
    Buffer.from('\nendstream\nendobj\n', 'ascii')
  ])

  const objectBuffers: Buffer[] = []
  objectBuffers.push(
    Buffer.from('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n', 'ascii'),
    Buffer.from('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n', 'ascii')
  )
  const xObjectPart = hasLogo ? ' /XObject << /Im1 7 0 R >>' : ''
  objectBuffers.push(
    Buffer.from(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 4 0 R /F2 6 0 R >>${xObjectPart} >> /Contents 5 0 R >>\nendobj\n`,
      'ascii'
    )
  )
  objectBuffers.push(
    Buffer.from('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n', 'ascii'),
    obj5,
    Buffer.from(
      '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
      'ascii'
    )
  )

  if (hasLogo) {
    const rgbCompressed = deflateSync(input.logo!.rgb)
    const smaskPart = hasAlpha ? ' /SMask 8 0 R' : ''
    objectBuffers.push(
      Buffer.from(
        `7 0 obj\n<< /Type /XObject /Subtype /Image /Width ${input.logo!.width} /Height ${input.logo!.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${rgbCompressed.length}${smaskPart} >>\nstream\n`,
        'ascii'
      ),
      rgbCompressed,
      Buffer.from('\nendstream\nendobj\n', 'ascii')
    )
    if (hasAlpha) {
      const aCompressed = deflateSync(input.logo!.alpha!)
      objectBuffers.push(
        Buffer.from(
          `8 0 obj\n<< /Type /XObject /Subtype /Image /Width ${input.logo!.width} /Height ${input.logo!.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${aCompressed.length} >>\nstream\n`,
          'ascii'
        ),
        aCompressed,
        Buffer.from('\nendstream\nendobj\n', 'ascii')
      )
    }
  }

  let cursor = header.length
  const offsets: number[] = [0]
  for (const b of objectBuffers) {
    offsets.push(cursor)
    cursor += b.length
  }
  const xrefStart = cursor
  const xrefLines: string[] = [
    'xref\n0 ' + (objectBuffers.length + 1) + '\n',
    '0000000000 65535 f \n'
  ]
  for (let i = 1; i < offsets.length; i++) {
    xrefLines.push(String(offsets[i]).padStart(10, '0') + ' 00000 n \n')
  }
  const xref = Buffer.from(xrefLines.join(''), 'ascii')
  const trailer = Buffer.from(
    `trailer\n<< /Size ${objectBuffers.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`,
    'ascii'
  )
  return Buffer.concat([header, ...objectBuffers, xref, trailer])
}

