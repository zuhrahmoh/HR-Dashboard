import { createError } from 'h3'
import type { Employee } from './employees'
import { getOdooClient } from './odoo'

type CachedEmployees = { fetchedAtMs: number; employees: Employee[] }
let cachedActiveOnly: CachedEmployees | null = null
let cachedIncludingInactive: CachedEmployees | null = null

function getCacheTtlMs() {
  const runtimeConfig = useRuntimeConfig()
  const v = Number((runtimeConfig as any)?.odoo?.cacheTtlMs ?? 30000)
  return Number.isFinite(v) && v >= 0 ? v : 30000
}

function pickFirstExistingField(fields: Record<string, unknown>, candidates: string[]) {
  for (const name of candidates) {
    if (Object.prototype.hasOwnProperty.call(fields, name)) return name
  }
  return null
}

function many2oneName(v: unknown) {
  if (Array.isArray(v) && typeof v[1] === 'string') return v[1]
  return ''
}

function toYmd(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (!s) return null
  // Odoo dates are typically "YYYY-MM-DD" (or datetimes "YYYY-MM-DD HH:mm:ss")
  const ymd = s.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : null
}

function safeString(v: unknown) {
  if (v === true || v === false) return ''
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

function normalizeDepartureReason(reason: string | undefined): 'resigned' | 'retired' | 'fired' | null {
  const v = (reason ?? '').trim().toLowerCase()
  if (!v) return null
  if (v === 'resigned' || v.startsWith('resign')) return 'resigned'
  if (v === 'retired' || v.startsWith('retire')) return 'retired'
  if (v === 'fired' || v.startsWith('fire') || v.includes('terminated') || v.includes('termination')) return 'fired'
  return null
}

async function loadEmployeesFromOdooInternal(opts: { includeInactive: boolean }): Promise<Employee[]> {
  const ttlMs = getCacheTtlMs()
  const cache = opts.includeInactive ? cachedIncludingInactive : cachedActiveOnly
  if (cache && ttlMs > 0 && Date.now() - cache.fetchedAtMs < ttlMs) return cache.employees

  const client = await getOdooClient()
  const fieldInfo = await client.fieldsGet('hr.employee')

  const countryField = pickFirstExistingField(fieldInfo, ['country_id', 'work_location_id', 'work_country_id'])
  const startDateField = pickFirstExistingField(fieldInfo, [
    'date_hired',
    'hire_date',
    'x_date_hired',
    'x_hire_date',
    'first_contract_date',
    'x_start_date',
    'start_date'
  ])
  const contractEndField = pickFirstExistingField(fieldInfo, ['x_contract_end_date', 'x_probation_end_date', 'date_end'])
  const talentRatingField = pickFirstExistingField(fieldInfo, ['x_talent_rating', 'x_a_player_rating', 'x_player_rating', 'x_rating'])
  const employmentTypeField = pickFirstExistingField(fieldInfo, [
    'employment_type',
    'employee_type',
    'x_employment_type',
    'x_employee_type',
    'x_contract_type',
    'contract_type'
  ])
  const birthDateField = pickFirstExistingField(fieldInfo, [
    'birthday',
    'birthdate',
    'date_of_birth',
    'x_birthday',
    'x_birthdate',
    'x_date_of_birth',
    'dob',
    'x_dob'
  ])
  const departureReasonField = pickFirstExistingField(fieldInfo, ['departure_reason_id', 'x_departure_reason_id'])
  const tenureField = pickFirstExistingField(fieldInfo, [
    'tenure',
    'employee_tenure',
    'length_of_service',
    'years_of_service',
    'x_tenure',
    'x_employee_tenure',
    'x_length_of_service',
    'x_years_of_service'
  ])
  const workEmailField = pickFirstExistingField(fieldInfo, [
    'work_email',
    'x_work_email',
    'x_email'
  ])
  const personalEmailField = pickFirstExistingField(fieldInfo, ['private_email', 'personal_email', 'x_private_email', 'x_personal_email'])

  const workPhoneField = pickFirstExistingField(fieldInfo, [
    'work_phone',
    'x_work_phone',
    'x_phone'
  ])
  const personalPhoneField = pickFirstExistingField(fieldInfo, [
    'mobile_phone',
    'private_phone',
    'phone',
    'mobile',
    'x_mobile_phone',
    'x_private_phone'
  ])

  const fields = Array.from(
    new Set(
      [
        'name',
        'active',
        'write_date',
        'create_date',
        'department_id',
        'job_title',
        'job_id',
        'parent_id',
        'gender',
        countryField,
        startDateField,
        contractEndField,
        talentRatingField,
        employmentTypeField,
        birthDateField,
        departureReasonField,
        tenureField,
        workEmailField,
        personalEmailField,
        workPhoneField,
        personalPhoneField
      ].filter(Boolean)
    )
  ) as string[]

  const rows = await client.executeKw<any[]>(
    'hr.employee',
    'search_read',
    [[]],
    opts.includeInactive ? { fields, context: { active_test: false } } : { fields }
  )
  if (!Array.isArray(rows)) {
    throw createError({ statusCode: 502, statusMessage: 'Unexpected Odoo response for employees.' })
  }

  const employees: Employee[] = rows.map((r) => {
    const id = r?.id
    if (!Number.isFinite(id)) {
      throw createError({ statusCode: 502, statusMessage: 'Odoo employee row missing id.' })
    }

    const isActive = Boolean(r?.active)
    const position = (r?.job_title && safeString(r.job_title).trim()) || many2oneName(r?.job_id) || ''

    const rawCountry = countryField ? r?.[countryField] : null
    const countryAssigned = (many2oneName(rawCountry) || safeString(rawCountry)).trim()

    const departureReason = departureReasonField ? many2oneName(r?.[departureReasonField]).trim() || undefined : undefined
    const normReason = normalizeDepartureReason(departureReason)
    const employeeStatus = isActive
      ? 'Active'
      : normReason === 'retired'
        ? 'Retired'
        : normReason === 'fired'
          ? 'Fired'
          : normReason === 'resigned'
            ? 'Resigned'
            : 'Separated'

    const employee: Employee = {
      employeeKey: `odoo-${id}`,
      name: safeString(r?.name).trim(),
      department: many2oneName(r?.department_id) || '',
      position,
      startDate: startDateField ? toYmd(r?.[startDateField]) : null,
      birthDate: birthDateField ? toYmd(r?.[birthDateField]) : null,
      countryAssigned,
      employeeStatus,
      gender: safeString(r?.gender).trim() || undefined,
      reportingTo: many2oneName(r?.parent_id) || undefined,
      contractOrProbationEndDate: contractEndField ? toYmd(r?.[contractEndField]) : null,
      talentRating: talentRatingField ? safeString(r?.[talentRatingField]).trim() || undefined : undefined,
      employeeType: employmentTypeField
        ? (many2oneName(r?.[employmentTypeField]) || safeString(r?.[employmentTypeField])).trim() || undefined
        : undefined,
      departureReason,
      separatedAt: !isActive ? toYmd(r?.write_date) : null,
      createdAt: toYmd(r?.create_date),
      tenure: tenureField ? safeString(r?.[tenureField]).trim() || undefined : undefined,
      workEmail: workEmailField ? safeString(r?.[workEmailField]).trim() || undefined : undefined,
      personalEmail: personalEmailField ? safeString(r?.[personalEmailField]).trim() || undefined : undefined,
      workPhone: workPhoneField ? safeString(r?.[workPhoneField]).trim() || undefined : undefined,
      personalPhone: personalPhoneField ? safeString(r?.[personalPhoneField]).trim() || undefined : undefined
    }

    return employee
  })

  const nextCache = { fetchedAtMs: Date.now(), employees }
  if (opts.includeInactive) cachedIncludingInactive = nextCache
  else cachedActiveOnly = nextCache
  return employees
}

export async function loadEmployeesFromOdoo(opts?: { includeInactive?: boolean }): Promise<Employee[]> {
  return await loadEmployeesFromOdooInternal({ includeInactive: Boolean(opts?.includeInactive) })
}

export async function getOdooEmployeeByKey(employeeKey: string) {
  if (!employeeKey.startsWith('odoo-')) return null
  const employees = await loadEmployeesFromOdoo()
  return employees.find((e) => e.employeeKey === employeeKey) ?? null
}

