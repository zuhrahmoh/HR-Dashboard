/// <reference types="node" />
import { createHash } from 'crypto'
import { readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'

export type Employee = {
  employeeKey: string
  name: string
  department: string
  position: string
  startDate: string | null
  birthDate?: string | null
  countryAssigned: string
  employeeStatus: string
  // Common extra CSV fields (read-only; optional)
  gender?: string
  reportingTo?: string
  email?: string
  phone?: string
  workEmail?: string
  personalEmail?: string
  workPhone?: string
  personalPhone?: string
  employeeType?: string
  employmentStatus?: string
  contractOrProbationEndDate?: string | null
  talentRating?: string
  departureReason?: string
  separatedAt?: string | null
  createdAt?: string | null
  tenure?: string
  monthlySalary?: string
  allowances?: string
  grossSalary?: string
  typeOfAllowance?: string
}

type CanonicalRow = Record<string, string>

const EMPLOYEE_KEY_MIN_LEN = 12

let cached:
  | {
      csvPath: string
      mtimeMs: number
      employees: Employee[]
    }
  | null = null

function normalizeHeader(header: string) {
  return header.trim().replace(/\s+/g, ' ').toLowerCase()
}

function canonicalHeaderKey(rawHeader: string) {
  const h = normalizeHeader(rawHeader)
  if (h === 'country assigsned' || h === 'country assigned') return 'countryAssigned'
  if (h === 'start date') return 'startDate'
  if (h === 'date of birth' || h === 'dob' || h === 'birth date' || h === 'birthday') return 'birthDate'
  if (h === 'employee status') return 'employeeStatus'
  if (h === 'department') return 'department'
  if (h === 'name') return 'name'
  if (h === 'position') return 'position'
  if (h === 'gender') return 'gender'
  if (h === 'reporting to') return 'reportingTo'
  if (h === 'email' || h === 'work email' || h === 'work_email' || h === 'e-mail') return 'email'
  if (h === 'personal email' || h === 'private email' || h === 'private_email' || h === 'personal_email') return 'personalEmail'
  if (h === 'phone' || h === 'work phone' || h === 'work_phone' || h === 'mobile' || h === 'mobile phone' || h === 'mobile_phone')
    return 'phone'
  if (h === 'personal phone' || h === 'private phone' || h === 'private_phone' || h === 'personal_phone') return 'personalPhone'
  if (h === 'employee type') return 'employeeType'
  if (h === 'employment status') return 'employmentStatus'
  if (h === 'contract/probation end date') return 'contractOrProbationEndDate'
  if (h === 'a player rating') return 'talentRating'
  if (h === 'monthly salary') return 'monthlySalary'
  if (h === 'allowances') return 'allowances'
  if (h === 'gross salary') return 'grossSalary'
  if (h === 'type of allowance') return 'typeOfAllowance'
  return h
}

function normalizeFieldValue(v: string) {
  return v.trim()
}

function normalizeKeyField(v: string) {
  return normalizeFieldValue(v).toLowerCase()
}

function sha1Hex(input: string) {
  return createHash('sha1').update(input).digest('hex')
}

export function generateEmployeeKey(input: {
  name: string
  department: string
  position: string
  startDate: string | null
  countryAssigned: string
}) {
  const name = normalizeKeyField(input.name)
  const department = normalizeKeyField(input.department)
  const position = normalizeKeyField(input.position)
  const startDate = normalizeKeyField(input.startDate ?? '')
  const country = normalizeKeyField(input.countryAssigned)
  const baseString = `${name}|${department}|${position}|${startDate}|${country}`
  const full = sha1Hex(baseString)
  return { baseString, fullHash: full }
}

function stableTruncatedKey(fullHash: string, baseString: string, seen: Map<string, string>) {
  for (let len = EMPLOYEE_KEY_MIN_LEN; len <= fullHash.length; len++) {
    const key = fullHash.slice(0, len)
    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, baseString)
      return key
    }
    if (existing === baseString) return key
  }
  // Extremely unlikely fallback.
  const key = fullHash
  seen.set(key, baseString)
  return key
}

