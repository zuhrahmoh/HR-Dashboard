import { createError } from 'h3'
import type { Employee } from './employees'
import { getOdooClient } from './odoo'
import { loadEmployeesFromOdoo } from './odooEmployees'

type FieldDef = { type?: string; string?: string; selection?: [string, string][]; relation?: string }

export type OdooMedicalEnrollmentRow = {
  id: string
  employeeName: string
  country: string
  enrollmentType?: string
  vendor?: string
  stage: string
  dateInitiated?: string
  nextAction?: string
  hrRepresentative?: string
  notes?: string
  attachmentsUrl?: string
  createdAt: string
  updatedAt: string
}

export type OdooEapReferralRow = {
  id: string
  employeeName: string
  country: string
  referralSource?: string
  referralDate: string
  reasonCategory: string
  reasonDetails?: string
  programStatus: string
  startDate?: string
  lastFollowUpDate?: string
  nextFollowUpDate?: string
  outcomeNotes?: string
  ownerHr?: string
  referralDocsUrl?: string
  closeDate?: string
  closedReason?: string
  createdAt: string
  updatedAt: string
}

function safeString(v: unknown) {
  if (v === true || v === false) return ''
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

function many2oneName(v: unknown) {
  if (Array.isArray(v) && typeof v[1] === 'string') return v[1]
  return ''
}

function selectionDisplayString(v: unknown): string {
  if (Array.isArray(v) && v.length >= 2 && typeof v[1] === 'string') return v[1].trim()
  return safeString(v).trim()
}

function selectionStoredKey(v: unknown): string {
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0]
  if (typeof v === 'string') return v
  return safeString(v).trim()
}

function mapSelectionToLabel(def: FieldDef | undefined, raw: unknown): string {
  const key = selectionStoredKey(raw)
  const opts = def?.selection
  if (Array.isArray(opts) && key) {
    const hit = opts.find((p) => p[0] === key)
    if (hit) return hit[1].trim()
  }
  const disp = selectionDisplayString(raw)
  return (disp || key).trim()
}

function toIsoFromOdooDatetime(raw: unknown): string {
  const s = safeString(raw).trim()
  if (!s) return new Date(0).toISOString()
  const normalized = s.includes('T') ? s : s.replace(' ', 'T')
  const d = new Date(normalized)
  if (!Number.isNaN(d.getTime())) return d.toISOString()
  return new Date(0).toISOString()
}

function toYmd(raw: unknown): string | undefined {
  const s = safeString(raw).trim()
  if (!s) return undefined
  const ymd = s.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : undefined
}

function odooWebOrigin(): string {
  const runtimeConfig = useRuntimeConfig()
  const raw = String((runtimeConfig as { odoo?: { url?: string } }).odoo?.url ?? '').trim()
  if (!raw) return ''
  try {
    const u = new URL(raw.includes('://') ? raw : `https://${raw}`)
    return `${u.protocol}//${u.host}`
  } catch {
    return raw.replace(/\/+$/, '').split('/web')[0] || raw.replace(/\/+$/, '')
  }
}

