import type { Employee } from './employees'

function normName(input: string) {
  const s = (input ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return s
}

function normEmail(input: unknown) {
  const s = String(input ?? '').trim().toLowerCase()
  return s && s.includes('@') ? s : ''
}

function odooIdFromKey(employeeKey: string) {
  const m = /^odoo-(\d+)$/.exec((employeeKey ?? '').trim())
  return m ? Number(m[1]) : null
}

function isActive(e: Employee) {
  return (e.employeeStatus ?? '').trim().toLowerCase() === 'active'
}

function populatedScore(e: Employee) {
  // Intentionally exclude fields that are always present / derived (e.g., countryAssigned).
  const candidates: Array<unknown> = [
    e.workEmail,
    e.personalEmail,
    e.workPhone,
    e.personalPhone,
    e.companyName,
    e.department,
    e.position,
    e.reportingTo,
    e.manager,
    e.elt,
    e.startDate,
    e.contractStartDate,
    e.contractEndDate,
    e.probationEndDate,
    e.contractOrProbationEndDate,
    e.employeeType,
    e.gender,
    e.birthDate,
    e.talentRating,
    e.tenure,
    e.departureReason,
    e.separatedAt
  ]
  let score = 0
  for (const v of candidates) {
    if (typeof v === 'string') {
      if (v.trim()) score += 1
    } else if (v != null) {
      score += 1
    }
  }
  return score
}

function stripTrailingSingleLetterToken(nameNorm: string) {
  const parts = nameNorm.split(' ').filter(Boolean)
  if (parts.length >= 2 && parts[parts.length - 1]!.length === 1) {
    return parts.slice(0, -1).join(' ')
  }
  return null
}

function stripLastCharOfLastToken(nameNorm: string) {
  const parts = nameNorm.split(' ').filter(Boolean)
  if (parts.length < 1) return null
  const last = parts[parts.length - 1]!
  if (last.length >= 4 && /[A-Z]$/.test(last)) {
    const shorter = last.slice(0, -1)
    return [...parts.slice(0, -1), shorter].filter(Boolean).join(' ')
  }
  return null
}

type UF = { parent: number[]; find: (x: number) => number; union: (a: number, b: number) => void }
function uf(n: number): UF {
  const parent = Array.from({ length: n }, (_, i) => i)
  const find = (x: number): number => {
    let p = parent[x]!
    while (p !== parent[p]!) p = parent[p]!
    // path compression
    let cur = x
    while (parent[cur]! !== p) {
      const next = parent[cur]!
      parent[cur] = p
      cur = next
    }
    return p
  }
  const union = (a: number, b: number) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[rb] = ra
  }
  return { parent, find, union }
}

export function dedupeOdooEmployees(employees: Employee[]): Employee[] {
  const n = employees.length
  if (n <= 1) return employees

  const names = employees.map((e) => normName(e.name))
  const nameSet = new Set(names.filter(Boolean))

  const scores = employees.map(populatedScore)

  const byName = new Map<string, number[]>()
  const byEmail = new Map<string, number[]>()

  for (let i = 0; i < n; i++) {
    const name = names[i]!
    if (name) {
      const arr = byName.get(name) ?? []
      arr.push(i)
      byName.set(name, arr)
    }

    const email = normEmail(employees[i]!.workEmail) || normEmail(employees[i]!.personalEmail)
    if (email) {
      const arr = byEmail.get(email) ?? []
      arr.push(i)
      byEmail.set(email, arr)
    }
  }

  const u = uf(n)

  // Exact-name duplicates always group.
  for (const idxs of byName.values()) {
    if (idxs.length < 2) continue
    const [first, ...rest] = idxs as [number, ...number[]]
    for (const j of rest) u.union(first, j)
  }

  // Email duplicates always group.
  for (const idxs of byEmail.values()) {
    if (idxs.length < 2) continue
    const [first, ...rest] = idxs as [number, ...number[]]
    for (const j of rest) u.union(first, j)
  }

  // Conservative near-duplicate grouping: strip a trailing token or trailing char when the "base" exists.
  // Only apply when the candidate record is relatively sparse (to reduce false positives).
  const baseMaxScore = new Map<string, number>()
  for (const [name, idxs] of byName.entries()) {
    let m = 0
    for (const i of idxs) m = Math.max(m, scores[i]!)
    baseMaxScore.set(name, m)
  }

  for (let i = 0; i < n; i++) {
    const name = names[i]!
    if (!name) continue

    const s = scores[i]!
    const v1 = stripTrailingSingleLetterToken(name)
    const v2 = stripLastCharOfLastToken(name)

    const base = v1 && nameSet.has(v1) ? v1 : v2 && nameSet.has(v2) ? v2 : null
    if (!base || base === name) continue

    const baseScore = baseMaxScore.get(base) ?? 0
    const sparse = s <= 3 || baseScore >= s + 2
    if (!sparse) continue

    const baseIdxs = byName.get(base) ?? []
    for (const j of baseIdxs) u.union(i, j)
  }

  // Build groups.
  const groups = new Map<number, number[]>()
  for (let i = 0; i < n; i++) {
    const root = u.find(i)
    const arr = groups.get(root) ?? []
    arr.push(i)
    groups.set(root, arr)
  }

  // Pick canonical record per group: highest populated score, then active (tie-break), then highest Odoo ID.
  const picked = new Set<number>()
  for (const idxs of groups.values()) {
    if (idxs.length === 1) {
      picked.add(idxs[0]!)
      continue
    }
    let best = idxs[0]!
    for (const i of idxs.slice(1)) {
      const a = employees[best]!
      const b = employees[i]!
      const sa = scores[best]!
      const sb = scores[i]!
      if (sb > sa) {
        best = i
        continue
      }
      if (sb < sa) continue
      const aa = isActive(a) ? 1 : 0
      const ab = isActive(b) ? 1 : 0
      if (ab > aa) {
        best = i
        continue
      }
      if (ab < aa) continue
      const ida = odooIdFromKey(a.employeeKey) ?? -1
      const idb = odooIdFromKey(b.employeeKey) ?? -1
      if (idb > ida) best = i
    }
    picked.add(best)
  }

  return employees.filter((_, i) => picked.has(i))
}

