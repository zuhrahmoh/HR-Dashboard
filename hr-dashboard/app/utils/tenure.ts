function parseTenureParts(raw: string | undefined): { y: number; mo: number; d: number; fallback: string } | null {
  if (!raw?.trim()) return null
  const s = raw.trim()
  const yMatch = /Years?:\s*(\d+)/i.exec(s)
  const mMatch = /Months?:\s*(\d+)/i.exec(s)
  const dMatch = /Days?:\s*(\d+)/i.exec(s)
  if (!yMatch && !mMatch && !dMatch) return { y: 0, mo: 0, d: 0, fallback: s }
  const y = yMatch ? Number(yMatch[1]) : 0
  const mo = mMatch ? Number(mMatch[1]) : 0
  const d = dMatch ? Number(dMatch[1]) : 0
  if (y === 0 && mo === 0 && d === 0) return null
  return { y, mo, d, fallback: s }
}

function unit(n: number, one: string, many: string) {
  return n === 1 ? `1 ${one}` : `${n} ${many}`
}

/** Full words for tables (e.g. "5 months", "1 year, 2 months"). */
export function formatTenureReadable(raw: string | undefined) {
  const parsed = parseTenureParts(raw)
  if (!parsed) return '—'
  const { y, mo, d, fallback } = parsed
  if (y === 0 && mo === 0 && d === 0) return fallback
  const parts: string[] = []
  if (y > 0) parts.push(unit(y, 'year', 'years'))
  if (mo > 0) parts.push(unit(mo, 'month', 'months'))
  if (d > 0 && y === 0 && mo === 0) parts.push(unit(d, 'day', 'days'))
  return parts.join(', ') || '—'
}