function employeeIdFromKey(employeeKey: string): number | null {
  const m = /^odoo-(\d+)$/.exec(employeeKey.trim())
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

function buildEmployeeIndex(employees: Employee[]) {
  const byOdooId = new Map<number, Employee>()
  for (const e of employees) {
    const id = employeeIdFromKey(e.employeeKey)
    if (id != null) byOdooId.set(id, e)
  }
  return byOdooId
}

function asEmployeeId(raw: unknown): number | null {
  if (Array.isArray(raw) && typeof raw[0] === 'number' && Number.isFinite(raw[0])) return raw[0]
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  return null
}

function relationalListIds(raw: unknown): number[] {
  const ids: number[] = []
  if (!Array.isArray(raw)) return ids
  for (const el of raw) {
    if (typeof el === 'number' && Number.isFinite(el)) ids.push(el)
    else if (Array.isArray(el) && el.length >= 2 && typeof el[0] === 'number' && Number.isFinite(el[0])) ids.push(el[0])
  }
  return ids
}

async function fieldsGetFull(model: string) {
  const client = await getOdooClient()
  return await client.executeKw<Record<string, FieldDef>>(model, 'fields_get', [], {
    attributes: ['string', 'type', 'selection', 'relation']
  })
}

async function resolveAttachmentUrls(
  client: Awaited<ReturnType<typeof getOdooClient>>,
  ids: number[],
  origin: string
): Promise<Map<number, string>> {
  const map = new Map<number, string>()
  const unique = [...new Set(ids)].filter((x) => x > 0)
  if (!unique.length) return map
  const rows = await client.executeKw<Array<Record<string, unknown>>>('ir.attachment', 'read', [unique], {
    fields: ['id', 'url']
  })
  if (!Array.isArray(rows)) return map
  const base = origin.replace(/\/$/, '')
  for (const a of rows) {
    const id = a?.id
    if (!Number.isFinite(id)) continue
    const urlField = safeString(a.url).trim()
    const link = urlField || (base ? `${base}/web/content/${Number(id)}` : '')
    if (link) map.set(Number(id), link)
  }
  return map
}

function pickExistingFields(info: Record<string, FieldDef>, names: string[]) {
  return names.filter((n) => Object.prototype.hasOwnProperty.call(info, n))
}

function getMedicalEapConfig() {
  const runtimeConfig = useRuntimeConfig()
  const odoo = (runtimeConfig as { odoo?: Record<string, unknown> }).odoo ?? {}
  return {
    medicalLineModel: String(odoo.medicalEnrolmentLineModel ?? 'hr.medical.enrolment').trim() || 'hr.medical.enrolment',
    eapLineModel: String(odoo.eapLineModel ?? 'hr.eap').trim() || 'hr.eap'
  }
}

export async function loadOdooMedicalEnrolments(): Promise<OdooMedicalEnrollmentRow[]> {
  const { medicalLineModel } = getMedicalEapConfig()
  const employees = await loadEmployeesFromOdoo({ includeInactive: true })
  const byOdooId = buildEmployeeIndex(employees)
  const employeeIds = Array.from(byOdooId.keys())
  if (!employeeIds.length) return []

  const fieldInfo = await fieldsGetFull(medicalLineModel)
  const employeeField = fieldInfo.employee_id ? 'employee_id' : Object.keys(fieldInfo).find((k) => fieldInfo[k]?.relation === 'hr.employee') || 'employee_id'

  const candidateFields = [
    'id',
    employeeField,
    'enrolment_type',
    'vendor',
    'status',
    'date_initiated',
    'next_action',
    'attachments',
    'write_date',
    'create_date'
  ]
  let fields = pickExistingFields(fieldInfo, candidateFields)
  if (!fields.includes('id')) fields = ['id', ...fields]
  if (!fields.includes(employeeField) && fieldInfo[employeeField]) fields = [...fields, employeeField]

  const domain: unknown[] = [[employeeField, 'in', employeeIds]]
  const client = await getOdooClient()
  const rows = await client.executeKw<Record<string, unknown>[]>(medicalLineModel, 'search_read', [domain], {
    fields,
    order: 'write_date desc'
  })
  if (!Array.isArray(rows)) {
    throw createError({ statusCode: 502, statusMessage: 'Unexpected Odoo response for medical enrolments.' })
  }

  const typeDef = fieldInfo.enrolment_type
  const vendorDef = fieldInfo.vendor
  const statusDef = fieldInfo.status

  const allAttach: number[] = []
  if (fieldInfo.attachments) {
    for (const r of rows) {
      allAttach.push(...relationalListIds(r.attachments))
    }
  }
  const origin = odooWebOrigin()
  const attachById = fieldInfo.attachments ? await resolveAttachmentUrls(client, allAttach, origin) : new Map<number, string>()

  const out: OdooMedicalEnrollmentRow[] = []
  for (const r of rows) {
    const lineId = r?.id
    if (!Number.isFinite(lineId)) continue
    const empId = asEmployeeId(r[employeeField])
    const emp = empId != null ? byOdooId.get(empId) : undefined
    const attachIds = relationalListIds(r.attachments)
    let attachmentsUrl: string | undefined
    for (const aid of attachIds) {
      const u = attachById.get(aid)
      if (u) {
        attachmentsUrl = u
        break
      }
    }

    out.push({
      id: `odoo-med-${lineId}`,
      employeeName: (emp?.name ?? '').trim() || many2oneName(r[employeeField]) || 'Unknown employee',
      country: (emp?.countryAssigned ?? '').trim(),
      enrollmentType: fieldInfo.enrolment_type ? mapSelectionToLabel(typeDef, r.enrolment_type) : undefined,
      vendor: fieldInfo.vendor ? mapSelectionToLabel(vendorDef, r.vendor) : undefined,
      stage: fieldInfo.status ? mapSelectionToLabel(statusDef, r.status) : '',
      dateInitiated: fieldInfo.date_initiated ? toYmd(r.date_initiated) : undefined,
      nextAction: fieldInfo.next_action ? safeString(r.next_action).trim() || undefined : undefined,
      hrRepresentative: undefined,
      notes: undefined,
      attachmentsUrl,
      createdAt: toIsoFromOdooDatetime(r.create_date),
      updatedAt: toIsoFromOdooDatetime(r.write_date)
    })
  }
  return out
}

export async function loadOdooEapReferrals(): Promise<OdooEapReferralRow[]> {
  const { eapLineModel } = getMedicalEapConfig()
  const employees = await loadEmployeesFromOdoo({ includeInactive: true })
  const byOdooId = buildEmployeeIndex(employees)
  const employeeIds = Array.from(byOdooId.keys())
  if (!employeeIds.length) return []

  const fieldInfo = await fieldsGetFull(eapLineModel)
  const employeeField = fieldInfo.employee_id ? 'employee_id' : Object.keys(fieldInfo).find((k) => fieldInfo[k]?.relation === 'hr.employee') || 'employee_id'

  const candidateFields = [
    'id',
    employeeField,
    'referral_source',
    'referral_date',
    'reason_category',
    'reason_details',
    'program_status',
    'outcome_notes',
    'close_date',
    'closed_reason',
    'write_date',
    'create_date'
  ]
  let fieldsEap = pickExistingFields(fieldInfo, candidateFields)
  if (!fieldsEap.includes('id')) fieldsEap = ['id', ...fieldsEap]
  if (!fieldsEap.includes(employeeField) && fieldInfo[employeeField]) fieldsEap = [...fieldsEap, employeeField]

  const domain: unknown[] = [[employeeField, 'in', employeeIds]]
  const client = await getOdooClient()
  const rows = await client.executeKw<Record<string, unknown>[]>(eapLineModel, 'search_read', [domain], {
    fields: fieldsEap,
    order: 'write_date desc'
  })
  if (!Array.isArray(rows)) {
    throw createError({ statusCode: 502, statusMessage: 'Unexpected Odoo response for EAP records.' })
  }

  const srcDef = fieldInfo.referral_source
  const catDef = fieldInfo.reason_category
  const progDef = fieldInfo.program_status

  const out: OdooEapReferralRow[] = []
  for (const r of rows) {
    const lineId = r?.id
    if (!Number.isFinite(lineId)) continue
    const empId = asEmployeeId(r[employeeField])
    const emp = empId != null ? byOdooId.get(empId) : undefined
    const refDate = fieldInfo.referral_date ? toYmd(r.referral_date) ?? '' : ''
    out.push({
      id: `odoo-eap-${lineId}`,
      employeeName: (emp?.name ?? '').trim() || many2oneName(r[employeeField]) || 'Unknown employee',
      country: (emp?.countryAssigned ?? '').trim(),
      referralSource: fieldInfo.referral_source ? mapSelectionToLabel(srcDef, r.referral_source) : undefined,
      referralDate: refDate,
      reasonCategory: fieldInfo.reason_category ? mapSelectionToLabel(catDef, r.reason_category) : '',
      reasonDetails: fieldInfo.reason_details ? safeString(r.reason_details).trim() || undefined : undefined,
      programStatus: fieldInfo.program_status ? mapSelectionToLabel(progDef, r.program_status) : '',
      startDate: undefined,
      lastFollowUpDate: undefined,
      nextFollowUpDate: undefined,
      outcomeNotes: fieldInfo.outcome_notes ? safeString(r.outcome_notes).trim() || undefined : undefined,
      ownerHr: undefined,
      referralDocsUrl: undefined,
      closeDate: fieldInfo.close_date ? toYmd(r.close_date) : undefined,
      closedReason: fieldInfo.closed_reason ? safeString(r.closed_reason).trim() || undefined : undefined,
      createdAt: toIsoFromOdooDatetime(r.create_date),
      updatedAt: toIsoFromOdooDatetime(r.write_date)
    })
  }
  return out
}
