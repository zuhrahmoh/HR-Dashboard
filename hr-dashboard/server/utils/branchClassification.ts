export const BRANCH_COUNTRIES = [
  'Trinidad and Tobago',
  'Guyana',
  'Houston',
  'Suriname',
  'El Dorado Offshore GY',
  'El Dorado Offshore TT',
  'Mexico',
  'Colombia'
] as const

export type BranchCountry = (typeof BRANCH_COUNTRIES)[number]

function norm(input: unknown) {
  const s = String(input ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, '-') // normalize dash variants
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  return s
}

function hasAny(haystack: string, needles: string[]) {
  for (const n of needles) {
    if (!n) continue
    if (haystack.includes(n)) return true
  }
  return false
}

function hasToken(haystack: string, token: string) {
  const t = token.trim()
  if (!t) return false
  if (t.includes(' ')) return haystack.includes(t)
  return new RegExp(`(?:^|\\s)${t}(?:\\s|$)`, 'i').test(haystack)
}

function title(input: BranchCountry): BranchCountry {
  return input
}

export function classifyBranchCountry(input: {
  companyName?: string | null
  workAddress?: string | null
  fallbackCountry?: string | null
}): BranchCountry {
  const company = norm(input.companyName)
  const addr = norm(input.workAddress)
  const fallback = norm(input.fallbackCountry)
  const all = `${company} ${addr} ${fallback}`.trim()

  // El Dorado Offshore (GY / TT)
  if (hasAny(all, ['el dorado offshore', 'eldorado offshore', 'el dorado'])) {
    if (hasAny(all, ['guyana', 'georgetown', 'demerara']) || hasToken(all, 'gy')) return title('El Dorado Offshore GY')
    if (hasAny(all, ['trinidad', 'tobago', 'cunupia', 'port of spain', 'chaguanas']) || hasToken(all, 'tt'))
      return title('El Dorado Offshore TT')
  }

  // Houston (Ramps Logistics LLC / Ramps Logistics Houston)
  if (
    hasAny(all, ['houston', 'texas', 'united states', 'usa']) ||
    hasToken(all, 'tx') ||
    company.includes('llc') ||
    company.includes('houston')
  ) {
    return title('Houston')
  }

  // Specific country branches
  if (hasAny(all, ['suriname', 'paramaribo'])) return title('Suriname')
  if (hasAny(all, ['mexico', 'méxico', 'cdmx', 'mexico city'])) return title('Mexico')
  if (hasAny(all, ['colombia', 'columbia', 'bogota', 'barranquilla', 'medellin'])) return title('Colombia')
  if (hasAny(all, ['guyana', 'georgetown'])) return title('Guyana')
  if (hasAny(all, ['trinidad', 'tobago', 'cunupia', 'port of spain'])) return title('Trinidad and Tobago')

  // Company-name fallbacks (when address isn't available)
  if (hasAny(company, ['guyana'])) return title('Guyana')
  if (hasAny(company, ['suriname'])) return title('Suriname')
  if (hasAny(company, ['mexico'])) return title('Mexico')
  if (hasAny(company, ['colombia', 'columbia'])) return title('Colombia')
  if (hasAny(company, ['limited', 'ltd'])) return title('Trinidad and Tobago')

  // Last-resort mapping from Odoo-provided country value.
  if (hasAny(fallback, ['guyana'])) return title('Guyana')
  if (hasAny(fallback, ['suriname'])) return title('Suriname')
  if (hasAny(fallback, ['mexico'])) return title('Mexico')
  if (hasAny(fallback, ['colombia', 'columbia'])) return title('Colombia')
  if (hasAny(fallback, ['trinidad', 'tobago', 'tt'])) return title('Trinidad and Tobago')

  // Must always return one of the allowed categories.
  return title('Trinidad and Tobago')
}

export function sortBranchCountries(values: string[]): BranchCountry[] {
  const present = new Set(values.map((v) => String(v ?? '').trim()).filter(Boolean))
  return BRANCH_COUNTRIES.filter((c) => present.has(c))
}