function normalizeDateToYmd(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null

  // Allow separators like "1-May-04", "Nov-18", "29-Oct-18"
  const parts = raw.split('-').map((p) => p.trim()).filter(Boolean)
  if (parts.length < 2) return null

  const monthMap: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12
  }

  let day: number | null = null
  let month: number | null = null
  let year: number | null = null

  if (parts.length === 2) {
    // "Nov-18" => 2018-11-01
    const m = monthMap[parts[0].slice(0, 3).toLowerCase()]
    const y = Number(parts[1])
    if (!m || !Number.isFinite(y)) return null
    month = m
    year = y < 100 ? (y >= 70 ? 1900 + y : 2000 + y) : y
    day = 1
  } else {
    // "1-May-04" or "15-Sep-16"
    const d = Number(parts[0])
    const m = monthMap[parts[1].slice(0, 3).toLowerCase()]
    const y = Number(parts[2])
    if (!Number.isFinite(d) || !m || !Number.isFinite(y)) return null
    day = d
    month = m
    year = y < 100 ? (y >= 70 ? 1900 + y : 2000 + y) : y
  }

  if (!year || !month || !day) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null

  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1]
        if (next === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cell += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
      continue
    }

    if (ch === ',') {
      row.push(cell)
      cell = ''
      continue
    }

    if (ch === '\n') {
      row.push(cell)
      cell = ''
      rows.push(row)
      row = []
      continue
    }

    if (ch === '\r') {
      continue
    }

    cell += ch
  }

  row.push(cell)
  if (row.length > 1 || row[0].trim() !== '') rows.push(row)
  return rows
}

function resolveEmployeeCsvPath() {
  const candidates = [
    // If you later standardize the file, this is the preferred location.
    fileURLToPath(new URL('../../data/employees.csv', import.meta.url)),
    // Repo-root file (current Phase 1 source).
    fileURLToPath(new URL('../../../employee_info.csv', import.meta.url))
  ]

  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return candidates[1]
}

function canonicalizeRows(csvText: string): CanonicalRow[] {
  const rows = parseCsv(csvText)
  if (rows.length === 0) return []

  const headerRow = rows[0]
  const headers = headerRow.map(canonicalHeaderKey)

  const out: CanonicalRow[] = []
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (r.every((c) => !c || c.trim() === '')) continue
    const obj: CanonicalRow = {}
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j]
      const value = r[j] ?? ''
      obj[key] = normalizeFieldValue(value)
    }
    out.push(obj)
  }
  return out
}

export async function loadEmployeesFromCsv(): Promise<Employee[]> {
  const csvPath = resolveEmployeeCsvPath()
  const mtimeMs = await stat(csvPath)
    .then((s) => s.mtimeMs)
    .catch(() => 0)

  if (cached && cached.csvPath === csvPath && cached.mtimeMs === mtimeMs) return cached.employees

  const csvText = await readFile(csvPath, 'utf8')
  const rows = canonicalizeRows(csvText)

  const seenKeys = new Map<string, string>()

  const employees: Employee[] = rows.map((r) => {
    const startDate = normalizeDateToYmd(r.startDate ?? '')
    const contractOrProbationEndDate = normalizeDateToYmd(r.contractOrProbationEndDate ?? '')
    const birthDate = normalizeDateToYmd((r as any).birthDate ?? '')

    const { baseString, fullHash } = generateEmployeeKey({
      name: r.name ?? '',
      department: r.department ?? '',
      position: r.position ?? '',
      startDate,
      countryAssigned: r.countryAssigned ?? ''
    })

    const employeeKey = stableTruncatedKey(fullHash, baseString, seenKeys)
    const employeeStatus = String(r.employeeStatus ?? '').trim() || 'Active'

    const employee: Employee = {
      employeeKey,
      name: r.name ?? '',
      department: r.department ?? '',
      position: r.position ?? '',
      startDate,
      birthDate,
      countryAssigned: r.countryAssigned ?? '',
      employeeStatus,
      gender: r.gender || undefined,
      reportingTo: r.reportingTo || undefined,
      employeeType: r.employeeType || undefined,
      employmentStatus: r.employmentStatus || undefined,
      contractOrProbationEndDate,
      talentRating: r.talentRating || undefined,
      monthlySalary: r.monthlySalary || undefined,
      allowances: r.allowances || undefined,
      grossSalary: r.grossSalary || undefined,
      typeOfAllowance: r.typeOfAllowance || undefined
    }

    return employee
  })

  cached = { csvPath, mtimeMs, employees }
  return employees
}

export async function getEmployeeByKey(employeeKey: string) {
  const employees = await loadEmployeesFromCsv()
  return employees.find((e) => e.employeeKey === employeeKey) ?? null
}

