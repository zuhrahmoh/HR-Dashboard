import { createError } from 'h3'
import { formatTalentRatingDisplay } from '~/utils/talentRatingDisplay'
import type { Employee } from './employees'
import { getOdooClient } from './odoo'
import { classifyBranchCountry } from './branchClassification'
import { dedupeOdooEmployees } from './dedupeOdooEmployees'
import { shouldExcludeOdooEmployee } from './odooEmployeeExclusions'

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
  if (Array.isArray(v)) {
    if (v.length >= 2) {
      const label = v[1]
      if (typeof label === 'string' && label.trim()) return label.trim()
      if (label != null && label !== false) return safeString(label).trim()
    }
    return ''
  }
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (typeof o.display_name === 'string' && o.display_name.trim()) return o.display_name.trim()
    if (typeof o.name === 'string' && o.name.trim()) return o.name.trim()
  }
  return ''
}

function extractRelatedRecordId(raw: unknown): number | null {
  if (raw === false || raw == null) return null
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw
  if (Array.isArray(raw) && typeof raw[0] === 'number' && Number.isFinite(raw[0]) && raw[0] > 0) return raw[0]
  if (typeof raw === 'object' && raw !== null && 'id' in raw) {
    const id = (raw as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id) && id > 0) return id
  }
  return null
}

async function readIdNameMapForModel(
  client: Awaited<ReturnType<typeof getOdooClient>>,
  model: string,
  ids: number[]
): Promise<Map<number, string>> {
  const map = new Map<number, string>()
  const unique = [...new Set(ids)].filter((x) => Number.isFinite(x) && x > 0)
  if (!unique.length || !model.trim()) return map
  const chunkSize = 80
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize)
    const rows = await client.executeKw<Array<Record<string, unknown>>>(model.trim(), 'read', [chunk], {
      fields: ['id', 'name']
    })
    if (!Array.isArray(rows)) continue
    for (const rec of rows) {
      const id = rec?.id
      if (!Number.isFinite(id)) continue
      const label = (typeof rec.name === 'string' && rec.name.trim()) || `#${id}`
      map.set(Number(id), label)
    }
  }
  return map
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

