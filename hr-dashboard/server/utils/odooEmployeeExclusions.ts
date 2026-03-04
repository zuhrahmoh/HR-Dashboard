import type { Employee } from './employees'

function normName(input: string) {
  return (input ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const EXCLUDED_EXACT_NAMES = new Set(
  [
    'Administrator',
    'RampsBot',
    'Tatiana Paris',
    'Heather Rampersad',
    'Maria Covaleda',
    'Chayenne Fraser',
    'Aneesa Singh',
    'Deron Seepaul',
    'Krishendath Maharaj',
    'Aki',
    'Akini',
    'Aruna',
    'Greg'
  ].map(normName)
)

function isClearlyInvalidSingleNameAccount(e: Employee) {
  const name = normName(e.name)
  if (!name) return false
  const parts = name.split(' ').filter(Boolean)
  if (parts.length !== 1) return false
  const token = parts[0] ?? ''
  if (token.length < 3 || token.length > 20) return false
  if (/\d/.test(token)) return false

  // Conservative: only exclude when the record is "too empty" to be a legitimate employee profile.
  const hasDepartment = Boolean((e.department ?? '').trim())
  const hasPosition = Boolean((e.position ?? '').trim())
  const hasEmail = Boolean((e.workEmail ?? '').trim()) || Boolean((e.personalEmail ?? '').trim())
  const hasPhone = Boolean((e.workPhone ?? '').trim()) || Boolean((e.personalPhone ?? '').trim())
  const hasStartDate = Boolean(e.startDate)

  return !(hasDepartment || hasPosition || hasEmail || hasPhone || hasStartDate)
}

export function shouldExcludeOdooEmployee(e: Employee) {
  const name = normName(e.name)
  if (name && EXCLUDED_EXACT_NAMES.has(name)) return true
  if (isClearlyInvalidSingleNameAccount(e)) return true
  return false
}

