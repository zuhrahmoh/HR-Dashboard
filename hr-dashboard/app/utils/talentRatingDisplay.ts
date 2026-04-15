const STAR_BY_GRADE: Record<string, number> = {
  C: 1,
  'B-': 2,
  B: 3,
  'B+': 4,
  A: 5
}

function normalizeGradeToken(raw: string): string {
  const g = raw.trim().toLowerCase()
  if (g === 'a') return 'A'
  if (g === 'b+') return 'B+'
  if (g === 'b-') return 'B-'
  if (g === 'b') return 'B'
  if (g === 'c') return 'C'
  if (!g) return raw.trim()
  return g.charAt(0).toUpperCase() + g.slice(1).toLowerCase()
}

/** Grade token for star lookup (e.g. `"A Player"` → `"A"`, `"b+ leader"` → `"B+"`). */
export function talentRatingGradeKey(display: string | undefined | null): string {
  if (display == null) return ''
  const first = String(display).trim().split(/\s+/)[0] ?? ''
  const u = first.toUpperCase()
  if (u === 'B+') return 'B+'
  if (u === 'B-') return 'B-'
  if (u === 'A' || u === 'B' || u === 'C') return u
  return ''
}

export function talentRatingStarsFromDisplay(display: string | undefined | null): number {
  const key = talentRatingGradeKey(display)
  return STAR_BY_GRADE[key] ?? 0
}

/**
 * Normalizes Odoo talent strings: grade as A/B/B+/B-/C and role suffix as Leader or Player.
 */
export function formatTalentRatingDisplay(raw: string | undefined | null): string | undefined {
  if (raw == null) return undefined
  const s = String(raw).trim()
  if (!s) return undefined

  const m = /^(.+?)\s+(leader|player)$/i.exec(s)
  if (m) {
    const gradeRaw = m[1] ?? ''
    const roleRaw = m[2] ?? ''
    const role = roleRaw.toLowerCase() === 'leader' ? 'Leader' : 'Player'
    return `${normalizeGradeToken(gradeRaw)} ${role}`
  }

  const parts = s.split(/\s+/).filter(Boolean)
  const last = parts[parts.length - 1]?.toLowerCase()
  if (last === 'leader' || last === 'player') {
    const gradePart = parts.slice(0, -1).join(' ')
    if (gradePart) {
      const role = last === 'leader' ? 'Leader' : 'Player'
      return `${normalizeGradeToken(gradePart)} ${role}`
    }
  }

  if (/^[abc][+-]?$/i.test(s)) return normalizeGradeToken(s)
  return s
}