function formatGenderForDisplay(raw: string) {
  const s = raw.trim()
  if (!s) return undefined
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

const WORK_PHONE_FIELD_CANDIDATES = [
  'work_phone',
  'x_work_phone',
  'x_phone',
  'x_office_phone'
]

type OdooFieldDef = { type?: string; string?: string; relation?: string }

/**
 * Standard + common Studio names. Ambiguous `phone` is last — work line may reuse it.
 * Custom "Personal Phone #" columns are picked up via {@link discoverPersonalPhoneFieldsByLabel}.
 */
const PERSONAL_PHONE_FIELD_AFTER_DISCOVERY = [
  'personal_phone',
  'x_mobile_phone',
  'x_private_phone',
  'x_personal_phone',
  'x_mobile',
  'x_cell_phone',
  'private_mobile',
  'employee_phone',
  'mobile',
  'phone'
]

function existingFieldsInOrder(fieldInfo: Record<string, unknown>, candidates: string[]) {
  return candidates.filter((name) => Object.prototype.hasOwnProperty.call(fieldInfo, name))
}

function isOdooStringLikeField(def: OdooFieldDef | undefined) {
  const t = (def?.type ?? '').toLowerCase()
  return t === 'char' || t === 'text' || t === 'phone'
}

/** Studio / custom fields use labels like "Personal Phone #"; technical names vary (e.g. `x_studio_...`). */
function discoverPersonalPhoneFieldsByLabel(fieldInfo: Record<string, OdooFieldDef>): string[] {
  const hits: string[] = []
  for (const [name, def] of Object.entries(fieldInfo)) {
    if (!def || !isOdooStringLikeField(def)) continue
    const nl = safeString(def.string).trim().toLowerCase()
    const nn = name.toLowerCase()
    if (nn === 'work_phone' || nn === 'work_mobile') continue
    if (nl.includes('work') && nl.includes('phone') && !nl.includes('personal') && !nl.includes('private') && !nl.includes('home'))
      continue

    const nameHit = /personal.*phone|phone.*personal|private.*phone|home.*phone/.test(nn)
    const labelHit =
      (nl.includes('personal') && nl.includes('phone')) ||
      (nl.includes('private') && nl.includes('phone')) ||
      (nl.includes('home') && nl.includes('phone'))
    if (nameHit || labelHit) hits.push(name)
  }
  hits.sort()
  return hits
}

function buildPersonalPhoneFieldOrder(fieldInfo: Record<string, OdooFieldDef>): string[] {
  const discovered = discoverPersonalPhoneFieldsByLabel(fieldInfo)
  const orderedNames = ['mobile_phone', 'private_phone', ...discovered, ...PERSONAL_PHONE_FIELD_AFTER_DISCOVERY]
  const seen = new Set<string>()
  const out: string[] = []
  for (const name of orderedNames) {
    if (seen.has(name) || !Object.prototype.hasOwnProperty.call(fieldInfo, name)) continue
    seen.add(name)
    out.push(name)
  }
  return out
}

function readFirstNonEmptyFieldString(row: Record<string, unknown>, fieldNames: string[]) {
  for (const name of fieldNames) {
    const raw = row[name]
    const v = (many2oneName(raw) || safeString(raw)).trim()
    if (v) return v
  }
  return undefined
}

function normalizeEmployeeType(raw: string | undefined) {
  const v = (raw ?? '').trim().toLowerCase()
  if (!v) return null
  if (v.includes('intern')) return 'intern'
  if (v.includes('contract')) return 'contract'
  if (v.includes('temporary') || v.includes('temp')) return 'contract'
  if (v.includes('fixed term') || v.includes('fixed-term')) return 'contract'
  if (v.includes('permanent') || v.includes('full time') || v.includes('full-time')) return 'permanent'
  return null
}

function normalizeTalentRole(raw: string | undefined) {
  const v = (raw ?? '').trim().toLowerCase()
  if (!v) return null
  if (v === 'l' || v === 'ldr') return 'leader'
  if (v === 'p' || v === 'plyr') return 'player'
  if (v.includes('leader')) return 'leader'
  if (v.includes('player')) return 'player'
  return null
}

function parseYmdUtcMs(ymd: string | null) {
  if (!ymd) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const ms = Date.UTC(y, mo - 1, d)
  const dt = new Date(ms)
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
  return ms
}

function clampContractLikeEndDate(endYmd: string | null, startYmd: string | null) {
  const endMs = parseYmdUtcMs(endYmd)
  if (endMs === null) return null
  const startMs = parseYmdUtcMs(startYmd)
  if (startMs === null) return endYmd
  if (endMs < startMs) return null
  // Guardrail: ignore obviously wrong far-future dates for "contract-ish" ends.
  const maxMs = startMs + 5 * 365 * 24 * 60 * 60 * 1000
  if (endMs > maxMs) return null
  return endYmd
}

function clampProbationEndDate(endYmd: string | null, startYmd: string | null) {
  const endMs = parseYmdUtcMs(endYmd)
  if (endMs === null) return null
  const startMs = parseYmdUtcMs(startYmd)
  if (startMs === null) return endYmd
  if (endMs < startMs) return null
  // Probation should be relatively close to start date.
  const maxMs = startMs + 365 * 24 * 60 * 60 * 1000
  if (endMs > maxMs) return null
  return endYmd
}

function normalizeDepartureReason(reason: string | undefined): 'resigned' | 'retired' | 'fired' | null {
  const v = (reason ?? '').trim().toLowerCase()
  if (!v) return null
  if (v === 'resigned' || v.startsWith('resign')) return 'resigned'
  if (v === 'retired' || v.startsWith('retire')) return 'retired'
  if (v === 'fired' || v.startsWith('fire') || v.includes('terminated') || v.includes('termination')) return 'fired'
  return null
}

function selectionDisplayString(v: unknown): string {
  if (Array.isArray(v) && v.length >= 2 && typeof v[1] === 'string') return v[1].trim()
  return safeString(v).trim()
}

/** True when Odoo marks the employee as in offboarding (still active until last working day). */
function rawIndicatesOffboarding(raw: unknown, fieldType: string | undefined): boolean {
  if (fieldType === 'boolean') return raw === true
  const s = selectionDisplayString(raw).toLowerCase()
  if (!s) return false
  if (s.includes('offboard')) return true
  if (s.includes('off-board')) return true
  if (s.includes('pending separation') || s.includes('pending_separation')) return true
  return false
}

function buildDisplayFromHrField(fieldDefs: Record<string, { type?: string }>) {
  return function displayFromHrField(row: Record<string, unknown>, fieldName: string | null): string {
    if (!fieldName) return ''
    const t = (fieldDefs[fieldName]?.type ?? '').toLowerCase()
    const raw = row[fieldName]
    if (t === 'many2one') return (many2oneName(raw) || safeString(raw)).trim()
    if (t === 'selection') return selectionDisplayString(raw)
    if (t === 'boolean') return raw === true ? 'Yes' : raw === false ? 'No' : ''
    if ((t === 'integer' || t === 'float') && typeof raw === 'number' && Number.isFinite(raw) && raw > 0 && Math.floor(raw) === raw) {
      return ''
    }
    return (many2oneName(raw) || safeString(raw)).trim()
  }
}

type HrEmployeeMappingCtx = {
  fieldDefs: Record<string, { type?: string; relation?: string }>
  displayFromHrField: ReturnType<typeof buildDisplayFromHrField>
  countryField: string | null
  companyField: string | null
  workAddressField: string | null
  startDateField: string | null
  contractEndField: string | null
  probationEndField: string | null
  contractDateStartField: string | null
  contractDateEndField: string | null
  contractTrialEndField: string | null
  talentRoleField: string | null
  playerRatingField: string | null
  leaderRatingField: string | null
  talentRatingField: string | null
  employmentTypeField: string | null
  birthDateField: string | null
  departureReasonField: string | null
  offboardingStateField: string | null
  offboardingPhaseField: string | null
  departureDateField: string | null
  tenureField: string | null
  workEmailField: string | null
  personalEmailField: string | null
  workPhoneFields: string[]
  personalPhoneFields: string[]
  managerField: string | null
  eltField: string | null
}

async function prepareHrEmployeeMappingCtx(client: Awaited<ReturnType<typeof getOdooClient>>): Promise<{
  ctx: HrEmployeeMappingCtx
  fields: string[]
}> {
  const fieldInfo = await client.fieldsGet('hr.employee')
  const contractFieldInfo = await client.fieldsGet('hr.contract').catch(() => ({}))

  const countryField = pickFirstExistingField(fieldInfo, ['country_id', 'work_location_id', 'work_country_id'])
  const companyField = pickFirstExistingField(fieldInfo, ['company_id', 'x_company_id', 'x_company'])
  const workAddressField = pickFirstExistingField(fieldInfo, [
    'work_location',
    'x_work_location',
    'work_address',
    'x_work_address',
    'work_address_id',
    'address_id',
    'work_contact_id',
    'work_location_id'
  ])
  const startDateField = pickFirstExistingField(fieldInfo, [
    'date_hired',
    'hire_date',
    'x_date_hired',
    'x_hire_date',
    'first_contract_date',
    'x_start_date',
    'start_date'
  ])
  const contractEndField = pickFirstExistingField(fieldInfo, [
    'contract_end',
    'end_contract_date',
    'x_contract_end_date',
    'contract_end_date',
    'x_end_of_contract',
    'x_intern_contract_end_date',
    'date_end'
  ])
  const probationEndField = pickFirstExistingField(fieldInfo, [
    'end_of_probation',
    'x_probation_end_date',
    'probation_end_date',
    'x_end_of_probation',
    'x_probation_end'
  ])

  const contractDateStartField = pickFirstExistingField(contractFieldInfo, [
    'date_start',
    'x_date_start',
    'contract_start_date',
    'x_contract_start_date',
    'start_date'
  ])
  const contractDateEndField = pickFirstExistingField(contractFieldInfo, [
    'date_end',
    'x_date_end',
    'end_date',
    'contract_end_date',
    'x_contract_end_date'
  ])
  const contractTrialEndField = pickFirstExistingField(contractFieldInfo, [
    'trial_date_end',
    'x_trial_date_end',
    'trial_end_date',
    'x_probation_end_date',
    'probation_end_date'
  ])

  const talentRoleField = pickFirstExistingField(fieldInfo, [
    'player_type',
    'x_player_type',
    'x_player_or_leader',
    'x_talent_role',
    'x_talent_type',
    'x_role'
  ])
  const playerRatingField = pickFirstExistingField(fieldInfo, [
    'player_rating',
    'x_player_rating',
    'x_a_player_rating',
    'x_rating_player',
    'x_player_perf_rating'
  ])
  const leaderRatingField = pickFirstExistingField(fieldInfo, [
    'leader_rating',
    'x_leader_rating',
    'x_rating_leader',
    'x_leader_perf_rating'
  ])
  const talentRatingField = pickFirstExistingField(fieldInfo, ['x_talent_rating', 'x_rating'])
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
  const offboardingStateField = pickFirstExistingField(fieldInfo, [
    'x_offboarding',
    'in_offboarding',
    'x_in_offboarding',
    'x_employee_offboarding',
    'offboarding_state',
    'x_offboarding_state',
    'employee_lifecycle',
    'x_employee_lifecycle',
    'x_hr_status',
    'x_employment_state',
    'hr_employee_state',
    'x_hr_employee_state'
  ])
  const offboardingPhaseField = pickFirstExistingField(fieldInfo, [
    'x_offboarding_status',
    'x_offboarding_phase',
    'x_separation_stage',
    'x_exit_stage',
    'separation_stage',
    'x_separation_status'
  ])
  const departureDateField = pickFirstExistingField(fieldInfo, [
    'departure_date',
    'x_departure_date',
    'x_separation_date',
    'x_separated_at',
    'x_exit_date',
    'x_date_of_exit',
    'x_last_working_day',
    'x_last_day_worked',
    'last_working_day',
    'last_day_worked'
  ])
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

  const workPhoneFields = existingFieldsInOrder(fieldInfo as Record<string, unknown>, WORK_PHONE_FIELD_CANDIDATES)
  const personalPhoneFields = buildPersonalPhoneFieldOrder(fieldInfo as Record<string, OdooFieldDef>)

  const managerField = pickFirstExistingField(fieldInfo, [
    'manager',
    'manager_id',
    'x_manager_id',
    'x_manager',
    'x_line_manager_id',
    'x_line_manager',
    'line_manager_id'
  ])
  const eltField = pickFirstExistingField(fieldInfo, [
    'elt',
    'elt_id',
    'x_elt_id',
    'x_elt',
    'x_executive_leadership_team_id',
    'x_el_team_id',
    'x_elt_member_id'
  ])

  const fieldDefs = fieldInfo as Record<string, { type?: string; relation?: string }>
  const displayFromHrField = buildDisplayFromHrField(fieldDefs)

  const fields = Array.from(
    new Set(
      [
        'name',
        'active',
        'write_date',
        'create_date',
        'contract_id',
        companyField,
        'department_id',
        'job_title',
        'job_id',
        'parent_id',
        managerField,
        eltField,
        'gender',
        countryField,
        workAddressField,
        startDateField,
        contractEndField,
        probationEndField,
        talentRoleField,
        playerRatingField,
        leaderRatingField,
        talentRatingField,
        employmentTypeField,
        birthDateField,
        departureReasonField,
        offboardingStateField,
        offboardingPhaseField,
        departureDateField,
        tenureField,
        workEmailField,
        personalEmailField,
        ...workPhoneFields,
        ...personalPhoneFields
      ].filter(Boolean)
    )
  ) as string[]

  return {
    ctx: {
      fieldDefs,
      displayFromHrField,
      countryField,
      companyField,
      workAddressField,
      startDateField,
      contractEndField,
      probationEndField,
      contractDateStartField,
      contractDateEndField,
      contractTrialEndField,
      talentRoleField,
      playerRatingField,
      leaderRatingField,
      talentRatingField,
      employmentTypeField,
      birthDateField,
      departureReasonField,
      offboardingStateField,
      offboardingPhaseField,
      departureDateField,
      tenureField,
      workEmailField,
      personalEmailField,
      workPhoneFields,
      personalPhoneFields,
      managerField,
      eltField
    },
    fields
  }
}

async function mapHrRowsToEmployees(
  client: Awaited<ReturnType<typeof getOdooClient>>,
  rows: Array<Record<string, unknown>>,
  ctx: HrEmployeeMappingCtx
): Promise<Employee[]> {
  const {
    fieldDefs,
    displayFromHrField,
    countryField,
    companyField,
    workAddressField,
    startDateField,
    contractEndField,
    probationEndField,
    contractDateStartField,
    contractDateEndField,
    contractTrialEndField,
    talentRoleField,
    playerRatingField,
    leaderRatingField,
    talentRatingField,
    employmentTypeField,
    birthDateField,
    departureReasonField,
    offboardingStateField,
    offboardingPhaseField,
    departureDateField,
    tenureField,
    workEmailField,
    personalEmailField,
    workPhoneFields,
    personalPhoneFields,
    managerField,
    eltField
  } = ctx

  const contractIds = Array.from(
    new Set(
      rows
        .map((r) => (Array.isArray(r?.contract_id) ? r.contract_id[0] : null))
        .filter((v): v is number => Number.isFinite(v))
    )
  )

  const contractById = new Map<number, Record<string, unknown>>()
  if (contractIds.length > 0 && (contractDateStartField || contractDateEndField || contractTrialEndField)) {
    const contractFields = Array.from(
      new Set([contractDateStartField, contractDateEndField, contractTrialEndField].filter(Boolean))
    ) as string[]
    if (contractFields.length > 0) {
      const contractRows = await client.executeKw<any[]>(
        'hr.contract',
        'search_read',
        [[['id', 'in', contractIds]]],
        { fields: ['id', ...contractFields] }
      )
      if (Array.isArray(contractRows)) {
        for (const c of contractRows) {
          const id = c?.id
          if (Number.isFinite(id)) contractById.set(Number(id), c as Record<string, unknown>)
        }
      }
    }
  }

  function relationModelForField(fieldName: string | null, fallback: string) {
    if (!fieldName) return fallback
    const rel = fieldDefs[fieldName]?.relation
    return typeof rel === 'string' && rel.trim() ? rel.trim() : fallback
  }

  const idsByModel = new Map<string, Set<number>>()
  for (const r of rows) {
    const row = r as Record<string, unknown>
    for (const fieldName of [managerField, eltField] as const) {
      if (!fieldName) continue
      if (displayFromHrField(row, fieldName)) continue
      const id = extractRelatedRecordId(row[fieldName])
      if (id == null) continue
      const model = relationModelForField(fieldName, 'hr.employee')
      if (!idsByModel.has(model)) idsByModel.set(model, new Set())
      idsByModel.get(model)!.add(id)
    }
  }

  const displayNameByModel = new Map<string, Map<number, string>>()
  for (const [model, idSet] of idsByModel.entries()) {
    displayNameByModel.set(model, await readIdNameMapForModel(client, model, [...idSet]))
  }

  function displayManagerOrElt(row: Record<string, unknown>, fieldName: string | null): string {
    if (!fieldName) return ''
    const direct = displayFromHrField(row, fieldName)
    if (direct) return direct
    const id = extractRelatedRecordId(row[fieldName])
    if (id == null) return ''
    const model = relationModelForField(fieldName, 'hr.employee')
    return (displayNameByModel.get(model)?.get(id) ?? '').trim()
  }

  const employees: Employee[] = rows.map((r) => {
    const id = r?.id
    if (!Number.isFinite(id)) {
      throw createError({ statusCode: 502, statusMessage: 'Odoo employee row missing id.' })
    }

    const isActive = Boolean(r?.active)
    const position =
      safeString(r?.job_title).trim() || many2oneName(r?.job_id) || ''

    const rawCountry = countryField ? r?.[countryField] : null
    const countryAssigned = (many2oneName(rawCountry) || safeString(rawCountry)).trim()

    const rawCompany = companyField ? r?.[companyField] : null
    const companyName = (many2oneName(rawCompany) || safeString(rawCompany)).trim()

    const rawWorkAddress = workAddressField ? r?.[workAddressField] : null
    const workAddress = (many2oneName(rawWorkAddress) || safeString(rawWorkAddress)).trim()

    const branchCountry = classifyBranchCountry({
      companyName,
      workAddress,
      fallbackCountry: countryAssigned
    })

    const rawDepartureReason = departureReasonField ? r?.[departureReasonField] : null
    const departureReason = departureReasonField
      ? (many2oneName(rawDepartureReason) || safeString(rawDepartureReason)).trim() || undefined
      : undefined
    const normReason = normalizeDepartureReason(departureReason)
    const offStateType = offboardingStateField ? fieldDefs[offboardingStateField]?.type : undefined
    const offRaw = offboardingStateField ? r?.[offboardingStateField] : undefined
    const inOffboarding =
      Boolean(offboardingStateField) && isActive && rawIndicatesOffboarding(offRaw, offStateType)

    const employeeStatus = !isActive
      ? normReason === 'retired'
        ? 'Retired'
        : normReason === 'fired'
          ? 'Fired'
          : normReason === 'resigned'
            ? 'Resigned'
            : 'Separated'
      : inOffboarding
        ? 'Offboarding'
        : 'Active'

    const lastWorkingDayYmd = departureDateField ? toYmd(r?.[departureDateField]) : null
    const offPhaseRaw = offboardingPhaseField ? selectionDisplayString(r?.[offboardingPhaseField]) : ''

    const managerDisplay = displayManagerOrElt(r as Record<string, unknown>, managerField)
    const eltDisplay = displayManagerOrElt(r as Record<string, unknown>, eltField)

    const employee: Employee = {
      employeeKey: `odoo-${id}`,
      name: safeString(r?.name).trim(),
      department: many2oneName(r?.department_id) || '',
      position,
      startDate: startDateField ? toYmd(r?.[startDateField]) : null,
      birthDate: birthDateField ? toYmd(r?.[birthDateField]) : null,
      countryAssigned: branchCountry,
      companyName: companyName || undefined,
      workAddress: workAddress || undefined,
      employeeStatus,
      gender: formatGenderForDisplay(safeString(r?.gender)),
      reportingTo: many2oneName(r?.parent_id) || undefined,
      manager: managerDisplay || undefined,
      elt: eltDisplay || undefined,
      contractStartDate: null,
      contractEndDate: null,
      probationEndDate: null,
      contractOrProbationEndDate: null,
      talentRating: undefined,
      employeeType: employmentTypeField
        ? (many2oneName(r?.[employmentTypeField]) || safeString(r?.[employmentTypeField])).trim() || undefined
        : undefined,
      departureReason,
      lastWorkingDay: lastWorkingDayYmd,
      offboardingPhase: offPhaseRaw || undefined,
      separatedAt: !isActive ? (departureDateField ? toYmd(r?.[departureDateField]) : null) ?? toYmd(r?.write_date) : null,
      createdAt: toYmd(r?.create_date),
      tenure: tenureField ? safeString(r?.[tenureField]).trim() || undefined : undefined,
      workEmail: workEmailField ? safeString(r?.[workEmailField]).trim() || undefined : undefined,
      personalEmail: personalEmailField ? safeString(r?.[personalEmailField]).trim() || undefined : undefined,
      workPhone: readFirstNonEmptyFieldString(r as Record<string, unknown>, workPhoneFields),
      personalPhone: readFirstNonEmptyFieldString(r as Record<string, unknown>, personalPhoneFields)
    }

    // Prefer contract end for interns/contract staff; probation end for permanent staff.
    const employeeTypeNorm = normalizeEmployeeType(employee.employeeType)
    const startYmd = employee.startDate

    const contractId = Array.isArray(r?.contract_id) ? r.contract_id[0] : null
    const linkedContract = Number.isFinite(contractId) ? contractById.get(Number(contractId)) : null

    const contractStartFromContract =
      linkedContract && contractDateStartField ? toYmd(linkedContract[contractDateStartField]) : null

    const contractEndFromContract =
      linkedContract && contractDateEndField ? toYmd(linkedContract[contractDateEndField]) : null
    const contractEndFromEmployee = contractEndField ? toYmd(r?.[contractEndField]) : null

    const probationEndFromContract =
      linkedContract && contractTrialEndField ? toYmd(linkedContract[contractTrialEndField]) : null
    const probationEndFromEmployee = probationEndField ? toYmd(r?.[probationEndField]) : null

    const contractEndRaw = contractEndFromContract ?? contractEndFromEmployee
    const probationEndRaw = probationEndFromEmployee ?? probationEndFromContract

    const contractEnd = clampContractLikeEndDate(contractEndRaw, startYmd)
    const probationEnd = clampProbationEndDate(probationEndRaw, startYmd)
    employee.contractStartDate = contractStartFromContract
    employee.contractEndDate = contractEnd
    employee.probationEndDate = probationEnd
    employee.contractOrProbationEndDate =
      employeeTypeNorm === 'intern' || employeeTypeNorm === 'contract'
        ? contractEnd ?? probationEnd
        : probationEnd ?? contractEnd

    // Talent rating: production stores role + role-specific rating; keep a safe fallback to legacy single field.
    const talentRoleRaw = talentRoleField ? (many2oneName(r?.[talentRoleField]) || safeString(r?.[talentRoleField])).trim() : ''
    const talentRole = normalizeTalentRole(talentRoleRaw)
    const playerRating = playerRatingField
      ? (many2oneName(r?.[playerRatingField]) || safeString(r?.[playerRatingField])).trim()
      : ''
    const leaderRating = leaderRatingField
      ? (many2oneName(r?.[leaderRatingField]) || safeString(r?.[leaderRatingField])).trim()
      : ''
    const legacyRating = talentRatingField
      ? (many2oneName(r?.[talentRatingField]) || safeString(r?.[talentRatingField])).trim()
      : ''

    const rating = talentRole === 'leader' ? leaderRating : talentRole === 'player' ? playerRating : ''
    const roleLabel = talentRole === 'leader' ? 'Leader' : talentRole === 'player' ? 'Player' : ''
    const combined = rating && roleLabel ? `${rating} ${roleLabel}` : ''
    const rawTalent = (combined || legacyRating || '').trim()
    employee.talentRating = rawTalent ? formatTalentRatingDisplay(rawTalent) ?? rawTalent : undefined

    return employee
  })

  return employees
}

async function loadEmployeesFromOdooInternal(opts: { includeInactive: boolean }): Promise<Employee[]> {
  const ttlMs = getCacheTtlMs()
  const cache = opts.includeInactive ? cachedIncludingInactive : cachedActiveOnly
  if (cache && ttlMs > 0 && Date.now() - cache.fetchedAtMs < ttlMs) return cache.employees

  const client = await getOdooClient()
  const { ctx, fields } = await prepareHrEmployeeMappingCtx(client)
  const rows = await client.executeKw<any[]>(
    'hr.employee',
    'search_read',
    [[]],
    opts.includeInactive ? { fields, context: { active_test: false } } : { fields }
  )
  if (!Array.isArray(rows)) {
    throw createError({ statusCode: 502, statusMessage: 'Unexpected Odoo response for employees.' })
  }

  const employees = await mapHrRowsToEmployees(client, rows, ctx)
  const employeesFiltered = employees.filter((e) => !shouldExcludeOdooEmployee(e))
  const employeesDeduped = dedupeOdooEmployees(employeesFiltered)
  const nextCache = { fetchedAtMs: Date.now(), employees: employeesDeduped }
  if (opts.includeInactive) cachedIncludingInactive = nextCache
  else cachedActiveOnly = nextCache
  return employeesDeduped
}

async function fetchOdooEmployeeByDatabaseId(id: number): Promise<Employee | null> {
  const client = await getOdooClient()
  const { ctx, fields } = await prepareHrEmployeeMappingCtx(client)
  const rows = await client.executeKw<any[]>(
    'hr.employee',
    'search_read',
    [[['id', '=', id]]],
    { fields, limit: 1, context: { active_test: false } }
  )
  if (!Array.isArray(rows) || rows.length === 0) return null
  const employees = await mapHrRowsToEmployees(client, rows, ctx)
  const employeesFiltered = employees.filter((e) => !shouldExcludeOdooEmployee(e))
  const deduped = dedupeOdooEmployees(employeesFiltered)
  return deduped[0] ?? null
}

export async function loadEmployeesFromOdoo(opts?: { includeInactive?: boolean }): Promise<Employee[]> {
  return await loadEmployeesFromOdooInternal({ includeInactive: Boolean(opts?.includeInactive) })
}

export async function getOdooEmployeeByKey(employeeKey: string): Promise<Employee | null> {
  if (!employeeKey.startsWith('odoo-')) return null
  const m = /^odoo-(\d+)$/.exec(employeeKey)
  if (!m) return null
  const id = Number(m[1])
  if (!Number.isFinite(id)) return null

  const ttlMs = getCacheTtlMs()
  const now = Date.now()
  const caches: CachedEmployees[] = []
  if (cachedActiveOnly && ttlMs > 0 && now - cachedActiveOnly.fetchedAtMs < ttlMs) caches.push(cachedActiveOnly)
  if (cachedIncludingInactive && ttlMs > 0 && now - cachedIncludingInactive.fetchedAtMs < ttlMs) caches.push(cachedIncludingInactive)
  for (const c of caches) {
    const hit = c.employees.find((e) => e.employeeKey === employeeKey)
    if (hit) return hit
  }

  return await fetchOdooEmployeeByDatabaseId(id)
}

